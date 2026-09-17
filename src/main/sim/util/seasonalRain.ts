import { Sim } from '../sim';


// Replace last year's seasonal rain with 1-5 smooth, 30-50 cell-wide storms.
export default function seasonalRain(sim: Sim): void {
    for (let row of sim.map) {
        for (let square of row) {
            square.precipitation -= square.seasonalRain || 0;
            square.seasonalRain = 0;
        }
    }

    let storms = Math.floor(Math.random() * 5) + 1;
    for (let storm = 0; storm < storms; storm++) {
        let centerI = Math.floor(Math.random() * sim.size);
        let centerJ = Math.floor(Math.random() * sim.size);
        let radius = 15 + Math.random() * 10;
        let peak = 100 + Math.random() * 100;
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
