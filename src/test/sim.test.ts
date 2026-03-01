import { Sim } from '../main/sim/sim';

const SIZE = 150;

describe('Sim structure', () => {
    let sim: Sim;

    beforeAll(() => {
        sim = new Sim(SIZE);
    });

    test('every square is assigned to a basin', () => {
        let count = 0;
        sim.map.forEach(arr => arr.forEach(square => {
            if (square.basin) count++;
        }));
        expect(count).toBe(SIZE * SIZE);
    });

    test('basin member counts sum to grid size', () => {
        let count = 0;
        sim.basins.forEach(basin => {
            count += basin.members.length;
        });
        expect(count).toBe(SIZE * SIZE);
    });

    test('every basin has valid structure', () => {
        sim.basins.forEach((basin, anchor) => {
            expect(basin.members.length).toBeGreaterThan(0);
            expect(basin.basinHold.edgeMembers.length).toBeGreaterThan(0);
            expect(basin.basinHold.holdCapacity).toBeGreaterThan(0);
        });
    });
});
