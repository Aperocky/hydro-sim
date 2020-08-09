import PAGE from './elements';
import { Square } from '../components/square';
import { Basin } from '../components/basin/basin';
import dataStore from './helper/dataStore';
import * as constants from '../constant/constant';


const LOOK = PAGE.console;
let roundTo = (n: number, round: number): number => {
    return Math.floor(n/round) * round;
};


export class Console {

    static clearText(): void {
        LOOK.innerHTML = "";
    }

    static appendText(text: string): void {
        let p = document.createElement('p');
        let cleanText = text.replace(/(\.\d{2})\d*/g, "$1");
        p.style.color = '#eee'
        p.style.padding = '0px';
        p.style.margin = '0px';
        p.textContent = cleanText;
        LOOK.appendChild(p);
    }

    static appendTexts(texts: string[]): void {
        texts.forEach((text) => {
            Console.appendText(text);
        })
    }

    static displayFlora(square: Square): string {
        if (square.submerged) {
            return "Lake";
        }
        let num = Math.log(square.flow.aquiferDrain/10000);
        if (num < 1) {
            return "Desert";
        } else if (num < 3) {
            return "Steppe";
        } else if (num < 4) {
            return "Coniferous Forest";
        } else {
            return "Forest";
        }
    }

    static displaySquare(square: Square, basin: Basin): void {
        Console.clearText();
        let texts: string[] = [];
        texts.push(`${square.location}`);
        texts.push(`BIOME: ${Console.displayFlora(square)}`);
        if (square.submerged) {
            texts.push(`Surface Elevation: ${basin.lake.surfaceElevation} m`);
            texts.push(`Depth: ${basin.lake.surfaceElevation - square.altitude} m`);
        } else {
            texts.push(`Altitude: ${square.altitude} m`);
        }
        texts.push(`Precipitation: ${square.precipitation} mm`);
        if (square.flow.flowVolume >= 1000 && !square.submerged) {
            texts.push(`------ FLOW INFORMATION ------`);
            let flowVal = roundTo(square.flow.flowVolume, 1000);
            if (flowVal > 1000000) {
                texts.push(`Yearly discharge: ${Math.floor(flowVal/10000)/100} M m^3`);
            } else {
                texts.push(`Yearly discharge: ${flowVal} m^3`);
            }
            texts.push(`Flows ${constants.DIRECTION_DESCRIPTION.get(square.flow.flowDirection)}`);
        }
        texts.push(`------ AQUIFER INFORMATION ------`);
        texts.push(`Aquifer Volume: ${roundTo(square.flow.aquifer, 1000)} m^3`);
        texts.push(`Aquifer MAX Volume: ${roundTo(square.flow.aquiferMax, 1000)} m^3`);
        texts.push(`Aquifer loss: ${roundTo(square.flow.aquiferDrain, 1000)} m^3`);
        texts.push(`------ BASIN INFORMATION -----`);
        texts = texts.concat(Console.displayBasin(basin));
        Console.appendTexts(texts);
    }

    static displayBasin(basin: Basin): string[] {
        let texts: string[] = [];
        texts.push(`Basin: ${basin.anchor}`);
        texts.push(`Bottom: ${basin.anchorAltitude} m, Drain: ${basin.basinHold.holdElevation} m`);
        texts.push(`Catchment: ${basin.members.length} km^2`);
        let capDisplay: string = '';
        let volDisplay: string = '';
        if (basin.basinHold.holdCapacity > 1000000000) {
            capDisplay = `Capacity ${basin.basinHold.holdCapacity/1000000000} km^3`;
        } else {
            let massagedValue = Math.floor(basin.basinHold.holdCapacity/1000) * 1000;
            capDisplay = `Capacity ${massagedValue} m^3`;
        }
        if (basin.lake.volume > 1000000000) {
            volDisplay = `Volume ${basin.lake.volume/1000000000} km^3`;
        } else {
            let massagedValue = Math.floor(basin.lake.volume/1000) * 1000;
            volDisplay = `Volume ${massagedValue} m^3`;
        }
        texts.push(capDisplay);
        texts.push(volDisplay);
        texts.push(`Lake Area: ${basin.lake.flooded.length} km^2`);
        return texts;
    }

    static displayGeneralInfo(): void {
        let generalInfo = dataStore.getGeneralInfo();
        let texts: string[] = ["GENERAL INFORMATION"];
        texts.push("------------------");
        for (let [key, value] of Object.entries(generalInfo)) {
            let unit: string;
            if (key.includes("Height")) {
                unit = "m";
            } else if (key.includes("Precip")) {
                unit = "mm";
            } else {
                unit = "";
            }
            texts.push(`${key}: ${value} ${unit}`)
        }
        Console.appendTexts(texts);
    }
}
