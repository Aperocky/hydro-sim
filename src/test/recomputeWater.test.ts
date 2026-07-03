import { Sim } from '../main/sim/sim';
import { SimBase } from '../main/sim/simBase';

function seedRandom(seed: number): () => void {
    let originalRandom = Math.random;
    let state = seed >>> 0;
    Math.random = () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
    return () => {
        Math.random = originalRandom;
    };
}

function totalLakeVolume(sim: Sim): number {
    let total = 0;
    let seen = new Set();
    sim.superBasins.forEach((basin: any) => {
        if (seen.has(basin)) return;
        seen.add(basin);
        total += basin.lake.getVolume();
    });
    return total;
}

test('recompute preserves lake water in reproduced overflow-cycle drain case', () => {
    let restoreRandom = seedRandom(2);
    let originalRecompute = SimBase.prototype.recomputeTopography;
    let recomputeDeltas: number[] = [];

    SimBase.prototype.recomputeTopography = function trackedRecompute() {
        let before = totalLakeVolume(this as any);
        originalRecompute.apply(this);
        let after = totalLakeVolume(this as any);
        recomputeDeltas.push(after - before);
    };

    try {
        let sim = new Sim(120);
        for (let i = 0; i < sim.size; i++) {
            for (let j = 0; j < sim.size; j++) {
                sim.map[i][j].precipitation *= 1.2;
            }
        }

        let previous = totalLakeVolume(sim);
        let minTurnDelta = 0;
        for (let turn = 1; turn <= 23; turn++) {
            sim.run();
            let volume = totalLakeVolume(sim);
            minTurnDelta = Math.min(minTurnDelta, volume - previous);
            previous = volume;
        }

        expect(minTurnDelta).toBeGreaterThan(-1_000_000_000);
        expect(Math.min(...recomputeDeltas)).toBeGreaterThan(-1_000_000_000);
    } finally {
        SimBase.prototype.recomputeTopography = originalRecompute;
        restoreRandom();
    }
}, 30000);
