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


export const DIRECTION_DESCRIPTION: Map<number, string> = new Map();
DIRECTION_DESCRIPTION.set(1, "Northwest");
DIRECTION_DESCRIPTION.set(2, "West");
DIRECTION_DESCRIPTION.set(3, "Southwest");
DIRECTION_DESCRIPTION.set(4, "South");
DIRECTION_DESCRIPTION.set(5, "Southeast");
DIRECTION_DESCRIPTION.set(6, "East");
DIRECTION_DESCRIPTION.set(7, "Northeast");
DIRECTION_DESCRIPTION.set(8, "North");
DIRECTION_DESCRIPTION.set(9, "Nowhere");
DIRECTION_DESCRIPTION.set(0, "Nowhere");


export const REVERSE: Map<number, number> = new Map();
REVERSE.set(1, 5);
REVERSE.set(2, 6);
REVERSE.set(3, 7);
REVERSE.set(4, 8);
REVERSE.set(5, 1);
REVERSE.set(6, 2);
REVERSE.set(7, 3);
REVERSE.set(8, 4);


export const UNITS: Map<string, number> = new Map();
// Altitude units are in meters.
UNITS.set("altitude", 3000);
// Precipitation units are in mm
UNITS.set("precipitation", 2000);
// Volume rates are in m**3
// This takes consideration of fact that precipitation is in mm and area is in km**2
UNITS.set("rainToVolume", 1000);
// Square of depth x multiplied by this to get volume in m**3
UNITS.set("squareToVolume", 1000000);
// Area placeholder, each square is 1 km**2
UNITS.set('area', 1);


export const MAP_SIZE = 200;
export const SPRITE_SIZE = 4;
