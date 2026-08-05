// Governs colors of mapping

export const OVERLAY_ALPHA: number = 0.2;
export const LAKE_BLUE = [16, 165, 245];
export const SEDIMENTATION_COLOR = [245, 185, 66];
export const EROSION_COLOR = [160, 90, 212];

const LAKE_COLOR_MAP: Map<number, number[]> = new Map();
LAKE_COLOR_MAP.set(0, [16, 165, 245]);
LAKE_COLOR_MAP.set(1, [0, 0, 130]);

export const BIOME_COLORS = {
    water: LAKE_BLUE,
    marsh: [105, 185, 205],
    saltPan: [238, 235, 222],
    cliff: [135, 130, 118],
    desert: [225, 190, 145],
    grassland: [160, 230, 100],
    woodland: [105, 175, 80],
    forest: [55, 140, 65],
    rainforest: [30, 120, 60],
}

const BASE_COLOR_MAP: Map<number, number[]> = new Map();
BASE_COLOR_MAP.set(0, [36, 92, 58]);
BASE_COLOR_MAP.set(1, [95, 158, 85]);
BASE_COLOR_MAP.set(2, [169, 180, 106]);
BASE_COLOR_MAP.set(3, [197, 145, 87]);
BASE_COLOR_MAP.set(4, [140, 112, 91]);
BASE_COLOR_MAP.set(5, [170, 169, 164]);
BASE_COLOR_MAP.set(6, [236, 239, 241]);

const ALT_COLOR_MAP: Map<number, number[]> = new Map();
ALT_COLOR_MAP.set(0, [40, 140, 70]); // Dark Green
ALT_COLOR_MAP.set(1, [150, 250, 150]); // Light Green
ALT_COLOR_MAP.set(2, [235, 180, 130]); // Light Brown
ALT_COLOR_MAP.set(3, [160, 100, 50]); // Brown
ALT_COLOR_MAP.set(4, [200, 200, 200]); // Gray

const PRECIP_COLOR_MAP: Map<number, number[]> = new Map();
PRECIP_COLOR_MAP.set(0, [120, 120, 0]); // Desert
PRECIP_COLOR_MAP.set(1, [175, 215, 230]); // Light blue
PRECIP_COLOR_MAP.set(2, [20, 30, 240]); // Blue
PRECIP_COLOR_MAP.set(3, [0, 0, 130]); // Navy

const AQUIFER_COLOR_MAP: Map<number, number[]> = new Map();
AQUIFER_COLOR_MAP.set(0, [215, 215, 215]); // Light grey
AQUIFER_COLOR_MAP.set(1, [20, 30, 240]); // Blue
AQUIFER_COLOR_MAP.set(2, [0, 0, 130]); // Navy

const FLAT_COLOR_MAP: Map<number, number[]> = new Map();
FLAT_COLOR_MAP.set(0, [80, 180, 80]);   // Flat — green
FLAT_COLOR_MAP.set(1, [230, 160, 50]);  // Moderate — orange
FLAT_COLOR_MAP.set(2, [120, 70, 30]);   // Steep — brown
FLAT_COLOR_MAP.set(3, [200, 40, 30]);   // Cliff — red

export const COLOR_MAPS = {
    altitude: ALT_COLOR_MAP,
    precip: PRECIP_COLOR_MAP,
    aquifer: AQUIFER_COLOR_MAP,
    base: BASE_COLOR_MAP,
    lake: LAKE_COLOR_MAP,
    flatness: FLAT_COLOR_MAP,
}

export type MapConfig = {
    name: string;
    stepSize: number;
    subStep: number;
    alpha: boolean;
}

export const MAP_CONFIG = {
    altitude: {
        name: 'altitude',
        stepSize: 500,
        subStep: 5,
        alpha: false,
    },
    base: {
        name: 'base',
        stepSize: 500,
        subStep: 100,
        alpha: false,
    },
    precip: {
        name: 'precip',
        stepSize: 500,
        subStep: 5,
        alpha: true,
    },
    basin: {
        name: 'basin',
        stepSize: 500, // Not applicable, just here for type sake
        subStep: 5,
        alpha: true,
    },
    aquifer: {
        name: 'aquifer',
        stepSize: 0.45,
        subStep: 5,
        alpha: true,
    },
    lake: {
        name: 'lake',
        stepSize: 300,
        subStep: 100,
        alpha: false,
    },
    flatness: {
        name: 'flatness',
        stepSize: 50,
        subStep: 100,
        alpha: false,
    }
}
