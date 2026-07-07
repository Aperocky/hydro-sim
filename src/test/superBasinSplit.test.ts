import { Sim } from '../main/sim/sim';
import { Basin } from '../main/components/basin/basin';
import SuperBasin from '../main/components/basin/superBasin';
import * as constants from '../main/constant/constant';

const UNIT_SQUARE_VOLUME = constants.UNITS.get('squareToVolume');

function seedRandom(seed: number): () => void {
    let originalRandom = Math.random;
    let state = seed >>> 0;
    Math.random = () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
    return () => {
        Math.random = originalRandom;
    };
}

function volumeAtElevation(sim: Sim, basin: Basin, elevation: number): number {
    let volume = 0;
    for (let locStr of basin.members) {
        let loc: {i: number, j: number} = JSON.parse(locStr);
        let square = sim.map[loc.i][loc.j];
        if (square.altitude < elevation) {
            volume += (elevation - square.altitude) * UNIT_SQUARE_VOLUME;
        }
    }
    return volume;
}

function countSubmergedMembers(sim: Sim, basin: Basin): number {
    let count = 0;
    for (let locStr of basin.members) {
        let loc: {i: number, j: number} = JSON.parse(locStr);
        if (sim.map[loc.i][loc.j].submerged) count++;
    }
    return count;
}

function findSplittablePair(sim: Sim): [Basin, Basin] {
    let result: [Basin, Basin];
    sim.basins.forEach((basin) => {
        if (result || !basin.basinHold.holdMember) return;
        for (let anchor of basin.basinHold.holdBasins) {
            let other = sim.basins.get(anchor);
            if (!other) continue;
            let targetElevation = basin.basinHold.holdElevation - 0.5;
            if (
                targetElevation > basin.anchorAltitude + 0.5 &&
                targetElevation > other.anchorAltitude + 0.5
            ) {
                result = [basin, other];
                return;
            }
        }
    });
    return result;
}

test('superbasin split rebuilds child lake water from terrain instead of stale child volume', () => {
    let restoreRandom = seedRandom(7);
    try {
        let sim = new Sim(140);
        let [basinA, basinB] = findSplittablePair(sim);
        expect(basinA).toBeDefined();
        expect(basinB).toBeDefined();

        let targetElevation = basinA.basinHold.holdElevation - 0.5;
        let expectedA = volumeAtElevation(sim, basinA, targetElevation);
        let expectedB = volumeAtElevation(sim, basinB, targetElevation);
        expect(expectedA).toBeGreaterThan(0);
        expect(expectedB).toBeGreaterThan(0);

        basinA.lake.drainToVolume(sim, 0);
        basinB.lake.drainToVolume(sim, 0);
        let superBasin = SuperBasin.fromBasins(sim, basinA, basinB);

        superBasin.divideBasin(sim, targetElevation);

        expect(basinA.lake.getVolume()).toBeCloseTo(expectedA, -2);
        expect(basinB.lake.getVolume()).toBeCloseTo(expectedB, -2);
    } finally {
        restoreRandom();
    }
}, 30000);

test('superbasin split rebuilds correctly when child lakes still have stale water queues', () => {
    let restoreRandom = seedRandom(13);
    try {
        let sim = new Sim(140);
        let [basinA, basinB] = findSplittablePair(sim);
        expect(basinA).toBeDefined();
        expect(basinB).toBeDefined();

        basinA.lake.fillToVolume(sim, volumeAtElevation(sim, basinA, basinA.basinHold.holdElevation));
        basinB.lake.fillToVolume(sim, volumeAtElevation(sim, basinB, basinA.basinHold.holdElevation));

        let targetElevation = basinA.basinHold.holdElevation - 0.5;
        let expectedA = volumeAtElevation(sim, basinA, targetElevation);
        let expectedB = volumeAtElevation(sim, basinB, targetElevation);

        let superBasin = SuperBasin.fromBasins(sim, basinA, basinB);
        superBasin.divideBasin(sim, targetElevation);

        expect(basinA.lake.getVolume()).toBeCloseTo(expectedA, -2);
        expect(basinB.lake.getVolume()).toBeCloseTo(expectedB, -2);
        expect(countSubmergedMembers(sim, basinA)).toBeGreaterThan(0);
        expect(countSubmergedMembers(sim, basinB)).toBeGreaterThan(0);
    } finally {
        restoreRandom();
    }
}, 30000);

test('superbasin merge rebuilds shared lake footprint from terrain instead of stale child lakes', () => {
    let restoreRandom = seedRandom(11);
    try {
        let sim = new Sim(140);
        let [basinA, basinB] = findSplittablePair(sim);
        expect(basinA).toBeDefined();
        expect(basinB).toBeDefined();

        let divideElevation = basinA.basinHold.holdElevation;
        let expectedA = volumeAtElevation(sim, basinA, divideElevation);
        let expectedB = volumeAtElevation(sim, basinB, divideElevation);
        expect(expectedA).toBeGreaterThan(0);
        expect(expectedB).toBeGreaterThan(0);

        basinA.lake.drainToVolume(sim, 0);
        basinB.lake.drainToVolume(sim, 0);

        let superBasin = SuperBasin.fromBasins(sim, basinA, basinB);

        expect(superBasin.lake.getVolume()).toBeCloseTo(expectedA + expectedB, -2);
        expect(superBasin.lake.surfaceElevation).toBe(divideElevation);
        expect(superBasin.lake.flooded.length).toBeGreaterThan(basinA.lake.flooded.length);
        expect(superBasin.lake.flooded.length).toBeGreaterThan(basinB.lake.flooded.length);
    } finally {
        restoreRandom();
    }
}, 30000);
