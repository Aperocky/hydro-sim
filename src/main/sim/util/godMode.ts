import { Square } from '../../components/square';
import { Sim } from '../sim';

export enum GodModeAction {
    NONE = 'none',
    PRECIPITATION = 'precipitation',
    ALTITUDE = 'altitude',
}

export default function applyGodMode(
    sim: Sim, center: Square, action: GodModeAction, radius: number, amplitude: number
): void {
    if (action === GodModeAction.NONE || amplitude === 0) return;
    let sigma = radius / 3;
    let radiusSquared = radius * radius;
    for (let i = Math.max(0, center.i - radius); i <= Math.min(sim.size - 1, center.i + radius); i++) {
        for (let j = Math.max(0, center.j - radius); j <= Math.min(sim.size - 1, center.j + radius); j++) {
            let distanceSquared = (i - center.i) ** 2 + (j - center.j) ** 2;
            if (distanceSquared > radiusSquared) continue;
            let delta = amplitude * Math.exp(-distanceSquared / (2 * sigma * sigma));
            let square = sim.map[i][j];
            if (action === GodModeAction.PRECIPITATION) {
                square.precipitation = Math.max(0, square.precipitation + delta);
            } else {
                square.altitude = Math.max(0, square.altitude + delta);
            }
        }
    }
}
