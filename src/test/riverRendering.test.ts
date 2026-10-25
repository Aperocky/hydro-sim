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
    expect(manager.currentRivers[0].width).toBeCloseTo(0.722741409177, 6);
    expect(manager.currentRivers[1].width).toBeCloseTo(1.097432548980, 6);
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

test('branches at or above 30M remain visible', () => {
    let map = [[SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)],
        [SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)]];
    map.forEach((row, i) => row.forEach((square, j) => Object.assign(square, {i, j})));
    map[0][0].flow.outFlows = [{direction: 4, volume: 30000000}, {direction: 6, volume: 37500000}];
    let manager = new RiverManager();
    manager.getRivers({size: 2, map, superBasins: new Map()} as any);
    expect(manager.currentRivers).toHaveLength(2);
    for (let river of manager.currentRivers) {
        expect(river.width).toBeGreaterThan(0.65);
        expect(river.width).toBeLessThan(1);
    }
});


test.each([100000000, 5000000000, 1e15])('flow %s respects width endpoints', volume => {
    let source = SquareUtil.createSquare(0, 0), target = SquareUtil.createSquare(0, 0);
    Object.assign(source, {i: 0, j: 0});
    Object.assign(target, {i: 0, j: 1});
    source.flow.outFlows = [{direction: 4, volume}];
    let manager = new RiverManager();
    manager.getRivers({size: 2, map: [[source, target],
        [SquareUtil.createSquare(0, 0), SquareUtil.createSquare(0, 0)]], superBasins: new Map()} as any);
    expect(manager.currentRivers[0].width).toBe(volume === 100000000 ? 1 : 4);
});

test('each doubling of flow gives the same proportional increase in width', () => {
    let map = Array.from({length: 3}, () => Array.from({length: 3}, () => SquareUtil.createSquare(0, 0)));
    map.forEach((row, i) => row.forEach((square, j) => Object.assign(square, {i, j})));
    map[1][1].flow.outFlows = [2, 4, 6, 8].map((direction, index) => ({direction, volume: 100000000 * Math.pow(2, index)}));
    let manager = new RiverManager();
    manager.getRivers({size: 3, map, superBasins: new Map()} as any);
    let widths = manager.currentRivers.map(river => river.width);
    for (let index = 2; index < widths.length; index++) {
        expect(widths[index] / widths[index - 1]).toBeCloseTo(widths[1] / widths[0], 12);
    }
});
