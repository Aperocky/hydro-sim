import { Basin } from '../../components/basin/basin';
import { BasinHold, HoldUtil } from '../../components/basin/basinHold';
import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import * as constants from '../../constant/constant';


// Populate the hold information for basins
// From sim where basins has already been initiated.
export default function populateBasinHold(sim: Sim): void {
    findEdge(sim);
    findHold(sim);
}


function findEdge(sim: Sim): void {
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let adjacents: Map<number, number[]> = SquareUtil.getAdjacentSquares(i, j, sim.size);
            let flowIntoBasins: Set<string> = new Set();
            let currSquare: Square = sim.map[i][j];
            adjacents.forEach((loc, key) => {
                let adjacentSquare: Square = sim.map[loc[0]][loc[1]];
                if (currSquare.altitude > adjacentSquare.altitude) {
                    flowIntoBasins.add(adjacentSquare.basin);
                }
            })
            if (flowIntoBasins.size > 1) {
                flowIntoBasins.forEach((anchor) => {
                    sim.basins.get(anchor).basinHold.edgeMembers.push(SquareUtil.stringRep(i,j));
                })
                currSquare.edgeOf = flowIntoBasins;
            }
        }
    }
}


function findHold(sim: Sim): void {
    sim.basins.forEach((basin, anchor) => {
        let minLoc: string;
        let holdBasins: Set<string>;
        let basinHold: BasinHold = basin.basinHold;
        let minimumHeight = Number.MAX_SAFE_INTEGER;
        basinHold.edgeMembers.forEach((locStr) => {
            let loc: {i: number, j: number} = JSON.parse(locStr);
            let edgeSquare: Square = sim.map[loc.i][loc.j];
            if (edgeSquare.altitude < minimumHeight) {
                minimumHeight = edgeSquare.altitude;
                minLoc = locStr;
                holdBasins = edgeSquare.edgeOf;
            }
        })
        basinHold.holdMember = minLoc;
        basinHold.holdElevation = minimumHeight;
        let localSet = new Set(holdBasins);
        localSet.delete(anchor);
        basinHold.holdBasins = Array.from(localSet);
        findHoldCapacity(sim, basin)
    })
}

function findHoldCapacity(sim: Sim, basin: Basin): void {
    // Find hold capacity
    let capacity = 0;
    let holdElevation = basin.basinHold.holdElevation;
    basin.members.forEach((locStr) => {
        let loc: {i: number, j: number} = JSON.parse(locStr);
        let memberSquare: Square = sim.map[loc.i][loc.j];
        if (memberSquare.altitude < holdElevation) {
            capacity += constants.UNITS.get('squareToVolume') * (holdElevation - memberSquare.altitude);
        }
    })
    basin.basinHold.holdCapacity = capacity;
}
