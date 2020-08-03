import { Basin, BasinFullEvent } from '../../components/basin/basin';
import { Sim } from '../sim';
import populateBasinRiver from './populateBasinRiver';
import processOverflowEvent from './processOverflowEvent';
import TinyQueue from 'tinyqueue';


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
        if (basin.evaporationProcessed) {
            return;
        }
        basin.evaporationProcessed = true;
        if (!basin.isBaseBasin) {
            if (basin.divideElevation > basin.lake.surfaceElevation - 2) {
                basin.divideBasin(sim, basin.lake.surfaceElevation - 2);
            }
        } else {
            let surfaceElevation = basin.lake.surfaceElevation;
            basin.lake.drainToElevation(sim, surfaceElevation - 2);
        }
    })
    sim.superBasins.forEach((basin) => { basin.evaporationProcessed = false });
}

function calculateRivers(sim: Sim): BasinFullEvent[] {
    let fullEvents: BasinFullEvent[] = [];
    sim.superBasins.forEach((basin) => {
        if (basin.inflowProcessed) {
            return;
        }
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
    console.log(`FOUND ${basinFullEvents.length} BASIN FULL EVENTS`);
    // Queue to make sure we're not going upstream and might come back again.
    // Start from the highest pond
    let fullEventQueue = new TinyQueue(basinFullEvents, fullEventComparator);
    while (fullEventQueue.length) {
        let currentEvent = fullEventQueue.pop();
        if (!currentEvent.valid) {
            continue;
        }
        // Make sure event is still valid
        let newEvent: BasinFullEvent | null = processOverflowEvent(sim, currentEvent);
        if (newEvent != null) {
            console.log(`New event as previous full basin flew through`);
            fullEventQueue.push(newEvent);
        }
    }
}

