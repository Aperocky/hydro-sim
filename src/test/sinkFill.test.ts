import { SimBase } from '../main/sim/simBase';
import { SquareUtil } from '../main/components/square';
import populateFlowDirection from '../main/sim/util/populateFlowDirection';
import populateBasins from '../main/sim/util/populateBasins';
import populateBasinHold from '../main/sim/util/populateBasinHold';
import runTurn from '../main/sim/util/runTurn';

// 1D channel on row 0, rows 1-9 slope downward to stay out of the way.
//
// Row 0 altitude profile:
//   col0: 3000  (source, heavy precip)
//   col1: 2500  (source, heavy precip)
//   col2: 2000  (source, heavy precip)
//   col3: 1502  (entry to depression)
//   col4: 1500  (depression)
//   col5: 1500  (depression floor)
//   col6: 1500.5 (depression)
//   col7: 1501  (hold)
//   col8: 500   (outflow)
//   col9: 0     (outflow)

function buildSim(): SimBase {
    const SIZE = 10;
    let sim = new SimBase(SIZE);
    sim.altitude = [];
    sim.precip = [];
    const alt = [3000, 2500, 2000, 1502, 1500, 1501, 1502, 1000, 500, 0];
    for (let i = 0; i < SIZE; i++) {
        sim.altitude.push([]);
        sim.precip.push([]);
        for (let j = 0; j < SIZE; j++) {
            if (i === 0) {
                sim.altitude[i][j] = alt[j] / 3000;
                sim.precip[i][j] = j <= 2 ? 1.0 : 0;
            } else {
                sim.altitude[i][j] = (3000 - i * 100) / 3000;
                sim.precip[i][j] = 0;
            }
        }
    }
    sim.map = [];
    sim.basins = new Map();
    (sim as any).superBasins = new Map();
    for (let i = 0; i < SIZE; i++) {
        sim.map.push([]);
        for (let j = 0; j < SIZE; j++) {
            let sq = SquareUtil.createSquare(sim.altitude[i][j], sim.precip[i][j]);
            sq.location = SquareUtil.stringRep(i, j);
            sim.map[i][j] = sq;
        }
    }
    populateFlowDirection(sim as any);
    populateBasins(sim as any);
    populateBasinHold(sim as any);
    return sim;
}

function printTurn(sim: SimBase, turn: number) {
    console.log(`\n========== TURN ${turn} ==========`);
    for (let j = 0; j < sim.size; j++) {
        let sq = sim.map[0][j];
        let sub = sq.submerged ? 'SUB' : '   ';
        console.log(`  col${j} ${sub} alt=${sq.altitude.toFixed(2)}  depth=${sq.depth.toFixed(2)}  flow=${sq.flow.flowVolume.toFixed(0)}  sed=${sq.flow.sediment.toFixed(0)}  pend=${sq.flow.pendingErosion.toFixed(4)}  dir=${sq.flow.flowDirection}`);
    }
}

describe('Sink fill diagnostic', () => {
    test('10 turns', () => {
        let sim = buildSim();
        printTurn(sim, 0);
        for (let turn = 1; turn <= 10; turn++) {
            runTurn(sim as any);
            (sim as any).turn++;
            printTurn(sim, turn);
        }
    });
});
