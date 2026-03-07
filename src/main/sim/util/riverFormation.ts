import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { FlowUtil } from '../../components/flow';
import { calculateDrain, getEffectivePrecipVolume } from './riverUtil';
import { processErosionAtSquare, dumpSedimentAtMouth } from './erosion';
import { depositAtDryAnchor } from './dryDeposit';


// Form rivers based on shores - all shores will be calculated as a separate catchment
// And fill all squares on map with flow information unless submerged

type FlowResult = {
    water: number;
    sediment: number;
}

export default function riverFormation(shoreSquare: Square, sim: Sim): number {
    return populateFlow(shoreSquare, sim).water;
}


function populateFlow(square: Square, sim: Sim): FlowResult {
    let effectivePrecipVolume = getEffectivePrecipVolume(square);
    if (square.flow.flowDirection == 0) {
        return { water: 0, sediment: 0 };
    }
    let loc: {i: number, j: number} = JSON.parse(square.location);
    let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
    let inFlowAmount = 0;
    let inSediment = 0;
    square.flow.inFlows.forEach((value, key) => {
        let flowSourceLoc = adjacents.get(key);
        let flowSourceSquare: Square = sim.map[flowSourceLoc[0]][flowSourceLoc[1]];
        let result = populateFlow(flowSourceSquare, sim);
        FlowUtil.addInFlowVol(square.flow, key, result.water);
        inFlowAmount += result.water;
        inSediment += result.sediment;
    })
    let outFlowRaw = effectivePrecipVolume + inFlowAmount;
    let finalOutFlow = calculateDrain(outFlowRaw, square);
    square.flow.flowVolume = finalOutFlow;

    // Erosion/sedimentation — stores deltas in pendingErosion, no altitude change now
    let sedimentOut = processErosionAtSquare(square, inSediment, finalOutFlow, sim);

    // Dump sediment at river-lake boundary
    let downstreamSquare = SquareUtil.getDownstreamSquare(square, sim);
    if (downstreamSquare && downstreamSquare.submerged) {
        dumpSedimentAtMouth(downstreamSquare, sedimentOut, sim);
        sedimentOut = 0;
    } else if (downstreamSquare && downstreamSquare.flow.flowDirection === 0 && !downstreamSquare.submerged) {
        // Dry basin anchor — smudge sediment outward
        depositAtDryAnchor(downstreamSquare, sedimentOut, sim);
        sedimentOut = 0;
    }

    return { water: finalOutFlow, sediment: sedimentOut };
}
