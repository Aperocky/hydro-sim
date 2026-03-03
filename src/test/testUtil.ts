import { Sim } from '../main/sim/sim';

// Create a sim with zero precipitation and low altitude (no erosion occurs)
export function createDrySim(size: number): Sim {
    let sim = new Sim(size);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            sim.map[i][j].precipitation = 0;
            // Cap altitude below mountain dew threshold
            if (sim.map[i][j].altitude > 1000) {
                sim.map[i][j].altitude = 1000;
            }
        }
    }
    return sim;
}
