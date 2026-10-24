import { Basin } from '../../components/basin/basin';
import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { dumpSedimentAtMouth } from './erosion';
import { depositAtDryAnchor } from './dryDeposit';
import * as constants from '../../constant/constant';

const UNIT_SQUARE_VOLUME = constants.UNITS.get('squareToVolume');

// Deposit sediment at the next sink. If that sink cannot hold all sediment,
// route the remainder through basin holds and existing downstream flow.
export function settleOrRouteSediment(
    entrySquare: Square,
    sediment: number,
    sim: Sim
): number {
    if (sediment <= 0 || !isFinite(sediment)) return 0;

    let current: Square | null = entrySquare;
    let last = entrySquare;
    let remaining = sediment;
    let visitedBasins: Set<number> = new Set();
    let visitedSquares: Set<number> = new Set();
    let steps = 0;
    let maxSteps = Math.max(1, sim.size * sim.size * 4);

    while (current && remaining > 0 && steps < maxSteps) {
        steps++;
        last = current;

        if (current.submerged) {
            remaining = dumpSedimentAtMouth(current, remaining, sim);
            if (remaining <= 0) return 0;
            current = getBasinOutflowTarget(current, sim, visitedBasins);
            continue;
        }

        if (current.flow.flowDirection === 0) {
            remaining = depositAtDryAnchor(current, remaining, sim);
            if (remaining <= 0) return 0;
            current = getBasinOutflowTarget(current, sim, visitedBasins);
            continue;
        }

        if (visitedSquares.has(current.location)) {
            break;
        }
        visitedSquares.add(current.location);

        current = SquareUtil.getDownstreamSquare(current, sim);
    }

    let basin = getSquareBasin(last, sim);
    let members = basin ? basin.members.map((id) => {
        let loc = SquareUtil.locFromId(id);
        return sim.map[loc.i][loc.j];
    }) : [last];
    if (members.length === 0) members = [last];
    let rise = remaining / (members.length * UNIT_SQUARE_VOLUME);
    for (let square of members) square.flow.pendingErosion += rise;
    return 0;
}

function getBasinOutflowTarget(
    square: Square,
    sim: Sim,
    visitedBasins: Set<number>
): Square | null {
    let basin = getSquareBasin(square, sim);
    if (!basin || !basin.basinHold || basin.basinHold.holdMember < 0) {
        return null;
    }

    let basinKey = basin.anchor;
    if (visitedBasins.has(basinKey)) {
        return null;
    }
    visitedBasins.add(basinKey);

    let holdLoc = SquareUtil.locFromId(basin.basinHold.holdMember);
    let adjacents = SquareUtil.getAdjacentSquares(holdLoc.i, holdLoc.j, sim.size);
    let target: Square | null = null;
    let targetElevation = Infinity;

    adjacents.forEach((coords) => {
        let adj = sim.map[coords[0]][coords[1]];
        if (!basin.basinHold.holdBasins.includes(adj.basin)) {
            return;
        }
        if (sim.superBasins && sim.superBasins.get(adj.basin) === basin) {
            return;
        }
        let elevation = adj.altitude + adj.flow.pendingErosion;
        if (elevation < targetElevation) {
            targetElevation = elevation;
            target = adj;
        }
    });

    return target;
}

function getSquareBasin(square: Square, sim: Sim): Basin | null {
    if (!sim.superBasins) return null;
    if (square.basin >= 0 && sim.superBasins.has(square.basin)) {
        return sim.superBasins.get(square.basin);
    }
    if (sim.superBasins.has(square.location)) {
        return sim.superBasins.get(square.location);
    }
    return null;
}
