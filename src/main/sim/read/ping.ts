import { Sim } from '../sim';
import { Square, SquareUtil } from '../../components/square';


// health check of sim, marginally useful at returning basins
export default function ping(sim: Sim): Object {
    let basinCount = 0;
    let maxHeight = 0;
    let basins: {[location: string]: number} = {};
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let square: Square = sim.map[i][j];
            if (square.flow.flowDirection === 0) {
                let locStr = SquareUtil.stringRep(i, j);
                basins[locStr] = square.altitude;
                basinCount++;
            }
            if (square.altitude > maxHeight) {
                maxHeight = square.altitude;
            }
        }
    }
    return {
        basinCount: basinCount,
        maxHeight: maxHeight,
        basinList: basins,
    }
}
