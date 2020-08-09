import { Square, SquareUtil } from '../components/square';
import { SimBase } from './simBase';
import { Basin } from '../components/basin/basin';
import timer from './util/timer';
import runTurn from './util/runTurn';
import generator from '../async/simplexGenerator';
import * as constants from '../constant/constant';


export class Sim extends SimBase {

    superBasins: Map<string, Basin>;

    constructor(size) {
        super(size);
        let altitudeMap = generator(size, 'altitude');
        let precipMap = generator(size, 'precip')
        this.altitude = altitudeMap;
        this.precip = precipMap;
        this.superBasins = new Map();
        this.createMap();
        this.initialized = true;
    }

    run(): void {
        timer("RUN TURN")(runTurn)(this);
        this.turn++;
    }
}
