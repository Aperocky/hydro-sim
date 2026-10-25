import { Square, SquareUtil } from '../../components/square';
import { FlowUtil } from '../../components/flow';
import { Sim } from '../sim';
import * as constants from '../../constant/constant';


// This populate all flow directions
export default function populateFlowDirection(sim: Sim): void {
    let map: Square[][] = sim.map;
    let size: number = sim.size;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let currSquare: Square = map[i][j];
            let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(i, j, size);
            let maxHeightDiffPair: number[] = [0, 0];
            adjacents.forEach((value, key) => {
                let adjacentSquare: Square = sim.getSquare(value[0], value[1])
                let heightDiff: number = currSquare.altitude - adjacentSquare.altitude;
                if (heightDiff > maxHeightDiffPair[1]) {
                    maxHeightDiffPair = [key, heightDiff];
                }
            });
            let flowDirection = maxHeightDiffPair[0];
            let heightDiff = maxHeightDiffPair[1];
            FlowUtil.populateFlowDirection(currSquare.flow, flowDirection, heightDiff);
            if (flowDirection !== 0) {
                let floc = adjacents.get(flowDirection);
                let flowToSquare = sim.getSquare(floc[0], floc[1]);
                FlowUtil.addInFlowDir(flowToSquare.flow, constants.REVERSE.get(flowDirection));
            }
        }
    }
}
