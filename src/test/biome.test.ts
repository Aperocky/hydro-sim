import { FlowUtil } from '../main/components/flow';
import { Square } from '../main/components/square';
import { Biome, getBiome, getMoistureIndex } from '../main/sim/util/biome';

function makeSquare(aquiferDrain: number, precipitation: number = 0): Square {
    return {
        altitude: 100,
        precipitation,
        flow: {
            ...FlowUtil.initFlow(),
            aquiferDrain,
        },
        basin: '',
        edgeOf: new Set(),
        location: JSON.stringify({i: 0, j: 0}),
        submerged: false,
        previously_submerged: 0,
        depth: 0,
    };
}

test('biome classifier treats submerged squares as water', () => {
    let square = makeSquare(0);
    square.submerged = true;

    expect(getBiome(square)).toBe(Biome.Water);
});

test('biome classifier maps base moisture to desert, grassland, and woodland bands', () => {
    expect(getBiome(makeSquare(0))).toBe(Biome.Desert);
    expect(getBiome(makeSquare(Math.exp(2.5) * 10000))).toBe(Biome.Grassland);
    expect(getBiome(makeSquare(Math.exp(3.5) * 10000))).toBe(Biome.Woodland);
    expect(getBiome(makeSquare(Math.exp(4.5) * 10000))).toBe(Biome.Woodland);
});

test('biome classifier requires wetness and more than 2m total sedimentation for forest biomes', () => {
    let drySediment = makeSquare(Math.exp(3.4) * 10000, 1200);
    drySediment.flow.totalSedimentation = 2_100_000;
    expect(getBiome(drySediment)).toBe(Biome.Woodland);

    let wetThinSediment = makeSquare(Math.exp(3.6) * 10000, 1200);
    wetThinSediment.flow.totalSedimentation = 2_000_000;
    expect(getBiome(wetThinSediment)).toBe(Biome.Woodland);

    let forest = makeSquare(Math.exp(3.6) * 10000, 999);
    forest.flow.totalSedimentation = 2_100_000;
    expect(getBiome(forest)).toBe(Biome.Forest);

    let rainforest = makeSquare(Math.exp(3.6) * 10000, 1000);
    rainforest.flow.totalSedimentation = 2_100_000;
    expect(getBiome(rainforest)).toBe(Biome.Rainforest);
});

test('biome classifier uses net sedimentation depth after erosion', () => {
    let square = makeSquare(Math.exp(3.6) * 10000, 1000);
    square.flow.totalSedimentation = 2_100_000;
    square.flow.totalErosion = 200_000;

    expect(getBiome(square)).toBe(Biome.Woodland);
});

test('biome classifier maps recently submerged flat squares to marsh', () => {
    let square = makeSquare(Math.exp(4.5) * 10000, 1000);
    square.flow.totalSedimentation = 2_100_000;
    square.previously_submerged = 19;

    expect(getBiome(square, 0.5)).toBe(Biome.Marsh);
    expect(getBiome(square, 1)).toBe(Biome.Rainforest);
});

test('biome classifier maps recently submerged dry flats to salt pan after marsh window', () => {
    let square = makeSquare(Math.exp(1.5) * 10000);
    square.previously_submerged = 100;

    expect(getBiome(square, 0.5)).toBe(Biome.SaltPan);
});

test('biome classifier maps steep dry squares to cliff', () => {
    let square = makeSquare(Math.exp(4.5) * 10000);
    square.previously_submerged = 9;

    expect(getBiome(square, 101)).toBe(Biome.Cliff);
});

test('moisture index is clamped to zero for dry squares', () => {
    expect(getMoistureIndex(makeSquare(0))).toBe(0);
});
