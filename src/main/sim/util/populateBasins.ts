import { Square, SquareUtil } from '../../components/square';
import { Basin } from '../../components/basin/basin';
import { Sim } from '../sim';
import ping from '../read/ping';


export default function populateBasins(sim: Sim): void {
    let pingResult = ping(sim);
    let anchors: number[] = Array.from(pingResult['basinList'].keys());
    for (let anchor of anchors) {
        let basinMembers: number[] = traceMembers(sim, anchor);
        let basin = createBasin(sim, anchor, basinMembers);
    }
}

function createBasin(sim: Sim, anchor: number, members: number[]): Basin {
    let anchorLoc = SquareUtil.locFromId(anchor);
    let anchorAltitude: number = sim.map[anchorLoc.i][anchorLoc.j].altitude;
    let basin: Basin = Basin.fromMembers(anchor, anchorAltitude, members)
    basin.lake.initiate(sim.map[anchorLoc.i][anchorLoc.j], sim);
    for (let member of members) {
        let currLoc = SquareUtil.locFromId(member);
        let currSquare: Square = sim.map[currLoc.i][currLoc.j];
        currSquare.basin = anchor;
    }
    sim.basins.set(anchor, basin);
    sim.superBasins.set(anchor, basin);
    return basin;
}

function traceMembers(sim: Sim, anchor: number): number[] {
    let result: number[] = [];
    dfsAddBasinMember(sim, anchor, result)
    return result;
}

function dfsAddBasinMember(sim: Sim, currNode: number, members: number[]): void {
    members.push(currNode);
    let currLoc = SquareUtil.locFromId(currNode);
    let currSquare: Square = sim.map[currLoc.i][currLoc.j];
    let inFlowLocs = SquareUtil.getInflowLocs(currSquare, sim.size);
    for (let loc of inFlowLocs) {
        let locStr = SquareUtil.stringRep(loc.i, loc.j);
        dfsAddBasinMember(sim, locStr, members);
    }
}
