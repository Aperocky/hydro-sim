import { Square, SquareUtil } from '../components/square';
import { Basin } from '../components/basin/basin';
import populateFlowDirection from './util/populateFlowDirection';
import populateBasins from './util/populateBasins';
import populateBasinHold from './util/populateBasinHold';
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
        this.basins = new Map();
        for (let i=0; i<this.size; i++) {
            this.map.push([]);
            for (let j=0; j<this.size; j++) {
                let square: Square = SquareUtil.createSquare(this.altitude[i][j], this.precip[i][j]);
                square.location = SquareUtil.stringRep(i, j);
                this.map[i][j] = square;
            }
        }
        timer("populateFlowDirection")(populateFlowDirection)(this);
        timer("populateBasins")(populateBasins)(this);
        timer("populateBasinHold")(populateBasinHold)(this);
    }

    getSquare(i: number, j: number): Square {
        return this.map[i][j];
    }
}
