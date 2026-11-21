// Deposit sediment into a dry basin by filling basin members up to the basin hold.
// Returns sediment that cannot be held by this basin, so it can continue downstream.

import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import * as constant from '../../constant/constant';

const UNIT_SQUARE_VOLUME = constant.UNITS.get('squareToVolume');

export function effectiveAltitude(square: Square): number {
    return square.altitude + square.flow.pendingErosion;
}

export function depositAtDryAnchor(
    anchor: Square,
    sediment: number,
    sim: Sim
): number {
    if (sediment <= 0 || !isFinite(sediment)) return 0;

    let basin = sim.superBasins ? sim.superBasins.get(anchor.basin >= 0 ? anchor.basin : anchor.location) : null;
    let memberLocations = basin ? basin.members : traceDryMembers(anchor, sim);
    let targetElevation = basin ? basin.basinHold.holdElevation : findFallbackHoldElevation(memberLocations, sim);

    let members: Square[] = [];
    for (let locStr of memberLocations) {
        let loc = SquareUtil.locFromId(locStr);
        let sq = sim.map[loc.i][loc.j];
        members.push(sq);
    }

    if (members.length === 0) {
        return sediment;
    }

    if (!isFinite(targetElevation)) {
        let highest = members.reduce((max, sq) => Math.max(max, effectiveAltitude(sq)), -Infinity);
        targetElevation = highest + sediment / (members.length * UNIT_SQUARE_VOLUME);
    }

    let anchorElevation = effectiveAltitude(anchor);
    if (!basin && targetElevation <= anchorElevation) {
        targetElevation = anchorElevation + sediment / (members.length * UNIT_SQUARE_VOLUME);
    }

    if (targetElevation <= anchorElevation) return sediment;
    return fillSedimentToElevation(members, sediment, targetElevation);
}

// Fill the lowest terrain first, including deposits already scheduled this turn.
export function fillSedimentToElevation(members: Square[], sediment: number, targetElevation: number): number {
    members = members.filter(sq => effectiveAltitude(sq) < targetElevation);
    if (members.length === 0) return sediment;
    members.sort((a, b) => effectiveAltitude(a) - effectiveAltitude(b));

    let remaining = sediment;
    let filled: Square[] = [];
    let index = 0;
    let currentElevation = effectiveAltitude(members[0]);

    while (remaining > 0 && currentElevation < targetElevation) {
        while (index < members.length && effectiveAltitude(members[index]) <= currentElevation) {
            filled.push(members[index++]);
        }
        let nextElevation = index < members.length
            ? Math.min(targetElevation, effectiveAltitude(members[index])) : targetElevation;

        let needed = (nextElevation - currentElevation) * filled.length * UNIT_SQUARE_VOLUME;
        if (needed > remaining) {
            let rise = remaining / (filled.length * UNIT_SQUARE_VOLUME);
            for (let sq of filled) {
                sq.flow.pendingErosion += rise;
            }
            return 0;
        }

        for (let sq of filled) {
            sq.flow.pendingErosion += nextElevation - currentElevation;
        }
        remaining -= needed;
        currentElevation = nextElevation;
    }

    return remaining;
}

function traceDryMembers(anchor: Square, sim: Sim): number[] {
    let result: number[] = [];
    let visited = new Set<number>();

    function dfs(square: Square): void {
        if (visited.has(square.location)) return;
        visited.add(square.location);
        result.push(square.location);
        for (let upstream of SquareUtil.getUpstreamSquares(square, sim)) {
            dfs(upstream);
        }
    }

    dfs(anchor);
    return result;
}

function findFallbackHoldElevation(
    memberLocations: number[],
    sim: Sim
): number {
    let members = new Set(memberLocations);
    let holdElevation = Infinity;

    for (let locStr of memberLocations) {
        let loc = SquareUtil.locFromId(locStr);
        let adjacents = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
        adjacents.forEach((coords) => {
            let adj = sim.map[coords[0]][coords[1]];
            if (!members.has(adj.location)) {
                holdElevation = Math.min(holdElevation, effectiveAltitude(adj));
            }
        });
    }

    return holdElevation;
}
