import { FlowUtil } from '../main/components/flow';
import { Square, SquareUtil } from '../main/components/square';
import applyGodMode, { GodModeAction } from '../main/sim/util/godMode';

function createSim(size: number): any {
    let map: Square[][] = [];
    for (let i = 0; i < size; i++) {
        map.push([]);
        for (let j = 0; j < size; j++) {
            map[i][j] = {
                altitude: 100,
                precipitation: 50,
                flow: FlowUtil.initFlow(),
                basin: SquareUtil.NO_LOCATION,
                edgeOf: new Set(),
                location: SquareUtil.locationId(i, j),
                i, j,
                submerged: false,
                previously_submerged: 0,
                depth: 0,
            };
        }
    }
    return {size, map};
}

test('God Mode applies a circular Gaussian without touching sediment ledgers', () => {
    let sim = createSim(15);
    let center = sim.map[7][7];
    center.flow.totalSedimentation = 3;
    center.flow.currentSedimentation = 2;

    applyGodMode(sim, center, GodModeAction.ALTITUDE, 5, 100);

    expect(center.altitude).toBeCloseTo(200, 9);
    expect(sim.map[10][7].altitude).toBeGreaterThan(100);
    expect(sim.map[10][7].altitude).toBeLessThan(200);
    expect(sim.map[11][11].altitude).toBe(100);
    expect(center.flow.totalSedimentation).toBe(3);
    expect(center.flow.currentSedimentation).toBe(2);
    expect(center.flow.pendingErosion).toBe(0);
});

test('God Mode precipitation cannot fall below zero', () => {
    let sim = createSim(15);
    let center = sim.map[7][7];

    applyGodMode(sim, center, GodModeAction.PRECIPITATION, 5, -100);

    expect(center.precipitation).toBe(0);
    expect(center.altitude).toBe(100);
});
