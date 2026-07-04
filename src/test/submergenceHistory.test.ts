import { FlowUtil } from '../main/components/flow';
import { Square } from '../main/components/square';
import { SUBMERGENCE_MEMORY_TURNS, updateSubmergenceHistory } from '../main/sim/util/runTurn';

function makeSquare(submerged: boolean, previouslySubmerged: number): Square {
    return {
        altitude: 0,
        precipitation: 0,
        flow: FlowUtil.initFlow(),
        basin: '',
        edgeOf: new Set(),
        location: JSON.stringify({i: 0, j: 0}),
        submerged,
        previously_submerged: previouslySubmerged,
        depth: submerged ? 1 : 0,
    };
}

test('submergence history marks currently submerged squares as -1', () => {
    let square = makeSquare(true, 4);
    let sim = { size: 1, map: [[square]] } as any;

    updateSubmergenceHistory(sim);

    expect(square.previously_submerged).toBe(-1);
});

test('submergence history ages dry squares up to the memory limit then resets', () => {
    let justDried = makeSquare(false, -1);
    let aging = makeSquare(false, 4);
    let old = makeSquare(false, SUBMERGENCE_MEMORY_TURNS);
    let never = makeSquare(false, 0);
    let sim = {
        size: 2,
        map: [
            [justDried, aging],
            [old, never],
        ],
    } as any;

    updateSubmergenceHistory(sim);

    expect(justDried.previously_submerged).toBe(1);
    expect(aging.previously_submerged).toBe(5);
    expect(old.previously_submerged).toBe(0);
    expect(never.previously_submerged).toBe(0);
});
