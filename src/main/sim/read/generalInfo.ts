import { Sim } from '../sim';


// General information for Sim instance.
// Average Height, Max Height
// Average Precipitation, Max Precipitation.
export default function generalInfo(sim: Sim) {
    let totalHeight = 0;
    let totalPrecip = 0;
    let maxHeight = 0;
    let maxPrecip = 0;
    let minPrecip = 5000;
    let waterArea = 0;
    for (let i = 0; i < sim.size; i++) {
        for (let j = 0; j < sim.size; j++) {
            let altitude = sim.map[i][j].altitude;
            let precip = sim.map[i][j].precipitation;
            totalHeight += altitude;
            totalPrecip += precip;
            if (maxHeight < altitude) { maxHeight = altitude }
            if (maxPrecip < precip) { maxPrecip = precip }
            if (minPrecip > precip) { minPrecip = precip }
            if (sim.map[i][j].submerged) { waterArea++ }
        }
    }
    let avgHeight = totalHeight / (sim.size * sim.size);
    let avgPrecip = totalPrecip / (sim.size * sim.size);
    let format = (n: number): number => Math.floor(n*100)/100;
    return {
        year: sim.turn,
        avgHeight: format(avgHeight),
        maxHeight: format(maxHeight),
        avgPrecip: format(avgPrecip),
        maxPrecip: format(maxPrecip),
        minPrecip: format(minPrecip),
        basinCount: sim.basins.size,
        waterArea: waterArea,
    }
}


