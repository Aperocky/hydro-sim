import { Sim } from '../sim';

// Apply 1-10 random elliptical bumps to the terrain
export default function earthquake(sim: Sim): void {
    let size = sim.size;
    let numBumps = Math.floor(Math.random() * 10) + 1;

    for (let b = 0; b < numBumps; b++) {
        let cx = Math.random() * size;
        let cy = Math.random() * size;
        let rx = size * (0.03 + Math.random() * 0.12); // 3-15% of map
        let ry = size * (0.03 + Math.random() * 0.12);
        let angle = Math.random() * Math.PI;
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);
        let magnitude = Math.random() * 60 - 30; // -30 to +30 meters
        let sx2 = rx * rx / 4;
        let sy2 = ry * ry / 4;

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let dx = i - cx;
                let dy = j - cy;
                let u = dx * cosA + dy * sinA;
                let v = -dx * sinA + dy * cosA;
                let dist2 = u * u / (2 * sx2) + v * v / (2 * sy2);
                let delta = magnitude * Math.exp(-dist2);
                sim.map[i][j].altitude += delta;
                if (sim.map[i][j].altitude < 0) sim.map[i][j].altitude = 0;
            }
        }
    }
}
