import { Basin, BasinFullEvent } from '../../components/basin/basin';
import { Sim } from '../sim';
import populateBasinRiver from './populateBasinRiver';


// Turn consist of several phases
// 1. apply evaporation to lakes.
// 2. calculate river flows and process basin inflow.
// 3. process any overfilling basin and basin mergers

export default function runTurn(sim: Sim): void {
    applyEvaporation(sim);
    let fullEvents: BasinFullEvent[] = calculateRivers(sim);
    processOverflows(sim, fullEvents);
}

function applyEvaporation(sim: Sim): void {
    sim.superBasins.forEach((basin) => {
        if (!basin.isBaseBasin) {
            throw new Error("Super basins not yet accepted");
        }
        // Fixed evaporation;
        let surfaceElevation = basin.lake.surfaceElevation;
        basin.lake.drainToElevation(sim, surfaceElevation - 2);
    })
}

function calculateRivers(sim: Sim): BasinFullEvent[] {
    let fullEvents: BasinFullEvent[] = [];
    sim.superBasins.forEach((basin) => {
        let inFlow = populateBasinRiver(basin, sim);
        let fullEvent: BasinFullEvent | null = basin.processInflow(inFlow, sim);
        if (fullEvent != null) {
            fullEvents.push(fullEvent);
        }
    })
    return fullEvents;
}

function processOverflows(sim: Sim, basinFullEvents: BasinFullEvent[]): void {
    console.log(`FOUND ${basinFullEvents.length} BASIN FULL EVENTS`);
    for (let fullEvent of basinFullEvents) {
        console.log(fullEvent);
    }
    if (basinFullEvents.length) {
        throw new Error("Basin full event processing not supported yet")
    }
    // TODO
}
