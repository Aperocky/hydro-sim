import { Basin } from './basin';

export class SuperBasin extends Basin {

    // When water level drops below this number, the superbasin will be divided
    // into sub(Superbasins or basins)
    // As no water bridge will connect the super basin anchors.
    divideElevation: number;
    // Upon division, the 2 separate basin member.
    divideBasinLayouts: string[][];

    static fromBasins(basinList: Basin[]) {
        // Extend to member basins
        let superBasin = new this();

        // Super basin specifics
        superBasin.isBaseBasin = false;
        let basins = [].concat(...basinList.map(b => b.memberBasins));
        superBasin.memberBasins = basins;
        for (let basin of basins) {
            // Do not need to keep the old superbasin once they're merged into new one
            basin.subBasinUnder = superBasin.basinId;
        }

        // Populate regular basin parameter and divide
        superBasin.populateFromSubBasins();
        return superBasin;
    }

    // Populate regular basin members from sub basins
    populateFromSubBasins() {
        // TODO add this logic
    }
}
