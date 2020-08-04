import { Square, SquareUtil } from '../components/square';
import { getData } from '../async/loader';
import { SimBase } from './simBase';
import { Basin } from '../components/basin/basin';
import timer from './util/timer';
import runTurn from './util/runTurn';


export class Sim extends SimBase {

    superBasins: Map<string, Basin>;

    constructor(size) {
        super(size);
        let promise = getData(size)
        promise.then((data) => {
            this.altitude = data['altitude'];
            this.precip = data['precip'];
            this.superBasins = new Map();
            this.createMap();
            this.initialized = true;
        });
    }

    run(): void {
        timer("RUN TURN")(runTurn)(this);
        this.turn++;
    }
}
