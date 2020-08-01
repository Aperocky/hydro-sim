import { Square, SquareUtil } from '../../components/square';
import { Basin } from '../../components/basin/basin';
import { Sim } from '../sim';
import ping from '../read/ping';


export default function populateBasins(sim: Sim): void {
    let pingResult = ping(sim);
    let anchors = Object.keys(pingResult['basinList']).map(
        locStr => JSON.parse(locStr)
    );
    let map = sim.map;
    for (let anchor of anchors) {
        let anchorString: string = SquareUtil.stringRep(anchor.i, anchor.j)
        let basinMembers: string[] = traceMembers(sim, anchorString);
        let basin = createBasin(sim, anchorString, basinMembers);
    }
}

function createBasin(sim: Sim, anchor: string, members: string[]): Basin {
    let anchorLoc = JSON.parse(anchor);
    let anchorAltitude: number = sim.map[anchorLoc.i][anchorLoc.j].altitude;
    let basin: Basin = Basin.fromMembers(anchor, anchorAltitude, members)
    for (let member of members) {
        let currLoc: {i: number, j: number} = JSON.parse(member);
        let currSquare: Square = sim.map[currLoc.i][currLoc.j];
        currSquare.basin = anchor;
    }
    sim.basins.set(anchor, basin);
    return basin;
}

function traceMembers(sim: Sim, anchor: string): string[] {
    let result: string[] = [];
    dfsAddBasinMember(sim, anchor, result)
    return result;
}

function dfsAddBasinMember(sim: Sim, currNode: string, members: string[]): void {
    members.push(currNode);
    let currLoc: {i: number, j: number} = JSON.parse(currNode);
    let currSquare: Square = sim.map[currLoc.i][currLoc.j];
    let inFlowLocs = SquareUtil.getInflowLocs(currSquare, sim.size);
    for (let loc of inFlowLocs) {
        let locStr = JSON.stringify(loc);
        dfsAddBasinMember(sim, locStr, members);
    }
}

