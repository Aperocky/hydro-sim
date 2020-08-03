import { Basin } from '../../components/basin/basin';
import { Square } from '../../components/square';
import LakeFormation from '../../components/basin/lakeFormation';
import riverFormation from './riverFormation';
import { Sim } from '../sim';


export default function populateBasinRiver(basin: Basin, sim: Sim): number {
    let lake: LakeFormation = basin.lake;
    let shores: Square[] = lake.getShore();
    let totalFlow = 0;
    for (let square of shores) {
        let flow = riverFormation(square, sim);
        totalFlow += flow;
    }
    // Logging operations to make sure we're sane.
//    let totalPrecipitation = 0;
//    for (let locStr of basin.members) {
//        let loc = JSON.parse(locStr);
//        totalPrecipitation += sim.map[loc.i][loc.j].precipitation;
//    }
//    let logs = []
//    logs.push('===========================');
//    logs.push(`BASIN: ${basin.anchor}`);
//    logs.push(`TOTAL_PRECIPITATION: ${totalPrecipitation * 1000}`);
//    logs.push(`INFLOW: ${totalFlow}`);
//    logs.push(`CAPACITY: ${basin.basinHold.holdCapacity}`);
//    console.log(logs.join("\n"));
    return totalFlow;
}
