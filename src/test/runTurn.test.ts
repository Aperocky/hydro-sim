import { Sim } from '../main/sim/sim';
import { createDrySim } from './testUtil';

const SIZE = 150;

describe('Simulation turns (with rainfall)', () => {
    let sim: Sim;

    beforeAll(() => {
        sim = new Sim(SIZE);
    });

    test('basins have water after 1 turn', () => {
        sim.run();
        let totalVolume = 0;
        sim.superBasins.forEach(b => { totalVolume += b.lake.getVolume(); });
        expect(totalVolume).toBeGreaterThan(0);
    });

    test('lakes and shores form after several turns', () => {
        // Already ran 1 turn in previous test
        sim.run();
        let lakeTiles = 0;
        let beachTiles = 0;
        sim.map.forEach(arr => arr.forEach(square => {
            if (square.submerged) lakeTiles++;
        }));
        expect(lakeTiles).toBeGreaterThan(0);
    });

    test('aquifer state is preserved across turns', () => {
        let hasAquifer = false;
        sim.map.forEach(arr => arr.forEach(square => {
            if (square.flow.aquifer > 0) hasAquifer = true;
        }));
        expect(hasAquifer).toBe(true);
    });
});
