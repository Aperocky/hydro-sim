import { Sim } from '../main/sim/sim';

const SIZE = 150;
const RIVER_THRESHOLD = 100000000; // 100M m^3

function countTiles(sim: Sim): { riverTiles: number, lakeTiles: number, beachTiles: number } {
    let riverTiles = 0;
    let lakeTiles = 0;
    let beachTiles = 0;
    sim.map.forEach(arr => arr.forEach(square => {
        if (square.flow.flowVolume > RIVER_THRESHOLD) riverTiles++;
        if (square.submerged) lakeTiles++;
        if (square.isShore) beachTiles++;
    }));
    return { riverTiles, lakeTiles, beachTiles };
}

describe('Simulation turns', () => {
    let sim: Sim;

    beforeAll(() => {
        sim = new Sim(SIZE);
    });

    test('flow volumes are populated after 1 turn', () => {
        sim.run();
        let hasFlow = false;
        sim.map.forEach(arr => arr.forEach(square => {
            if (square.flow.flowVolume > 0) hasFlow = true;
        }));
        expect(hasFlow).toBe(true);
    });

    test('lakes and beaches form after 11 turns', () => {
        for (let i = 0; i < 10; i++) {
            sim.run();
        }
        const { riverTiles, lakeTiles, beachTiles } = countTiles(sim);
        expect(riverTiles).toBeGreaterThan(0);
        expect(lakeTiles).toBeGreaterThan(0);
        expect(beachTiles).toBeGreaterThan(0);
    });
});
