import { Sim } from '../main/sim/sim';
import ping from '../main/sim/read/ping';
import timer from '../main/sim/util/timer';
import lakeFormationTests from './testLakeFormation';
import runTests from './testRunTurn';


declare function require(name:string);
const assert = require('assert');
const SIZE = 150;


let testBasins = (sim: Sim) => {
    let count = 0;
    sim.basins.forEach((basin, anchor) => {
        let logs: string[] = [];
        logs.push(`${anchor} basin:`);
        logs.push(`memberSize: ${basin.members.length}`);
        logs.push(`edgeLength: ${basin.basinHold.edgeMembers.length}`);
        logs.push(`holdVolume: ${Math.floor(basin.basinHold.holdCapacity)}`);
        logs.push(`drainLocation: ${basin.basinHold.holdMember}`);
        logs.push(`drainHeight: ${basin.basinHold.holdElevation}`);
        logs.push(`drainTo: ${basin.basinHold.holdBasins}`);
        logs.push(`----------------------`);
        console.log(logs.join("\n"));
        count += basin.members.length
    })
    assert(count == sim.size * sim.size);
}


let testSquares = (sim: Sim) => {
    let count = 0;
    sim.map.forEach((arr) => {
        arr.forEach((square) => {
            if (square.basin) {
                count++;
            }
        })
    })
    assert(count == sim.size * sim.size);
}


const TESTS = {
    testBasin: testBasins,
    testSquare: testSquares,
    ...lakeFormationTests,
    ...runTests,
}


let sim = new Sim(SIZE);
let iterCount = 0;
let mainTest = () => {
    if (iterCount > 20) {
        console.log("Did not load in due time");
        return;
    }
    if (sim.initialized) {
        let result = timer('ping')(ping)(sim);
        for (let [name, test] of Object.entries(TESTS)) {
            timer(`TEST ${name}`)(test)(sim);
        }
        console.log(result);
    } else {
        iterCount++;
        console.log("100ms TIME")
        setTimeout(mainTest, 100);
    }
}
mainTest();

