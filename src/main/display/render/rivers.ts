import * as PIXI from 'pixi.js';
import { Sim } from '../../sim/sim';
import { RiverOutflow } from '../../components/flow';
import { Square, SquareUtil } from '../../components/square';
import * as constants from '../../constant/constant';


const SPRITE_SIZE = constants.SPRITE_SIZE;
const VOLUME_START = 30000000;
const VOLUME_ONE_PIXEL = 100000000;
const VOLUME_MAX_WIDTH = 5000000000;
const WIDTH_EXPONENT = Math.log(SPRITE_SIZE) / Math.log(VOLUME_MAX_WIDTH / VOLUME_ONE_PIXEL);


type RiverLine = {
    loc: Square;
    flowTo: Square;
    width: number;
}


function getLineWidth(volume: number): number {
    // Constant percentage growth: each doubling of flow adds about 28% width.
    if (volume >= VOLUME_MAX_WIDTH) return SPRITE_SIZE;
    return Math.pow(volume / VOLUME_ONE_PIXEL, WIDTH_EXPONENT);
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
        let drawn = new Set<number>();
        let followed = new Set<number>();
        let continuation: Square[] = [];
        let append = (square: Square, outflow: RiverOutflow) => {
            if (outflow.volume <= 0) return;
            let key = (square.i * sim.size + square.j) * 10 + outflow.direction;
            if (drawn.has(key)) return;
            let offset = constants.DIRECTIONS.get(outflow.direction);
            let flowTo = sim.map[square.i + offset[0]][square.j + offset[1]];
            // Lake tiles already supply the connection when both ends are water.
            if (square.submerged && flowTo.submerged) return;
            drawn.add(key);
            this.currentRivers.push({loc: square, flowTo, width: Math.max(0.4, getLineWidth(outflow.volume))});
            if (!flowTo.submerged) continuation.push(flowTo);
        };
        for (let row of sim.map) {
            for (let square of row) {
                for (let outflow of square.flow.outFlows) {
                    if (outflow.volume >= VOLUME_START) append(square, outflow);
                }
            }
        }
        // Keep the downstream end of a visible channel connected even if aquifer
        // losses or a fork reduce its flow below the normal drawing threshold.
        for (let index = 0; index < continuation.length; index++) {
            let square = continuation[index];
            let key = square.i * sim.size + square.j;
            if (followed.has(key)) continue;
            followed.add(key);
            for (let outflow of square.flow.outFlows) append(square, outflow);
        }
        // A spillway can be a dry shoreline tile: connect the lake edge to the
        // channel's starting center rather than leaving half a tile of bare land.
        for (let basin of Array.from(new Set(sim.superBasins.values()))) {
            if (!basin.isFull || !basin.basinHold || basin.basinHold.holdMember < 0) continue;
            let loc = SquareUtil.locFromId(basin.basinHold.holdMember);
            let hold = sim.map[loc.i][loc.j];
            if (hold.submerged) continue;
            let outlet = hold.flow.outFlows.find(flow => drawn.has((hold.i * sim.size + hold.j) * 10 + flow.direction));
            if (!outlet) continue;
            let direction = constants.DIRECTIONS.get(outlet.direction);
            let shore: Square | null = null;
            let bestAlignment = -Infinity;
            SquareUtil.getAdjacentSquares(hold.i, hold.j, sim.size).forEach((coords, key) => {
                let square = sim.map[coords[0]][coords[1]];
                if (!square.submerged || sim.superBasins.get(square.basin) !== basin) return;
                let offset = constants.DIRECTIONS.get(key);
                let alignment = -(offset[0] * direction[0] + offset[1] * direction[1]) / Math.hypot(...offset);
                if (alignment > bestAlignment) {
                    shore = square;
                    bestAlignment = alignment;
                }
            });
            if (shore) this.currentRivers.push({loc: shore, flowTo: hold, width: Math.max(0.4, getLineWidth(outlet.volume))});
        }
    }

    draw(mapContainer: PIXI.Container) {
        this.graphics.clear();
        this.currentRivers.forEach((river) => {
            let x = river.loc.i * SPRITE_SIZE + SPRITE_SIZE/2;
            let y = river.loc.j * SPRITE_SIZE + SPRITE_SIZE/2;
            let dx = (river.flowTo.i - river.loc.i) * SPRITE_SIZE;
            let dy = (river.flowTo.j - river.loc.j) * SPRITE_SIZE;
            // End just inside the water tile, including diagonal corner entries.
            let overlap = river.loc.submerged || river.flowTo.submerged
                ? 0.5 / Math.sqrt(dx * dx + dy * dy) : 0;
            let start = river.loc.submerged ? 0.5 - overlap : 0;
            let end = river.flowTo.submerged ? 0.5 + overlap : 1;
            this.graphics.lineStyle(river.width, 0x10a5f5);
            this.graphics.moveTo(x + dx * start, y + dy * start);
            this.graphics.lineTo(x + dx * end, y + dy * end);
        });
        mapContainer.addChild(this.graphics);
        this.currentRivers = [];
    }
}
