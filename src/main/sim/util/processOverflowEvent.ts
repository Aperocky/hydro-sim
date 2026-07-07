import { Basin, BasinFullEvent } from '../../components/basin/basin';
import SuperBasin from '../../components/basin/superBasin';
import { Square, SquareUtil } from '../../components/square';
import { FlowUtil } from '../../components/flow';
import { Sim } from '../sim';
import { calculateDrain, getEffectivePrecipVolume } from './riverUtil';
import * as constants from '../../constant/constant';


type ProcessOverflowOptions = {
    includePrecipitation?: boolean;
    routeFlow?: boolean;
    fillAquifer?: boolean;
}

export default function processOverflowEvent(sim: Sim, event: BasinFullEvent, options: ProcessOverflowOptions = {}): BasinFullEvent | null {
    let includePrecipitation = options.includePrecipitation !== false;
    let routeFlow = options.routeFlow !== false;
    if (event.holdBasins.length != 1) {
    }
    let thisBasin = sim.superBasins.get(event.anchor);
    let holdBasins = event.holdBasins.slice();
    let nextBasinAnchor: string;
    let nextBasin: Basin;
    while (true) {
        nextBasinAnchor = holdBasins.pop();
        if (nextBasinAnchor === undefined) {
            // All hold basins belong to current superbasin — skip event
            return null;
        }
        nextBasin = sim.superBasins.get(nextBasinAnchor);
        if (thisBasin != nextBasin) {
            break;
        }
    }
    let shareHold = thisBasin.basinHold.holdMember == nextBasin.basinHold.holdMember;
    if (nextBasin.isFull && shareHold) {
        let superBasin = SuperBasin.fromBasins(sim, thisBasin, nextBasin);
        // Hijack both BasinFullEvent.
        let totalOverflow = event.overflowVolume;
        let otherEvent = nextBasin.basinFullEvent;
        if (otherEvent != null) {
            totalOverflow += otherEvent.overflowVolume;
            otherEvent.valid = false;
            nextBasin.basinFullEvent = null;
        }
        thisBasin.basinFullEvent = null;
        let newEvent = superBasin.processInflow(totalOverflow, sim, {fillAquifer: options.fillAquifer});
        return newEvent;
    }
    let diffVolume = event.overflowVolume;
    if (routeFlow) {
        let outlet = identifyOutflow(sim, event.holdMember, nextBasinAnchor, event.overflowVolume);
        if (!outlet) {
            // Erosion invalidated the outflow path — skip event
            thisBasin.basinFullEvent = null;
            return null;
        }
        diffVolume = flow(outlet.square, event.overflowVolume, outlet.direction, sim, includePrecipitation);
    }

    thisBasin.basinFullEvent = null; // Clearing the event from original basin.

    if (diffVolume <= 0) {
        // Erosion/sedimentation absorbed all overflow along the path
        return null;
    }

    let newEvent: BasinFullEvent | null = nextBasin.processInflow(diffVolume, sim, {fillAquifer: options.fillAquifer});
    return newEvent;
}


function identifyOutflow(sim: Sim, holdMember: string, flowToBasin: string, overflowVolume: number): {square: Square, direction: number} | null {
    let loc = JSON.parse(holdMember);
    let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
    let holdSquare = sim.map[loc.i][loc.j];
    let lowestElevation = Number.MAX_SAFE_INTEGER;
    let flowToSquare: Square;
    let flowDirection: number;
    adjacents.forEach((value, key) => {
        let adjacentSquare = sim.map[value[0]][value[1]];
        if (adjacentSquare.basin == flowToBasin) {
            if (adjacentSquare.altitude < lowestElevation) {
                lowestElevation = adjacentSquare.altitude;
                flowToSquare = adjacentSquare;
                flowDirection = key;
            }
        }
    })
    if (!flowToSquare) {
        return null;
    }
    if (flowDirection == holdSquare.flow.flowDirection) {
        holdSquare.flow.flowVolume = overflowVolume;
    } else {
        holdSquare.submerged = true;
    }
    return {
        square: flowToSquare,
        direction: constants.REVERSE.get(flowDirection),
    };
}


function flow(square: Square, volume: number, flowFrom: number, sim: Sim, includePrecipitation: boolean, depth: number = 0): number {
    if (depth > 50000) {
        console.warn(`flow() hit recursion limit at depth ${depth} at square ${square.location}`);
        return 0;
    }
    let flowFromOriginalValue = 0;
    if (square.flow.inFlows.has(flowFrom)) {
        flowFromOriginalValue = square.flow.inFlows.get(flowFrom)
    }
    FlowUtil.addInFlowVol(square.flow, flowFrom, volume + flowFromOriginalValue);
    let updatedRawFlowVolume = 0;
    square.flow.inFlows.forEach((val) => {
        updatedRawFlowVolume += val;
    })
    // Recalibrate cellular water flow.
    if (includePrecipitation) {
        updatedRawFlowVolume += getEffectivePrecipVolume(square);
    }
    let nextSquare = SquareUtil.getDownstreamSquare(square, sim);
    if (nextSquare == null) {
        return updatedRawFlowVolume - square.flow.flowVolume
    }
    let altDiff = square.altitude - nextSquare.altitude;
    let finalVolume = calculateDrain(updatedRawFlowVolume, square);

    // Find the difference in flow at mouth
    let originalFlowVolume = square.flow.flowVolume;
    square.flow.flowVolume = finalVolume;
    let diffVolume = finalVolume - originalFlowVolume;

    let nextFlowFrom = constants.REVERSE.get(square.flow.flowDirection);

    if (nextSquare.submerged) {
        return diffVolume;
    }
    return flow(nextSquare, diffVolume, nextFlowFrom, sim, includePrecipitation, depth + 1);
}
