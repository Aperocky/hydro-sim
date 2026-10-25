jest.mock('pixi.js', () => ({
    Graphics: class {
        segments: number[][] = [];
        starts: number[][] = [];
        clear() { this.segments = []; this.starts = []; }
        lineStyle() {}
        moveTo(x: number, y: number) { this.starts.push([x, y]); }
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
    target.submerged = true;
    manager.getRivers(sim);
    expect(manager.currentRivers).toHaveLength(0);
});

function shorelineScene() {
    let map = Array.from({length: 3}, () => Array.from({length: 3}, () => SquareUtil.createSquare(0, 0)));
    map.forEach((row, i) => row.forEach((square, j) => Object.assign(square, {i, j})));
    return {size: 3, map, superBasins: new Map()} as any;
}

test('lake outlets remain connected to dry land within the same basin', () => {
    let sim = shorelineScene();
    sim.map[0][0].submerged = true;
    sim.map[0][0].flow.outFlows = [{direction: 4, volume: 100000000}];
    let manager = new RiverManager();
    manager.getRivers(sim);
    expect(manager.currentRivers).toHaveLength(1);
    manager.draw({addChild() {}} as any);
    expect((manager.graphics as any).starts).toEqual([[2, 3.5]]);
    expect((manager.graphics as any).segments).toEqual([[2, 6]]);
});

test.each([[4, 0, 1, 2, 4.5], [5, 1, 1, 4 + Math.SQRT1_2 / 2, 4 + Math.SQRT1_2 / 2]])(
    'river mouths overlap water at direction %s without extending to its center', (direction, i, j, x, y) => {
        let sim = shorelineScene();
        sim.map[i][j].submerged = true;
        sim.map[0][0].flow.outFlows = [{direction, volume: 100000000}];
        let manager = new RiverManager();
        manager.getRivers(sim);
        manager.draw({addChild() {}} as any);
        expect((manager.graphics as any).starts).toEqual([[2, 2]]);
        expect((manager.graphics as any).segments[0][0]).toBeCloseTo(x, 10);
        expect((manager.graphics as any).segments[0][1]).toBeCloseTo(y, 10);
    });

test('visible channels continue to lakes below the cutoff without drawing unrelated trickles', () => {
    let sim = shorelineScene();
    sim.map[0][0].flow.outFlows = [{direction: 4, volume: 40000000}];
    sim.map[0][1].flow.outFlows = [{direction: 4, volume: 20000000}];
    sim.map[0][2].submerged = true;
    sim.map[2][0].flow.outFlows = [{direction: 4, volume: 10000000}];
    let manager = new RiverManager();
    manager.getRivers(sim);
    expect(manager.currentRivers).toHaveLength(2);
    expect(manager.currentRivers[1].flowTo).toBe(sim.map[0][2]);
    expect(manager.currentRivers.every(river => river.loc.i === 0)).toBe(true);
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
