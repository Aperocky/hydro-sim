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
    aquiferDrain: number;
    // Sediment carried by flow (m^3)
    sediment: number;
    // Erosion/sedimentation tracking for display
    erosion: number;       // m^3 eroded from this square this turn
    sedimentation: number; // m^3 deposited on this square this turn
    // Pending altitude delta (meters) to apply next turn
    pendingErosion: number;
}


export class FlowUtil {

    static initFlow(): Flow {
        return {
            flowDirection: 0,
            heightDiff: 0,
            flowVolume: 0,
            inFlows: new Map(),
            aquifer: 0,
            aquiferDrain: 0,
            aquiferMax: 0,
            sediment: 0,
            erosion: 0,
            sedimentation: 0,
            pendingErosion: 0,
        };
    }

    static fillAquifer(flow: Flow, volume: number): number {
        if (flow.aquiferMax <= 0) return volume;
        // Reset corrupted or overfilled aquifer
        if (!isFinite(flow.aquifer) || flow.aquifer > flow.aquiferMax) {
            flow.aquifer = flow.aquiferMax;
        }
        let fillPercentage = flow.aquifer/flow.aquiferMax;
        let aquiferFillVolume = flow.aquiferMax * (1 - fillPercentage) * 0.4;
        // If aquifer is over 90% full, it seeps out.
        let seepage = 0
        if (flow.aquifer > flow.aquiferMax * 0.9) {
            seepage = (flow.aquifer - (flow.aquiferMax * 0.9)) * 0.4;
            flow.aquifer -= seepage;
        }
        if (aquiferFillVolume > volume * 0.2) {
            flow.aquifer += volume * 0.2;
            return volume * 0.8 + seepage;
        }
        flow.aquifer += aquiferFillVolume;
        return volume - aquiferFillVolume + seepage;
    }

    static fillUnderwaterAquifer(flow: Flow, volume: number): number {
        if (flow.aquiferMax <= 0) return volume;
        let fillPercentage = flow.aquifer/flow.aquiferMax;
        let aquiferFillVolume = flow.aquiferMax * (1 - fillPercentage) * 0.5;
        if (aquiferFillVolume < volume) {
            flow.aquifer += aquiferFillVolume;
            flow.aquiferDrain = 0;
            return volume - aquiferFillVolume;
        } else {
            flow.aquifer += volume;
            flow.aquiferDrain = 0;
            return 0;
        }
    }

    static evaporateAquifer(flow: Flow): void {
        if (flow.aquiferMax <= 0) { flow.aquiferDrain = 0; return; }
        if (!isFinite(flow.aquifer) || flow.aquifer > flow.aquiferMax) {
            flow.aquifer = flow.aquiferMax;
        }
        let fillPercentage = flow.aquifer/flow.aquiferMax;
        let aquiferMaxFraction = 10000000/flow.aquiferMax;
        let aquiferDrainVolume = flow.aquifer *
                (fillPercentage) ** 2 * aquiferMaxFraction ** 0.5 * 0.1;
        flow.aquiferDrain = aquiferDrainVolume;
        flow.aquifer -= aquiferDrainVolume;
    }

    static populateFlowDirection(flow: Flow, direction: number, heightDiff: number): void {
        flow.flowDirection = direction;
        flow.heightDiff = heightDiff;
        flow.aquiferMax = heightDiff > 10 ?
            10 * 1000 * (10/heightDiff) * 1000 * 0.5 :
            Math.max((20 - heightDiff), 1) * 1000 * 1000 * 0.5 ;
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
            flow.inFlows.set(direction, volume);
        }
    }

    static clearFlow(flow: Flow): void {
        flow.inFlows.forEach((val, key) => {
            flow.inFlows.set(key, 0);
        });
        flow.flowVolume = 0;
    }

    // Reset flow direction and inflow structure for basin recomputation.
    // Preserves aquifer state and flowVolume (needed for river display).
    static resetForRecompute(flow: Flow): void {
        flow.flowDirection = 0;
        flow.heightDiff = 0;
        flow.inFlows = new Map();
    }
}
