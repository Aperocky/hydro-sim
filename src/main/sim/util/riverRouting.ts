import TinyQueue from 'tinyqueue';
import { Basin } from '../../components/basin/basin';
import { FlowUtil } from '../../components/flow';
import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { getEffectivePrecipVolume } from './riverUtil';
import { processErosionAtSquare } from './erosion';
import { settleOrRouteSediment } from './sedimentRouting';
import * as constants from '../../constant/constant';

type Destination = { square: Square; direction: number; fraction: number };

// Per turn volumes (m³); each tile is 1 km². Freeze splits using last turn's
// volume so late overflow never requires retracting water from filled lakes.
export const DISTRIBUTARY_MIN_FLOW = 80000000;
export const DISTRIBUTARY_MIN_BRANCH_FLOW = 30000000;
export const DISTRIBUTARY_MAX_DROP = 1;
export const DISTRIBUTARY_MIN_DROP_RATIO = 0.9;

export function riverDestinations(square: Square, sim: Sim, allowSplit = true): Destination[] {
    let primary = SquareUtil.getDownstreamSquare(square, sim);
    if (!primary) return [];
    let single = [{square: primary, direction: square.flow.flowDirection, fraction: 1}];
    if (!allowSplit || square.flow.flowVolume < DISTRIBUTARY_MIN_FLOW) return single;
    let level = (target: Square) => target.altitude + (target.submerged ? target.depth : 0);
    let primaryDrop = square.altitude - level(primary);
    if (primaryDrop <= 0 || primaryDrop > DISTRIBUTARY_MAX_DROP) return single;
    let secondary: Square | null = null;
    let secondaryDirection = 0;
    let secondaryDrop = 0;
    SquareUtil.getAdjacentSquares(square.i, square.j, sim.size).forEach((loc, direction) => {
        let target = sim.map[loc[0]][loc[1]];
        if (target === primary) return;
        let drop = square.altitude - level(target);
        if (drop <= 0 || drop > DISTRIBUTARY_MAX_DROP || target.altitude >= square.altitude) return;
        if (Math.min(drop, primaryDrop) / Math.max(drop, primaryDrop) < DISTRIBUTARY_MIN_DROP_RATIO) return;
        if (drop > secondaryDrop) {
            secondary = target;
            secondaryDirection = direction;
            secondaryDrop = drop;
        }
    });
    if (!secondary) return single;
    let fraction = primaryDrop / (primaryDrop + secondaryDrop);
    if (square.flow.flowVolume * Math.min(fraction, 1 - fraction) <= DISTRIBUTARY_MIN_BRANCH_FLOW) return single;
    return [
        {square: primary, direction: square.flow.flowDirection, fraction},
        {square: secondary, direction: secondaryDirection, fraction: 1 - fraction},
    ];
}

type RiverState = {
    square: Square;
    aquifer: number;
    incoming: number;
    output: number;
    destinations: Destination[];
};

function downhill(a: Square, b: Square): number {
    return b.altitude - a.altitude || a.location - b.location;
}

// One turn's transport graph. Basin/lake geometry continues to use flowDirection.
// Lake intakes and destinations are frozen before any inflow changes lake levels.
export class RiverRouting {
    private ordered: Square[];
    private states = new Map<number, RiverState>();
    private intakes = new Map<number, Square[]>();
    private lakeAquiferCapacity = new Map<number, number>();
    private submerged = new Set<number>();
    private outlets = new Map<number, Map<number, number>>();

    constructor(private sim: Sim, options: {allowDistributaries?: boolean} = {}) {
        this.ordered = ([] as Square[]).concat(...sim.map).sort(downhill);
        for (let square of this.ordered) {
            if (square.submerged) this.submerged.add(square.location);
            if (!square.submerged && square.flow.flowDirection !== 0 && square.flow.flowDirection !== 9) {
                this.states.set(square.location, {
                    square, aquifer: square.flow.aquifer, incoming: 0, output: 0,
                    destinations: riverDestinations(square, sim, options.allowDistributaries !== false),
                });
            }
            FlowUtil.clearFlow(square.flow);
        }
        let seen = new Set<Basin>();
        sim.superBasins.forEach(basin => {
            if (seen.has(basin)) return;
            seen.add(basin);
            for (let square of basin.lake.flooded.data) {
                let members = this.intakes.get(square.basin) || [];
                members.push(square);
                this.intakes.set(square.basin, members);
                let aquifer = isFinite(square.flow.aquifer)
                    ? Math.min(square.flow.aquifer, square.flow.aquiferMax) : square.flow.aquiferMax;
                square.flow.aquifer = aquifer;
                this.lakeAquiferCapacity.set(square.location,
                    Math.max(0, (square.flow.aquiferMax - aquifer) * 0.5));
            }
        });
    }

    runWater(): Map<number, number> {
        let arrivals = new Map<number, number>();
        this.intakes.forEach((squares, basin) => {
            arrivals.set(basin, squares.reduce((sum, square) => sum + square.precipitation * 1000, 0));
        });
        for (let square of this.ordered) {
            let state = this.states.get(square.location);
            if (state) this.distribute(state, this.updateWater(state), (target, amount) => {
                if (!this.addIncoming(target, amount)) {
                    arrivals.set(target.basin, (arrivals.get(target.basin) || 0) + amount);
                }
            });
        }
        return arrivals;
    }

    // Add only the new output from a late overflow. Re-evaluate aquifer exchange
    // from the original state, so rainfall/seepage/infiltration happen once.
    routeOverflow(entry: Square, volume: number): Map<number, number> {
        let arrivals = new Map<number, number>();
        if (!this.addIncoming(entry, volume)) return new Map([[entry.basin, volume]]);
        let queue = new TinyQueue<Square>([entry], downhill);
        let queued = new Set<number>([entry.location]);
        while (queue.length) {
            let square = queue.pop();
            queued.delete(square.location);
            let state = this.states.get(square.location);
            this.distribute(state, this.updateWater(state), (target, amount) => {
                if (!this.addIncoming(target, amount)) {
                    arrivals.set(target.basin, (arrivals.get(target.basin) || 0) + amount);
                } else if (!queued.has(target.location)) {
                    queue.push(target);
                    queued.add(target.location);
                }
            });
        }
        return arrivals;
    }

    // Only the initial lake cells absorb inflow this turn. Each has one fixed
    // infiltration allowance, shared across pulses and subsequent basin mergers.
    receiveLakeInflow(basin: Basin, volume: number): number {
        for (let anchor of basin.memberBasins) {
            for (let square of this.intakes.get(anchor) || []) {
                let capacity = this.lakeAquiferCapacity.get(square.location);
                let absorbed = Math.min(volume, capacity);
                square.flow.aquifer += absorbed;
                this.lakeAquiferCapacity.set(square.location, capacity - absorbed);
                volume -= absorbed;
                if (volume <= 0) return 0;
            }
        }
        return volume;
    }

    recordOutlet(hold: Square, direction: number, volume: number): void {
        let outlets = this.outlets.get(hold.location) || new Map<number, number>();
        outlets.set(direction, (outlets.get(direction) || 0) + volume);
        this.outlets.set(hold.location, outlets);
        this.updateOutflows(hold);
    }

    // Once water/overflow has settled, erode each channel once and transport
    // sediment along the actual outgoing water shares, including basin outlets.
    runSediment(): void {
        let incoming = new Map<number, number>();
        for (let square of this.ordered) {
            if (square.flow.flowVolume <= 0 || square.flow.outFlows.length === 0) continue;
            let sediment = this.submerged.has(square.location) ? 0
                : processErosionAtSquare(square, incoming.get(square.location) || 0, square.flow.flowVolume, this.sim);
            let remaining = sediment;
            square.flow.outFlows.forEach((outflow, index) => {
                let amount = index === square.flow.outFlows.length - 1 ? remaining
                    : sediment * outflow.volume / square.flow.flowVolume;
                remaining -= amount;
                let offset = constants.DIRECTIONS.get(outflow.direction);
                let target = this.sim.map[square.i + offset[0]][square.j + offset[1]];
                if (this.states.has(target.location)) {
                    incoming.set(target.location, (incoming.get(target.location) || 0) + amount);
                } else {
                    settleOrRouteSediment(target, amount, this.sim);
                }
            });
        }
    }

    private addIncoming(square: Square, volume: number): boolean {
        let state = this.states.get(square.location);
        if (!state) return false;
        state.incoming += volume;
        return true;
    }

    private updateWater(state: RiverState): number {
        let flow = state.square.flow;
        let snapshot = {...flow, aquifer: state.aquifer};
        let output = FlowUtil.fillAquifer(snapshot, state.incoming + getEffectivePrecipVolume(state.square));
        let increment = output - state.output;
        flow.aquifer = snapshot.aquifer;
        state.output = output;
        this.updateOutflows(state.square);
        return increment;
    }

    private distribute(state: RiverState, volume: number, send: (target: Square, amount: number) => void): void {
        let remaining = volume;
        state.destinations.forEach((destination, index) => {
            let amount = index === state.destinations.length - 1 ? remaining : volume * destination.fraction;
            remaining -= amount;
            if (amount > 0) send(destination.square, amount);
        });
    }

    private updateOutflows(square: Square): void {
        let volumes = new Map<number, number>();
        let state = this.states.get(square.location);
        if (state) {
            let remaining = state.output;
            state.destinations.forEach((destination, index) => {
                let amount = index === state.destinations.length - 1 ? remaining : state.output * destination.fraction;
                remaining -= amount;
                volumes.set(destination.direction, amount);
            });
        }
        (this.outlets.get(square.location) || new Map<number, number>()).forEach((volume, direction) => {
            volumes.set(direction, (volumes.get(direction) || 0) + volume);
        });
        square.flow.outFlows = Array.from(volumes, ([direction, volume]) => ({direction, volume}));
        square.flow.flowVolume = square.flow.outFlows.reduce((sum, outflow) => sum + outflow.volume, 0);
    }
}
