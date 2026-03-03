import { Basin, BasinFullEvent } from '../../components/basin/basin';
import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { FlowUtil } from '../../components/flow';
import populateBasinRiver from './populateBasinRiver';
import processOverflowEvent from './processOverflowEvent';
import { processErosionAtSquare, dumpSedimentAtMouth } from './erosion';
import { aquiferFlow, fillAquiferWithEffectivePrecip } from './riverUtil';
import * as constant from '../../constant/constant';
import TinyQueue from 'tinyqueue';


// Turn phases:
// 1. apply pending erosion deltas from last turn
// 2. recompute topography (rebuild directions/basins from post-erosion terrain)
// 3. apply evaporation to lakes
// 4. calculate river flows + erosion/sedimentation (stores pending deltas)
// 5. process any overfilling basin and basin mergers
// 6. erode basin outlet channels (stores pending deltas)

export default function runTurn(sim: Sim): void {
    applyPendingErosion(sim);
    sim.recomputeTopography();
    clearRelic(sim);
    applyEvaporation(sim);
    let fullEvents: BasinFullEvent[] = calculateRivers(sim);
    processOverflows(sim, fullEvents);
    erodeOutlets(sim);
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

function clearRelic(sim: Sim): void {
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            FlowUtil.clearFlow(sim.map[i][j].flow);
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

function calculateRivers(sim: Sim): BasinFullEvent[] {
    let fullEvents: BasinFullEvent[] = [];
    sim.superBasins.forEach((basin) => {
        if (basin.inflowProcessed) {
            return;
        }
        basin.inflowProcessed = true;
        // Also calculate precipitation received on the lake itself
        let totalPrecip = 0;
        for (let square of basin.lake.flooded.data) {
            totalPrecip += square.precipitation * 1000;
        }
        let inFlow = populateBasinRiver(basin, sim);
        inFlow += totalPrecip;
        let fullEvent: BasinFullEvent | null = basin.processInflow(inFlow, sim);
        if (fullEvent != null) {
            fullEvents.push(fullEvent);
        }
    })
    sim.superBasins.forEach((basin) => { basin.inflowProcessed = false });
    return fullEvents;
}

function processOverflows(sim: Sim, basinFullEvents: BasinFullEvent[]): void {
    let fullEventComparator = (a, b) => b.holdElevation - a.holdElevation;
    let processCount = 0;
    let maxEvents = sim.size * sim.size;
    let fullEventQueue = new TinyQueue(basinFullEvents, fullEventComparator);
    while (fullEventQueue.length) {
        let currentEvent = fullEventQueue.pop();
        if (!currentEvent.valid) {
            continue;
        }
        let newEvent: BasinFullEvent | null = processOverflowEvent(sim, currentEvent);
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

// Erode outlet channels of full basins.
// Traces from hold member downstream, applying erosion based on overflow volume.
function erodeOutlets(sim: Sim): void {
    let visited = new Set<string>();
    sim.superBasins.forEach((basin) => {
        if (visited.has(basin.anchor)) return;
        visited.add(basin.anchor);
        if (!basin.isFull) return;

        let holdLoc = basin.basinHold.holdMember;
        if (!holdLoc) return;
        let loc = JSON.parse(holdLoc);
        let holdSquare: Square = sim.map[loc.i][loc.j];

        // Use the basin's overflow volume as the flow for erosion
        // Estimate from lake volume at capacity
        let overflowVolume = holdSquare.flow.flowVolume;
        if (overflowVolume <= 0) {
            // Estimate from basin inflow
            overflowVolume = basin.lake.getVolume() * 0.01;
        }
        if (overflowVolume <= 0) return;

        // Trace downstream from hold member, eroding each square
        let current: Square = holdSquare;
        let sediment = 0;
        let steps = 0;

        // If hold has no flow direction, find the outlet target and
        // apply its erosion to the hold so the lake mouth can erode down
        if (holdSquare.flow.flowDirection === 0 && holdSquare.depth <= 0) {
            let holdBasins = new Set(basin.basinHold.holdBasins);
            let adjacents = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
            let lowestAlt = Number.MAX_SAFE_INTEGER;
            let outletTarget: Square | null = null;
            adjacents.forEach((value) => {
                let adj = sim.map[value[0]][value[1]];
                if (holdBasins.has(adj.basin) && adj.altitude < lowestAlt) {
                    lowestAlt = adj.altitude;
                    outletTarget = adj;
                }
            });
            if (outletTarget) {
                // Apply outlet target's gradient erosion to the hold
                let savedHeightDiff = holdSquare.flow.heightDiff;
                holdSquare.flow.heightDiff = outletTarget.flow.heightDiff;
                sediment = processErosionAtSquare(holdSquare, 0, overflowVolume);
                holdSquare.flow.heightDiff = savedHeightDiff;
                current = outletTarget;
            }
        }

        while (current && !current.submerged && steps < sim.size * 2) {
            sediment = processErosionAtSquare(current, sediment, overflowVolume);
            let next = SquareUtil.getDownstreamSquare(current, sim);
            if (!next || next === current) break;
            if (next.submerged) {
                dumpSedimentAtMouth(next, sediment, sim);
                break;
            }
            current = next;
            steps++;
        }
    });
}

