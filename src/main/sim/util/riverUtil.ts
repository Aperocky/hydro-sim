import { Square } from '../../components/square';

const RAIN_TO_VOLUME = 1000;
const BASE_AMOUNT = 1000000; // start to lessen from here; the amount is 30L/sec
const BASE_EVAPORATION = 0.2;
const PRECIPITATION_EFFECT = 0.0001;
const ALT_DIFF_BASE = 10;


export function calculateDrain(volume: number, precipitation: number): number {
    if (precipitation > 500) {
        return volume;
    }
    let drainVolume = (1000 - precipitation) * 0.25 * RAIN_TO_VOLUME;
    let finalVolume = drainVolume > volume ? 0 : volume - drainVolume;
    return finalVolume;
}


export function calculateSurfaceEvaporation(volume: number, precipitation: number, altDiff: number): number {
    if (volume < 10000) {
        return 0;
    }
    let cubicMeterPerSecond = volume/31540000;
    let riverSpeed = (cubicMeterPerSecond ** 0.25) * (altDiff/ALT_DIFF_BASE) ** 0.5 * 0.5;
    let rawDepth = altDiff ** 0.5;
    let width = cubicMeterPerSecond / riverSpeed / rawDepth;
    if (width * 2000 > volume) { return 0 }
    return volume - width * 2000;
}


export function getEffectivePrecipVolume(square: Square): number {
    let effectivePrecip = square.precipitation > 200 ? square.precipitation - 200 : 0;
    let effectivePrecipVolume = effectivePrecip * 1000;
    if (square.altitude > 1000) {
        // Mountain Dew
        effectivePrecipVolume += 100 * square.altitude;
    }
    return effectivePrecipVolume;
}
