import processOverflowEvent from '../main/sim/util/processOverflowEvent';
import { Square, SquareUtil } from '../main/components/square';

function makeSquare(i: number, j: number, basin: number, altitude: number, precipitation: number): Square {
    let square = SquareUtil.createSquare(0, 0);
    square.location = SquareUtil.stringRep(i, j);
    square.i = i;
    square.j = j;
    square.basin = basin;
    square.altitude = altitude;
    square.precipitation = precipitation;
    return square;
}

test('overflow transfer mode does not route through cells or add precipitation', () => {
    let sourceAnchor = SquareUtil.stringRep(1, 1);
    let targetAnchor = SquareUtil.stringRep(1, 2);
    let overflowVolume = 12345;
    let capturedInflow = 0;

    let map: Square[][] = [];
    for (let i = 0; i < 3; i++) {
        map.push([]);
        for (let j = 0; j < 3; j++) {
            map[i][j] = makeSquare(i, j, sourceAnchor, 10, 0);
        }
    }

    let holdSquare = makeSquare(1, 1, sourceAnchor, 10, 0);
    let rainyOutlet = makeSquare(1, 2, targetAnchor, 1, 5000);
    holdSquare.flow.flowDirection = 4;
    rainyOutlet.flow.flowDirection = 9;
    map[1][1] = holdSquare;
    map[1][2] = rainyOutlet;

    let event = {
        anchor: sourceAnchor,
        holdMember: holdSquare.location,
        holdElevation: holdSquare.altitude,
        holdBasins: [targetAnchor],
        overflowVolume,
        valid: true,
    };

    let sourceBasin: any = {
        basinHold: { holdMember: holdSquare.location },
        basinFullEvent: event,
    };
    let targetBasin: any = {
        isFull: false,
        basinHold: { holdMember: targetAnchor },
        processInflow: (volume: number) => {
            capturedInflow = volume;
            return null;
        },
    };
    let sim: any = {
        size: 3,
        map,
        superBasins: new Map([
            [sourceAnchor, sourceBasin],
            [targetAnchor, targetBasin],
        ]),
    };

    processOverflowEvent(sim, event, {includePrecipitation: false, routeFlow: false});

    expect(capturedInflow).toBe(overflowVolume);
    expect(rainyOutlet.flow.inFlows.size).toBe(0);
    expect(event.holdBasins).toEqual([targetAnchor]);
});
