import { Square, SquareUtil } from '../components/square';
import { Basin, BasinFullEvent } from '../components/basin/basin';
import populateFlowDirection from './util/populateFlowDirection';
import populateBasins from './util/populateBasins';
import populateBasinHold from './util/populateBasinHold';
import processOverflowEvent from './util/processOverflowEvent';
import timer from './util/timer';
import * as constants from '../constant/constant';
import TinyQueue from 'tinyqueue';


export class SimBase {

    size: number;
    map: Square[][];
    initialized: boolean;
    altitude: number[][];
    precip: number[][];
    basins: Map<string, Basin>;
    turn: number;

    constructor(size) {
        this.size = size;
        this.turn = 0;
    }

    // Create a map of squares based on numpy multivariate results
    createMap() {
        this.map = [];
        this.basins = new Map();
        for (let i=0; i<this.size; i++) {
            this.map.push([]);
            for (let j=0; j<this.size; j++) {
                let square: Square = SquareUtil.createSquare(this.altitude[i][j], this.precip[i][j]);
                square.location = SquareUtil.stringRep(i, j);
                this.map[i][j] = square;
            }
        }
        timer("populateFlowDirection")(populateFlowDirection)(this);
        timer("populateBasins")(populateBasins)(this);
        timer("populateBasinHold")(populateBasinHold)(this);
    }

    recomputeTopography() {
        const UNIT_SQUARE_VOLUME = constants.UNITS.get('squareToVolume');

        // Save water surface elevation per square (only meaningful if submerged)
        let waterSurface: number[][] = [];
        for (let i = 0; i < this.size; i++) {
            waterSurface.push([]);
            for (let j = 0; j < this.size; j++) {
                let sq = this.map[i][j];
                waterSurface[i][j] = sq.submerged ? sq.altitude + sq.depth : -1;
            }
        }

        // Clear lake state from all basins
        let visited: Set<string> = new Set();
        (this as any).superBasins.forEach((basin: Basin) => {
            if (visited.has(basin.anchor)) return;
            visited.add(basin.anchor);
            basin.lake.clearLakeStateToSim();
        });

        // Reset all squares
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                SquareUtil.resetForRecompute(this.map[i][j]);
            }
        }

        // Recompute basins from terrain
        this.basins = new Map();
        (this as any).superBasins = new Map();
        populateFlowDirection(this as any);
        populateBasins(this as any);
        populateBasinHold(this as any);

        // Aggregate saved water volume per new base basin
        // Use surface elevation vs new altitude to handle terrain changes correctly
        let basinWater: Map<string, number> = new Map();
        let targetLakeVolume = 0;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let surface = waterSurface[i][j];
                if (surface < 0) continue;
                let newDepth = surface - this.map[i][j].altitude;
                if (newDepth > 0) {
                    let anchor = this.map[i][j].basin;
                    let vol = (basinWater.get(anchor) || 0) + newDepth * UNIT_SQUARE_VOLUME;
                    basinWater.set(anchor, vol);
                    targetLakeVolume += newDepth * UNIT_SQUARE_VOLUME;
                }
            }
        }

        // Fill each basin and process overflows to recreate super-basins
        // Save and clear flow volumes since processOverflowEvent uses them
        let savedFlowVolumes: number[][] = [];
        for (let i = 0; i < this.size; i++) {
            savedFlowVolumes.push([]);
            for (let j = 0; j < this.size; j++) {
                savedFlowVolumes[i][j] = this.map[i][j].flow.flowVolume;
                this.map[i][j].flow.flowVolume = 0;
            }
        }
        let fullEvents: BasinFullEvent[] = [];
        let processedBasins: Set<Basin> = new Set();
        (this as any).superBasins.forEach((basin: Basin, anchor: string) => {
            if (processedBasins.has(basin)) return;
            processedBasins.add(basin);
            let volume = 0;
            for (let memberAnchor of basin.memberBasins) {
                volume += basinWater.get(memberAnchor) || 0;
            }
            if (volume > 0) {
                let event = basin.processInflow(volume, this as any, {fillAquifer: false});
                if (event != null) {
                    fullEvents.push(event);
                }
            }
        });

        // Process overflows to merge basins as needed
        let fullEventComparator = (a, b) => b.holdElevation - a.holdElevation;
        let fullEventQueue = new TinyQueue(fullEvents, fullEventComparator);
        let overflowCount = 0;
        let maxEvents = this.size * this.size;
        let processedOverflowEvents: Set<string> = new Set();
        while (fullEventQueue.length) {
            let currentEvent = fullEventQueue.pop();
            if (!currentEvent.valid) continue;
            let eventKey = [
                currentEvent.anchor,
                currentEvent.holdMember,
                currentEvent.holdElevation,
                currentEvent.holdBasins.slice().sort().join('|'),
            ].join('::');
            if (processedOverflowEvents.has(eventKey)) {
                let basin = (this as any).superBasins.get(currentEvent.anchor);
                if (basin != null) {
                    basin.basinFullEvent = null;
                }
                continue;
            }
            processedOverflowEvents.add(eventKey);
            let newEvent: BasinFullEvent | null = processOverflowEvent(this as any, currentEvent, {
                fillAquifer: false,
                includePrecipitation: false,
                routeFlow: false,
            });
            overflowCount++;
            if (overflowCount > maxEvents) {
                console.warn(`recomputeTopography overflow processing hit limit at ${overflowCount} events, breaking`);
                break;
            }
            if (newEvent != null) {
                fullEventQueue.push(newEvent);
            }
        }
        (this as any).superBasins.forEach((basin: Basin) => {
            basin.basinFullEvent = null;
        });
        this.reconcileRecomputedLakeVolume(targetLakeVolume);

        // Restore flow volumes for river display
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.map[i][j].flow.flowVolume = savedFlowVolumes[i][j];
            }
        }
    }

    getSquare(i: number, j: number): Square {
        return this.map[i][j];
    }

    private getUniqueSuperBasins(): Basin[] {
        let basins: Basin[] = [];
        let seen: Set<Basin> = new Set();
        (this as any).superBasins.forEach((basin: Basin) => {
            if (seen.has(basin)) return;
            seen.add(basin);
            basins.push(basin);
        });
        return basins;
    }

    private getTotalLakeVolume(): number {
        return this.getUniqueSuperBasins().reduce((sum, basin) => sum + basin.lake.getVolume(), 0);
    }

    private reconcileRecomputedLakeVolume(targetLakeVolume: number): void {
        const EPSILON = 1;
        let missingVolume = targetLakeVolume - this.getTotalLakeVolume();
        if (Math.abs(missingVolume) <= EPSILON) return;

        let basins = this.getUniqueSuperBasins()
            .filter((basin) => basin.basinHold != null && basin.lake != null)
            .sort((a, b) => {
                let aCapacity = Math.max(0, a.basinHold.holdCapacity - a.lake.getVolume());
                let bCapacity = Math.max(0, b.basinHold.holdCapacity - b.lake.getVolume());
                return bCapacity - aCapacity;
            });

        if (missingVolume < -EPSILON) {
            let excessVolume = -missingVolume;
            basins.sort((a, b) => b.lake.getVolume() - a.lake.getVolume());
            for (let basin of basins) {
                if (excessVolume <= EPSILON) break;
                let lakeVolume = basin.lake.getVolume();
                if (lakeVolume <= EPSILON) continue;
                let volume = Math.min(excessVolume, lakeVolume);
                basin.lake.drainToVolume(this as any, lakeVolume - volume);
                basin.isFull = basin.lake.getVolume() >= basin.basinHold.holdCapacity - EPSILON;
                excessVolume -= volume;
            }
            return;
        }

        for (let basin of basins) {
            if (missingVolume <= EPSILON) break;
            let capacityLeft = Math.max(0, basin.basinHold.holdCapacity - basin.lake.getVolume());
            if (capacityLeft <= EPSILON) continue;
            let volume = Math.min(missingVolume, capacityLeft);
            basin.lake.fillByVolume(this as any, volume);
            if (basin.lake.getVolume() >= basin.basinHold.holdCapacity - EPSILON) {
                basin.isFull = true;
            }
            missingVolume -= volume;
        }

        if (missingVolume > EPSILON && basins.length > 0) {
            basins.sort((a, b) => b.lake.getVolume() - a.lake.getVolume());
            basins[0].lake.fillByVolume(this as any, missingVolume);
            basins[0].isFull = true;
        }
    }
}
