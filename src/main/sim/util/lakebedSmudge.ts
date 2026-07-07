import { SquareUtil } from '../../components/square';
import { Sim } from '../sim';

const SMUDGE_RATE = 0.05;
const NEIGHBOR_DIVISOR = 8;

export default function lakebedSmudge(sim: Sim): void {
    let deltas: number[][] = [];
    let activeSquares = getSubmergedOrShoreSquares(sim);

    for (let i = 0; i < sim.size; i++) {
        deltas.push([]);
        for (let j = 0; j < sim.size; j++) {
            let square = sim.map[i][j];
            if (!activeSquares.has(square.location)) {
                deltas[i][j] = 0;
                continue;
            }

            let sumDiff = 0;
            let adjacents = SquareUtil.getAdjacentSquares(i, j, sim.size);
            adjacents.forEach((loc) => {
                let neighbor = sim.map[loc[0]][loc[1]];
                if (activeSquares.has(neighbor.location)) {
                    sumDiff += neighbor.altitude - square.altitude;
                }
            });
            deltas[i][j] = SMUDGE_RATE * sumDiff / NEIGHBOR_DIVISOR;
        }
    }

    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            if (deltas[i][j] !== 0) {
                sim.map[i][j].flow.pendingErosion += deltas[i][j];
            }
        }
    }
}

function getSubmergedOrShoreSquares(sim: Sim): Set<number> {
    let result = new Set<number>();
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let square = sim.map[i][j];
            if (square.submerged) {
                result.add(square.location);
            }
        }
    }

    let seenBasins = new Set();
    sim.superBasins.forEach((basin) => {
        if (seenBasins.has(basin)) return;
        seenBasins.add(basin);
        for (let square of basin.lake.shore.data) {
            result.add(square.location);
        }
    });

    return result;
}
