export type Flow = {
    // Flow Direction in relation with other squares
    // 1  2  3
    // 8  9  4
    // 7  6  5
    // 0: uninitiated
    // 9: lowest point, no flow to other squares.
    flowDirection: number;
    heightDiff: number;
    flowVolume: number;
    // Map: direction, volume
    inFlows: Map<number, number>;
}


export class FlowUtil {

    static initFlow(): Flow {
        return {
            flowDirection: 0,
            heightDiff: 0,
            flowVolume: 0,
            inFlows: new Map(),
        };
    }

    static populateFlowDirection(flow: Flow, direction: number, heightDiff: number): void {
        flow.flowDirection = direction;
        flow.heightDiff = heightDiff;
    }

    static populateFlowVolume(flow: Flow, volume: number): void {
        flow.flowVolume = volume;
    }

    // Need to populate directions before we can populate volumes.
    static addInFlowDir(flow: Flow, direction: number): void {
        flow.inFlows.set(direction, 0);
    }

    static addInFlowVol(flow: Flow, direction: number, volume: number): void {
        if (flow.inFlows.has(direction)) {
            flow.inFlows.set(direction, volume);
        } else {
            console.log(`Adding flow to no existing direction: ${Array.from(flow.inFlows.keys())}, ${direction}`);
            flow.inFlows.set(direction, volume);
        }
    }
}
