// Run with: npx ts-node src/test/stabilityRun.ts
import { Sim } from '../main/sim/sim';

const sim = new Sim(200);
for (let turn = 0; turn < 100; turn++) {
    let start = Date.now();
    sim.run();
    let elapsed = Date.now() - start;
    console.log(`Turn ${turn+1}: ${elapsed}ms`);
}
console.log("DONE - 100 turns stable");
