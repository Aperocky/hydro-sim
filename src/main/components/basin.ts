import { SquareUtil } from './square';
import { v4 as uuid } from 'uuid';

// A basin consist of a lowest point and all 
// Squares which flowDirection eventually converges to that lowest point
// def lowest point: A square where all other squares adjacent to it are higher than it.
export class Basin {

    // The lowest point square location
    anchor: string;
    // member Squares where the converges to the anchor
    members: string[];
    // edge Members does not have to be members of the basin
    // It can flow to other basin but still constitute as the 
    // edge of the basin.
    edgeMembers: string[];
    // The lowest altitude of edge member.
    // Above this we'll have
    // 1. outflow from this basin
    // 2. in case the other basin is also filled to this altitude,
    // the formation of SuperBasin
    holdElevation: number;
    // Amount of water this basin can hold
    holdCapacity: number;
    // Is full
    isFull: boolean;
    // Is fully controlled under a superbasin
    isSubBasin: boolean;
    subBasinUnder: string;

    // Super basin specifics
    isBaseBasin: boolean;
    memberBasins: string[];

    static fromMembers(anchor: string, members: string[]): Basin {
        let basin = new this();
        basin.isBaseBasin = true;
        basin.anchor = anchor;
        basin.memberBasins = [anchor];
        basin.members = members;
        basin.isFull = false;
        basin.isSubBasin = false;
        return basin;
    }

    populateEdgeMembers(edgeMembers: string[]) {
        this.edgeMembers = edgeMembers;
    }
}
