// Erosion and Sedimentation equations
// All tunable parameters are in this file.

import { Square, SquareUtil } from '../../components/square';
import { Sim } from '../sim';
import * as constants from '../../constant/constant';

const UNIT_SQUARE_VOLUME = constants.UNITS.get('squareToVolume');

// ============================================================
// TUNABLE PARAMETERS
// ============================================================

// Erosion: how much sediment is picked up per square
// erosion = EROSION_COEFFICIENT * flowVolume^EROSION_FLOW_EXPONENT * (EROSION_BASE_GRADIENT + gradient)^EROSION_GRADIENT_EXPONENT
// Result is in m^3 of sediment picked up
export const EROSION_COEFFICIENT = 0.05;
export const EROSION_GRADIENT_EXPONENT = 2.0;  // Quadratic with gradient
export const EROSION_FLOW_EXPONENT = 0.5;      // Sqrt of flow
export const EROSION_BASE_GRADIENT = 0.5;      // Baseline gradient (meters) so flat terrain still erodes
export const EROSION_MAX_PER_SQUARE = 5000000; // Max 5m altitude change per square per turn

// Sedimentation: what fraction of carried sediment is dropped per square
// Base deposit fraction before modifiers
export const SEDIMENT_BASE_DEPOSIT = 0.05;
// How strongly sediment load ratio affects deposition (quadratic)
export const SEDIMENT_LOAD_EXPONENT = 2.0;
// How strongly low gradient increases deposition
export const SEDIMENT_GRADIENT_DECAY = 5.0;    // gradient reference point in meters
// Volume dampening - more water = less % deposited (linear dampening)
export const SEDIMENT_VOLUME_REF = 100000000;  // 100M m^3 reference volume

// Altitude change conversion: sediment volume to altitude change
// 1 m^3 sediment over 1 km^2 = 0.000001 m altitude change
// So altitude_change = sediment_volume / UNIT_SQUARE_VOLUME

// ============================================================
// EROSION
// ============================================================

// Calculate sediment eroded from a square (m^3)
export function calculateErosion(square: Square, flowVolume: number): number {
    if (flowVolume <= 0) return 0;
    let gradient = square.flow.heightDiff;

    let erosion = EROSION_COEFFICIENT
        * Math.pow(flowVolume, EROSION_FLOW_EXPONENT)
        * Math.pow(EROSION_BASE_GRADIENT + gradient, EROSION_GRADIENT_EXPONENT);

    return Math.min(erosion, EROSION_MAX_PER_SQUARE);
}

// ============================================================
// SEDIMENTATION
// ============================================================

// Calculate fraction of carried sediment to deposit on this square
export function calculateDepositionFraction(
    sedimentCarried: number,
    flowVolume: number,
    gradient: number
): number {
    if (sedimentCarried <= 0 || flowVolume <= 0) return 0;

    // a. Sediment load ratio (quadratic) - more sediment relative to water = more deposition
    let loadRatio = sedimentCarried / flowVolume * 10;
    let loadFactor = Math.pow(loadRatio, SEDIMENT_LOAD_EXPONENT);

    // b. Gradient factor - less gradient = more deposition
    let gradientFactor = SEDIMENT_GRADIENT_DECAY / (gradient + SEDIMENT_GRADIENT_DECAY);

    let fraction = SEDIMENT_BASE_DEPOSIT * (1 + loadFactor) * gradientFactor;

    // Clamp to [0, 0.8] - never dump everything mid-river
    return Math.min(fraction, 0.8);
}

// ============================================================
// APPLY EROSION AND SEDIMENTATION TO A SQUARE
// ============================================================

// Process erosion and sedimentation for a single square during river flow.
// Returns the sediment being carried downstream.
export function processErosionAtSquare(
    square: Square,
    incomingSediment: number,
    flowVolume: number
): number {
    if (!isFinite(flowVolume) || !isFinite(incomingSediment)) return 0;
    let gradient = square.flow.heightDiff;

    // Erosion: pick up sediment
    let eroded = calculateErosion(square, flowVolume);
    square.flow.erosion = eroded;

    // Total sediment in transit after erosion
    let totalSediment = incomingSediment + eroded;

    // Sedimentation: deposit some sediment
    let depositFraction = calculateDepositionFraction(totalSediment, flowVolume, gradient);
    let deposited = totalSediment * depositFraction;
    square.flow.sedimentation = deposited;

    // Store net altitude delta for next turn (don't apply now)
    square.flow.pendingErosion += (deposited - eroded) / UNIT_SQUARE_VOLUME;

    // Sediment continuing downstream
    let sedimentOut = totalSediment - deposited;
    square.flow.sediment = sedimentOut;
    return sedimentOut;
}

// ============================================================
// DELTA FORMATION: dump sediment at river mouth
// ============================================================

// When a river meets a body of water, dump remaining sediment.
// Spreads to adjacent water squares if current square fills above water.
export function dumpSedimentAtMouth(
    square: Square,
    sediment: number,
    sim: Sim
): void {
    if (sediment <= 0 || !isFinite(sediment)) return;

    let queue: Square[] = [square];
    let visited: Set<string> = new Set([square.location]);
    let remaining = sediment;

    while (remaining > 0 && queue.length > 0) {
        let current = queue.shift();
        if (!current.submerged) continue;
        // Remaining depth accounts for sediment already pending deposit
        let effectiveDepth = current.depth - current.flow.pendingErosion;
        if (effectiveDepth <= 0) continue;

        let capacity = effectiveDepth * UNIT_SQUARE_VOLUME;
        let deposit = Math.min(remaining, capacity);
        current.flow.pendingErosion += deposit / UNIT_SQUARE_VOLUME;
        remaining -= deposit;

        if (remaining > 0) {
            let adjacents = SquareUtil.getAdjacentMapFromSquare(current, sim.size);
            adjacents.forEach((loc) => {
                let adj = sim.map[loc.i][loc.j];
                if (adj.submerged && !visited.has(adj.location)) {
                    visited.add(adj.location);
                    queue.push(adj);
                }
            });
        }
    }
    // Excess sediment stays suspended in lake water — discard
}
