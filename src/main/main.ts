import { Square, SquareUtil } from './square/square';
import { getData } from './loader';


export class Sim {

    size: number;
    map: Square[][];
    initialized: boolean;
    altitude: number[][];
    precip: number[][];

    constructor(size) {
        this.size = size;
        let promise = getData(size)
        promise.then((data) => {
            this.altitude = data['altitude'];
            this.precip = data['precip'];
            this.createMap();
            this.initialized = true;
        });
    }

    createMap() {
        this.map = [];
        for (let i=0; i<this.size; i++) {
            this.map.push([]);
            for (let j=0; j<this.size; j++) {
                let square: Square = SquareUtil.createSquare(this.altitude[i][j], this.precip[i][j]);
                this.map[i][j] = square;
            }
        }
    }
}
