import { Basin } from '../main/components/basin/basin';
import { basinBoundaryTest } from '../main/display/render/basinBoundaries';

test('the overlay hides boundaries across a chain of spilling lakes', () => {
    const upper = new Basin();
    const middle = new Basin();
    const lower = new Basin();
    const separate = new Basin();
    const basins = new Map([[0, upper], [1, middle], [2, lower], [3, separate], [4, lower]]);
    upper.displaySpillTarget = 1;
    middle.displaySpillTarget = 4;

    const isBoundary = basinBoundaryTest(basins);
    expect(isBoundary(new Set([0, 1, 2, 4]))).toBe(false);
    expect(isBoundary(new Set([0, 2, 3]))).toBe(true);

    // When middle stops spilling, the boundary appears on the next redraw.
    middle.displaySpillTarget = undefined;
    expect(basinBoundaryTest(basins)(new Set([0, 2]))).toBe(true);
});
