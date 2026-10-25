import { Basin, BasinFullEvent } from '../../components/basin/basin';
import SuperBasin from '../../components/basin/superBasin';
import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import { RiverRouting } from './riverRouting';
import * as constants from '../../constant/constant';


type ProcessOverflowOptions = {
    routeFlow?: boolean;
    fillAquifer?: boolean;
    routing?: RiverRouting;
}

export default function processOverflowEvent(sim: Sim, event: BasinFullEvent, options: ProcessOverflowOptions = {}): BasinFullEvent | null {
    let routeFlow = options.routeFlow !== false;
    let thisBasin = sim.superBasins.get(event.anchor);
    let holdBasins = new Set(event.holdBasins);
    let nextBasinAnchor: number;
    let nextBasin: Basin;
    let lowestElevation = Number.MAX_SAFE_INTEGER;
    let holdLoc = SquareUtil.locFromId(event.holdMember);
    SquareUtil.getAdjacentSquares(holdLoc.i, holdLoc.j, sim.size).forEach((loc) => {
        let adjacent = sim.map[loc[0]][loc[1]];
        let candidate = sim.superBasins.get(adjacent.basin);
        if (holdBasins.has(adjacent.basin) && candidate && candidate !== thisBasin
                && adjacent.altitude < lowestElevation) {
            lowestElevation = adjacent.altitude;
            nextBasinAnchor = adjacent.basin;
            nextBasin = candidate;
        }
    });
    if (nextBasinAnchor === undefined) {
        // All hold basins belong to the current superbasin.
        return null;
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
        let newEvent = receiveInflow(superBasin, totalOverflow, sim, options);
        return newEvent;
    }
    let diffVolume = event.overflowVolume;
    if (routeFlow) {
        let outlet = identifyOutflow(sim, event.holdMember, nextBasinAnchor);
        if (!outlet) {
            // Erosion invalidated the outflow path — skip event
            thisBasin.basinFullEvent = null;
            return null;
        }
        if (!options.routing) throw new Error('River routing is required for channel overflow');
        let hold = sim.map[holdLoc.i][holdLoc.j];
        options.routing.recordOutlet(hold, constants.REVERSE.get(outlet.direction), event.overflowVolume);
        diffVolume = options.routing.routeOverflow(outlet.square, event.overflowVolume);
    }

    thisBasin.basinFullEvent = null; // Clearing the event from original basin.

    if (diffVolume <= 0) {
        // Erosion/sedimentation absorbed all overflow along the path
        return null;
    }

    let newEvent: BasinFullEvent | null = receiveInflow(nextBasin, diffVolume, sim, options);
    return newEvent;
}


function identifyOutflow(sim: Sim, holdMember: number, flowToBasin: number): {square: Square, direction: number} | null {
    let loc = SquareUtil.locFromId(holdMember);
    let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
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
    return {
        square: flowToSquare,
        direction: constants.REVERSE.get(flowDirection),
    };
}


function receiveInflow(basin: Basin, volume: number, sim: Sim, options: ProcessOverflowOptions): BasinFullEvent | null {
    if (options.routing) {
        volume = options.routing.receiveLakeInflow(basin, volume);
        return basin.processInflow(volume, sim, {fillAquifer: false});
    }
    return basin.processInflow(volume, sim, {fillAquifer: options.fillAquifer});
}
