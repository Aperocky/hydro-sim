export type Square = {
    altitude: number;
    precipitation: number;
}


// Direction in relation with other squares
// 0  1  2
// 7  X  3
// 6  5  4


export class SquareUtil {
    
    static createSquare(altitude: number, precip: number): Square {
        return {
            altitude: altitude,
            precipitation: precip
        };
    }
}
