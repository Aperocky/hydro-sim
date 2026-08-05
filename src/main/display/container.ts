import * as PIXI from "pixi.js";
import PAGE from './elements';
import { Sim } from '../sim/sim';
import { Square, SquareUtil } from '../components/square';
import { SpriteUtil } from './render/sprite';
import { RiverManager } from './render/rivers';
import { Console } from './console';
import * as COLOR from '../constant/colors';
import dataStore from './helper/dataStore';
import generalInfo from '../sim/read/generalInfo';
import { getBiome } from '../sim/util/biome';
import * as constants from '../constant/constant';


const SPRITE_SIZE = constants.SPRITE_SIZE;
const MAP_PIXEL_SIZE = constants.MAP_SIZE * SPRITE_SIZE;
const HILLSHADE_LIGHT_X = -0.7071;
const HILLSHADE_LIGHT_Y = -0.7071;
const HILLSHADE_STRENGTH = 0.35;


type Component = {
    locStr: number;
    square: Square;
    sprite: PIXI.Sprite;
}


export class MapContainer {

    mapContainer: PIXI.Container;
    mapComponents: Map<number, Component>;
    riverManager: RiverManager;
    simMap: Square[][];
    simSize: number;
    godModeHandler: ((square: Square) => boolean) | null;
    godModeSquare: Square | null;
    godModeTimer: number | null;

    constructor() {
        let canvas = document.createElement('canvas');
        PAGE.mapSpace.appendChild(canvas);
        let app = new PIXI.Application({
            width: MAP_PIXEL_SIZE, height: MAP_PIXEL_SIZE, view: canvas
        });
        let mapContainer = new PIXI.Container();
        mapContainer.interactive = true;
        app.stage.addChild(mapContainer);
        this.mapContainer = mapContainer;
        this.mapComponents = new Map();
        this.riverManager = new RiverManager();
        this.godModeHandler = null;
        this.godModeSquare = null;
        this.godModeTimer = null;
        window.addEventListener('pointerup', () => this.stopGodMode());
        Console.appendText("INITIATE MAPCONTAINER");
    }

    initialize(sim: Sim): void {
        this.simMap = sim.map;
        this.simSize = sim.size;
        this.initializeComponents(sim);
        this.renderRivers(sim);
        this.createColorMap();
        this.mapContainer.on('mouseout', () => {
            Console.clearText();
            Console.displayGeneralInfo();
        });
        dataStore.setGeneralInfo(generalInfo(sim));
    }

    initializeComponents(sim: Sim): void {
        this.stopGodMode();
        this.mapContainer.removeChildren();
        this.mapComponents.clear();
        this.riverManager.clear();
        for (let i = 0; i < sim.size; i++) {
            for (let j = 0; j < sim.size; j++) {
                let square: Square = sim.map[i][j];
                let x = SPRITE_SIZE * i;
                let y = SPRITE_SIZE * j;
                let sprite: PIXI.Sprite = SpriteUtil.getBaseSprite(x, y);
                sprite.interactive = true;
                sprite.
                    on('mouseover', () => {
                        this.godModeSquare = square;
                        Console.displaySquare(square, sim.superBasins.get(square.basin), this.getLocalGradient(square));
                    }).
                    on('pointerdown', () => {
                        this.startGodMode(square);
                    }).
                    on('pointertap', () => {
                        Console.displaySquare(square, sim.superBasins.get(square.basin), this.getLocalGradient(square));
                    });
                this.mapContainer.addChild(sprite);
                let record: Component = {
                    locStr: square.location,
                    square: square,
                    sprite: sprite,
                }
                this.mapComponents.set(square.location, record);
            }
        }
        console.log(`mapContainer has ${this.mapContainer.children.length} children`);
    }

    setGodModeHandler(handler: (square: Square) => boolean): void {
        this.godModeHandler = handler;
    }

    startGodMode(square: Square): void {
        this.stopGodMode();
        this.godModeSquare = square;
        if (!this.godModeHandler || !this.godModeHandler(square)) return;
        this.godModeTimer = window.setInterval(() => {
            if (this.godModeSquare) this.godModeHandler(this.godModeSquare);
        }, 200);
    }

    stopGodMode(): void {
        if (this.godModeTimer !== null) window.clearInterval(this.godModeTimer);
        this.godModeTimer = null;
    }

    renderRivers(sim: Sim): void {
        this.riverManager.getRivers(sim);
        this.riverManager.draw(this.mapContainer);
    }

    createColorMap(mapType='altitude'): void {
        this.mapComponents.forEach((val) => {
            let baseColor = this.getBaseTint(mapType, val.square);
            val.sprite.tint = SpriteUtil.getColorCode(baseColor[0], baseColor[1], baseColor[2]);
        })
    }

    getBaseTint(mapType: string, square: Square): number[] {
        let baseConf = COLOR.MAP_CONFIG[mapType];
        switch(mapType) {
            case 'base':
            case 'altitude': {
                if (square.submerged) {
                    return SpriteUtil.getColor(square.depth, COLOR.MAP_CONFIG['lake'])
                }
                return SpriteUtil.getColor(square.altitude, baseConf);
            }
            case 'flora': {
                if (square.submerged) {
                    return SpriteUtil.getColor(square.depth, COLOR.MAP_CONFIG['lake'])
                }
                return COLOR.BIOME_COLORS[getBiome(square, this.getLocalGradient(square))];
            }
            case 'flatness': {
                if (square.submerged) {
                    return SpriteUtil.getColor(square.depth, COLOR.MAP_CONFIG['lake'])
                }
                let maxDiff = this.getLocalGradient(square);
                // Remap: 0-1 -> 0 (green), 1-10 -> 0-1 (green->orange), 10-50 -> 1-2 (orange->brown), 50-200 -> 2-3 (brown->red)
                let scaled: number;
                if (maxDiff <= 1) {
                    scaled = 0;
                } else if (maxDiff <= 10) {
                    scaled = (maxDiff - 1) / 9;
                } else if (maxDiff <= 50) {
                    scaled = 1 + (maxDiff - 10) / 40;
                } else {
                    scaled = 2 + (maxDiff - 50) / 150;
                }
                let flatnessColor = SpriteUtil.getColorMapColor('flatness', scaled, 1, 100);
                return this.applyHillshade(flatnessColor, square);
            }
        }
    }

    getAlphaTint(mapType: string, square: Square): number[] {
        let alphaConf = COLOR.MAP_CONFIG[mapType];
        switch(mapType) {
            case 'precip': {
                return SpriteUtil.getColor(square.precipitation, alphaConf);
            }
            case 'basin': {
                if (square.edgeOf.size > 0) {
                    return [200, 0, 0];
                } else if (square.edgeOf.size > 2) {
                    return [255, 0, 0];
                } else {
                    return [100, 100, 100];
                }
            }
            case 'aquifer': {
                if (square.submerged) {
                    return [255, 255, 255];
                }
                let aquiferPercentFull = square.flow.aquifer/square.flow.aquiferMax;
                return SpriteUtil.getColor(aquiferPercentFull, alphaConf);
            }
            case 'flora': {
                return COLOR.BIOME_COLORS[getBiome(square, this.getLocalGradient(square))];
            }
            case 'sedimentation': {
                return square.flow.totalSedimentation >= 0
                    ? COLOR.SEDIMENTATION_COLOR : COLOR.EROSION_COLOR;
            }
            default: {
                return [255, 255, 255]
            }
        }
    }

    createAlphaColorMap(baseMapType: string, alphaMapType: string): void {
        this.mapComponents.forEach((val) => {
            let baseColor = this.getBaseTint(baseMapType, val.square);
            let alphaColor = this.getAlphaTint(alphaMapType, val.square);
            let alpha = alphaMapType === 'flora' ? 0.4 : COLOR.OVERLAY_ALPHA;
            if (alphaMapType === 'sedimentation') {
                let magnitude = Math.min(Math.abs(val.square.flow.totalSedimentation), 100);
                alpha = magnitude < 0.05 ? 0
                    : 0.1 + 0.45 * Math.log1p(magnitude) / Math.log1p(100);
            }
            let tint = SpriteUtil.alphaBlend(alphaColor, baseColor, alpha);
            val.sprite.tint = tint;
        })
    }

    getLocalGradient(square: Square): number {
        let adjacents = SquareUtil.getAdjacentSquares(square.i, square.j, this.simSize);
        let maxDiff = 0;
        adjacents.forEach((coords) => {
            let adj = this.simMap[coords[0]][coords[1]];
            let diff = Math.abs(square.altitude - adj.altitude);
            if (diff > maxDiff) maxDiff = diff;
        });
        return maxDiff;
    }

    applyHillshade(color: number[], square: Square): number[] {
        let slope = this.getSlopeVector(square);
        let magnitude = Math.sqrt(slope.x * slope.x + slope.y * slope.y);
        if (magnitude <= 0) {
            return color;
        }
        let uphillX = slope.x / magnitude;
        let uphillY = slope.y / magnitude;
        let alignment = uphillX * HILLSHADE_LIGHT_X + uphillY * HILLSHADE_LIGHT_Y;
        let relief = Math.min(1, magnitude / 50);
        let brightness = 1 + alignment * HILLSHADE_STRENGTH * relief;
        return color.map((channel) => Math.max(0, Math.min(255, Math.floor(channel * brightness))));
    }

    getSlopeVector(square: Square): {x: number, y: number} {
        let altitudeAt = (di: number, dj: number): number => {
            let i = Math.max(0, Math.min(this.simSize - 1, square.i + di));
            let j = Math.max(0, Math.min(this.simSize - 1, square.j + dj));
            return this.simMap[i][j].altitude;
        };

        let nw = altitudeAt(-1, -1);
        let n = altitudeAt(0, -1);
        let ne = altitudeAt(1, -1);
        let w = altitudeAt(-1, 0);
        let e = altitudeAt(1, 0);
        let sw = altitudeAt(-1, 1);
        let s = altitudeAt(0, 1);
        let se = altitudeAt(1, 1);

        return {
            x: ((ne + 2 * e + se) - (nw + 2 * w + sw)) / 8,
            y: ((sw + 2 * s + se) - (nw + 2 * n + ne)) / 8,
        };
    }
}
