import * as PIXI from "pixi.js";
import PAGE from './elements';
import { Sim } from '../sim/sim';
import { Square, SquareUtil } from '../components/square';
import { SpriteUtil } from './render/sprite';
import { Console } from './console';
import * as COLOR from '../constant/colors';
import dataStore from './helper/dataStore';
import generalInfo from '../sim/read/generalInfo';


const SPRITE_SIZE = 6
const MAP_SIZE = 900


type Component = {
    locStr: string;
    square: Square;
    sprite: PIXI.Sprite;
}


export class MapContainer {

    mapContainer: PIXI.Container;
    mapComponents: Map<string, Component>;

    constructor() {
        let canvas = document.createElement('canvas');
        PAGE.mapSpace.appendChild(canvas);
        let app = new PIXI.Application({
            width: 900, height: 900, view: canvas
        });
        let mapContainer = new PIXI.Container();
        mapContainer.interactive = true;
        mapContainer.on('mouseout', () => {
            Console.clearText();
            Console.displayGeneralInfo();
        });
        app.stage.addChild(mapContainer);
        this.mapContainer = mapContainer;
        this.mapComponents = new Map();
        Console.appendText("INITIATE MAPCONTAINER");
    }

    initialize(sim: Sim): void {
        // Wait for sim to initialize itself
        let loop = () => {
            if (sim.initialized) {
                this.initializeComponents(sim);
                this.createColorMap();
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
        for (let i = 0; i < sim.size; i++) {
            for (let j = 0; j < sim.size; j++) {
                let square: Square = sim.map[i][j];
                let x = SPRITE_SIZE * i;
                let y = SPRITE_SIZE * j;
                let sprite: PIXI.Sprite = SpriteUtil.getBaseSprite(x, y);
                sprite.interactive = true;
                sprite.
                    on('mouseover', () => {
                        Console.displaySquare(square);
                        Console.displayBasin(sim.basins.get(square.basin));
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

    createColorMap(mapType='base'): void {
        this.mapComponents.forEach((val) => {
            let altitude = val.square.altitude;
            let altConf = COLOR.MAP_CONFIG[mapType];
            let tint = SpriteUtil.getTint(altitude, altConf);
            val.sprite.tint = tint;
        })
    }

    getAlphaTint(mapType: string, square: Square): number[] {
        let alphaConf = COLOR.MAP_CONFIG[mapType];
        switch(mapType) {
            case 'precip': {
                return SpriteUtil.getColor(square.precipitation, alphaConf);
            }
            case 'basin': {
                if (square.isHold) {
                    return [255, 255, 0];
                }
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
            let altConf = COLOR.MAP_CONFIG[baseMapType];
            let baseColor = SpriteUtil.getColor(altitude, altConf);
            let alphaColor = this.getAlphaTint(alphaMapType, val.square);
            let tint = SpriteUtil.alphaBlend(alphaColor, baseColor, COLOR.OVERLAY_ALPHA);
            val.sprite.tint = tint;
        })
    }
}
