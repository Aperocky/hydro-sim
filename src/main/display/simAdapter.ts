import { Sim } from '../sim/sim';
import * as constants from '../constant/constant';
import dataStore from './helper/dataStore';
import generalInfo from '../sim/read/generalInfo';
import { Console } from './console';


export class SimAdapter {

    sim: Sim;

    constructor() {
        this.sim = new Sim(constants.MAP_SIZE);
    }

    reloadSim() {
        this.sim = new Sim(constants.MAP_SIZE);
    }

    changePrecipitation(ratio: number): void {
        for (let i = 0; i < this.sim.size; i++) {
            for (let j = 0; j < this.sim.size; j++) {
                this.sim.map[i][j].precipitation *= ratio;
            }
        }
        dataStore.updatePrecip(ratio);
    }

    run() {
        this.sim.run();
        dataStore.setGeneralInfo(generalInfo(this.sim));
        Console.clearText();
        Console.displayGeneralInfo();
    }
}
