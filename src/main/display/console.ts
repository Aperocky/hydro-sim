import PAGE from './elements';
import { Square } from '../components/square';
import { Basin } from '../components/basin/basin';
import dataStore from './helper/dataStore';
import * as constants from '../constant/constant';
import { Biome, getBiome } from '../sim/util/biome';


const LOOK = PAGE.console;

type InfoRow = {
    label: string;
    value: string;
}

let roundTo = (n: number, round: number): number => {
    return Math.floor(n/round) * round;
};

let trimNumber = (n: number): string => {
    return `${Math.round(n * 100) / 100}`;
}


export class Console {

    static clearText(): void {
        LOOK.innerHTML = "";
    }

    static appendText(text: string): void {
        let p = document.createElement('p');
        let cleanText = text.replace(/(\.\d{2})\d*/g, "$1");
        p.className = 'info-line';
        p.textContent = cleanText;
        LOOK.appendChild(p);
    }

    static appendTexts(texts: string[]): void {
        texts.forEach((text) => {
            Console.appendText(text);
        })
    }

    static displayFlora(square: Square): string {
        switch (getBiome(square)) {
            case Biome.Water:
                return "Lake";
            case Biome.Marsh:
                return "Marsh";
            case Biome.SaltPan:
                return "Salt Pan";
            case Biome.Cliff:
                return "Cliff";
            case Biome.Desert:
                return "Desert";
            case Biome.Grassland:
                return "Grassland";
            case Biome.Woodland:
                return "Woodland";
            case Biome.Forest:
                return "Forest";
            case Biome.Rainforest:
                return "Rainforest";
        }
    }

    static displaySquare(square: Square, basin: Basin, localGradient: number): void {
        Console.clearText();
        Console.appendTitle('Square');
        let terrainRows: InfoRow[] = [
            {label: 'X    Y', value: `${square.i}    ${square.j}`},
            {label: 'Biome', value: Console.displayFlora(square)},
            {label: 'Rain', value: `${trimNumber(square.precipitation)} mm`},
        ];

        if (square.submerged && basin) {
            terrainRows.push(
                {label: 'Surface', value: `${trimNumber(basin.lake.surfaceElevation)} m`},
                {label: 'Depth', value: `${trimNumber(square.depth)} m`},
            );
        } else {
            terrainRows.push(
                {label: 'Altitude', value: `${trimNumber(square.altitude)} m`},
                {label: 'Surface', value: '—'},
                {label: 'Depth', value: '—'},
            );
        }
        Console.appendSection('Terrain', terrainRows);

        let hasFlow = square.flow.flowVolume >= 1000 && !square.submerged;
        let flowVal = roundTo(square.flow.flowVolume, 1000);
        Console.appendSection('Flow', [
            {label: 'Water', value: hasFlow ? Console.displayVolume(flowVal) : '—'},
            {label: 'Direction', value: hasFlow ? constants.DIRECTION_DESCRIPTION.get(square.flow.flowDirection) : '—'},
            {label: 'Gradient', value: `${trimNumber(localGradient)} m`},
            {label: 'Sediment', value: hasFlow && square.flow.sediment > 0 ? Console.displayVolume(square.flow.sediment) : '—'},
            {label: 'Erosion', value: hasFlow && square.flow.erosion > 0 ? Console.displaySedimentDepth(square.flow.erosion) : '—'},
            {label: 'Deposit', value: hasFlow && square.flow.sedimentation > 0 ? Console.displaySedimentDepth(square.flow.sedimentation) : '—'},
        ]);

        let soilRows: InfoRow[] = [
            {label: 'Aquifer', value: Console.displayVolume(roundTo(square.flow.aquifer, 1000))},
            {label: 'Aq max', value: Console.displayVolume(roundTo(square.flow.aquiferMax, 1000))},
            {label: 'Aq loss', value: Console.displayVolume(roundTo(square.flow.aquiferDrain, 1000))},
            {label: 'Erosion', value: Console.displaySedimentMeters(square.flow.totalErosion)},
            {label: 'Sedimentation', value: Console.displaySedimentMeters(square.flow.totalSedimentation)},
        ];
        Console.appendSection('Soil', soilRows);

        if (square.submerged && basin) {
            Console.appendSection('Basin', Console.displayBasin(basin));
        }
    }

    static displayBasin(basin: Basin): InfoRow[] {
        return [
            {label: 'Bottom', value: `${trimNumber(basin.anchorAltitude)} m`},
            {label: 'Drain', value: `${trimNumber(basin.basinHold.holdElevation)} m`},
            {label: 'Catchment Area', value: `${basin.members.length} km²`},
            {label: 'Capacity', value: Console.displayVolume(basin.basinHold.holdCapacity)},
            {label: 'Volume', value: Console.displayVolume(basin.lake.volume)},
            {label: 'Lake area', value: `${basin.lake.flooded.length} km²`},
        ];
    }

    static displayGeneralInfo(): void {
        let generalInfo = dataStore.getGeneralInfo();
        Console.clearText();
        Console.appendTitle('General');
        let rows: InfoRow[] = [];
        for (let [key, value] of Object.entries(generalInfo)) {
            let unit: string;
            if (key.includes("Height")) {
                unit = "m";
            } else if (key.includes("Precip")) {
                unit = "mm";
            } else {
                unit = "";
            }
            rows.push({label: key, value: `${value} ${unit}`.trim()});
        }
        Console.appendSection('Simulation', rows);
    }

    static appendTitle(title: string): void {
        let h = document.createElement('h3');
        h.className = 'info-title';
        h.textContent = title;
        LOOK.appendChild(h);
    }

    static appendSection(title: string, rows: InfoRow[]): void {
        if (rows.length === 0) {
            return;
        }
        let section = document.createElement('section');
        section.className = 'info-section';

        let h = document.createElement('h4');
        h.className = 'info-section-title';
        h.textContent = title;
        section.appendChild(h);

        let table = document.createElement('div');
        table.className = 'info-metrics';
        rows.forEach((row) => {
            let wrapper = document.createElement('div');
            wrapper.className = 'info-metric';

            let label = document.createElement('span');
            label.className = 'info-label';
            label.textContent = row.label;

            let value = document.createElement('span');
            value.className = 'info-value';
            value.textContent = row.value;

            wrapper.appendChild(label);
            wrapper.appendChild(value);
            table.appendChild(wrapper);
        });

        section.appendChild(table);
        LOOK.appendChild(section);
    }

    static displayVolume(volume: number): string {
        if (volume > 1000000000) {
            return `${trimNumber(volume/1000000000)} km³`;
        }
        if (volume > 1000000) {
            return `${trimNumber(volume/1000000)} M m³`;
        }
        return `${Math.floor(volume)} m³`;
    }

    static displaySedimentDepth(volume: number): string {
        return `${Math.floor(volume)} m³ (${Math.floor(volume/10000)/100} m)`;
    }

    static displaySedimentMeters(volume: number): string {
        return `${Math.floor(volume/10000)/100} m`;
    }
}
