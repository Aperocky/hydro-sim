import { Flow, FlowUtil } from './flow';
import * as constants from '../constant/constant';


export type Square = {
    altitude: number;
    precipitation: number;
    flow: Flow;
    basin: string;
    edgeOf: Set<string>;
    location: string;
    isHold: boolean
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
            isHold: false,
        };
    }

    static altAdjust(altitude: number): number {
        return altitude * constants.UNITS.get('altitude');
    }

    static precipAdjust(precip: number): number {
        let factor: number = constants.UNITS.get('precipitation');
        if (precip > 0) {
            return factor * ( 1 + precip );
        }
        let scale: number = Math.exp(precip);
        return factor * scale;
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
}
