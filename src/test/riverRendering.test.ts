jest.mock('pixi.js', () => ({
    Graphics: class {
        segments: number[][] = [];
        clear() { this.segments = []; }
        lineStyle() {}
        moveTo() {}
        lineTo(x: number, y: number) { this.segments.push([x, y]); }
    },
}));

import { RiverManager } from '../main/display/render/rivers';
import { SquareUtil } from '../main/components/square';

test('renderer uses each branch volume and clears vanished rivers', () => {
    let map = [[SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)],
        [SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)]];
    map.forEach((row, i) => row.forEach((square, j) => Object.assign(square, {i, j})));
    let source = map[0][0];
    source.flow.outFlows = [{direction: 4, volume: 40000000}, {direction: 6, volume: 130000000}];
    source.flow.flowVolume = 170000000;
    let sim: any = {size: 2, map, superBasins: new Map()};
    let manager = new RiverManager();
    let container: any = {addChild: jest.fn()};
    manager.getRivers(sim);
    expect(manager.currentRivers[0].width).toBeCloseTo(0.549019608, 6);
    expect(manager.currentRivers[1].width).toBeCloseTo(0.65258216, 6);
    manager.draw(container);
    expect((manager.graphics as any).segments).toHaveLength(2);
    source.flow.outFlows = [];
    source.flow.flowVolume = 0;
    manager.getRivers(sim);
    manager.draw(container);
    expect((manager.graphics as any).segments).toHaveLength(0);
});

test('full lakes do not create fictional outlet lines; actual recorded spills are drawn', () => {
    let source = SquareUtil.createSquare(0, 0), target = SquareUtil.createSquare(0, 0);
    Object.assign(source, {i: 0, j: 0, submerged: true, basin: 1});
    Object.assign(target, {i: 0, j: 1, basin: 2});
    let sourceBasin: any = {isFull: true};
    let targetBasin: any = {};
    let sim: any = {size: 2, map: [[source, target], [SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)]],
        superBasins: new Map([[1, sourceBasin], [2, targetBasin]])};
    let manager = new RiverManager();
    manager.getRivers(sim);
    expect(manager.currentRivers).toHaveLength(0);
    source.flow.outFlows = [{direction: 4, volume: 40000000}];
    manager.getRivers(sim);
    expect(manager.currentRivers).toHaveLength(1);
    sim.superBasins.set(2, sourceBasin);
    manager.getRivers(sim);
    expect(manager.currentRivers).toHaveLength(0);
});

test('both arms of a small distributary remain visible', () => {
    let map = [[SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)],
        [SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)]];
    map.forEach((row, i) => row.forEach((square, j) => Object.assign(square, {i, j})));
    map[0][0].flow.outFlows = [{direction: 4, volume: 12500000}, {direction: 6, volume: 37500000}];
    let manager = new RiverManager();
    manager.getRivers({size: 2, map, superBasins: new Map()} as any);
    expect(manager.currentRivers).toHaveLength(2);
    for (let river of manager.currentRivers) {
        expect(river.width).toBeGreaterThan(0.5);
        expect(river.width).toBeLessThan(1);
    }
});


test('even extreme river volumes remain capped at three pixels', () => {
    let source = SquareUtil.createSquare(0, 0), target = SquareUtil.createSquare(0, 0);
    Object.assign(source, {i: 0, j: 0});
    Object.assign(target, {i: 0, j: 1});
    source.flow.outFlows = [{direction: 4, volume: 1e15}];
    let manager = new RiverManager();
    manager.getRivers({size: 2, map: [[source, target],
        [SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)]], superBasins: new Map()} as any);
    expect(manager.currentRivers[0].width).toBeLessThanOrEqual(3);
});
