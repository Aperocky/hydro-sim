import { SimBase } from '../main/sim/simBase';
import lakebedSmudge from '../main/sim/util/lakebedSmudge';
import * as constants from '../main/constant/constant';

function createFlatSim(size: number): any {
    let sim: any = new SimBase(size);
    sim.superBasins = new Map();
    sim.initialized = true;
    sim.altitude = [];
    sim.precip = [];
    for (let i = 0; i < size; i++) {
        sim.altitude.push([]);
        sim.precip.push([]);
        for (let j = 0; j < size; j++) {
            sim.altitude[i][j] = 100 / constants.UNITS.get('altitude');
            sim.precip[i][j] = 0;
        }
    }
    sim.createMap();
    return sim;
}

test('lakebed smudge smooths submerged squares without net altitude drift', () => {
    let sim = createFlatSim(3);
    sim.map[1][1].altitude = 80;
    sim.map[0][0].altitude = 120;

    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            sim.map[i][j].submerged = true;
        }
    }

    lakebedSmudge(sim);

    let totalPending = 0;
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            totalPending += sim.map[i][j].flow.pendingErosion;
        }
    }

    expect(Math.abs(totalPending)).toBeLessThan(1e-9);
    expect(sim.map[1][1].flow.pendingErosion).toBeGreaterThan(0);
    expect(sim.map[0][0].flow.pendingErosion).toBeLessThan(0);
});

test('lakebed smudge includes lake shore squares but not unrelated dry squares', () => {
    let sim = createFlatSim(3);
    let submerged = sim.map[1][1];
    let shore = sim.map[1][2];
    let dry = sim.map[1][0];

    submerged.altitude = 80;
    shore.altitude = 120;
    dry.altitude = 120;
    submerged.submerged = true;

    sim.superBasins.set('fake', {
        lake: {
            shore: {
                data: [shore],
            },
        },
    });

    lakebedSmudge(sim);

    expect(submerged.flow.pendingErosion).toBeGreaterThan(0);
    expect(shore.flow.pendingErosion).toBeLessThan(0);
    expect(dry.flow.pendingErosion).toBe(0);
    expect(submerged.flow.pendingErosion + shore.flow.pendingErosion).toBeCloseTo(0, 9);
});
