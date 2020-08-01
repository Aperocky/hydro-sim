import { SquareUtil } from '../square';
import { v4 as uuid } from 'uuid';
import LakeFormation from './lakeFormation';
import { BasinHold, HoldUtil } from './basinHold';


export type BasinFullEvent = {
    holdMember: string;
    holdElevation: number;
    overFlowVolume: number;
    basin: Basin;
}

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
    lake: LakeFormation
    isFull: boolean;
    outFlowVolume: number;
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
        basin.lake = new LakeFormation();
        return basin;
    }

    processInflow(volume: number, sim): BasinFullEvent | null {
        let currVolume = this.lake.getVolume();
        if (currVolume + volume > this.basinHold.holdCapacity) {
            let outFlowAmount = currVolume + volume - this.basinHold.holdCapacity;
            this.lake.fillToVolume(sim, this.basinHold.holdCapacity);
            return {
                holdMember: this.basinHold.holdMember,
                holdElevation: this.basinHold.holdElevation,
                overFlowVolume: outFlowAmount,
                basin: this,
            }
        }
        this.lake.fillByVolume(sim, volume);
        return null;
    }
}
