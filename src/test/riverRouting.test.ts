import { Square, SquareUtil } from '../main/components/square';
import { FlowUtil } from '../main/components/flow';
import { RiverRouting } from '../main/sim/util/riverRouting';
import riverFormation from '../main/sim/util/riverFormation';
import * as constants from '../main/constant/constant';

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

test('downhill water pass matches single-channel upstream accumulation', () => {
    let old = fixture();
    let expected = riverFormation(old.b, old.sim);
    let current = fixture();
    let router = new RiverRouting(current.sim);
    let arrivals = router.runWater();
    expect(arrivals.get(current.sink.basin)).toBeCloseTo(expected, 8);
    expect(current.a.flow.flowVolume).toBeCloseTo(old.a.flow.flowVolume, 8);
    expect(current.b.flow.flowVolume).toBeCloseTo(old.b.flow.flowVolume, 8);
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
        for (let pulse of pulses) total += router.routeOverflow(a, pulse);
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
