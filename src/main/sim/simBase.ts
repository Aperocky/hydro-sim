import { Square, SquareUtil } from '../components/square';
import { Basin } from '../components/basin';
import populateFlowDirection from './util/populateFlowDirection';
import timer from './util/timer';


export class SimBase {

    size: number;
    map: Square[][];
    initialized: boolean;
    altitude: number[][];
    precip: number[][];
    basins: Map<string, Basin>;

    constructor(size) {
        this.size = size;
    }

    // Create a map of squares based on numpy multivariate results
    createMap() {
        this.map = [];
        for (let i=0; i<this.size; i++) {
            this.map.push([]);
            for (let j=0; j<this.size; j++) {
                let square: Square = SquareUtil.createSquare(this.altitude[i][j], this.precip[i][j]);
                this.map[i][j] = square;
            }
        }
        timer("populateFlowDirection")(populateFlowDirection)(this.map, this.size);
    }
}
