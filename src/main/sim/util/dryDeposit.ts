// Deposit sediment into a dry basin by smudging outward from the anchor.
// Fills anchor to 0.1m above its lowest neighbor, then expands ring by ring.
// Each ring expansion raises ALL filled squares (anchor + all rings so far) by SMUDGE_MARGIN.

import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import * as constant from '../../constant/constant';

const UNIT_SQUARE_VOLUME = constant.UNITS.get('squareToVolume');
const SMUDGE_MARGIN = 0.1; // meters above lowest neighbor

export function depositAtDryAnchor(
    anchor: Square,
    sediment: number,
    sim: Sim
): void {
    if (sediment <= 0 || !isFinite(sediment)) return;

    let remaining = sediment;
    let allFilled: Square[] = [anchor];
    let filledSet = new Set<string>([anchor.location]);

    function effAlt(sq: Square): number {
        return sq.altitude + sq.flow.pendingErosion;
    }

    function lowestNeighborAlt(sq: Square): number {
        let loc = JSON.parse(sq.location);
        let adjacents = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
        let lowest = Infinity;
        adjacents.forEach((coords) => {
            let adj = sim.map[coords[0]][coords[1]];
            if (filledSet.has(adj.location)) return;
            let alt = effAlt(adj);
            if (alt < lowest) lowest = alt;
        });
        return lowest;
    }

    // Fill anchor to SMUDGE_MARGIN above its lowest neighbor
    let targetAlt = lowestNeighborAlt(anchor) + SMUDGE_MARGIN;
    let anchorAlt = effAlt(anchor);
    if (targetAlt > anchorAlt) {
        let deposit = (targetAlt - anchorAlt) * UNIT_SQUARE_VOLUME;
        deposit = Math.min(deposit, remaining);
        anchor.flow.pendingErosion += deposit / UNIT_SQUARE_VOLUME;
        remaining -= deposit;
    }

    if (remaining <= 0) return;

    // Expand ring by ring
    let currentRing: Square[] = [anchor];
    let maxRings = sim.size;

    for (let ring = 0; ring < maxRings && remaining > 0; ring++) {
        let nextRing: Square[] = [];

        for (let sq of currentRing) {
            let loc = JSON.parse(sq.location);
            let adjacents = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
            adjacents.forEach((coords) => {
                let adj = sim.map[coords[0]][coords[1]];
                if (filledSet.has(adj.location)) return;
                filledSet.add(adj.location);
                nextRing.push(adj);
            });
        }

        if (nextRing.length === 0) break;

        // For each new ring square: fill to margin above lowest non-filled neighbor,
        // or add fixed margin if already higher
        for (let sq of nextRing) {
            if (remaining <= 0) break;
            let lowestOutside = lowestNeighborAlt(sq);
            let current = effAlt(sq);
            let target: number;
            if (lowestOutside === Infinity) {
                target = current + SMUDGE_MARGIN;
            } else if (current >= lowestOutside) {
                target = current + SMUDGE_MARGIN;
            } else {
                target = lowestOutside + SMUDGE_MARGIN;
            }
            if (target > current) {
                let deposit = (target - current) * UNIT_SQUARE_VOLUME;
                deposit = Math.min(deposit, remaining);
                sq.flow.pendingErosion += deposit / UNIT_SQUARE_VOLUME;
                remaining -= deposit;
            }
        }

        allFilled.push(...nextRing);

        // Raise ALL filled squares (anchor + all rings) by SMUDGE_MARGIN
        if (remaining > 0) {
            let needed = allFilled.length * SMUDGE_MARGIN * UNIT_SQUARE_VOLUME;
            if (needed <= remaining) {
                for (let sq of allFilled) {
                    sq.flow.pendingErosion += SMUDGE_MARGIN;
                }
                remaining -= needed;
            } else {
                // Distribute remaining evenly
                let perSquare = remaining / (allFilled.length * UNIT_SQUARE_VOLUME);
                for (let sq of allFilled) {
                    sq.flow.pendingErosion += perSquare;
                }
                remaining = 0;
            }
        }

        currentRing = nextRing;
    }
    // Any remaining sediment is discarded (spread beyond map)
}
