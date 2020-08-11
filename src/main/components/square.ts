import { Flow, FlowUtil } from './flow';
import * as constants from '../constant/constant';


export type Square = {
    altitude: number;
    precipitation: number;
    flow: Flow;
    basin: string;
    edgeOf: Set<string>;
    location: string;
    submerged: boolean;
    isShore: boolean;
    depth: number;
}


export class SquareUtil {

    static createSquare(altitude: number, precip: number): Square {
        return {
            altitude: SquareUtil.altAdjust(altitude),
            precipitation: SquareUtil.precipAdjust(precip),
            flow: FlowUtil.initFlow(),
            basin: "",
            edgeOf: new Set(),
            location: "", // To be filled
            submerged: false,
            isShore: false,
            depth: 0,
        };
    }

    static altAdjust(altitude: number): number {
        return altitude * constants.UNITS.get('altitude');
    }

    static precipAdjust(precip: number): number {
        return precip * constants.UNITS.get('precipitation');
    }

    static stringRep(i: number, j: number): string {
        return JSON.stringify({
            i: i,
            j: j,
        })
    }

    static getAdjacentLocs(square: Square, size: number): Map<number, number[]> {
        let loc: {i:number, j:number} = JSON.parse(square.location);
        return SquareUtil.getAdjacentSquares(loc.i, loc.j, size);
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
        let loc = JSON.parse(square.location);
        return SquareUtil.getAdjacentMap(loc.i, loc.j, size);
    }

    // Easy way, only works when location has been published
    static getInflowLocs(square: Square, size: number): {i: number, j: number}[] {
        let inFlowMap: Map<number, number> = square.flow.inFlows;
        let currLoc: {i: number, j: number} = JSON.parse(square.location);
        let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(currLoc.i, currLoc.j, size);
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
        let currLoc: {i: number, j: number} = JSON.parse(square.location);
        let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(currLoc.i, currLoc.j, sim.size);
        if (square.flow.flowDirection == 9 || square.flow.flowDirection == 0) {
            return null;
        }
        let loc = adjacents.get(square.flow.flowDirection);
        return sim.map[loc[0]][loc[1]];
    }
}
