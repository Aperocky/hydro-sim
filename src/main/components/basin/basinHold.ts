// Specific package dealing with features of
// Holding of the basin, e.g. edge, capacity etc.

// edge Members does not have to be members of the basin
// It can flow to other basin but still constitute as the
// edge of the basin.
// The lowest altitude of edge member.
// Above this we'll have
// 1. outflow from this basin
// 2. in case the other basin is also filled to this altitude,
// the formation of SuperBasin
export type BasinHold = {
    edgeMembers: string[];
    holdElevation: number;
    holdCapacity: number;
    holdMember: string;
    holdBasins: string[];
}


export class HoldUtil {

    static createHold() {
        return {
            edgeMembers: [],
            holdElevation: 0,
            holdCapacity: 0,
            holdMember: '',
            holdBasins: [],
        }
    }
}

