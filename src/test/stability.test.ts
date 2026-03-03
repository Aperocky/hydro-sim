import { Sim } from '../main/sim/sim';

test('100 turn stability', () => {
    const sim = new Sim(200);
    for (let turn = 0; turn < 100; turn++) {
        let start = Date.now();
        sim.run();
        let elapsed = Date.now() - start;
        console.log(`Turn ${turn+1}: ${elapsed}ms`);
        if (elapsed > 3000) {
            throw new Error(`Turn ${turn+1} hung (${elapsed}ms)`);
        }
    }
    expect(sim.turn).toBe(100);
}, 300000);
