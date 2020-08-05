import { Sim } from '../sim/sim';
import * as constants from '../constant/constant';


export class SimAdapter {

    sim: Sim;

    constructor() {
        this.sim = new Sim(constants.MAP_SIZE);
    }

    reloadSim() {
        this.sim = new Sim(constants.MAP_SIZE);
    }
}
