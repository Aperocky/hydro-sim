import { Square, SquareUtil } from '../components/square';
import { getData } from '../async/loader';
import { SimBase } from './simBase';
import { Basin } from '../components/basin/basin';
import timer from './util/timer';


export class Sim extends SimBase {

    liveSuperBasins: Map<string, Basin>;

    constructor(size) {
        super(size);
        let promise = getData(size)
        promise.then((data) => {
            this.altitude = data['altitude'];
            this.precip = data['precip'];
            this.createMap();
            this.initialized = true;
        });
    }
}
