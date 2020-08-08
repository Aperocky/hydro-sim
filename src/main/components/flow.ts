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
    // Aquifer
    aquifer: number;
    aquiferMax: number;
}


export class FlowUtil {

    static initFlow(): Flow {
        return {
            flowDirection: 0,
            heightDiff: 0,
            flowVolume: 0,
            inFlows: new Map(),
            aquifer: 0,
            aquiferMax: 0,
        };
    }

    static fillAquifer(flow: Flow, volume: number): number {
        let fillPercentage = flow.aquifer/flow.aquiferMax;
        let aquiferFillVolume = flow.aquiferMax * (1 - fillPercentage) ** 2 * 0.2;
        if (aquiferFillVolume > volume * 0.4) {
            flow.aquifer += volume * 0.4;
            return volume * 0.6
        }
        flow.aquifer += aquiferFillVolume;
        return volume - aquiferFillVolume;
    }

    static populateFlowDirection(flow: Flow, direction: number, heightDiff: number): void {
        flow.flowDirection = direction;
        flow.heightDiff = heightDiff;
        flow.aquiferMax = heightDiff > 10 ?
            10 * 1000 * (10/heightDiff) * 1000 * 0.5 :
            (20 - heightDiff) * 1000 * 1000 * 0.5 ;
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

    static clearFlow(flow: Flow): void {
        flow.inFlows.forEach((val, key) => {
            flow.inFlows.set(key, 0);
        });
        flow.flowVolume = 0;
    }
}
