// Flow Direction in relation with other squares
// 1  2  3
// 8  9  4
// 7  6  5
// 0: uninitiated
// 9: lowest point, no flow to other squares.
export const DIRECTIONS: Map<number, number[]> = new Map();
DIRECTIONS.set(1, [-1, -1]);
DIRECTIONS.set(2, [-1, 0]);
DIRECTIONS.set(3, [-1, 1]);
DIRECTIONS.set(4, [0, 1]);
DIRECTIONS.set(5, [1, 1]);
DIRECTIONS.set(6, [1, 0]);
DIRECTIONS.set(7, [1, -1]);
DIRECTIONS.set(8, [0, -1]);


export const REVERSE: Map<number, number> = new Map();
REVERSE.set(1, 5);
REVERSE.set(2, 6);
REVERSE.set(3, 7);
REVERSE.set(4, 8);
REVERSE.set(5, 1);
REVERSE.set(6, 2);
REVERSE.set(7, 3);
REVERSE.set(8, 4);
