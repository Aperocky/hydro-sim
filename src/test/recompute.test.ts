import { Sim } from '../main/sim/sim';
import { SquareUtil } from '../main/components/square';
import { FlowUtil } from '../main/components/flow';
import { createDrySim } from './testUtil';

const SIZE = 150;

describe('Recompute topography (dry sim)', () => {
    let sim: Sim;

    beforeAll(() => {
        sim = createDrySim(SIZE);
        for (let i = 0; i < 3; i++) {
            sim.run();
        }
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

    test('no square has negative depth', () => {
        sim.map.forEach(arr => arr.forEach(sq => {
            expect(sq.depth).toBeGreaterThanOrEqual(0);
        }));
    });

    test('non-submerged squares have zero depth', () => {
        sim.map.forEach(arr => arr.forEach(sq => {
            if (!sq.submerged) {
                expect(sq.depth).toBe(0);
            }
        }));
    });

    test('altitude is unchanged without rainfall', () => {
        let sim2 = createDrySim(SIZE);

        let altitudes: number[][] = [];
        for (let i = 0; i < SIZE; i++) {
            altitudes.push([]);
            for (let j = 0; j < SIZE; j++) {
                altitudes[i][j] = sim2.map[i][j].altitude;
            }
        }

        for (let i = 0; i < 3; i++) {
            sim2.run();
        }

        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                expect(sim2.map[i][j].altitude).toBe(altitudes[i][j]);
            }
        }
    });
});

describe('Erosion effects', () => {
    test('altitude changes with rainfall', () => {
        let sim = new Sim(SIZE);

        let altitudes: number[][] = [];
        for (let i = 0; i < SIZE; i++) {
            altitudes.push([]);
            for (let j = 0; j < SIZE; j++) {
                altitudes[i][j] = sim.map[i][j].altitude;
            }
        }

        sim.run();
        sim.run(); // erosion uses last turn's flow, so need 2 turns

        let changed = 0;
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (sim.map[i][j].altitude !== altitudes[i][j]) changed++;
            }
        }
        expect(changed).toBeGreaterThan(0);
    });
});

describe('Flow reset correctness', () => {
    test('resetForRecompute preserves aquifer and flowVolume but clears flow direction', () => {
        let flow = FlowUtil.initFlow();
        FlowUtil.populateFlowDirection(flow, 4, 50);
        flow.aquifer = 5000;
        flow.aquiferDrain = 100;
        FlowUtil.addInFlowDir(flow, 1);
        FlowUtil.addInFlowVol(flow, 1, 999);
        flow.flowVolume = 12345;

        FlowUtil.resetForRecompute(flow);

        expect(flow.flowDirection).toBe(0);
        expect(flow.heightDiff).toBe(0);
        expect(flow.inFlows.size).toBe(0);
        expect(flow.flowVolume).toBe(12345);
        expect(flow.aquifer).toBe(5000);
        expect(flow.aquiferDrain).toBe(100);
    });

    test('resetForRecompute on square preserves altitude and location', () => {
        let square = SquareUtil.createSquare(0.5, 0.3);
        square.location = SquareUtil.stringRep(10, 20);
        square.basin = "somebasin";
        square.submerged = true;
        square.depth = 42;
        square.edgeOf = new Set(["a", "b"]);

        SquareUtil.resetForRecompute(square);

        expect(square.altitude).toBeGreaterThan(0);
        expect(square.precipitation).toBeGreaterThan(0);
        expect(square.location).toBe(SquareUtil.stringRep(10, 20));
        expect(square.basin).toBe("");
        expect(square.submerged).toBe(false);
        expect(square.depth).toBe(0);
        expect(square.edgeOf.size).toBe(0);
    });
});
