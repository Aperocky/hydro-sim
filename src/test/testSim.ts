import { Sim } from '../main/sim/sim';
import ping from '../main/sim/read/ping';
import timer from '../main/sim/util/timer';


declare function require(name:string);
const assert = require('assert');
const SIZE = 150;


let testBasins = (sim: Sim) => {
    let count = 0;
    sim.basins.forEach((basin, anchor) => {
        console.log(`${anchor}: ${basin.members.length} members`);
        count += basin.members.length
    })
    assert(count == sim.size * sim.size);
}


const TESTS = [
    testBasins,
]

let sim = new Sim(SIZE);
let iterCount = 0;
let healthCheck = () => {
    if (iterCount > 20) {
        console.log("Did not load in due time");
        return;
    }
    if (sim.initialized) {
        let result = timer('ping')(ping)(sim);
        for (let test of TESTS) {
            test(sim);
        }
        console.log(result);
    } else {
        iterCount++;
        console.log("100ms TIME")
        setTimeout(healthCheck, 100);
    }
}
healthCheck();

