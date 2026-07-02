// Deposit sediment into a dry basin by filling basin members up to the basin hold.
// Returns sediment that cannot be held by this basin, so it can continue downstream.

import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import * as constant from '../../constant/constant';

const UNIT_SQUARE_VOLUME = constant.UNITS.get('squareToVolume');

export function depositAtDryAnchor(
    anchor: Square,
    sediment: number,
    sim: Sim
): number {
    if (sediment <= 0 || !isFinite(sediment)) return 0;

    function effAlt(sq: Square): number {
        return sq.altitude + sq.flow.pendingErosion;
    }

    let basin = sim.superBasins ? sim.superBasins.get(anchor.basin || anchor.location) : null;
    let memberLocations = basin ? basin.members : traceDryMembers(anchor, sim);
    let targetElevation = basin ? basin.basinHold.holdElevation : findFallbackHoldElevation(memberLocations, sim, effAlt);

    let members: Square[] = [];
    for (let locStr of memberLocations) {
        let loc = JSON.parse(locStr);
        let sq = sim.map[loc.i][loc.j];
        members.push(sq);
    }

    if (members.length === 0) {
        return sediment;
    }

    if (!isFinite(targetElevation)) {
        let highest = members.reduce((max, sq) => Math.max(max, effAlt(sq)), -Infinity);
        targetElevation = highest + sediment / (members.length * UNIT_SQUARE_VOLUME);
    }

    if (!basin && targetElevation <= effAlt(anchor)) {
        targetElevation = effAlt(anchor) + sediment / (members.length * UNIT_SQUARE_VOLUME);
    }

    members = members.filter((sq) => effAlt(sq) < targetElevation);
    if (members.length === 0 || targetElevation <= effAlt(anchor)) {
        return sediment;
    }

    members.sort((a, b) => effAlt(a) - effAlt(b));

    let remaining = sediment;
    let filled: Square[] = [];
    let index = 0;
    let currentElevation = effAlt(members[0]);

    while (index < members.length && effAlt(members[index]) <= currentElevation) {
        filled.push(members[index]);
        index++;
    }

    while (remaining > 0 && filled.length > 0 && currentElevation < targetElevation) {
        let nextElevation = targetElevation;
        if (index < members.length) {
            nextElevation = Math.min(nextElevation, effAlt(members[index]));
        }
        if (nextElevation <= currentElevation) {
            while (index < members.length && effAlt(members[index]) <= currentElevation) {
                filled.push(members[index]);
                index++;
            }
            continue;
        }

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

        while (index < members.length && effAlt(members[index]) <= currentElevation) {
            filled.push(members[index]);
            index++;
        }
    }

    return remaining;
}

function traceDryMembers(anchor: Square, sim: Sim): string[] {
    let result: string[] = [];
    let visited = new Set<string>();

    function dfs(square: Square): void {
        if (visited.has(square.location)) return;
        visited.add(square.location);
        result.push(square.location);
        for (let loc of SquareUtil.getInflowLocs(square, sim.size)) {
            dfs(sim.map[loc.i][loc.j]);
        }
    }

    dfs(anchor);
    return result;
}

function findFallbackHoldElevation(
    memberLocations: string[],
    sim: Sim,
    effAlt: (sq: Square) => number
): number {
    let members = new Set(memberLocations);
    let holdElevation = Infinity;

    for (let locStr of memberLocations) {
        let loc = JSON.parse(locStr);
        let adjacents = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
        adjacents.forEach((coords) => {
            let adj = sim.map[coords[0]][coords[1]];
            if (!members.has(adj.location)) {
                holdElevation = Math.min(holdElevation, effAlt(adj));
            }
        });
    }

    return holdElevation;
}
