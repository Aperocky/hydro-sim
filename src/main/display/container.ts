import * as PIXI from "pixi.js";
import PAGE from './elements';
import { Sim } from '../sim/sim';
import { Square, SquareUtil } from '../components/square';
import { SpriteUtil } from './render/sprite';


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
        app.stage.addChild(mapContainer);
        this.mapContainer = mapContainer;
        this.mapComponents = new Map();
    }

    initialize(sim: Sim): void {
        // Wait for sim to initialize itself
        let loop = () => {
            if (sim.initialized) {
                this.initializeComponents(sim);
                this.createAltitudeTerrain();
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
                this.mapContainer.addChild(sprite);
                let record: Component = {
                    locStr: square.location,
                    square: square,
                    sprite: sprite,
                }
                this.mapComponents.set(square.location, record);
            }
        }
        console.log(`Added ${this.mapComponents.size} sprites`);
        console.log(`mapContainer has ${this.mapContainer.children.length} children`);
    }

    createAltitudeTerrain(): void {
        this.mapComponents.forEach((val) => {
            let altitude = val.square.altitude;
            let tint = SpriteUtil.getAltitudeTint(altitude);
            val.sprite.tint = tint;
        })
    }
}
