import { Sim } from '../sim/sim';
import * as constants from '../constant/constant';
import dataStore from './helper/dataStore';
import generalInfo from '../sim/read/generalInfo';
import shiftPrecipitation from '../sim/util/precipitationShift';
import earthquake from '../sim/util/earthquake';
import { Console } from './console';
import { Square } from '../components/square';
import applyGodMode, { GodModeAction } from '../sim/util/godMode';


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

    shiftPrecipitation(): void {
        shiftPrecipitation(this.sim);
        dataStore.setGeneralInfo(generalInfo(this.sim));
        Console.clearText();
        Console.displayGeneralInfo();
    }

    earthquake(): void {
        earthquake(this.sim);
    }

    applyGodMode(center: Square, action: GodModeAction, radius: number, amplitude: number): void {
        applyGodMode(this.sim, center, action, radius, amplitude);
    }

    run() {
        this.sim.run();
        dataStore.setGeneralInfo(generalInfo(this.sim));
        Console.clearText();
        Console.displayGeneralInfo();
    }
}
