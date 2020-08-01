import { SquareUtil } from '../square';
import { v4 as uuid } from 'uuid';
import { LakeStatus, LakeStatusUtil } from './lakeStatus';
import { BasinHold, HoldUtil } from './basinHold';


// A basin consist of a lowest point and all
// Squares which flowDirection eventually converges to that lowest point
// def lowest point: A square where all other squares adjacent to it are higher than it.
export class Basin {

    // BASICS
    // The lowest point square location
    // member Squares where the converges to the anchor
    anchor: string;
    anchorAltitude: number;
    members: string[];

    // WATER HOLD
    basinHold: BasinHold;

    // STATUS
    lakeStatus: LakeStatus;
    isFull: boolean;
    isSubBasin: boolean;
    subBasinUnder: string;

    // For super basin
    isBaseBasin: boolean;
    memberBasins: string[];

    static fromMembers(anchor: string, anchorAltitude: number, members: string[]): Basin {
        let basin = new this();
        basin.isBaseBasin = true;
        basin.anchor = anchor;
        basin.anchorAltitude = anchorAltitude
        basin.memberBasins = [anchor];
        basin.members = members;
        basin.isFull = false;
        basin.isSubBasin = false;
        basin.basinHold = HoldUtil.createHold();
        basin.lakeStatus = LakeStatusUtil.getEmptyLake(anchorAltitude);
        return basin;
    }
}
