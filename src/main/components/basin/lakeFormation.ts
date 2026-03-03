// Datastructure designed to calculate water area, depth and volume
// Tree for flooded area
// Queue for shoreline

import TinyQueue from 'tinyqueue';
import { Square, SquareUtil } from '../square';
import { Sim } from '../../sim/sim';
import * as constants from '../../constant/constant';


const UNIT_SQUARE_VOLUME = constants.UNITS.get('squareToVolume');

let squareCompare = (a, b) => {
    return a.altitude - b.altitude;
}

export default class LakeFormation {

    anchor: Square;
    volume: number;
    anchorElevation: number;
    surfaceElevation: number;
    flooded: TinyQueue<Square>;
    shore: TinyQueue<Square>;

    initiate(anchor: Square, sim: Sim) {
        this.anchor = anchor;
        this.shore = new TinyQueue([], squareCompare);
        this.flooded = new TinyQueue([], (a, b) => -squareCompare(a, b));
        this.volume = 0;
        this.surfaceElevation = anchor.altitude;
        this.anchorElevation = anchor.altitude;
        this.initiateQueue(sim);
    }

    initiateFromSuperBasin(anchor: Square, shore: Square[], flooded: Square[],
            sumVolume: number, surfaceElevation: number): void {
        this.anchor = anchor;
        this.shore = new TinyQueue(shore, squareCompare);
        this.flooded = new TinyQueue(flooded, (a, b) => -squareCompare(a, b));
        this.volume = sumVolume;
        this.surfaceElevation = surfaceElevation;
        this.anchorElevation = anchor.altitude;
    }

    initiateQueue(sim: Sim) {
        this.flooded.push(this.anchor);
        let initialUpstreams = SquareUtil.getUpstreamSquares(this.anchor, sim);
        for (let square of initialUpstreams) {
            this.shore.push(square);
        }
        this.setLakeStateToSim();
    }

    // Fill by this volume
    fillByVolume(sim: Sim, volume: number): void {
        this.fillToVolume(sim, this.volume + volume);
    }

    // Fill basin to volume
    // Returns the altitude of the lake
    // This assume that volume will be less than basin capacity.
    // This also assume that volume will be more than current volume
    fillToVolume(sim: Sim, volume: number): void {
        if (volume <= this.volume) {
            return;
        }
        if (this.volume == 0 && this.flooded.length == 0 && this.shore.length == 0) {
            this.initiateQueue(sim); // Safety check
        }
        this.fill(sim, volume);
        this.setLakeStateToSim();
    }

    fill(sim: Sim, volume: number, depth: number = 0): void {
        // Safety: prevent infinite recursion
        if (depth > 50000) {
            console.warn(`fill() hit recursion limit at depth ${depth}`);
            this.volume = volume;
            return;
        }
        // still need to fill this much
        let diffVolume = volume - this.volume;
        if (diffVolume <= 0) return;
        // Find the lowest shore and pop that.
        let lowestShore: Square = this.shore.pop();
        if (!lowestShore) {
            // No more shore to flood — cap at current volume
            this.volume = volume;
            return;
        }
        let altDiff = lowestShore.altitude - this.surfaceElevation;
        // Erosion may have lowered shore below surface — treat as zero-cost flood
        if (altDiff < 0) altDiff = 0;
        let altVolume = altDiff * this.flooded.length * UNIT_SQUARE_VOLUME;
        if (altVolume > diffVolume) {
            this.shore.push(lowestShore); // No need to overflow the shore member
            this.surfaceElevation += diffVolume / (this.flooded.length * UNIT_SQUARE_VOLUME);
            this.volume = volume;
        } else {
            this.flooded.push(lowestShore);
            for (let square of SquareUtil.getUpstreamSquares(lowestShore, sim)) {
                this.shore.push(square);
            }
            this.surfaceElevation = lowestShore.altitude;
            this.volume += altVolume;
            this.fill(sim, volume, depth + 1); // Recursion to flood until it fills to volume
        }
    }

    // Lower the elevation to a certain volume
    drainToElevation(sim: Sim, elevation: number): void {
        if (elevation <= this.anchorElevation) {
            this.clearLakeStateToSim();
            // Re-initiate empty lake
            this.shore = new TinyQueue([], squareCompare);
            this.flooded = new TinyQueue([], (a, b) => -squareCompare(a, b));
            this.surfaceElevation = this.anchorElevation;
            this.volume = 0;
            this.initiateQueue(sim);
        } else {
            let recedingShores: Square[] = [];
            let allShores: Set<Square> = new Set();
            this.drain(sim, elevation, recedingShores);
            // Eliminate shores that are not shores anymore.
            // purge and restart the shore queue
            while (this.shore.length) { allShores.add(this.shore.pop()) }
            while (recedingShores.length) {
                let notShore = recedingShores.pop();
                allShores.delete(notShore);
                notShore.submerged = false;
                notShore.depth = 0;
            }
            allShores.forEach((shore) => this.shore.push(shore));
        }
        this.setLakeStateToSim();
    }

    drain(sim: Sim, elevation: number, recedingShores: Square[], depth: number = 0): void {
        if (depth > 50000) {
            console.warn(`drain() hit recursion limit at depth ${depth}`);
            this.volume = 0;
            this.surfaceElevation = this.anchorElevation;
            return;
        }
        let highestFlooded = this.flooded.pop();
        if (!highestFlooded) {
            // Queue exhausted — lake fully drained
            this.volume = 0;
            this.surfaceElevation = this.anchorElevation;
            return;
        }
        if (highestFlooded.altitude < elevation) {
            this.flooded.push(highestFlooded); // No need to expose the lakebed
            this.volume -= (this.surfaceElevation - elevation) * this.flooded.length * UNIT_SQUARE_VOLUME;
            this.surfaceElevation = elevation;
        } else {
            let drainDiff = this.surfaceElevation - highestFlooded.altitude;
            if (drainDiff < 0) drainDiff = 0;
            this.volume -= drainDiff
                    * (this.flooded.length + 1) * UNIT_SQUARE_VOLUME;
            this.surfaceElevation = Math.min(highestFlooded.altitude, this.surfaceElevation);
            this.shore.push(highestFlooded); // Shore will contain all previously flooded squares and shores.
            for (let square of SquareUtil.getUpstreamSquares(highestFlooded, sim)) {
                recedingShores.push(square); // Previous shores that are no longer shores.
            }
            this.drain(sim, elevation, recedingShores, depth + 1);
        }
    }

    clearLakeStateToSim(): void {
        for (let square of this.flooded.data) {
            square.submerged = false;
            square.depth = 0;
        }
        for (let square of this.shore.data) {
            square.submerged = false;
            square.depth = 0;
        }
    }

    setLakeStateToSim(): void {
        let hasWater = this.volume > 0;
        for (let square of this.flooded.data) {
            square.submerged = hasWater;
            square.depth = hasWater ? this.surfaceElevation - square.altitude : 0;
        }
    }

    getInfo(): {[key: string]: number} {
        return {
            surfaceElevation: this.surfaceElevation,
            volume: this.volume,
            area: this.flooded.length,
            shoreline: this.shore.length,
            deepest: this.surfaceElevation - this.anchorElevation,
        }
    }

    getSurfaceElevation(): number {
        return this.surfaceElevation;
    }

    getVolume(): number {
        return this.volume;
    }

    getShore(): Square[] {
        return [...this.shore.data];
    }

    getLake(): Square[] {
        return [...this.flooded.data];
    }
}
