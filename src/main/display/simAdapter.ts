import { Sim } from '../sim/sim';


export class SimAdapter {

    sim: Sim;

    constructor() {
        this.sim = new Sim(150);
    }

    reloadSim() {
        this.sim = new Sim(150);
    }
}
