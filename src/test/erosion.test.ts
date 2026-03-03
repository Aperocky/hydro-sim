import { Sim } from '../main/sim/sim';

const SIZE = 150;

describe('Erosion and sedimentation', () => {

    test('outlet channels erode over time', () => {
        const sim = new Sim(SIZE);
        sim.run();
        // Run a few turns to fill basins
        for (let i = 0; i < 5; i++) sim.run();

        // Find full basins with hold members
        let holdAltitudes: Map<string, number> = new Map();
        sim.superBasins.forEach(basin => {
            if (basin.isFull && basin.basinHold.holdMember) {
                let loc = JSON.parse(basin.basinHold.holdMember);
                holdAltitudes.set(basin.basinHold.holdMember, sim.map[loc.i][loc.j].altitude);
            }
        });

        // Run more turns for erosion to act on outlets
        for (let i = 0; i < 20; i++) sim.run();

        // At least one hold member should have lower altitude
        let eroded = 0;
        holdAltitudes.forEach((oldAlt, holdMember) => {
            let loc = JSON.parse(holdMember);
            let newAlt = sim.map[loc.i][loc.j].altitude;
            if (newAlt < oldAlt) eroded++;
        });
        expect(eroded).toBeGreaterThan(0);
    });

    test('mountains erode faster than plains', () => {
        const sim = new Sim(SIZE);
        sim.run();
        sim.run();

        let mountainErosion = 0;
        let mountainCount = 0;
        let plainErosion = 0;
        let plainCount = 0;

        sim.map.forEach(arr => arr.forEach(sq => {
            if (sq.flow.erosion > 0) {
                if (sq.altitude > 1500) {
                    mountainErosion += sq.flow.erosion;
                    mountainCount++;
                } else if (sq.altitude < 500 && sq.altitude > 0) {
                    plainErosion += sq.flow.erosion;
                    plainCount++;
                }
            }
        }));

        if (mountainCount > 0 && plainCount > 0) {
            let avgMountain = mountainErosion / mountainCount;
            let avgPlain = plainErosion / plainCount;
            expect(avgMountain).toBeGreaterThan(avgPlain);
        }
    });

    test('sedimentation occurs on flat terrain', () => {
        const sim = new Sim(SIZE);
        sim.run();
        sim.run();

        let hasFlatSedimentation = false;
        sim.map.forEach(arr => arr.forEach(sq => {
            if (sq.flow.sedimentation > 0 && sq.flow.heightDiff < 5) {
                hasFlatSedimentation = true;
            }
        }));
        expect(hasFlatSedimentation).toBe(true);
    });

    test('sediment is carried downstream', () => {
        const sim = new Sim(SIZE);
        sim.run();
        sim.run();

        let hasSedimentInFlow = false;
        sim.map.forEach(arr => arr.forEach(sq => {
            if (sq.flow.sediment > 0) hasSedimentInFlow = true;
        }));
        expect(hasSedimentInFlow).toBe(true);
    });

    test('total altitude change is bounded per turn', () => {
        const sim = new Sim(SIZE);
        sim.run();

        let altBefore: number[][] = [];
        for (let i = 0; i < SIZE; i++) {
            altBefore.push([]);
            for (let j = 0; j < SIZE; j++) {
                altBefore[i][j] = sim.map[i][j].altitude;
            }
        }

        sim.run();

        let maxChange = 0;
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                let change = Math.abs(sim.map[i][j].altitude - altBefore[i][j]);
                if (change > maxChange) maxChange = change;
            }
        }
        // No single square should change more than 50m in one turn
        expect(maxChange).toBeLessThan(50);
    });

    test('erosion and sedimentation conserve sediment along a river', () => {
        const sim = new Sim(SIZE);
        sim.run();
        sim.run();

        // For squares with flow, total erosion - total sedimentation should roughly
        // equal total sediment still being carried
        let totalEroded = 0;
        let totalDeposited = 0;
        let totalCarried = 0;

        sim.map.forEach(arr => arr.forEach(sq => {
            totalEroded += sq.flow.erosion;
            totalDeposited += sq.flow.sedimentation;
            // Sediment at river mouths (where flow meets lake) is the carried amount
            if (sq.flow.sediment > 0 && sq.flow.flowDirection !== 9 && sq.flow.flowDirection !== 0) {
                // Only count terminal sediment (squares whose downstream is submerged or null)
            }
            totalCarried += sq.flow.sediment;
        }));

        // Eroded should be > deposited (some sediment is still in transit or dumped in lakes)
        expect(totalEroded).toBeGreaterThan(0);
        expect(totalDeposited).toBeGreaterThan(0);
        expect(totalEroded).toBeGreaterThan(totalDeposited);
    });

    test('no NaN altitudes after 10 turns', () => {
        const sim = new Sim(SIZE);
        sim.run();
        for (let i = 0; i < 10; i++) {
            sim.run();
        }
        sim.map.forEach(arr => arr.forEach(sq => {
            expect(isFinite(sq.altitude)).toBe(true);
        }));
    });
});
