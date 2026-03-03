import * as PIXI from 'pixi.js';
import { Sim } from '../../sim/sim';
import { MapContainer } from '../container';
import { Square, SquareUtil } from '../../components/square';
import * as constants from '../../constant/constant';


const SPRITE_SIZE = constants.SPRITE_SIZE;
const VOLUME_START = 30000000; // 30 million cubic meters, 1m^3/sec
const VOLUME_MAP: Map<number, number> = new Map();
VOLUME_MAP.set(1, 20000000);
VOLUME_MAP.set(2, 100000000);
VOLUME_MAP.set(3, 300000000);
VOLUME_MAP.set(4, 1000000000);


type RiverLine = {
    key: string;
    loc: string;
    flowTo: string;
    width: number;
    line: PIXI.Graphics | null;
}


function getFlowTo(square: Square, sim: Sim): string | null {
    let ds = SquareUtil.getDownstreamSquare(square, sim);
    return ds ? ds.location : null;
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
    currentRivers: RiverLine[];

    constructor() {
        this.rivers = new Map();
        this.currentRivers = [];
    }

    clear() {
        this.rivers.clear();
        this.currentRivers = [];
    }

    getRivers(sim: Sim) {
        this.currentRivers = [];
        for (let i = 0; i < sim.size; i++) {
            for (let j = 0; j < sim.size; j++) {
                let square: Square = sim.map[i][j];
                if (square.flow.flowVolume > VOLUME_START && !square.submerged) {
                    let flowTo = getFlowTo(square, sim);
                    if (!flowTo) continue;
                    this.currentRivers.push({
                        key: square.location,
                        loc: square.location,
                        flowTo: flowTo,
                        width: getLineWidth(square.flow.flowVolume),
                        line: null,
                    });
                }
            }
        }
        this.renderOutlets(sim);
    }

    renderOutlets(sim: Sim): void {
        let visited = new Set<string>();
        sim.superBasins.forEach((basin) => {
            if (visited.has(basin.anchor)) return;
            visited.add(basin.anchor);
            if (!basin.isFull) return;
            let holdMember = basin.basinHold.holdMember;
            if (!holdMember) return;
            let loc = JSON.parse(holdMember);
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
                key: holdMember + '_outlet',
                loc: holdMember,
                flowTo: outletTarget.location,
                width: width,
                line: null,
            });
        });
    }

    draw(mapContainer: PIXI.Container) {
        // Remove all old river lines
        this.rivers.forEach((river) => {
            if (river.line != null) {
                mapContainer.removeChild(river.line);
            }
        });
        this.rivers.clear();

        // Draw current rivers fresh
        this.currentRivers.forEach((river) => {
            river.line = new PIXI.Graphics();
            river.line.lineStyle(river.width, 0x10a5f5);
            let startloc = JSON.parse(river.loc);
            let endloc = JSON.parse(river.flowTo);
            river.line.moveTo(startloc.i * SPRITE_SIZE + SPRITE_SIZE/2, startloc.j * SPRITE_SIZE + SPRITE_SIZE/2);
            river.line.lineTo(endloc.i * SPRITE_SIZE + SPRITE_SIZE/2, endloc.j * SPRITE_SIZE + SPRITE_SIZE/2);
            mapContainer.addChild(river.line);
            this.rivers.set(river.key, river);
        });
        this.currentRivers = [];
    }
}
