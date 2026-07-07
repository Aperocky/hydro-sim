import { Flow, FlowUtil } from './flow';
import * as constants from '../constant/constant';


export type Square = {
    altitude: number;
    precipitation: number;
    flow: Flow;
    basin: number;
    edgeOf: Set<number>;
    location: number;
    i: number;
    j: number;
    submerged: boolean;
    previously_submerged: number;
    depth: number;
}


export class SquareUtil {
    static NO_LOCATION = -1;
    static LOCATION_ID_MULTIPLIER = 100000;

    static createSquare(altitude: number, precip: number): Square {
        return {
            altitude: SquareUtil.altAdjust(altitude),
            precipitation: SquareUtil.precipAdjust(precip),
            flow: FlowUtil.initFlow(),
            basin: SquareUtil.NO_LOCATION,
            edgeOf: new Set(),
            location: SquareUtil.NO_LOCATION, // To be filled
            i: SquareUtil.NO_LOCATION,
            j: SquareUtil.NO_LOCATION,
            submerged: false,
            previously_submerged: 0,
            depth: 0,
        };
    }

    static altAdjust(altitude: number): number {
        return altitude * constants.UNITS.get('altitude');
    }

    static precipAdjust(precip: number): number {
        return precip * constants.UNITS.get('precipitation');
    }

    static stringRep(i: number, j: number): number {
        return SquareUtil.locationId(i, j);
    }

    static locationId(i: number, j: number): number {
        return i * SquareUtil.LOCATION_ID_MULTIPLIER + j;
    }

    static locFromId(location: number): {i: number, j: number} {
        return {
            i: Math.floor(location / SquareUtil.LOCATION_ID_MULTIPLIER),
            j: location % SquareUtil.LOCATION_ID_MULTIPLIER,
        };
    }

    static getAdjacentLocs(square: Square, size: number): Map<number, number[]> {
        return SquareUtil.getAdjacentSquares(square.i, square.j, size);
    }

    // Reset square state for basin recomputation. Preserves altitude, precipitation, location, and flow aquifer state.
    static resetForRecompute(square: Square): void {
        square.basin = SquareUtil.NO_LOCATION;
        square.edgeOf = new Set();
        square.submerged = false;
        square.depth = 0;
        FlowUtil.resetForRecompute(square.flow);
    }

    static getAdjacentSquares(i: number, j: number, size: number): Map<number, number[]> {
        let adjacents: Map<number, number[]> = new Map();
        constants.DIRECTIONS.forEach((value, key) => {
            let x = i + value[0];
            let y = j + value[1];
            if (x < 0 || x >= size || y < 0 || y >= size) {
                return;
            }
            adjacents.set(key, [x, y]);
        });
        return adjacents;
    }

    // New way to do getAdjacentSquares/Locs
    static getAdjacentMap(i: number, j: number, size: number): Map<number, {i:number, j:number}> {
        let adjacents = SquareUtil.getAdjacentSquares(i, j, size);
        let result: Map<number, {i: number, j: number}> = new Map();
        adjacents.forEach((value, key) => {
            result.set(key, {i: value[0], j: value[1]});
        })
        return result;
    }

    static getAdjacentMapFromSquare(square: Square, size: number): Map<number, {i:number, j:number}> {
        return SquareUtil.getAdjacentMap(square.i, square.j, size);
    }

    // Easy way, only works when location has been published
    static getInflowLocs(square: Square, size: number): {i: number, j: number}[] {
        let inFlowMap: Map<number, number> = square.flow.inFlows;
        let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(square.i, square.j, size);
        let result = [];
        inFlowMap.forEach((value, key) => {
            let loc = adjacents.get(key);
            result.push({
                i: loc[0],
                j: loc[1],
            });
        });
        return result;
    }

    static getUpstreamSquares(square: Square, sim): Square[] {
        let inflowLocs = SquareUtil.getInflowLocs(square, sim.size);
        return inflowLocs.map((loc) => sim.map[loc.i][loc.j]);
    }

    static getDownstreamSquare(square: Square, sim): Square | null {
        if (square.flow.flowDirection == 9 || square.flow.flowDirection == 0) {
            return null;
        }
        let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(square.i, square.j, sim.size);
        let loc = adjacents.get(square.flow.flowDirection);
        return sim.map[loc[0]][loc[1]];
    }
}
