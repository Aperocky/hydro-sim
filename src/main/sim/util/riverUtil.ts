import { Square } from '../../components/square';

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
