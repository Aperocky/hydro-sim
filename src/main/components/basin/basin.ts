import { SquareUtil } from '../square';
import { FlowUtil } from '../flow';
import LakeFormation from './lakeFormation';
import { BasinHold, HoldUtil } from './basinHold';


export type BasinFullEvent = {
    anchor: number;
    holdMember: number;
    holdElevation: number;
    holdBasins: number[];
    overflowVolume: number;
    valid: boolean;
}

export type ProcessInflowOptions = {
    fillAquifer?: boolean;
}

// A basin consist of a lowest point and all
// Squares which flowDirection eventually converges to that lowest point
// def lowest point: A square where all other squares adjacent to it are higher than it.
export class Basin {

    // BASICS
    // The lowest point square location
    // member Squares where the converges to the anchor
    anchor: number;
    anchorAltitude: number;
    members: number[];

    // WATER HOLD
    basinHold: BasinHold;

    // STATUS
    lake: LakeFormation
    isFull: boolean;

    // For super basin
    isBaseBasin: boolean;
    memberBasins: number[];
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

    static fromMembers(anchor: number, anchorAltitude: number, members: number[]): Basin {
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

    processInflow(volume: number, sim, options: ProcessInflowOptions = {}): BasinFullEvent | null {
        if (!isFinite(volume) || volume <= 0) return null;
        if (options.fillAquifer !== false) {
            // Fills aquifer first.
            for (let square of [...this.lake.flooded.data]) {
                volume = FlowUtil.fillUnderwaterAquifer(square.flow, volume);
                if (volume <= 0) {
                    return null;
                }
            }
        }
        let currVolume = this.lake.getVolume();
        if (currVolume + volume > this.basinHold.holdCapacity) {
            if (this.basinFullEvent == null) {
                let outFlowAmount = currVolume + volume - this.basinHold.holdCapacity;
                if (currVolume > this.basinHold.holdCapacity) {
                    this.lake.drainToVolume(sim, this.basinHold.holdCapacity);
                } else {
                    this.lake.fillToVolume(sim, this.basinHold.holdCapacity);
                }
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
