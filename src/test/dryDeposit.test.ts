import { SimBase } from '../main/sim/simBase';
import { SquareUtil, Square } from '../main/components/square';
import populateFlowDirection from '../main/sim/util/populateFlowDirection';
import { depositAtDryAnchor } from '../main/sim/util/dryDeposit';
import * as constant from '../main/constant/constant';

const UNIT_SQUARE_VOLUME = constant.UNITS.get('squareToVolume');

function buildGrid(altitudes: number[][]): SimBase {
    const size = altitudes.length;
    let sim = new SimBase(size);
    sim.altitude = [];
    sim.precip = [];
    for (let i = 0; i < size; i++) {
        sim.altitude.push([]);
        sim.precip.push([]);
        for (let j = 0; j < size; j++) {
            sim.altitude[i][j] = altitudes[i][j] / 3000;
            sim.precip[i][j] = 0;
        }
    }
    sim.map = [];
    sim.basins = new Map();
    (sim as any).superBasins = new Map();
    for (let i = 0; i < size; i++) {
        sim.map.push([]);
        for (let j = 0; j < size; j++) {
            let sq = SquareUtil.createSquare(sim.altitude[i][j], sim.precip[i][j]);
            sq.location = SquareUtil.stringRep(i, j);
            sim.map[i][j] = sq;
        }
    }
    populateFlowDirection(sim as any);
    return sim;
}

function effAlt(sq: Square): number {
    return sq.altitude + sq.flow.pendingErosion;
}

function totalPendingVolume(sim: SimBase): number {
    let total = 0;
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            total += sim.map[i][j].flow.pendingErosion * UNIT_SQUARE_VOLUME;
        }
    }
    return total;
}

function attachBasin(sim: SimBase, anchor: Square, members: Square[], holdElevation: number): void {
    let anchorId = 'basin';
    for (let sq of members) {
        sq.basin = anchorId;
    }
    (sim as any).superBasins.set(anchorId, {
        anchor: anchor.location,
        members: members.map((sq) => sq.location),
        memberBasins: [anchorId],
        basinHold: {
            edgeMembers: [],
            holdElevation,
            holdCapacity: 0,
            holdMember: '',
            holdBasins: [],
        },
    });
}

describe('dryDeposit', () => {

    test('zero sediment does nothing and returns zero remainder', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        attachBasin(sim, sim.map[1][1], [sim.map[1][1]], 12);

        let remaining = depositAtDryAnchor(sim.map[1][1], 0, sim as any);

        expect(remaining).toBe(0);
        expect(totalPendingVolume(sim)).toBe(0);
    });

    test('fills dry basin up to hold elevation before passing sediment through', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        attachBasin(sim, sim.map[1][1], [sim.map[1][1]], 12);

        let remaining = depositAtDryAnchor(sim.map[1][1], 3000000, sim as any);

        expect(effAlt(sim.map[1][1])).toBeCloseTo(12, 5);
        expect(remaining).toBeCloseTo(1000000, -2);
        expect(totalPendingVolume(sim)).toBeCloseTo(2000000, -2);
    });

    test('partial fill keeps all sediment in the basin', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        attachBasin(sim, sim.map[1][1], [sim.map[1][1]], 12);

        let remaining = depositAtDryAnchor(sim.map[1][1], 500000, sim as any);

        expect(remaining).toBe(0);
        expect(effAlt(sim.map[1][1])).toBeCloseTo(10.5, 5);
    });

    test('fills multi-square basin from low members upward', () => {
        let sim = buildGrid([[12,12,12],[12,10,11],[12,12,12]]);
        let anchor = sim.map[1][1];
        let shelf = sim.map[1][2];
        attachBasin(sim, anchor, [anchor, shelf], 12);

        let remaining = depositAtDryAnchor(anchor, 2500000, sim as any);

        expect(remaining).toBe(0);
        expect(effAlt(anchor)).toBeCloseTo(11.75, 5);
        expect(effAlt(shelf)).toBeCloseTo(11.75, 5);
    });

    test('returns all sediment when real basin has no capacity', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        attachBasin(sim, sim.map[1][1], [sim.map[1][1]], 10);

        let remaining = depositAtDryAnchor(sim.map[1][1], 1000000, sim as any);

        expect(remaining).toBe(1000000);
        expect(totalPendingVolume(sim)).toBe(0);
    });

    test('standalone closed-basin fallback conserves sediment', () => {
        let sim = buildGrid([[10,10,10],[10,10,10],[10,10,10]]);

        let remaining = depositAtDryAnchor(sim.map[1][1], 5000000, sim as any);

        expect(remaining).toBe(0);
        expect(totalPendingVolume(sim)).toBeCloseTo(5000000, -2);
        expect(isFinite(sim.map[1][1].flow.pendingErosion)).toBe(true);
        expect(sim.map[1][1].flow.pendingErosion).toBeGreaterThan(0);
    });

    test('multiple deposits accumulate against effective altitude', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        attachBasin(sim, sim.map[1][1], [sim.map[1][1]], 12);

        depositAtDryAnchor(sim.map[1][1], 500000, sim as any);
        let alt1 = effAlt(sim.map[1][1]);
        depositAtDryAnchor(sim.map[1][1], 500000, sim as any);
        let alt2 = effAlt(sim.map[1][1]);

        expect(alt2).toBeGreaterThan(alt1);
        expect(alt2).toBeCloseTo(11, 5);
    });
});
