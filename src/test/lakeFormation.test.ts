import { Sim } from '../main/sim/sim';
import { Basin } from '../main/components/basin/basin';
import LakeFormation from '../main/components/basin/lakeFormation';

const SIZE = 150;

function selectLargestBasin(sim: Sim): Basin {
    let selected: Basin;
    sim.basins.forEach(basin => {
        if (!selected || basin.basinHold.holdCapacity > selected.basinHold.holdCapacity) {
            selected = basin;
        }
    });
    return selected;
}

function countAreas(sim: Sim): { submerged: number, shore: number } {
    let submerged = 0;
    let shore = 0;
    sim.map.forEach(arr => arr.forEach(square => {
        if (square.submerged) submerged++;
        if (square.isShore) shore++;
    }));
    return { submerged, shore };
}

describe('Lake formation', () => {
    let sim: Sim;
    let basin: Basin;
    let lake: LakeFormation;

    beforeAll(() => {
        sim = new Sim(SIZE);
        basin = selectLargestBasin(sim);
        lake = basin.lake;
    });

    afterEach(() => {
        lake.drainToElevation(sim, lake.anchorElevation - 1);
    });

    test('partial fill reaches target volume', () => {
        const testCapacity = basin.basinHold.holdCapacity / 2;
        lake.fillToVolume(sim, testCapacity);
        expect(lake.volume).toBe(testCapacity);
        const { submerged, shore } = countAreas(sim);
        expect(submerged).toBeGreaterThanOrEqual(lake.flooded.length);
        expect(shore).toBeGreaterThanOrEqual(lake.shore.length);
    });

    test('drain to mid-elevation reduces surface', () => {
        const testCapacity = basin.basinHold.holdCapacity / 2;
        lake.fillToVolume(sim, testCapacity);
        const midElevation = (lake.surfaceElevation - lake.anchorElevation) / 2 + lake.anchorElevation;
        lake.drainToElevation(sim, midElevation);
        expect(lake.surfaceElevation).toBe(midElevation);
        const { submerged, shore } = countAreas(sim);
        expect(submerged).toBeGreaterThanOrEqual(lake.flooded.length);
        expect(shore).toBeGreaterThanOrEqual(lake.shore.length);
    });

    test('full fill reaches hold elevation', () => {
        lake.fillToVolume(sim, basin.basinHold.holdCapacity);
        expect(lake.surfaceElevation).toBeCloseTo(basin.basinHold.holdElevation, 3);
    });
});
