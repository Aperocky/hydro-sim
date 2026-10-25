import TinyQueue from 'tinyqueue';
import { Basin, BasinFullEvent } from '../../components/basin/basin';
import SuperBasin from '../../components/basin/superBasin';
import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { RiverRouting } from './riverRouting';

type ProcessOverflowOptions = {
    routeFlow?: boolean;
    fillAquifer?: boolean;
    routing?: RiverRouting;
};

// Shared by normal turns and terrain reconstruction; both need identical event
// ordering, duplicate suppression, iteration limits, and event cleanup.
export function processOverflows(sim: Sim, events: BasinFullEvent[], options: ProcessOverflowOptions = {}): void {
    let queue = new TinyQueue(events, (a, b) => b.holdElevation - a.holdElevation);
    let processed = new Set<string>();
    let count = 0;
    while (queue.length) {
        let event = queue.pop();
        if (!event.valid) continue;
        let key = [event.anchor, event.holdMember, event.holdElevation,
            event.holdBasins.slice().sort().join('|'), Math.round(event.overflowVolume)].join('::');
        if (processed.has(key)) {
            let basin = sim.superBasins.get(event.anchor);
            if (basin) basin.basinFullEvent = null;
            continue;
        }
        processed.add(key);
        let nextEvents = processOverflowEvent(sim, event, options);
        if (++count > sim.size * sim.size) {
            let phase = options.routeFlow === false ? 'recomputeTopography overflow processing' : 'processOverflows';
            console.warn(`${phase} hit limit at ${count} events, breaking`);
            break;
        }
        for (let next of nextEvents) queue.push(next);
    }
    sim.superBasins.forEach(basin => { basin.basinFullEvent = null; });
}

export default function processOverflowEvent(sim: Sim, event: BasinFullEvent, options: ProcessOverflowOptions = {}): BasinFullEvent[] {
    let source = sim.superBasins.get(event.anchor);
    let holdBasins = new Set(event.holdBasins);
    let holdLoc = SquareUtil.locFromId(event.holdMember);
    let outlet: {square: Square; direction: number} | null = null;
    SquareUtil.getAdjacentSquares(holdLoc.i, holdLoc.j, sim.size).forEach((loc, direction) => {
        let square = sim.map[loc[0]][loc[1]];
        let basin = sim.superBasins.get(square.basin);
        if (holdBasins.has(square.basin) && basin && basin !== source
                && (!outlet || square.altitude < outlet.square.altitude)) {
            outlet = {square, direction};
        }
    });
    if (!outlet) return []; // Every hold basin already belongs to this lake.
    let target = sim.superBasins.get(outlet.square.basin);
    if (target.isFull && source.basinHold.holdMember === target.basinHold.holdMember) {
        let merged = SuperBasin.fromBasins(sim, source, target);
        let volume = event.overflowVolume;
        if (target.basinFullEvent) {
            volume += target.basinFullEvent.overflowVolume;
            target.basinFullEvent.valid = false;
            target.basinFullEvent = null;
        }
        source.basinFullEvent = null;
        let next = receiveInflow(merged, volume, sim, options);
        return next ? [next] : [];
    }
    let arrivals = new Map([[outlet.square.basin, event.overflowVolume]]);
    if (options.routeFlow !== false) {
        if (!options.routing) throw new Error('River routing is required for channel overflow');
        options.routing.recordOutlet(sim.map[holdLoc.i][holdLoc.j], outlet.direction, event.overflowVolume);
        arrivals = options.routing.routeOverflow(outlet.square, event.overflowVolume);
    }
    source.basinFullEvent = null;
    let events: BasinFullEvent[] = [];
    arrivals.forEach((volume, anchor) => {
        if (volume <= 0) return;
        // Resolve the current lake owner after any preceding basin merges.
        let next = receiveInflow(sim.superBasins.get(anchor), volume, sim, options);
        if (next) events.push(next);
    });
    return events;
}

function receiveInflow(basin: Basin, volume: number, sim: Sim, options: ProcessOverflowOptions): BasinFullEvent | null {
    if (options.routing) {
        volume = options.routing.receiveLakeInflow(basin, volume);
        return basin.processInflow(volume, sim, {fillAquifer: false});
    }
    return basin.processInflow(volume, sim, {fillAquifer: options.fillAquifer});
}
