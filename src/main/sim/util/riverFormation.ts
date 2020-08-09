import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { FlowUtil } from '../../components/flow';
import { calculateDrain, getEffectivePrecipVolume } from './riverUtil';
import * as constants from '../../constant/constant';


// Form rivers based on shores - all shores will be calculated as a separate catchment
// And fill all squares on map with flow information unless submerged

export default function riverFormation(shoreSquare: Square, sim: Sim): number {
    return populateFlow(shoreSquare, sim);
}


function populateFlow(square: Square, sim: Sim): number {
    let effectivePrecipVolume = getEffectivePrecipVolume(square);
    if (square.flow.flowDirection == 0) {
        return 0;
    }
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
    let outFlowRaw = effectivePrecipVolume + inFlowAmount;
    let flowToLoc = adjacents.get(square.flow.flowDirection);
    let altDiff = square.flow.heightDiff;
    // Let evaporation takes its toll
    // Surface evaporation.
    // Percentage based on volume, larger the volume, the less percentage it losses.
    let finalOutFlow = calculateDrain(outFlowRaw, square);
    square.flow.flowVolume = finalOutFlow;
    return finalOutFlow;
}

