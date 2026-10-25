import * as PIXI from 'pixi.js';
import { Sim } from '../../sim/sim';
import { Square, SquareUtil } from '../../components/square';
import * as constants from '../../constant/constant';


const SPRITE_SIZE = constants.SPRITE_SIZE;
const VOLUME_START = 30000000; // 30 million cubic meters, 1m^3/sec
const VOLUME_MAP: Map<number, number> = new Map();
VOLUME_MAP.set(1, 30000000);
VOLUME_MAP.set(2, 120000000);
VOLUME_MAP.set(3, 480000000);
VOLUME_MAP.set(4, 1600000000);


type RiverLine = {
    loc: Square;
    flowTo: Square;
    width: number;
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
                if (square.flow.flowVolume > VOLUME_START && !square.submerged) {
                    let flowTo = SquareUtil.getDownstreamSquare(square, sim);
                    if (!flowTo) continue;
                    this.currentRivers.push({
                        loc: square,
                        flowTo: flowTo,
                        width: getLineWidth(square.flow.flowVolume),
                    });
                }
            }
        }
        this.renderOutlets(sim);
    }

    renderOutlets(sim: Sim): void {
        let visited = new Set<number>();
        sim.superBasins.forEach((basin) => {
            if (visited.has(basin.anchor)) return;
            visited.add(basin.anchor);
            if (!basin.isFull) return;
            let holdMember = basin.basinHold.holdMember;
            if (holdMember < 0) return;
            let loc = SquareUtil.locFromId(holdMember);
            let holdSquare: Square = sim.map[loc.i][loc.j];
            let adjacents = SquareUtil.getAdjacentSquares(loc.i, loc.j, sim.size);
            let holdBasins = new Set(basin.basinHold.holdBasins);
            let lowestAlt = Number.MAX_SAFE_INTEGER;
            let outletTarget: Square | null = null;
            adjacents.forEach((value) => {
                let adj = sim.map[value[0]][value[1]];
                if (holdBasins.has(adj.basin) && adj.altitude < lowestAlt) {
                    lowestAlt = adj.altitude;
                    outletTarget = adj;
                }
            });
            if (!outletTarget) return;
            let volume = holdSquare.flow.flowVolume > 0 ? holdSquare.flow.flowVolume : VOLUME_START * 2;
            let width = getLineWidth(volume);
            if (width < 1) width = 1;
            this.currentRivers.push({
                loc: holdSquare,
                flowTo: outletTarget,
                width: width,
            });
        });
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
