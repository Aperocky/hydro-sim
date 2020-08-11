// Use simplex generator to no longer require a back end map generator
import SimplexNoise from 'simplex-noise';


const ALTITUDE_OCTAVES = {
    bands: [
        [0.4, 2],
        [1, 1],
        [2, 1],
        [4, 0.5],
        [8, 0.2],
        [16, 0.05],
        [24, 0.02],
    ],
    exponent: 3.0,
}

const PRECIPITATION_OCTAVES = {
    bands: [
        [1, 1],
        [2, 0.4],
        [4, 0.1],
    ],
    exponent: 2.5,
}

const TYPE_MAP = {
    "altitude": ALTITUDE_OCTAVES,
    "precip": PRECIPITATION_OCTAVES,
}

function getNoise(noise: SimplexNoise) {
    return function(x: number, y:number): number {
        return noise.noise2D(x,y)/2 + 0.5;
    }
}

export default function generate(size, dtype): number[][] {
    let noise = new SimplexNoise();
    let map: number[][] = [];
    let octaves = TYPE_MAP[dtype];
    // Prevent predictable mapping by adding random offsets to each octave
    let offSets = [];
    for (let i = 0; i < octaves.bands.length; i++) {
        offSets.push(Math.random()/2 - 0.5);
    }
    for (let y = 0; y < size; y++) {
        map.push([]);
        for (let x = 0; x < size; x++) {
            let nx = x/size - 0.5;
            let ny = y/size - 0.5;
            let sumValue = 0
            let sumWeight = 0
            octaves.bands.forEach((val, index) => {
                let param = val[0];
                let weight = val[1];
                let offSet = offSets[index];
                sumValue += weight * getNoise(noise)(param * (nx - offSet), param * (ny - offSet));
                sumWeight += weight;
            })
            let value = Math.pow((sumValue/sumWeight), octaves.exponent);
            map[y][x] = value;
        }
    }
    return map;
}
