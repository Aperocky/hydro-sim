import { Basin, BasinFullEvent } from '../../components/basin/basin';
import SuperBasin from '../../components/basin/superBasin';
import { Square, SquareUtil } from '../../components/square';
import { FlowUtil } from '../../components/flow';
import { Sim } from '../sim';
import { calculateDrain, calculateSurfaceEvaporation } from './riverUtil';
import * as constants from '../../constant/constant';


export default function processOverflowEvent(sim: Sim, event: BasinFullEvent): BasinFullEvent | null {
    if (event.holdBasins.length != 1) {
        throw new Error(`unanticipated basin direction: ${event.holdBasins}`);
    }
    let nextBasinAnchor = event.holdBasins[0];
    let thisBasin = sim.superBasins.get(event.anchor);
    let nextBasin = sim.superBasins.get(nextBasinAnchor);
    let shareHold = thisBasin.basinHold.holdMember == nextBasin.basinHold.holdMember;
    if (nextBasin.isFull && shareHold) {
        let superBasin = SuperBasin.fromBasins(sim, thisBasin, nextBasin);
        // Hijack both BasinFullEvent.
        let totalOverflow = event.overflowVolume;
        let otherEvent = nextBasin.basinFullEvent;
        if (otherEvent != null) {
            totalOverflow = otherEvent.overflowVolume;
            otherEvent.valid = false;
            nextBasin.basinFullEvent = null;
        }
        thisBasin.basinFullEvent = null;
        let newEvent = superBasin.processInflow(totalOverflow, sim);
        return newEvent;
    }
    let outlet = identifyOutflow(sim, event.holdMember, event.holdBasins[0]);
    let diffVolume = flow(outlet.square, event.overflowVolume, outlet.direction, sim);

    if (diffVolume < 0) {
        throw new Error("Something went wrong, less water got discharged than original");
    }

    thisBasin.basinFullEvent = null; // Clearing the event from original basin.

    let newEvent: BasinFullEvent | null = nextBasin.processInflow(diffVolume, sim);
    return newEvent;
}


function identifyOutflow(sim: Sim, holdMember: string, flowToBasin: string): {square: Square, direction: number} {
    let loc = JSON.parse(holdMember);
    let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
    let holdSquare = sim.map[loc.i][loc.j];
    let lowestElevation = holdSquare.altitude;
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
        throw new Error("No square in target basin is lower than hold square");
    }
    return {
        square: flowToSquare,
        direction: constants.REVERSE.get(flowDirection),
    };
}


function flow(square: Square, volume: number, flowFrom: number, sim: Sim): number {
    let flowFromOriginalValue = 0;
    if (square.flow.inFlows.has(flowFrom)) {
        flowFromOriginalValue = square.flow.inFlows.get(flowFrom)
    }
    FlowUtil.addInFlowVol(square.flow, flowFrom, volume + flowFromOriginalValue);
    let updatedRawFlowVolume = 0;
    square.flow.inFlows.forEach((val) => {
        updatedRawFlowVolume += val;
    })
    // Recalibrate cellular water flow
    let effectivePrecip = square.precipitation > 200 ? square.precipitation - 200 : 0;
    let effectivePrecipVolume = effectivePrecip * constants.UNITS.get('rainToVolume');
    updatedRawFlowVolume += effectivePrecipVolume;
    let nextSquare = SquareUtil.getDownstreamSquare(square, sim);
    let altDiff = square.altitude - nextSquare.altitude;
    let finalVolume = calculateSurfaceEvaporation(updatedRawFlowVolume, square.precipitation, altDiff)
    finalVolume = calculateDrain(finalVolume, square.precipitation);

    // Find the difference in flow at mouth
    let originalFlowVolume = square.flow.flowVolume;
    square.flow.flowVolume = finalVolume;
    let diffVolume = finalVolume - originalFlowVolume;

    let nextFlowFrom = constants.REVERSE.get(square.flow.flowDirection);

    if (nextSquare.submerged) {
        return diffVolume;
    }
    return flow(nextSquare, finalVolume, nextFlowFrom, sim);
}
