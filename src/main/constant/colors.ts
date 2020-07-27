// Governs colors of mapping

export const OVERLAY_ALPHA: number = 0.2;

const BASE_COLOR_MAP: Map<number, number[]> = new Map();
BASE_COLOR_MAP.set(0, [100, 180, 100]);
BASE_COLOR_MAP.set(1, [210, 240, 210]);

const ALT_COLOR_MAP: Map<number, number[]> = new Map();
ALT_COLOR_MAP.set(0, [30, 120, 60]); // Dark Green
ALT_COLOR_MAP.set(1, [150, 250, 150]); // Light Green
ALT_COLOR_MAP.set(2, [235, 180, 130]); // Light Brown
ALT_COLOR_MAP.set(3, [160, 100, 50]); // Brown
ALT_COLOR_MAP.set(4, [200, 200, 200]); // Gray

const PRECIP_COLOR_MAP: Map<number, number[]> = new Map();
PRECIP_COLOR_MAP.set(0, [200, 200, 200]); // Gray
PRECIP_COLOR_MAP.set(1, [175, 215, 230]); // Light blue
PRECIP_COLOR_MAP.set(2, [20, 30, 240]); // Blue
PRECIP_COLOR_MAP.set(3, [0, 0, 130]); // Navy

export const COLOR_MAPS = {
    altitude: ALT_COLOR_MAP,
    precip: PRECIP_COLOR_MAP,
    base: BASE_COLOR_MAP,
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
        stepSize: 2000,
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
    }
}
