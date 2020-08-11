import generate from '../../async/simplexGenerator';
import { Sim } from '../sim';
import { SquareUtil } from '../../components/square';


export default function precipitationShift(sim: Sim): void {
    let newPrecipitation = generate(sim.size, 'precip');
    for (let i=0; i<sim.size; i++) {
        for (let j=0; j<sim.size; j++) {
            sim.map[i][j].precipitation = SquareUtil.precipAdjust(newPrecipitation[i][j]);
        }
    }
}
