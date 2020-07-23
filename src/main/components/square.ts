import { Flow, FlowUtil } from './flow';
import * as constants from '../constant/constant';


export type Square = {
    altitude: number;
    precipitation: number;
    flow: Flow;
    basin: string;
}


export class SquareUtil {

    static createSquare(altitude: number, precip: number): Square {
        return {
            altitude: altitude,
            precipitation: precip,
            flow: FlowUtil.initFlow(),
            basin: "",
        };
    }

    static stringRep(i: number, j: number): string {
        return JSON.stringify({
            i: i,
            j: j,
        })
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
