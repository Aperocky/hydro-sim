import * as PIXI from 'pixi.js';
import { Sim } from '../../sim/sim';
import { Square } from '../../components/square';
import * as constants from '../../constant/constant';


const SPRITE_SIZE = constants.SPRITE_SIZE;
const VOLUME_START = 10000000; // Keep small distributary arms visible.


type RiverLine = {
    loc: Square;
    flowTo: Square;
    width: number;
}


function getLineWidth(volume: number): number {
    // Keep even the largest river below 40% of a tile; small arms stay fine.
    let strength = volume / (volume + 120000000);
    return SPRITE_SIZE * (0.125 + 0.275 * strength);
}


export class RiverManager {

    graphics: PIXI.Graphics;
    currentRivers: RiverLine[];

    constructor() {
        this.graphics = new PIXI.Graphics();
        this.currentRivers = [];
    }

    clear() {
        this.graphics.clear();
        this.currentRivers = [];
    }

    getRivers(sim: Sim) {
        this.currentRivers = [];
        for (let i = 0; i < sim.size; i++) {
            for (let j = 0; j < sim.size; j++) {
                let square: Square = sim.map[i][j];
                for (let outflow of square.flow.outFlows) {
                    if (outflow.volume <= VOLUME_START) continue;
                    let offset = constants.DIRECTIONS.get(outflow.direction);
                    let flowTo = sim.map[i + offset[0]][j + offset[1]];
                    if (square.submerged && sim.superBasins.get(square.basin) === sim.superBasins.get(flowTo.basin)) continue;
                    this.currentRivers.push({
                        loc: square,
                        flowTo,
                        width: getLineWidth(outflow.volume),
                    });
                }
            }
        }
    }

    draw(mapContainer: PIXI.Container) {
        this.graphics.clear();
        this.currentRivers.forEach((river) => {
            this.graphics.lineStyle(river.width, 0x10a5f5);
            this.graphics.moveTo(river.loc.i * SPRITE_SIZE + SPRITE_SIZE/2, river.loc.j * SPRITE_SIZE + SPRITE_SIZE/2);
            this.graphics.lineTo(river.flowTo.i * SPRITE_SIZE + SPRITE_SIZE/2, river.flowTo.j * SPRITE_SIZE + SPRITE_SIZE/2);
        });
        mapContainer.addChild(this.graphics);
        this.currentRivers = [];
    }
}
