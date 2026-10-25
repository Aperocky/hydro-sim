import { Square, SquareUtil } from '../main/components/square';
import { FlowUtil } from '../main/components/flow';
import { RiverRouting, riverDestinations, distributaryTolerance, higherBranchFraction } from '../main/sim/util/riverRouting';
import processOverflowEvent from '../main/sim/util/processOverflowEvent';
import * as constants from '../main/constant/constant';
import { SimBase } from '../main/sim/simBase';
import runTurn from '../main/sim/util/runTurn';

function fixture() {
    let map: Square[][] = [];
    for (let i = 0; i < 3; i++) {
        map.push([]);
        for (let j = 0; j < 3; j++) {
            let square = SquareUtil.createSquare(0, 0);
            Object.assign(square, {i, j, location: SquareUtil.stringRep(i, j), altitude: 0, basin: 100001});
            map[i].push(square);
        }
    }
    let a = map[0][0], b = map[0][1], sink = map[1][1];
    a.altitude = 4;
    b.altitude = 3;
    a.precipitation = b.precipitation = 350;
    a.flow.flowDirection = 4;
    b.flow.flowDirection = 6;
    a.flow.heightDiff = 1;
    b.flow.heightDiff = 3;
    FlowUtil.addInFlowDir(b.flow, 8);
    FlowUtil.addInFlowDir(sink.flow, 2);
    sink.submerged = true;
    sink.depth = 1;
    let basin: any = {
        anchor: sink.location, memberBasins: [sink.location], members: ([] as Square[]).concat(...map).map(square => square.location),
        basinHold: null, lake: {flooded: {data: [sink]}},
    };
    let sim: any = {size: 3, map, superBasins: new Map([[sink.location, basin]])};
    return {sim, a, b, sink, basin};
}

test('downhill water pass accumulates single-channel runoff exactly once', () => {
    let current = fixture();
    let router = new RiverRouting(current.sim);
    let arrivals = router.runWater();
    expect(arrivals.get(current.sink.basin)).toBeCloseTo(400000, 8);
    expect(current.a.flow.flowVolume).toBeCloseTo(200000, 8);
    expect(current.b.flow.flowVolume).toBeCloseTo(400000, 8);
});

test('late overflow is independent of pulse partition, including aquifer seepage', () => {
    function run(pulses: number[]) {
        let {sim, a, b, sink} = fixture();
        a.flow.aquiferMax = b.flow.aquiferMax = 1000000;
        a.flow.aquifer = 950000;
        b.flow.aquifer = 300000;
        let initialAquifer = a.flow.aquifer + b.flow.aquifer;
        let router = new RiverRouting(sim);
        let total = router.runWater().get(sink.basin);
        for (let pulse of pulses) total += router.routeOverflow(a, pulse).get(sink.basin) || 0;
        let aquifer = a.flow.aquifer + b.flow.aquifer;
        expect(total + aquifer - initialAquifer).toBeCloseTo(400000 + pulses.reduce((sum, p) => sum + p, 0), 7);
        return {total, aquifer, flow: b.flow.flowVolume};
    }
    expect(run([9000, 11000])).toEqual(run([20000]));
});

test('lake infiltration has one allowance across pulses and excludes newly flooded cells', () => {
    let {sim, b, sink, basin} = fixture();
    sink.flow.aquiferMax = 100000;
    let router = new RiverRouting(sim);
    b.submerged = true;
    basin.lake.flooded.data.push(b);
    expect(router.receiveLakeInflow(basin, 30000)).toBe(0);
    expect(router.receiveLakeInflow(basin, 30000)).toBe(10000);
    expect(sink.flow.aquifer).toBe(50000);
    expect(b.flow.aquifer).toBe(0);
});

test('sediment is processed once after overflow and conserves terrain volume', () => {
    let {sim, a, b} = fixture();
    let router = new RiverRouting(sim);
    router.runWater();
    router.routeOverflow(a, 20000);
    expect(a.flow.pendingErosion).toBe(0);
    router.runSediment();
    expect(a.flow.erosion).toBeGreaterThan(0);
    expect(b.flow.erosion).toBeGreaterThan(0);
    let net = ([] as Square[]).concat(...sim.map).reduce((sum, square) => sum + square.flow.pendingErosion, 0);
    expect(net * constants.UNITS.get('squareToVolume')).toBeCloseTo(0, 7);
});

// Two branches diverge for a tile and rejoin before reaching a lake. The outlet
// of a separate basin can inject overflow at the head of this network.
function distributaryFixture() {
    let map: Square[][] = [];
    for (let i = 0; i < 5; i++) {
        map.push([]);
        for (let j = 0; j < 5; j++) {
            let square = SquareUtil.createSquare(0, 0);
            Object.assign(square, {i, j, location: SquareUtil.stringRep(i, j), altitude: 100, basin: 4});
            map[i].push(square);
        }
    }
    let hold = map[1][0], sourceRoot = map[2][0];
    let head = map[0][1], left = map[0][2], right = map[1][2], join = map[1][3], sink = map[1][4];
    let connect = (square: Square, target: Square) => {
        constants.DIRECTIONS.forEach((offset, direction) => {
            if (square.i + offset[0] === target.i && square.j + offset[1] === target.j) {
                square.flow.flowDirection = direction;
                square.flow.heightDiff = square.altitude - target.altitude;
                FlowUtil.addInFlowDir(target.flow, constants.REVERSE.get(direction));
            }
        });
    };
    hold.altitude = 3;
    hold.basin = sourceRoot.basin = sourceRoot.location;
    sourceRoot.altitude = 0;
    head.altitude = 2.3;
    left.altitude = 1.05;
    right.altitude = 1;
    join.altitude = 0.5;
    sink.altitude = 0;
    sink.submerged = sourceRoot.submerged = true;
    sink.depth = sourceRoot.depth = 0.25;
    connect(hold, sourceRoot);
    connect(head, right);
    connect(left, join);
    connect(right, join);
    connect(join, sink);
    head.flow.flowVolume = 100000000;
    let targetBasin: any = {
        anchor: 4, memberBasins: [4], members: map.reduce((ids, row) => ids.concat(row.map(s => s.location)), [] as number[]),
        isFull: false, basinHold: {holdMember: sink.location, holdBasins: [], holdElevation: Infinity},
        lake: {flooded: {data: [sink]}}, processInflow: jest.fn(() => null),
    };
    let sourceBasin: any = {
        anchor: sourceRoot.location, memberBasins: [sourceRoot.location],
        basinHold: {holdMember: hold.location}, lake: {flooded: {data: [sourceRoot]}},
    };
    let sim: any = {size: 5, map, superBasins: new Map([[4, targetBasin], [sourceRoot.location, sourceBasin]])};
    return {sim, hold, sourceRoot, head, left, right, join, sink, targetBasin, sourceBasin};
}

test('a flat river splits and rejoins without duplicating water, aquifer exchange, or basin connections', () => {
    let {sim, head, left, right, join, sink} = distributaryFixture();
    for (let square of [head, left, right, join]) square.flow.aquiferMax = 1000000;
    let primaryDirection = head.flow.flowDirection;
    let primaryInflows = Array.from(left.flow.inFlows.keys());
    let router = new RiverRouting(sim);
    router.runWater();
    let arrived = router.routeOverflow(head, 100000000).get(sink.basin);
    expect(head.flow.outFlows).toHaveLength(2);
    expect(left.flow.flowVolume).toBeGreaterThan(30000000);
    expect(right.flow.flowVolume).toBeGreaterThan(30000000);
    expect(join.flow.flowVolume).toBeCloseTo(arrived, 6);
    let aquifer = [head, left, right, join].reduce((sum, square) => sum + square.flow.aquifer, 0);
    expect(arrived + aquifer).toBeCloseTo(100000000, 6);
    expect(head.flow.flowDirection).toBe(primaryDirection);
    expect(Array.from(left.flow.inFlows.keys())).toEqual(primaryInflows);
    router.runSediment();
    expect(left.flow.erosion).toBeGreaterThan(0);
    expect(right.flow.erosion).toBeGreaterThan(0);
    expect(sink.flow.pendingErosion).toBeGreaterThan(0);
    let net = ([] as Square[]).concat(...sim.map).reduce((sum, square) => sum + square.flow.pendingErosion, 0);
    expect(net * constants.UNITS.get('squareToVolume')).toBeCloseTo(0, 6);
});

test('overflow events traverse both branches and record actual outlet water', () => {
    let {sim, hold, head, left, right, targetBasin, sourceBasin} = distributaryFixture();
    let router = new RiverRouting(sim);
    router.runWater();
    let event: any = {anchor: sourceBasin.anchor, holdMember: hold.location, holdBasins: [4], overflowVolume: 100000000};
    sourceBasin.basinFullEvent = event;
    processOverflowEvent(sim, event, {routing: router});
    expect(targetBasin.processInflow.mock.calls[0][0]).toBeCloseTo(100000000, 6);
    expect(left.flow.flowVolume + right.flow.flowVolume).toBeCloseTo(100000000, 6);
    let direction = constants.DIRECTIONS.get(hold.flow.outFlows.find(flow => flow.volume > 0).direction);
    expect(sim.map[hold.i + direction[0]][hold.j + direction[1]]).toBe(head);
    expect(hold.flow.flowVolume).toBe(100000000);
    router.runSediment();
    expect(hold.flow.erosion).toBeGreaterThan(0);
    let net = ([] as Square[]).concat(...sim.map).reduce((sum, square) => sum + square.flow.pendingErosion, 0);
    expect(net * constants.UNITS.get('squareToVolume')).toBeCloseTo(0, 6);
});

test('branching overflow is independent of pulse partition and arrival order', () => {
    function run(pulses: number[]) {
        let {sim, head, left, right, join} = distributaryFixture();
        head.flow.aquiferMax = join.flow.aquiferMax = 1000000;
        head.flow.aquifer = 950000;
        let router = new RiverRouting(sim);
        let arrived = router.runWater().get(4) || 0;
        for (let pulse of pulses) arrived += router.routeOverflow(head, pulse).get(4) || 0;
        return [arrived, ...[head, left, right, join].map(square => square.flow.aquifer)];
    }
    let expected = run([100000000]);
    for (let pulses of [[40000000, 60000000], [60000000, 40000000]]) {
        run(pulses).forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));
    }
});

function crossBasinFixture() {
    let scene = distributaryFixture();
    let otherSink = scene.sim.map[0][3] as Square;
    Object.assign(otherSink, {altitude: 0.2, submerged: true, depth: 0.1, basin: otherSink.location});
    scene.left.basin = otherSink.basin;
    scene.left.flow.flowDirection = 4;
    scene.left.flow.heightDiff = scene.left.altitude - otherSink.altitude;
    let otherBasin: any = {
        anchor: otherSink.basin, memberBasins: [otherSink.basin], members: [scene.left.location, otherSink.location],
        isFull: false, basinHold: {holdMember: otherSink.location, holdBasins: [], holdElevation: Infinity},
        lake: {flooded: {data: [otherSink]}}, processInflow: jest.fn(() => null),
    };
    scene.sim.superBasins.set(otherSink.basin, otherBasin);
    return {...scene, otherSink, otherBasin};
}

test('split selection is independent of source and destination basin labels', () => {
    let {sim, head, left, right} = distributaryFixture();
    let expected = riverDestinations(head, sim).map(destination => ({direction: destination.direction, fraction: destination.fraction}));
    head.basin = 12;
    left.basin = 34;
    right.basin = 56;
    expect(riverDestinations(head, sim).map(destination => ({direction: destination.direction, fraction: destination.fraction}))).toEqual(expected);
    expect(expected).toHaveLength(2);
});

test('ordinary runoff splits across basin divides and conserves water and sediment', () => {
    let {sim, head, left, right, sink, otherSink} = crossBasinFixture();
    head.precipitation = 125100; // 100 million m³ effective runoff.
    let router = new RiverRouting(sim);
    let arrivals = router.runWater();
    expect(arrivals.get(sink.basin)).toBeCloseTo(right.flow.flowVolume, 6);
    expect(arrivals.get(otherSink.basin)).toBeCloseTo(left.flow.flowVolume, 6);
    expect(arrivals.get(sink.basin) + arrivals.get(otherSink.basin)).toBeCloseTo(100000000, 6);
    expect(arrivals.get(sink.basin)).toBeGreaterThan(30000000);
    expect(arrivals.get(otherSink.basin)).toBeGreaterThan(30000000);
    router.runSediment();
    expect(sink.flow.pendingErosion).toBeGreaterThan(0);
    expect(otherSink.flow.pendingErosion).toBeGreaterThan(0);
    let net = ([] as Square[]).concat(...sim.map).reduce((sum, square) => sum + square.flow.pendingErosion, 0);
    expect(net * constants.UNITS.get('squareToVolume')).toBeCloseTo(0, 6);
});

test('one overflow can fill two receiving lakes and emit both subsequent events', () => {
    let {sim, hold, left, right, sourceBasin, targetBasin, otherBasin} = crossBasinFixture();
    let router = new RiverRouting(sim);
    router.runWater();
    let firstEvent: any = {anchor: targetBasin.anchor};
    let secondEvent: any = {anchor: otherBasin.anchor};
    targetBasin.processInflow.mockReturnValue(firstEvent);
    otherBasin.processInflow.mockReturnValue(secondEvent);
    let event: any = {anchor: sourceBasin.anchor, holdMember: hold.location, holdBasins: [4], overflowVolume: 100000000};
    let events = processOverflowEvent(sim, event, {routing: router});
    expect(events).toEqual(expect.arrayContaining([firstEvent, secondEvent]));
    expect(events).toHaveLength(2);
    expect(targetBasin.processInflow.mock.calls[0][0]).toBeCloseTo(right.flow.flowVolume, 6);
    expect(otherBasin.processInflow.mock.calls[0][0]).toBeCloseTo(left.flow.flowVolume, 6);
    expect(left.flow.flowVolume + right.flow.flowVolume).toBeCloseTo(100000000, 6);
});

test('overflow resolves receiving basins after their lakes merge', () => {
    let {sim, head, hold, sourceBasin, targetBasin, otherBasin} = crossBasinFixture();
    let router = new RiverRouting(sim);
    router.runWater();
    let merged: any = {...targetBasin, memberBasins: [targetBasin.anchor, otherBasin.anchor], processInflow: jest.fn(() => null)};
    sim.superBasins.set(targetBasin.anchor, merged);
    sim.superBasins.set(otherBasin.anchor, merged);
    let event: any = {anchor: sourceBasin.anchor, holdMember: hold.location, holdBasins: [4], overflowVolume: 100000000};
    processOverflowEvent(sim, event, {routing: router});
    expect(head.flow.outFlows).toHaveLength(2);
    let received = merged.processInflow.mock.calls.reduce((sum, call) => sum + call[0], 0);
    expect(received).toBeCloseTo(100000000, 6);
    expect(targetBasin.processInflow).not.toHaveBeenCalled();
    expect(otherBasin.processInflow).not.toHaveBeenCalled();
});

test.each([[50, 0.2], [525, 0.35], [1000, 0.5], [2000, 0.5]])(
    '%s million m³/year allows a %s m elevation gap', (volume, tolerance) => {
        expect(distributaryTolerance(volume * 1000000)).toBeCloseTo(tolerance, 12);
    });

test.each([[49, 0.1, 1], [50, 0.1, 1], [75, 0.1, 1], [99.9, 0.1, 1], [100, 0.2, 2], [100, 0.216, 1], [525, 0.35, 2],
    [525, 0.351, 1], [1000, 0.5, 2], [1000, 0.501, 1]])(
    '%s million m³/year with gap %s produces %s destinations', (volume, gap, count) => {
        let {sim, head, left, right, hold} = distributaryFixture();
        hold.altitude = 20;
        head.altitude = 10;
        head.flow.flowVolume = volume * 1000000;
        right.altitude = 8;
        left.altitude = 8 + gap;
        expect(riverDestinations(head, sim)).toHaveLength(count);
    });

test('higher branch gains share with volume and larger drops approach equality', () => {
    let low = higherBranchFraction(50000000, 0.1, 0.2);
    let high = higherBranchFraction(1000000000, 0.1, 0.2);
    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThan(0.5);
    expect(higherBranchFraction(50000000, 10, 0.2)).toBeGreaterThan(low);
    expect(higherBranchFraction(50000000, 0.1, 0)).toBe(0.5);
});

test.each([[0.999, 1], [1, 2], [1.001, 2]])('both split destinations need a 1 m drop: %s m', (drop, count) => {
    let {sim, head, hold, left, right} = distributaryFixture();
    hold.altitude = 20;
    head.altitude = 10;
    right.altitude = 8.95;
    left.altitude = 10 - drop;
    expect(riverDestinations(head, sim)).toHaveLength(count);
});

test('steep drops can split when the two destination elevations are close', () => {
    let {sim, head, hold} = distributaryFixture();
    hold.altitude = 100;
    head.altitude = 50;
    expect(riverDestinations(head, sim)).toHaveLength(2);
});

test('an isolated lower neighbor does not veto two close downhill alternatives', () => {
    let {sim, head, hold, left, right} = distributaryFixture();
    head.altitude = 10;
    hold.altitude = 0;
    right.altitude = 8;
    left.altitude = 8.1;
    let destinations = riverDestinations(head, sim);
    expect(destinations.map(destination => destination.square)).toEqual([right, left]);
});

test.each(['low volume', 'unequal elevations', 'level', 'uphill'])(
    'split eligibility excludes %s', condition => {
        let {sim, head, left} = distributaryFixture();
        if (condition === 'low volume') head.flow.flowVolume = 49000000;
        if (condition === 'unequal elevations') left.altitude = 1.9;
        if (condition === 'level') left.altitude = head.altitude;
        if (condition === 'uphill') left.altitude = head.altitude + 1;
        expect(riverDestinations(head, sim)).toHaveLength(1);
    });

test('volume threshold takes effect next turn and routing can disable splits for comparison', () => {
    let {sim, head} = distributaryFixture();
    head.flow.flowVolume = 0;
    head.precipitation = 150100;
    new RiverRouting(sim).runWater();
    expect(head.flow.outFlows).toHaveLength(1);
    new RiverRouting(sim).runWater();
    expect(head.flow.outFlows).toHaveLength(2);
    new RiverRouting(sim, {allowDistributaries: false}).runWater();
    expect(head.flow.outFlows).toHaveLength(1);
});

test('split eligibility compares lake surface instead of submerged bed elevation', () => {
    let {sim, head, left, right} = distributaryFixture();
    head.altitude = 0.35;
    for (let square of [left, right]) {
        square.altitude = -5;
        square.submerged = true;
        square.depth = 5.25;
    }
    expect(riverDestinations(head, sim)).toHaveLength(1);
    head.altitude = 1.25; // Exactly 1 m above both water surfaces.
    expect(riverDestinations(head, sim)).toHaveLength(2);
});

test.each([[0.4, false], [2, true]])('complete turns with slope %s have splits: %s', (slope, shouldSplit) => {
    let sim: any = new SimBase(12);
    sim.superBasins = new Map();
    sim.altitude = [];
    sim.precip = [];
    for (let i = 0; i < sim.size; i++) {
        sim.altitude.push([]);
        sim.precip.push([]);
        for (let j = 0; j < sim.size; j++) {
            sim.altitude[i][j] = (500 + (11 - i) * slope + (11 - j) * 0.025) / 3000;
            sim.precip[i][j] = 0;
        }
    }
    sim.altitude[11][11] = 0;
    sim.precip[0][0] = 150100 / 2000;
    sim.createMap();
    let maxSplits = 0;
    for (let turn = 0; turn < 3; turn++) {
        runTurn(sim);
        let splits = 0;
        let netSediment = 0;
        for (let row of sim.map) {
            for (let square of row) {
                let active = square.flow.outFlows.filter(outflow => outflow.volume > 0);
                if (active.length === 2) splits++;
                expect(square.basin).toBe(SquareUtil.stringRep(11, 11));
                expect(Number.isFinite(square.altitude)).toBe(true);
                expect(square.flow.aquifer).toBeGreaterThanOrEqual(0);
                expect(square.flow.aquifer).toBeLessThanOrEqual(square.flow.aquiferMax + 0.000001);
                expect(active.reduce((sum, outflow) => sum + outflow.volume, 0)).toBeCloseTo(square.flow.flowVolume, 6);
                for (let outflow of active) {
                    let offset = constants.DIRECTIONS.get(outflow.direction);
                    let target = sim.map[square.i + offset[0]][square.j + offset[1]];
                    expect(target.altitude).toBeLessThan(square.altitude);
                }
                netSediment += square.flow.pendingErosion;
            }
        }
        expect(netSediment).toBeCloseTo(0, 7);
        maxSplits = Math.max(maxSplits, splits);
    }
    if (shouldSplit) expect(maxSplits).toBeGreaterThan(0);
    else expect(maxSplits).toBe(0);
});
