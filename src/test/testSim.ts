import { Sim } from '../main/sim/sim';
import ping from '../main/sim/read/ping';

const SIZE = 100;

let sim = new Sim(SIZE);
let healthCheck = () => {
    if (sim.initialized) {
        console.log(ping(sim))
    } else {
        console.log("100ms TIME")
        setTimeout(healthCheck, 100);
    }
}
healthCheck();
