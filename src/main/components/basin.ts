import { SquareUtil } from './square';
import { v4 as uuid } from 'uuid';

// A basin consist of a lowest point and all 
// Squares which flowDirection eventually converges to that lowest point
// def lowest point: A square where all other squares adjacent to it are higher than it.
export class Basin {

    basinId: string;
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
    full: boolean;
    // Is fully controlled under a superbasin ("" means None)
    subBasinUnder: string;

    // Super basin specifics
    isBaseBasin: boolean;
    memberBasins: string[];

    constructor() {
        this.basinId = uuid();
    }

    static fromMembers(anchor: string, members: string[], edgeMembers: string[], holdElevation: number, holdCapacity: number): Basin {
        let basin = new this();
        basin.isBaseBasin = true;
        basin.memberBasins = [basin.basinId]
        basin.populateInfo(anchor, members, edgeMembers, holdElevation, holdCapacity);
        return basin;
    }

    populateInfo(anchor: string, members: string[], edgeMembers: string[], holdElevation: number, holdCapacity: number): void {
        this.anchor = anchor;
        this.members = members;
        this.edgeMembers = edgeMembers;
        this.holdElevation = holdElevation;
        this.holdCapacity = holdCapacity;
    }
}
