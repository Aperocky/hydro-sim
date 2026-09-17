import { Sim } from '../sim';


// A bounded split-normal distribution with its highest likelihood at mode.
export function skewedNormal(min: number, mode: number, max: number): number {
    let left = mode - min;
    let right = max - mode;
    while (true) {
        let useRight = Math.random() < right / (left + right);
        let normal = Math.abs(Math.sqrt(-2 * Math.log(Math.max(Math.random(), Number.EPSILON))) *
            Math.cos(2 * Math.PI * Math.random()));
        let value = mode + (useRight ? right : -left) * normal / 3;
        if (value >= min && value <= max) return value;
    }
}

// Replace last year's seasonal rain with smooth, localized storms.
export default function seasonalRain(sim: Sim): void {
    for (let row of sim.map) {
        for (let square of row) {
            square.precipitation = Math.max(0, square.precipitation - (square.seasonalRain || 0));
            square.seasonalRain = 0;
        }
    }

    let storms = Math.round(skewedNormal(1, 2.5, 10));
    for (let storm = 0; storm < storms; storm++) {
        let centerI = Math.floor(Math.random() * sim.size);
        let centerJ = Math.floor(Math.random() * sim.size);
        let radius = skewedNormal(20, 40, 100) / 2;
        let peak = skewedNormal(50, 150, 400);
        for (let i = Math.max(0, Math.floor(centerI - radius)); i <= Math.min(sim.size - 1, Math.ceil(centerI + radius)); i++) {
            for (let j = Math.max(0, Math.floor(centerJ - radius)); j <= Math.min(sim.size - 1, Math.ceil(centerJ + radius)); j++) {
                let distance = Math.hypot(i - centerI, j - centerJ);
                if (distance > radius) continue;
                let rain = peak * Math.pow(1 - distance / radius, 2);
                sim.map[i][j].precipitation += rain;
                sim.map[i][j].seasonalRain += rain;
            }
        }
    }
}
