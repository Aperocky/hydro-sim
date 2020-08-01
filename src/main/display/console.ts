import PAGE from './elements';
import { Square } from '../components/square';
import { Basin } from '../components/basin/basin';
import dataStore from './helper/dataStore';


const LOOK = PAGE.console;


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

    static displaySquare(square: Square): void {
        Console.clearText();
        let texts: string[] = [];
        texts.push(`${square.location}`);
        texts.push(`Altitude: ${square.altitude} m`);
        texts.push(`Precipitation: ${square.precipitation} mm`);
        texts.push(`Drain To: ${square.basin}`);
        Console.appendTexts(texts);
    }

    static displayBasin(basin: Basin, clearText=false): void {
        let texts: string[] = [];
        if (clearText) {
            Console.clearText();
        } else {
            texts.push('----------------');
        }
        texts.push(`Basin: ${basin.anchor}`);
        texts.push(`Bottom: ${basin.anchorAltitude} m, Drain: ${basin.basinHold.holdElevation} m`);
        texts.push(`Catchment: ${basin.members.length} km^2`);
        let capDisplay: string = ''
        if (basin.basinHold.holdCapacity > 1000000000) {
            capDisplay = `Capacity ${basin.basinHold.holdCapacity/1000000000} km^3`;
        } else {
            let massagedValue = Math.floor(basin.basinHold.holdCapacity/1000) * 1000;
            capDisplay = `Capacity ${massagedValue} m^3`;
        }
        texts.push(capDisplay);
        texts.push(`Drain To: ${basin.basinHold.holdMember}`);
        Console.appendTexts(texts);
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
