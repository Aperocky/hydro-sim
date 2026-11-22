import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';

const SMUDGE_RATE = 0.05;
const SHORE_SMUDGE_MULTIPLIER = 0.1;
const NEIGHBOR_DIVISOR = 8;

function smoothingCap(square: Square): number {
    const depth = square.submerged ? Math.min(20, Math.max(0, square.depth)) : 0;
    return (1 - depth / 20) * 0.9 + 0.1;
}

export default function lakebedSmudge(sim: Sim): void {
    let {activeSquares, shoreSquares} = getSubmergedOrShoreSquares(sim);
    const transfers: {from: Square; to: Square; amount: number}[] = [];
    const totals = new Map<Square, number>();

    activeSquares.forEach(location => {
        const {i, j} = SquareUtil.locFromId(location);
        const square = sim.map[i][j];
        SquareUtil.getAdjacentSquares(i, j, sim.size).forEach(([ni, nj]) => {
            const neighbor = sim.map[ni][nj];
            // Visit each downhill pair once, using the unchanged bed elevations.
            const drop = square.altitude - neighbor.altitude;
            if (drop <= 0 || !activeSquares.has(neighbor.location)) return;
            const multiplier = shoreSquares.has(location) || shoreSquares.has(neighbor.location)
                ? SHORE_SMUDGE_MULTIPLIER : 1;
            const amount = SMUDGE_RATE * multiplier * drop / NEIGHBOR_DIVISOR;
            transfers.push({from: square, to: neighbor, amount});
            totals.set(square, (totals.get(square) || 0) + amount);
            totals.set(neighbor, (totals.get(neighbor) || 0) + amount);
        });
    });

    // Limit total movement per tile and apply the smaller scale to both ends.
    const scales = new Map<Square, number>();
    totals.forEach((total, square) => scales.set(square, Math.min(1, smoothingCap(square) / total)));
    for (const {from, to, amount} of transfers) {
        const moved = amount * Math.min(scales.get(from), scales.get(to));
        from.flow.pendingErosion -= moved;
        to.flow.pendingErosion += moved;
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
