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
import * as constants from '../constant/constant';


const SPRITE_SIZE = constants.SPRITE_SIZE;
const MAP_PIXEL_SIZE = constants.MAP_SIZE * SPRITE_SIZE;


type Component = {
    locStr: string;
    square: Square;
    sprite: PIXI.Sprite;
}


export class MapContainer {

    mapContainer: PIXI.Container;
    mapComponents: Map<string, Component>;
    riverManager: RiverManager;

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
        Console.appendText("INITIATE MAPCONTAINER");
    }

    initialize(sim: Sim): void {
        // Wait for sim to initialize itself
        let loop = () => {
            if (sim.initialized) {
                this.initializeComponents(sim);
                this.renderRivers(sim);
                this.createColorMap();
                this.mapContainer.on('mouseout', () => {
                    Console.clearText();
                    Console.displayGeneralInfo();
                    Console.appendText(`TURN: ${sim.turn}`);
                });
                dataStore.setGeneralInfo(generalInfo(sim));
            } else {
                console.log("Waiting 200ms for sim to initialize")
                setTimeout(loop, 200);
            }
        }
        loop();
    }

    initializeComponents(sim: Sim): void {
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
                        Console.displaySquare(square, sim.superBasins.get(square.basin));
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
                    return COLOR.LAKE_BLUE;
                }
                return SpriteUtil.getColor(square.altitude, baseConf);
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
            default: {
                return [255, 255, 255]
            }
        }
    }

    createAlphaColorMap(baseMapType: string, alphaMapType: string): void {
        this.mapComponents.forEach((val) => {
            let altitude = val.square.altitude;
            let baseColor = this.getBaseTint(baseMapType, val.square);
            let alphaColor = this.getAlphaTint(alphaMapType, val.square);
            let tint = SpriteUtil.alphaBlend(alphaColor, baseColor, COLOR.OVERLAY_ALPHA);
            val.sprite.tint = tint;
        })
    }
}
