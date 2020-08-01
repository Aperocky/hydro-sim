import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { FlowUtil } from '../../components/flow';
import * as constants from '../../constant/constant';


const PRECIPITATION_EFFECT = 0.0001;
const BASE_EVAPORATION = 0.2;
const BASE_AMOUNT = 10000000; // start to lessen from here; the amount is 0.3m^3/sec
const ALT_DIFF_BASE = 10;
const ALT_DIFF_SCALAR_MAX = 2;

// Form rivers based on shores - all shores will be calculated as a separate catchment
// And fill all squares on map with flow information unless submerged


export default function riverFormation(shoreSquare: Square, sim: Sim): number {
    return populateFlow(shoreSquare, sim);
}


function populateFlow(square: Square, sim: Sim): number {
    let loc: {i: number, j: number} = JSON.parse(square.location);
    let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
    let inFlowAmount = 0;
    square.flow.inFlows.forEach((value, key) => {
        let flowSourceLoc = adjacents.get(key);
        let flowSourceSquare: Square = sim.map[flowSourceLoc[0]][flowSourceLoc[1]];
        let flowSourceAmount = populateFlow(flowSourceSquare, sim);
        FlowUtil.addInFlowVol(square.flow, key, flowSourceAmount);
        inFlowAmount += flowSourceAmount;
    })
    // Add precipitation.
    let effectivePrecip = square.precipitation > 200 ? square.precipitation - 200 : 0;
    let effectivePrecipVolume = effectivePrecip * constants.UNITS.get('rainToVolume');
    let outFlowRaw = effectivePrecipVolume + inFlowAmount;
    let flowToLoc = adjacents.get(square.flow.flowDirection);
    let flowToSquare = sim.map[flowToLoc[0]][flowToLoc[1]]
    let altDiff = square.altitude - flowToSquare.altitude;
    // Let evaporation takes its toll
    // Surface evaporation.
    // Percentage based on volume, larger the volume, the less percentage it losses.
    let evaporatedFlow = calculateSurfaceEvaporation(outFlowRaw, square.precipitation, altDiff);
    let finalOutFlow = calculateDrain(evaporatedFlow, square.precipitation);
    square.flow.flowVolume = finalOutFlow;
    return finalOutFlow;
}


function calculateDrain(volume: number, precipitation: number): number {
    if (precipitation > 500) {
        return volume;
    }
    let drainVolume = (500 - precipitation) * 0.1 * constants.UNITS.get('rainToVolume');
    let finalVolume = drainVolume > volume ? 0 : volume - drainVolume;
    return finalVolume;
}


function calculateSurfaceEvaporation(volume: number, precipitation: number, altDiff: number): number {
    let evaporationScalar = BASE_EVAPORATION - (PRECIPITATION_EFFECT * precipitation);
    let volumeLogScalar = Math.log((volume + 1)/BASE_AMOUNT);
    let volumeScalar = volumeLogScalar > 0 ? 1 + volumeLogScalar : 1;
    evaporationScalar /= volumeScalar;

    let altDiffScalar = altDiff/ALT_DIFF_BASE + 0.5; // More diff less evaporation.
    evaporationScalar /= altDiffScalar;
    return volume * (1 - evaporationScalar);
}
