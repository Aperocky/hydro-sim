import { Basin } from './basin';
import LakeFormation from './lakeFormation';
import { Square, SquareUtil } from '../square';
import { BasinHold, HoldUtil } from './basinHold';
import { v4 as uuid } from 'uuid';
import { Sim } from '../../sim/sim';
import * as constants from '../../constant/constant';



export default class SuperBasin extends Basin {

    // When water level drops below this number, the superbasin will be divided
    // into sub(Superbasins or basins)
    superBasinId: string;
    // Upon division, the 2 separate basin member.
    originalBasinA: Basin;
    originalBasinB: Basin;

    constructor() {
        super(); // Placeholder, nothing is done in the base class constructor
        this.superBasinId = uuid();
    }

    static fromBasins(sim: Sim, basinA: Basin, basinB: Basin): SuperBasin {

        if (basinA.basinHold.holdElevation != basinB.basinHold.holdElevation) {
            console.log("Merged basin does not have same holdElevation, must be wrong");
            throw new Error("Merged basin does not have same holdElevation");
        }

        // Extend to member basins
        let superBasin = new this();
        superBasin.divideElevation = basinA.basinHold.holdElevation;
        superBasin.populateBasinBasics(basinA, basinB);
        superBasin.populateBasinHold(sim, basinA, basinB);
        superBasin.populateLakeFormation(sim, basinA, basinB);

        for (let anchor of superBasin.memberBasins) {
            sim.superBasins.set(anchor, superBasin);
        }
        superBasin.originalBasinA = basinA;
        superBasin.originalBasinB = basinB;

        // Sanity logging
        let logs = [];
        logs.push(`Created superbasin: ${superBasin.anchor}`);
        logs.push(`From basins: ${basinA.anchor}, ${basinB.anchor}`);
        console.log(logs.join('\n'));
        // Sanity logging

        return superBasin;
    }

    populateBasinBasics(basinA: Basin, basinB: Basin): void {
        this.isBaseBasin = false;
        this.isFull = false;
        if (basinA.anchorAltitude > basinB.anchorAltitude) {
            this.anchorAltitude = basinB.anchorAltitude;
            this.anchor = basinB.anchor;
        } else {
            this.anchorAltitude = basinA.anchorAltitude;
            this.anchor = basinA.anchor;
        }
        let basins = basinA.memberBasins.concat(basinB.memberBasins);
        this.memberBasins = basins;
        this.members = basinA.members.concat(basinB.members);
        this.basinFullEvent = null;
    }

    populateBasinHold(sim: Sim, basinA: Basin, basinB: Basin): void {
        let hold = HoldUtil.createHold();

        // Find edge members:
        let edgeMemberSet: Set<string> = new Set();
        basinA.basinHold.edgeMembers.forEach((loc) => edgeMemberSet.add(loc));
        basinB.basinHold.edgeMembers.forEach((loc) => edgeMemberSet.add(loc));
        hold.edgeMembers = Array.from(edgeMemberSet).filter((locStr) => {
            let loc = JSON.parse(locStr);
            let edgeOf: Set<string> = sim.map[loc.i][loc.j].edgeOf;
            let isEdge = false;
            for (let anchor of Array.from(edgeOf)) {
                if (!this.memberBasins.includes(anchor)) {
                    isEdge = true;
                    break;
                }
            }
            return isEdge;
        });

        // Find hold;
        let holdElevation = Number.MAX_SAFE_INTEGER;
        let holdMember = "";
        let holdBasins: Set<string>;
        for (let locStr of hold.edgeMembers) {
            let loc = JSON.parse(locStr);
            let locSquare: Square = sim.map[loc.i][loc.j];
            if (locSquare.altitude < holdElevation) {
                holdElevation = locSquare.altitude;
                holdMember = locStr;
                holdBasins = locSquare.edgeOf;
            }
        }
        let localSet = new Set(holdBasins);
        for (let anchor of this.memberBasins) {
            if (localSet.has(anchor)) {
                localSet.delete(anchor);
            }
        }
        hold.holdBasins = Array.from(localSet);
        hold.holdMember = holdMember;
        hold.holdElevation = holdElevation;

        let capacity = 0;
        this.members.forEach((locStr) => {
            let loc: {i: number, j: number} = JSON.parse(locStr);
            let memberSquare: Square = sim.map[loc.i][loc.j];
            if (memberSquare.altitude < hold.holdElevation) {
                capacity += constants.UNITS.get('squareToVolume') * (holdElevation - memberSquare.altitude);
            }
        })
        hold.holdCapacity = capacity
        this.basinHold = hold;
    }

    populateLakeFormation(sim: Sim, basinA: Basin, basinB: Basin): void {
        // BasinA and BasinB shares a hold
        // It's the only way it comes up here.
        // just merge the flooded & shore.
        let lake = new LakeFormation();
        let anchorLoc = JSON.parse(this.anchor);
        let anchorSquare = sim.map[anchorLoc.i][anchorLoc.j];
        let combinedShore = basinA.lake.shore.data.concat(basinB.lake.shore.data);
        let combinedLake = basinA.lake.flooded.data.concat(basinB.lake.flooded.data);
        let sumVolume = basinA.lake.volume + basinB.lake.volume;
        lake.initiateFromSuperBasin(anchorSquare, combinedShore, combinedLake, sumVolume, this.divideElevation);
        this.lake = lake;
    }

    divideBasin(sim: Sim, newElevation: number): void {
        console.log(`dividing superbasin into subbasins: ${this.anchor}, ${newElevation}`)
        this.lake.drainToElevation(sim, this.divideElevation);
        this.rehabilitateMemberBasins(sim);
        this.originalBasinA.lake.drainToElevation(sim, newElevation);
        this.originalBasinB.lake.drainToElevation(sim, newElevation);
    }

    rehabilitateMemberBasins(sim: Sim): void {
        this.originalBasinA.evaporationProcessed = true;
        this.originalBasinB.evaporationProcessed = true;
        for (let anchor of this.originalBasinA.memberBasins) {
            sim.superBasins.set(anchor, this.originalBasinA);
        }
        for (let anchor of this.originalBasinB.memberBasins) {
            sim.superBasins.set(anchor, this.originalBasinB);
        }
    }
}
