import { Basin } from './basin';
import { v4 as uuid } from 'uuid';

export class SuperBasin extends Basin {

    // When water level drops below this number, the superbasin will be divided
    // into sub(Superbasins or basins)
    superBasinId: string;
    // As no water bridge will connect the super basin anchors.
    divideElevation: number;
    // Upon division, the 2 separate basin member.
    divideBasinLayouts: string[][];

    constructor() {
        super(); // Placeholder, nothing is done in the base class constructor
        this.superBasinId = uuid();
    }

    static fromBasins(basinList: Basin[]) {
        // Extend to member basins
        let superBasin = new this();

        // Super basin specifics
        superBasin.isBaseBasin = false;
        superBasin.isSubBasin = false;
        superBasin.isFull = false;
        let basins = [].concat(...basinList.map(b => b.memberBasins));
        superBasin.memberBasins = basins;
        for (let basin of basins) {
            basin.isSubBasin = true;
            basin.subBasinUnder = superBasin.superBasinId;
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
