import * as PIXI from 'pixi.js';
import { Sim } from '../../sim/sim';
import { MapContainer } from '../container';
import { Square, SquareUtil } from '../../components/square';


const VOLUME_START = 30000000; // 30 million cubic meters, 1m^3/sec
const VOLUME_MAP: Map<number, number> = new Map();
VOLUME_MAP.set(1, 30000000);
VOLUME_MAP.set(2, 100000000);
VOLUME_MAP.set(3, 1000000000);
VOLUME_MAP.set(4, 5000000000);


type RiverLine = {
    loc: string;
    flowTo: string;
    width: number;
    needDraw: boolean; // Need to draw
    current: boolean; // This is past info, to be swept
    line: PIXI.Graphics | null;
}


function getFlowTo(square: Square, sim: Sim) {
    return SquareUtil.getDownstreamSquare(square, sim).location;
}


function getLineWidth(volume: number): number {
    let width = 0;
    for (let i = 1; i<5; i++) {
        if (VOLUME_MAP.get(i) < volume) {
            width = i;
        } else {
            break;
        }
    }
    return width;
}


export class RiverManager {

    rivers: Map<string, RiverLine>;

    constructor() {
        this.rivers = new Map();
    }

    clear() {
        this.rivers.clear();
    }

    getRivers(sim: Sim) {
        // Set all rivers to non current until update
        this.rivers.forEach((river) => {
            river.current = false;
        })
        for (let i = 0; i < sim.size; i++) {
            for (let j = 0; j < sim.size; j++) {
                let square: Square = sim.map[i][j];
                if (square.flow.flowVolume > VOLUME_START && !square.submerged) {
                    this.setSquare(sim, square);
                }
            }
        }
    }

    setSquare(sim: Sim, square: Square): void {
        let width = getLineWidth(square.flow.flowVolume);
        let loc = square.location;
        if (this.rivers.has(loc)) {
            let riverline = this.rivers.get(loc);
            riverline.current = true;
            if (riverline.width != width) {
                riverline.width = width;
                riverline.needDraw = true;
            }
        } else {
            this.rivers.set(loc, {
                loc: loc,
                flowTo: getFlowTo(square, sim),
                width: width,
                needDraw: true,
                current: true,
                line: null,
            });
        }
    }

    draw(mapContainer: PIXI.Container) {
        this.rivers.forEach((river) => {
            if (!river.current && river.line != null) {
                mapContainer.removeChild(river.line);
            } else if (river.needDraw) {
                if (river.line == null) {
                    river.line = new PIXI.Graphics();
                    river.line.lineStyle(river.width, 0x10a5f5);
                    let startloc = JSON.parse(river.loc);
                    let endloc = JSON.parse(river.flowTo);
                    river.line.moveTo(startloc.i * 6 + 3, startloc.j * 6 + 3);
                    river.line.lineTo(endloc.i * 6 + 3, endloc.j * 6 + 3);
                    mapContainer.addChild(river.line);
                } else {
                    river.line.clear()
                    river.line.lineStyle(river.width, 0x10a5f5);
                    let startloc = JSON.parse(river.loc);
                    let endloc = JSON.parse(river.flowTo);
                    river.line.moveTo(startloc.i * 6 + 3, startloc.j * 6 + 3);
                    river.line.lineTo(endloc.i * 6 + 3, endloc.j * 6 + 3);
                }
            }
            if (!river.current) {
                // Remove from map.
                this.rivers.delete(river.loc);
            }
        })
        console.log(`MapContainer children size: ${mapContainer.children.length}`);
    }
}
