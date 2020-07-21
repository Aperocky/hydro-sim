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
