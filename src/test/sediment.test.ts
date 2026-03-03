import { SquareUtil, Square } from '../main/components/square';
import { FlowUtil } from '../main/components/flow';
import { processErosionAtSquare } from '../main/sim/util/erosion';

// Build a minimal 2x2 grid:
//  A(0,0)  B(0,1)
//  C(1,0)  D(1,1)   <-- D is the sink, A/B/C flow into D

function makeSquare(alt: number, i: number, j: number): Square {
    let sq: Square = {
        altitude: alt,
        precipitation: 0,
        flow: FlowUtil.initFlow(),
        basin: '',
        edgeOf: new Set(),
        location: JSON.stringify({i, j}),
        submerged: false,
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
});
