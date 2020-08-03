const RAIN_TO_VOLUME = 1000;
const PRECIPITATION_EFFECT = 0.0001;
const BASE_EVAPORATION = 0.2;
const BASE_AMOUNT = 10000000; // start to lessen from here; the amount is 0.3m^3/sec
const ALT_DIFF_BASE = 10;
const ALT_DIFF_SCALAR_MAX = 2;

export function calculateDrain(volume: number, precipitation: number): number {
    if (precipitation > 500) {
        return volume;
    }
    let drainVolume = (500 - precipitation) * 0.1 * RAIN_TO_VOLUME;
    let finalVolume = drainVolume > volume ? 0 : volume - drainVolume;
    return finalVolume;
}


export function calculateSurfaceEvaporation(volume: number, precipitation: number, altDiff: number): number {
    let evaporationScalar = BASE_EVAPORATION - (PRECIPITATION_EFFECT * precipitation);
    let volumeLogScalar = Math.log((volume + 1)/BASE_AMOUNT);
    let volumeScalar = volumeLogScalar > 0 ? 1 + volumeLogScalar : 1;
    evaporationScalar /= volumeScalar;

    let altDiffScalar = altDiff/ALT_DIFF_BASE + 0.5; // More diff less evaporation.
    evaporationScalar /= altDiffScalar;
    return volume * (1 - evaporationScalar);
}
