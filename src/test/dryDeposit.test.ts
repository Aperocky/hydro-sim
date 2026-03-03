import { SimBase } from '../main/sim/simBase';
import { SquareUtil, Square } from '../main/components/square';
import populateFlowDirection from '../main/sim/util/populateFlowDirection';
import { depositAtDryAnchor } from '../main/sim/util/dryDeposit';
import * as constant from '../main/constant/constant';

const UNIT_SQUARE_VOLUME = constant.UNITS.get('squareToVolume'); // 1,000,000

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

describe('dryDeposit', () => {

    test('zero sediment does nothing', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        depositAtDryAnchor(sim.map[1][1], 0, sim as any);
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                expect(sim.map[i][j].flow.pendingErosion).toBe(0);
    });

    test('tiny sediment only raises anchor', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        depositAtDryAnchor(sim.map[1][1], 10000, sim as any); // 0.01m
        expect(effAlt(sim.map[1][1])).toBeCloseTo(10.01, 2);
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                if (i === 1 && j === 1) continue;
                expect(sim.map[i][j].flow.pendingErosion).toBe(0);
            }
    });

    test('anchor fills to margin above lowest neighbor', () => {
        // Anchor 10m, neighbors 12m. Should fill to 12.1m = 2.1m rise = 2,100,000 m³
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        depositAtDryAnchor(sim.map[1][1], 2100000, sim as any);
        expect(effAlt(sim.map[1][1])).toBeCloseTo(12.1, 1);
    });

    test('asymmetric — anchor fills to margin above LOWEST neighbor', () => {
        // Anchor 10m, one neighbor at 11m, rest at 15m
        // Should fill to 11.1m (lowest neighbor + 0.1)
        let sim = buildGrid([[15,15,15],[11,10,15],[15,15,15]]);
        depositAtDryAnchor(sim.map[1][1], 1100000, sim as any);
        expect(effAlt(sim.map[1][1])).toBeCloseTo(11.1, 1);
        expect(sim.map[1][0].flow.pendingErosion).toBe(0); // not enough to reach ring
    });

    test('ring squares get deposit even when already higher', () => {
        // Anchor 10m, neighbors 20m. Fill anchor to 20.1, then ring gets SMUDGE_MARGIN
        let sim = buildGrid([[20,20,20],[20,10,20],[20,20,20]]);
        // Anchor fill: 10.1m * 1M = 10,100,000. Ring fill (8 sq * 0.1m): 800,000.
        // All-raise (9 sq * 0.1m): 900,000. Total ~11,800,000
        depositAtDryAnchor(sim.map[1][1], 12000000, sim as any);
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                if (i === 1 && j === 1) continue;
                expect(sim.map[i][j].flow.pendingErosion).toBeGreaterThan(0);
            }
    });

    test('all-raise includes anchor — anchor rises with each ring', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        // Give enough to fill anchor + ring + all-raise
        depositAtDryAnchor(sim.map[1][1], 5000000, sim as any);
        // Anchor should be higher than 12.1 (initial fill) due to all-raise
        expect(effAlt(sim.map[1][1])).toBeGreaterThan(12.1);
    });

    test('sediment conservation — no sediment lost on large grid', () => {
        // 7x7 grid with deep depression — plenty of room to absorb
        let alts: number[][] = [];
        for (let i = 0; i < 7; i++) {
            alts.push([]);
            for (let j = 0; j < 7; j++) {
                if (i === 3 && j === 3) alts[i][j] = 0;
                else alts[i][j] = 100;
            }
        }
        let sim = buildGrid(alts);
        let input = 10000000; // 10M m³
        depositAtDryAnchor(sim.map[3][3], input, sim as any);
        let deposited = totalPendingVolume(sim);
        expect(deposited).toBeCloseTo(input, -2);
    });

    test('5x5 grid — sediment reaches outer ring', () => {
        let alts: number[][] = [];
        for (let i = 0; i < 5; i++) {
            alts.push([]);
            for (let j = 0; j < 5; j++) {
                if (i === 2 && j === 2) alts[i][j] = 10;
                else if (i >= 1 && i <= 3 && j >= 1 && j <= 3) alts[i][j] = 12;
                else alts[i][j] = 15;
            }
        }
        let sim = buildGrid(alts);
        depositAtDryAnchor(sim.map[2][2], 50000000, sim as any);
        // Outer ring should have deposits
        expect(sim.map[0][0].flow.pendingErosion).toBeGreaterThan(0);
        expect(sim.map[4][4].flow.pendingErosion).toBeGreaterThan(0);
    });

    test('no NaN or negative values', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        depositAtDryAnchor(sim.map[1][1], 100000000, sim as any);
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                expect(isFinite(sim.map[i][j].flow.pendingErosion)).toBe(true);
                expect(sim.map[i][j].flow.pendingErosion).toBeGreaterThanOrEqual(0);
            }
    });

    test('flat terrain — all same altitude', () => {
        let sim = buildGrid([[10,10,10],[10,10,10],[10,10,10]]);
        depositAtDryAnchor(sim.map[1][1], 5000000, sim as any);
        // Anchor should rise
        expect(effAlt(sim.map[1][1])).toBeGreaterThan(10);
        // No NaN
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                expect(isFinite(sim.map[i][j].flow.pendingErosion)).toBe(true);
    });

    test('multiple deposits accumulate', () => {
        let sim = buildGrid([[12,12,12],[12,10,12],[12,12,12]]);
        depositAtDryAnchor(sim.map[1][1], 1000000, sim as any);
        let alt1 = effAlt(sim.map[1][1]);
        depositAtDryAnchor(sim.map[1][1], 1000000, sim as any);
        let alt2 = effAlt(sim.map[1][1]);
        expect(alt2).toBeGreaterThan(alt1);
    });
});
