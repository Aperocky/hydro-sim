import { SquareUtil } from '../square';
import LakeFormation from './lakeFormation';
import { BasinHold, HoldUtil } from './basinHold';


export type BasinFullEvent = {
    anchor: string;
    holdMember: string;
    holdElevation: number;
    holdBasins: string[];
    overflowVolume: number;
    valid: boolean;
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

    // For super basin
    isBaseBasin: boolean;
    memberBasins: string[];
    divideElevation: number;

    // keep basin full event in instance before it gets processed
    basinFullEvent: BasinFullEvent | null;

    // State flags
    evaporationProcessed: boolean;
    inflowProcessed: boolean;

    constructor() {
        this.evaporationProcessed = false;
        this.inflowProcessed = false;
        this.isFull = false;
    }

    static fromMembers(anchor: string, anchorAltitude: number, members: string[]): Basin {
        let basin = new Basin();
        basin.isBaseBasin = true;
        basin.anchor = anchor;
        basin.anchorAltitude = anchorAltitude
        basin.memberBasins = [anchor];
        basin.members = members;
        basin.basinFullEvent = null;
        basin.basinHold = HoldUtil.createHold();
        basin.lake = new LakeFormation();
        return basin;
    }

    processInflow(volume: number, sim): BasinFullEvent | null {
        let currVolume = this.lake.getVolume();
        if (currVolume + volume > this.basinHold.holdCapacity) {
            if (this.basinFullEvent == null) {
                let outFlowAmount = currVolume + volume - this.basinHold.holdCapacity;
                this.lake.fillToVolume(sim, this.basinHold.holdCapacity);
                this.isFull = true;
                this.basinFullEvent = {
                    anchor: this.anchor,
                    holdMember: this.basinHold.holdMember,
                    holdElevation: this.basinHold.holdElevation,
                    holdBasins: [...this.basinHold.holdBasins],
                    overflowVolume: outFlowAmount,
                    valid: true,
                }
                return this.basinFullEvent;
            } else {
                this.basinFullEvent.overflowVolume += volume;
                return null;
            }
        }
        this.lake.fillByVolume(sim, volume);
        return null;
    }

    divideBasin(sim, newElevation: number): void {}
}
