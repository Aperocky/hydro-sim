import { Square, SquareUtil } from '../../components/square';
import { FlowUtil } from '../../components/flow';

// This populate all flow directions
export default function populateFlowDirection(map: Square[][], size: number): void {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(i, j, size);
            let currSquare: Square = map[i][j];
            let maxHeightDiffPair: number[] = [0, 0];
            adjacents.forEach((value, key) => {
                let adjacentSquare: Square = map[value[0]][value[1]];
                let heightDiff: number = currSquare.altitude - adjacentSquare.altitude;
                if (heightDiff > maxHeightDiffPair[1]) {
                    maxHeightDiffPair = [key, heightDiff];
                }
            });
            FlowUtil.populateFlowDirection(currSquare.flow, maxHeightDiffPair[0], maxHeightDiffPair[1]);
        }
    }
}
