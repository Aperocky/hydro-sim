import { Basin, BasinFullEvent } from '../../components/basin/basin';
import { SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { FlowUtil } from '../../components/flow';
import { RiverRouting } from './riverRouting';
import processOverflowEvent from './processOverflowEvent';
import { fillAquiferWithEffectivePrecip } from './riverUtil';
import lakebedSmudge from './lakebedSmudge';
import * as constant from '../../constant/constant';
import TinyQueue from 'tinyqueue';
import { updateBiomeState } from './biome';


export const SUBMERGENCE_MEMORY_TURNS = 20;

// Turn phases:
// 1. apply pending erosion deltas from last turn
// 2. recompute topography (rebuild directions/basins from post-erosion terrain)
// 3. apply evaporation to lakes
// 4. route river water using fixed lake intakes, then fill lakes
// 5. process any overfilling basin and basin mergers
// 6. erode channels once and route sediment using final water volumes
// 7. smooth submerged lakebeds (stores pending deltas)
// 8. add this turn's net terrain change to sedimentation history
// 9. update submergence history from final water state
// 10. advance persistent vegetation state

export default function runTurn(sim: Sim): void {
    applyPendingErosion(sim);
    applyFlatnessJitter(sim);
    sim.recomputeTopography();
    applyEvaporation(sim);
    let routing = new RiverRouting(sim);
    let fullEvents: BasinFullEvent[] = calculateRivers(sim, routing);
    processOverflows(sim, fullEvents, routing);
    routing.runSediment();
    lakebedSmudge(sim);
    updateSedimentationHistory(sim);
    updateSubmergenceHistory(sim);
    for (let row of sim.map) {
        for (let square of row) updateBiomeState(square);
    }
}

function updateSedimentationHistory(sim: Sim): void {
    for (let row of sim.map) {
        for (let square of row) {
            square.flow.totalSedimentation += square.flow.pendingErosion;
            square.flow.currentSedimentation = Math.max(
                0, square.flow.currentSedimentation + square.flow.pendingErosion);
        }
    }
}

// For any square that shares an exact altitude with at least one of its 8 neighbors,
// add a tiny random jitter so flow direction can be determined unambiguously.
function applyFlatnessJitter(sim: Sim): void {
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            const square = sim.map[i][j];
            const adj = SquareUtil.getAdjacentSquares(i, j, sim.size);
            let hasMatch = false;
            adj.forEach((value) => {
                if (sim.map[value[0]][value[1]].altitude === square.altitude) {
                    hasMatch = true;
                }
            });
            if (hasMatch) {
                square.altitude += Math.random() * 0.01;
            }
        }
    }
}

// Apply pending altitude deltas from last turn's erosion/sedimentation.
function applyPendingErosion(sim: Sim): void {
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let flow = sim.map[i][j].flow;
            if (flow.pendingErosion !== 0) {
                sim.map[i][j].altitude += flow.pendingErosion;
                flow.pendingErosion = 0;
            }
        }
    }
}

export function updateSubmergenceHistory(sim: Sim): void {
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let square = sim.map[i][j];
            if (square.submerged) {
                square.previously_submerged = -1;
            } else if (square.previously_submerged === -1) {
                square.previously_submerged = 1;
            } else if (square.previously_submerged > 0 && square.previously_submerged < SUBMERGENCE_MEMORY_TURNS) {
                square.previously_submerged += 1;
            } else if (square.previously_submerged >= SUBMERGENCE_MEMORY_TURNS) {
                square.previously_submerged = SUBMERGENCE_MEMORY_TURNS;
            } else {
                square.previously_submerged = 0;
            }
        }
    }
}

function applyEvaporation(sim: Sim): void {
    sim.superBasins.forEach((basin) => {
        if (basin.evaporationProcessed) {
            return;
        }
        basin.evaporationProcessed = true;
        if (!basin.isBaseBasin && basin.divideElevation > basin.lake.surfaceElevation - constant.EVAPORATION_METERS) {
            basin.divideBasin(sim, basin.lake.surfaceElevation - constant.EVAPORATION_METERS);
        } else {
            let surfaceElevation = basin.lake.surfaceElevation;
            basin.lake.drainToElevation(sim, surfaceElevation - constant.EVAPORATION_METERS);
        }
    })
    sim.superBasins.forEach((basin) => { basin.evaporationProcessed = false });
    // Apply evaporation for aquifers
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            if (!sim.map[i][j].submerged) {
                // aquiferFlow(sim.map[i][j], sim); // Cost way too much
                FlowUtil.evaporateAquifer(sim.map[i][j].flow);
                fillAquiferWithEffectivePrecip(sim.map[i][j]);
            }
        }
    }
}

function calculateRivers(sim: Sim, routing: RiverRouting): BasinFullEvent[] {
    let arrivals = routing.runWater();
    let fullEvents: BasinFullEvent[] = [];
    let seen = new Set<Basin>();
    sim.superBasins.forEach(basin => {
        if (seen.has(basin)) return;
        seen.add(basin);
        let inflow = basin.memberBasins.reduce((sum, anchor) => sum + (arrivals.get(anchor) || 0), 0);
        inflow = routing.receiveLakeInflow(basin, inflow);
        let event = basin.processInflow(inflow, sim, {fillAquifer: false});
        if (event) fullEvents.push(event);
    });
    return fullEvents;
}

function processOverflows(sim: Sim, basinFullEvents: BasinFullEvent[], routing: RiverRouting): void {
    let fullEventComparator = (a, b) => b.holdElevation - a.holdElevation;
    let processCount = 0;
    let maxEvents = sim.size * sim.size;
    let fullEventQueue = new TinyQueue(basinFullEvents, fullEventComparator);
    let processedOverflowEvents: Set<string> = new Set();
    while (fullEventQueue.length) {
        let currentEvent = fullEventQueue.pop();
        if (!currentEvent.valid) {
            continue;
        }
        let eventKey = [
            currentEvent.anchor,
            currentEvent.holdMember,
            currentEvent.holdElevation,
            currentEvent.holdBasins.slice().sort().join('|'),
            Math.round(currentEvent.overflowVolume),
        ].join('::');
        if (processedOverflowEvents.has(eventKey)) {
            let basin = sim.superBasins.get(currentEvent.anchor);
            if (basin != null) {
                basin.basinFullEvent = null;
            }
            continue;
        }
        processedOverflowEvents.add(eventKey);
        let newEvent: BasinFullEvent | null = processOverflowEvent(sim, currentEvent, {routing});
        processCount += 1;
        if (processCount > maxEvents) {
            console.warn(`processOverflows hit limit at ${processCount} events, breaking`);
            break;
        }
        if (newEvent != null) {
            fullEventQueue.push(newEvent);
        }
    }
    // Remove all current events from basins.
    sim.superBasins.forEach((basin) => {
        basin.basinFullEvent = null;
    })
}
