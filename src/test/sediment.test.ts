import { SquareUtil, Square } from '../main/components/square';
import { FlowUtil } from '../main/components/flow';
import {
    calculateErosion,
    processErosionAtSquare,
    dumpSedimentAtMouth,
    EROSION_SLOPE_FRACTION,
    MIN_SLOPE_CAP_DISTANCE,
} from '../main/sim/util/erosion';
import { settleOrRouteSediment } from '../main/sim/util/sedimentRouting';

// Build a minimal 2x2 grid:
//  A(0,0)  B(0,1)
//  C(1,0)  D(1,1)   <-- D is the sink, A/B/C flow into D

function makeSquare(alt: number, i: number, j: number): Square {
    let sq: Square = {
        altitude: alt,
        precipitation: 0,
        flow: FlowUtil.initFlow(),
        basin: SquareUtil.NO_LOCATION,
        edgeOf: new Set(),
        location: SquareUtil.stringRep(i, j),
        i,
        j,
        submerged: false,
        previously_submerged: 0,
        depth: 0,
    };
    return sq;
}

describe('Sediment carrying downstream', () => {

    test('confluence receives sum of all upstream sediment', () => {
        // 3 upstream squares each produce sediment, all flow to D
        let A = makeSquare(100, 0, 0);
        let B = makeSquare(100, 0, 1);
        let C = makeSquare(100, 1, 0);
        let D = makeSquare(50, 1, 1);

        // Give each upstream square flow volume and height diff
        A.flow.flowVolume = 1000000;
        A.flow.heightDiff = 50;
        B.flow.flowVolume = 2000000;
        B.flow.heightDiff = 50;
        C.flow.flowVolume = 3000000;
        C.flow.heightDiff = 50;

        // Process erosion on each upstream square (no incoming sediment)
        let sedA = processErosionAtSquare(A, 0, A.flow.flowVolume);
        let sedB = processErosionAtSquare(B, 0, B.flow.flowVolume);
        let sedC = processErosionAtSquare(C, 0, C.flow.flowVolume);

        expect(sedA).toBeGreaterThan(0);
        expect(sedB).toBeGreaterThan(0);
        expect(sedC).toBeGreaterThan(0);

        // D receives sum of all upstream sediment
        let totalIncoming = sedA + sedB + sedC;
        D.flow.flowVolume = A.flow.flowVolume + B.flow.flowVolume + C.flow.flowVolume;
        D.flow.heightDiff = 10;

        let sedD = processErosionAtSquare(D, totalIncoming, D.flow.flowVolume);

        // D's erosion + incoming = D's sedimentation + D's outgoing sediment
        let dEroded = D.flow.erosion;
        let dDeposited = D.flow.sedimentation;
        expect(dEroded + totalIncoming).toBeCloseTo(dDeposited + sedD, 5);

        // D's outgoing sediment should be stored on flow
        expect(D.flow.sediment).toBeCloseTo(sedD, 5);

        // Sediment is conserved: total eroded everywhere = total deposited + total still carried
        let totalEroded = A.flow.erosion + B.flow.erosion + C.flow.erosion + D.flow.erosion;
        let totalDeposited = A.flow.sedimentation + B.flow.sedimentation + C.flow.sedimentation + D.flow.sedimentation;
        let totalCarried = sedD; // only D has outgoing sediment leaving the system
        expect(totalEroded).toBeCloseTo(totalDeposited + totalCarried, 5);
    });

    test('sediment increases downstream as tributaries merge', () => {
        // Linear chain: A -> B -> C, each adds erosion
        let A = makeSquare(200, 0, 0);
        let B = makeSquare(150, 0, 1);
        let C = makeSquare(100, 0, 2);

        A.flow.flowVolume = 1000000;
        A.flow.heightDiff = 50;
        B.flow.flowVolume = 2000000;
        B.flow.heightDiff = 50;
        C.flow.flowVolume = 3000000;
        C.flow.heightDiff = 50;

        let sedA = processErosionAtSquare(A, 0, A.flow.flowVolume);
        let sedB = processErosionAtSquare(B, sedA, B.flow.flowVolume);
        let sedC = processErosionAtSquare(C, sedB, C.flow.flowVolume);

        // Each downstream square should carry more sediment than upstream
        expect(sedB).toBeGreaterThan(sedA);
        expect(sedC).toBeGreaterThan(sedB);
    });

    test('lake mouth deposition returns excess sediment after flooded capacity is full', () => {
        let lake = makeSquare(10, 0, 0);
        lake.submerged = true;
        lake.depth = 1;

        let sim = {
            size: 1,
            map: [[lake]],
        } as any;

        let remaining = dumpSedimentAtMouth(lake, 1500000, sim);

        expect(lake.flow.pendingErosion).toBeCloseTo(1.1, 5);
        expect(lake.flow.sedimentation).toBeCloseTo(0, 5);
        expect(remaining).toBeCloseTo(400000, -2);
    });

    test('sediment with no remaining route settles instead of disappearing', () => {
        let lake = makeSquare(10, 0, 0);
        let basinMember = makeSquare(11, 0, 1);
        lake.submerged = true;
        let basin: any = {members: [lake.location, basinMember.location], basinHold: null};
        let sim = {
            size: 2,
            map: [[lake, basinMember], [makeSquare(12, 1, 0), makeSquare(13, 1, 1)]],
            superBasins: new Map([[lake.location, basin]]),
        } as any;

        let remaining = settleOrRouteSediment(lake, 500000, sim);

        expect(remaining).toBe(0);
        expect(lake.flow.pendingErosion).toBeCloseTo(0.50, 9);
        expect(basinMember.flow.pendingErosion).toBeCloseTo(0, 9);
    });

    test('a filled mouth still spreads later sediment into the rest of the lake', () => {
        let map = Array.from({length: 3}, (_, i) =>
            Array.from({length: 3}, (_, j) => makeSquare(10, i, j)));
        let mouth = map[1][0];
        let middle = map[1][1];
        let far = map[1][2];
        for (let square of [mouth, middle, far]) {
            square.submerged = true;
            square.depth = 0.1;
        }
        let sim = {size: 3, map} as any;
        dumpSedimentAtMouth(mouth, 200000, sim);
        dumpSedimentAtMouth(middle, 200000, sim);

        expect(dumpSedimentAtMouth(mouth, 200000, sim)).toBeCloseTo(0, 6);
        expect(far.flow.pendingErosion).toBeCloseTo(0.2, 9);
        for (let square of [mouth, middle, far]) {
            expect(square.flow.pendingErosion).toBeCloseTo(0.2, 9);
        }
    });

    test('excess sediment spreads beyond a tiny saturated pond without forming a spire', () => {
        let size = 21;
        let map = Array.from({length: size}, (_, i) =>
            Array.from({length: size}, (_, j) => makeSquare(10, i, j)));
        let pond = map[10][10];
        pond.submerged = true;
        pond.depth = 0.1;
        pond.basin = pond.location;
        let basin = {members: [pond.location], basinHold: null};
        let sim = {size, map, superBasins: new Map([[pond.location, basin]])} as any;

        // The old fallback put almost all 200 million m³ on the one pond tile:
        // a 200 m column on an otherwise flat plain.
        expect(settleOrRouteSediment(pond, 200000000, sim)).toBe(0);
        let squares = ([] as Square[]).concat(...map);
        expect(Math.max(...squares.map(sq => sq.flow.pendingErosion))).toBeLessThan(0.5);
        expect(squares.reduce((sum, sq) => sum + sq.flow.pendingErosion * 1000000, 0))
            .toBeCloseTo(200000000, 3);

        // Multiple arrivals must share the new effective terrain this turn.
        settleOrRouteSediment(pond, 200000000, sim);
        expect(Math.max(...squares.map(sq => sq.flow.pendingErosion))).toBeLessThan(1);
        expect(squares.reduce((sum, sq) => sum + sq.flow.pendingErosion * 1000000, 0))
            .toBeCloseTo(400000000, 3);
    });

    test('excess crosses a low rim and fills a lower pond before raising that rim', () => {
        let map = Array.from({length: 5}, (_, i) =>
            Array.from({length: 5}, (_, j) => makeSquare(20, i, j)));
        let mouth = map[2][1];
        let rim = map[2][2];
        let lower = map[2][3];
        mouth.altitude = 10;
        mouth.submerged = true;
        rim.altitude = 11;
        lower.altitude = 9;
        let sim = {size: 5, map} as any;

        settleOrRouteSediment(mouth, 1500000, sim);

        expect(mouth.altitude + mouth.flow.pendingErosion).toBeCloseTo(11, 9);
        expect(rim.flow.pendingErosion).toBe(0);
        expect(lower.altitude + lower.flow.pendingErosion).toBeCloseTo(9.5, 9);
        expect(([] as Square[]).concat(...map).reduce((sum, sq) => sum + sq.flow.pendingErosion, 0))
            .toBeCloseTo(1.5, 9);
    });

    test.each([0.1, 2, 10])('channel rise is capped at 1 m with a %s m drop', (drop) => {
        let channel = makeSquare(10, 0, 0);
        channel.flow.heightDiff = drop;
        let incoming = 100000000;
        let outgoing = processErosionAtSquare(channel, incoming, 500000000);

        expect(channel.flow.erosion).toBeGreaterThan(0);
        expect(channel.flow.pendingErosion).toBeCloseTo(1, 9);
        expect(outgoing).toBeCloseTo(incoming - 1000000, 5);
    });

    test('sub-meter slopes use the minimum erosion cap distance', () => {
        let eroding = makeSquare(10, 0, 0);
        eroding.flow.heightDiff = 0.1;

        let eroded = calculateErosion(eroding, Number.MAX_SAFE_INTEGER);

        expect(eroded).toBeCloseTo(
            MIN_SLOPE_CAP_DISTANCE * EROSION_SLOPE_FRACTION * 1000000,
            5
        );
    });
});
