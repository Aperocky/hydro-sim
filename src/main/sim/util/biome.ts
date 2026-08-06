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

export const MARSH_SUBMERGENCE_TURNS = 20;
export const MARSH_ANY_GRADIENT_TURNS = 5;
export const SALT_PAN_MOISTURE_THRESHOLD = 2;
export const FLAT_WETLAND_GRADIENT = 1;
export const CLIFF_GRADIENT = 100;
export const RAINFOREST_MOISTURE_THRESHOLD = 3.5;
export const RAINFOREST_SEDIMENT_DEPTH = 2;
export const RAINFOREST_PRECIPITATION_THRESHOLD = 1000;

export function getBiome(square: Square, localGradient: number = square.flow.heightDiff): Biome {
    if (square.submerged) {
        return Biome.Water;
    }

    if (localGradient > CLIFF_GRADIENT) {
        return Biome.Cliff;
    }

    let moisture = getMoistureIndex(square);
    if (
        moisture < SALT_PAN_MOISTURE_THRESHOLD &&
        wasPreviouslySubmerged(square) &&
        localGradient < FLAT_WETLAND_GRADIENT
    ) {
        return Biome.SaltPan;
    }

    if (
        wasRecentlySubmerged(square, MARSH_ANY_GRADIENT_TURNS) ||
        (wasRecentlySubmerged(square, MARSH_SUBMERGENCE_TURNS) && localGradient < FLAT_WETLAND_GRADIENT)
    ) {
        return Biome.Marsh;
    }
    if (moisture < 1) {
        return Biome.Desert;
    }
    if (moisture < 3) {
        return Biome.Grassland;
    }
    if (
        moisture > RAINFOREST_MOISTURE_THRESHOLD &&
        square.flow.currentSedimentation > RAINFOREST_SEDIMENT_DEPTH
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

function wasRecentlySubmerged(square: Square, turns: number): boolean {
    return square.previously_submerged > 0 && square.previously_submerged < turns;
}

function wasPreviouslySubmerged(square: Square): boolean {
    return square.previously_submerged > 0;
}
