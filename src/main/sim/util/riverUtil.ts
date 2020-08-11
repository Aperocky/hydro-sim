import { Square, SquareUtil } from '../../components/square';
import { FlowUtil } from '../../components/flow';
import { Sim } from '../sim';

const RAIN_TO_VOLUME = 1000;
const BASE_AMOUNT = 1000000; // start to lessen from here; the amount is 30L/sec
const BASE_EVAPORATION = 0.2;
const PRECIPITATION_EFFECT = 0.0001;
const ALT_DIFF_BASE = 10;


export function calculateDrain(volume: number, square: Square): number {
    return FlowUtil.fillAquifer(square.flow, volume);
}


export function getEffectivePrecipVolume(square: Square): number {
    let effectivePrecip = square.precipitation > 100 ? square.precipitation - 100 : 0; // For evaporation
    effectivePrecip -= effectivePrecip * 0.2; // For aquifer
    let effectivePrecipVolume = effectivePrecip * 1000;
    if (square.altitude > 1000) {
        // Mountain Dew
        effectivePrecipVolume += 100 * square.altitude;
    }
    return effectivePrecipVolume;
}


export function fillAquiferWithEffectivePrecip(square: Square): void {
    let effectivePrecip = square.precipitation > 100 ? square.precipitation - 100 : 0; // For evaporation
    let aquiferPrecip = effectivePrecip * 0.2;
    square.flow.aquifer += aquiferPrecip * 1000;
}


// Aquifer flows undersurface.
export function aquiferFlow(square: Square, sim: Sim): void {
    let flowTendency = 0.5 * square.flow.aquifer/square.flow.aquiferMax; // Maximum Aquifer flow.
    let adjacents = SquareUtil.getAdjacentMapFromSquare(square, sim.size);
    let weights: Map<number, number> = new Map();
    let totalWeights = 0;
    adjacents.forEach((loc, key) => {
        let adjacentSquare: Square = sim.map[loc.i][loc.j];
        let altDiff = square.altitude - adjacentSquare.altitude;
        let adjacentFullness = adjacentSquare.flow.aquifer/adjacentSquare.flow.aquiferMax;
        let particularFlowTendency = (1 - adjacentFullness) * (altDiff + 10)/100;
        if (particularFlowTendency <= 0) {
            return;
        } else if (particularFlowTendency >= 1) {
            weights.set(key, 1);
        } else {
            weights.set(key, particularFlowTendency);
        }
        totalWeights += 1;
    });
    // Execute flow
    if (totalWeights === 0) {
        return; // Nowhere to flow to.
    }
    let unitVolume = square.flow.aquifer * flowTendency / totalWeights;
    weights.forEach((weight, key) => {
        let loc = adjacents.get(key);
        let flowVolume = unitVolume * weight;
        square.flow.aquifer -= flowVolume;
        sim.map[loc.i][loc.j].flow.aquifer += flowVolume;
    })
}
