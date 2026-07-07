import { Basin } from './basin';
import LakeFormation from './lakeFormation';
import { Square, SquareUtil } from '../square';
import { BasinHold, HoldUtil } from './basinHold';
import { Sim } from '../../sim/sim';
import * as constants from '../../constant/constant';



export default class SuperBasin extends Basin {

    // into sub(Superbasins or basins)
    // Upon division, the 2 separate basin member.
    originalBasinA: Basin;
    originalBasinB: Basin;

    static fromBasins(sim: Sim, basinA: Basin, basinB: Basin): SuperBasin {

        // Use the current altitude of the shared hold member as the divide elevation
        // (erosion may have slightly changed it since hold was computed)
        let holdLoc = SquareUtil.locFromId(basinA.basinHold.holdMember);
        let divideElevation = sim.map[holdLoc.i][holdLoc.j].altitude;

        // Extend to member basins
        let superBasin = new this();
        superBasin.divideElevation = divideElevation;
        superBasin.populateBasinBasics(basinA, basinB);
        superBasin.populateBasinHold(sim, basinA, basinB);
        superBasin.populateLakeFormation(sim, basinA, basinB);

        for (let anchor of superBasin.memberBasins) {
            sim.superBasins.set(anchor, superBasin);
        }
        superBasin.originalBasinA = basinA;
        superBasin.originalBasinB = basinB;

        // Sanity logging
        //let logs = [];
        //logs.push(`Created superbasin: ${superBasin.anchor}`);
        //logs.push(`From basins: ${basinA.anchor}, ${basinB.anchor}`);
        //logs.push(`Divide elevation: ${superBasin.divideElevation}`);
        //console.log(logs.join('\n'));
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
        let edgeMemberSet: Set<number> = new Set();
        basinA.basinHold.edgeMembers.forEach((loc) => edgeMemberSet.add(loc));
        basinB.basinHold.edgeMembers.forEach((loc) => edgeMemberSet.add(loc));
        hold.edgeMembers = Array.from(edgeMemberSet).filter((locStr) => {
            let loc = SquareUtil.locFromId(locStr);
            let edgeOf: Set<number> = sim.map[loc.i][loc.j].edgeOf;
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
        let holdMember = SquareUtil.NO_LOCATION;
        let holdBasins: Set<number>;
        for (let locStr of hold.edgeMembers) {
            let loc = SquareUtil.locFromId(locStr);
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
            let loc = SquareUtil.locFromId(locStr);
            let memberSquare: Square = sim.map[loc.i][loc.j];
            if (memberSquare.altitude < hold.holdElevation) {
                capacity += constants.UNITS.get('squareToVolume') * (holdElevation - memberSquare.altitude);
            }
        })
        hold.holdCapacity = capacity
        this.basinHold = hold;
    }

    populateLakeFormation(sim: Sim, basinA: Basin, basinB: Basin): void {
        let lake = new LakeFormation();
        let anchorLoc = SquareUtil.locFromId(this.anchor);
        let anchorSquare = sim.map[anchorLoc.i][anchorLoc.j];
        lake.initiateFromSuperBasin(anchorSquare, [], [], 0, anchorSquare.altitude);
        lake.resetToElevationFromMembers(sim, this.members, this.divideElevation);
        this.lake = lake;
    }

    divideBasin(sim: Sim, newElevation: number): void {
        // console.log(`dividing superbasin into subbasins: ${this.anchor}, ${newElevation}`)
        this.lake.clearLakeStateToSim();
        this.rehabilitateMemberBasins(sim);
        this.rebuildSubBasinAtElevation(sim, this.originalBasinA, newElevation);
        this.rebuildSubBasinAtElevation(sim, this.originalBasinB, newElevation);
    }

    rebuildSubBasinAtElevation(sim: Sim, basin: Basin, newElevation: number): void {
        if (!basin.isBaseBasin && basin.divideElevation > newElevation) {
            basin.divideBasin(sim, newElevation);
            return;
        }
        basin.lake.resetToElevationFromMembers(sim, basin.members, newElevation);
    }

    rehabilitateMemberBasins(sim: Sim): void {
        this.originalBasinA.evaporationProcessed = true;
        this.originalBasinB.evaporationProcessed = true;
        this.originalBasinA.basinFullEvent = null;
        this.originalBasinB.basinFullEvent = null;
        this.originalBasinA.isFull = false;
        this.originalBasinB.isFull = false;
        for (let anchor of this.originalBasinA.memberBasins) {
            sim.superBasins.set(anchor, this.originalBasinA);
        }
        for (let anchor of this.originalBasinB.memberBasins) {
            sim.superBasins.set(anchor, this.originalBasinB);
        }
    }
}
