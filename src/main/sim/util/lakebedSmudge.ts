import { SquareUtil } from '../../components/square';
import { Sim } from '../sim';

const SMUDGE_RATE = 0.05;
const SHORE_SMUDGE_MULTIPLIER = 0.1;
const NEIGHBOR_DIVISOR = 8;

export default function lakebedSmudge(sim: Sim): void {
    let deltas: number[][] = [];
    let {activeSquares, shoreSquares} = getSubmergedOrShoreSquares(sim);

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
                    let multiplier = shoreSquares.has(square.location)
                            || shoreSquares.has(neighbor.location) ? SHORE_SMUDGE_MULTIPLIER : 1;
                    sumDiff += multiplier * (neighbor.altitude - square.altitude);
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

function getSubmergedOrShoreSquares(sim: Sim): {activeSquares: Set<number>, shoreSquares: Set<number>} {
    let activeSquares = new Set<number>();
    let shoreSquares = new Set<number>();
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let square = sim.map[i][j];
            if (square.submerged) {
                activeSquares.add(square.location);
            }
        }
    }

    let seenBasins = new Set();
    sim.superBasins.forEach((basin) => {
        if (seenBasins.has(basin)) return;
        seenBasins.add(basin);
        for (let square of basin.lake.shore.data) {
            activeSquares.add(square.location);
            shoreSquares.add(square.location);
        }
    });

    return {activeSquares, shoreSquares};
}
