import { Square } from '../../components/square';

export enum Biome {
    Water = 'water',
    Marsh = 'marsh',
    SaltPan = 'saltPan',
    Cliff = 'cliff',
    Desert = 'desert',
    Grassland = 'grassland',
    Woodland = 'woodland',
    Forest = 'forest',
    Rainforest = 'rainforest',
}

export const MARSH_SUBMERGENCE_TURNS = 10;
export const SALT_PAN_SUBMERGENCE_TURNS = 100;
export const SALT_PAN_MOISTURE_THRESHOLD = 2;
export const FLAT_WETLAND_GRADIENT = 1;
export const CLIFF_GRADIENT = 100;
export const RAINFOREST_MOISTURE_THRESHOLD = 3.5;
export const RAINFOREST_SEDIMENT_DEPTH = 2;
export const RAINFOREST_PRECIPITATION_THRESHOLD = 1000;
export const SQUARE_AREA_M2 = 1000 * 1000;

export function getBiome(square: Square, localGradient: number = square.flow.heightDiff): Biome {
    if (square.submerged) {
        return Biome.Water;
    }

    if (localGradient > CLIFF_GRADIENT) {
        return Biome.Cliff;
    }

    if (wasRecentlySubmerged(square, MARSH_SUBMERGENCE_TURNS) && localGradient < FLAT_WETLAND_GRADIENT) {
        return Biome.Marsh;
    }

    let moisture = getMoistureIndex(square);
    if (
        moisture < SALT_PAN_MOISTURE_THRESHOLD &&
        wasSubmergedAtMost(square, SALT_PAN_SUBMERGENCE_TURNS) &&
        localGradient < FLAT_WETLAND_GRADIENT
    ) {
        return Biome.SaltPan;
    }
    if (moisture < 1) {
        return Biome.Desert;
    }
    if (moisture < 3) {
        return Biome.Grassland;
    }
    if (
        moisture > RAINFOREST_MOISTURE_THRESHOLD &&
        getNetSedimentationDepth(square) > RAINFOREST_SEDIMENT_DEPTH
    ) {
        if (square.precipitation >= RAINFOREST_PRECIPITATION_THRESHOLD) {
            return Biome.Rainforest;
        }
        return Biome.Forest;
    }
    return Biome.Woodland;
}

export function getMoistureIndex(square: Square): number {
    let aquiferDrain = square.flow.aquiferDrain;
    let moisture = Math.log(aquiferDrain / 10000);
    if (!isFinite(moisture) || moisture < 0) {
        return 0;
    }
    return moisture;
}

export function getNetSedimentationDepth(square: Square): number {
    return (square.flow.totalSedimentation - square.flow.totalErosion) / SQUARE_AREA_M2;
}

function wasRecentlySubmerged(square: Square, turns: number): boolean {
    return square.previously_submerged > 0 && square.previously_submerged < turns;
}

function wasSubmergedAtMost(square: Square, turns: number): boolean {
    return square.previously_submerged > 0 && square.previously_submerged <= turns;
}
