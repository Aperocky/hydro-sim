import * as PIXI from 'pixi.js';


const SUB_STEPS: number = 5
const ALT_COLOR_STEP: number = 500;
const ALT_COLOR_MAP: Map<number, number[]> = new Map();
ALT_COLOR_MAP.set(0, [30, 120, 60]);
ALT_COLOR_MAP.set(1, [150, 250, 150]);
ALT_COLOR_MAP.set(2, [235, 180, 130]);
ALT_COLOR_MAP.set(3, [160, 100, 50]);
ALT_COLOR_MAP.set(4, [200, 200, 200]);


export class SpriteUtil {

    static getBaseSprite(x: number, y: number): PIXI.Sprite {
        let sprite: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.scale.set(0.375);
        sprite.x = x;
        sprite.y = y;
        return sprite;
    }

    static getAltitudeTint(h: number): number {
        let colors = SpriteUtil.getAltitudeColors(h)
        return SpriteUtil.getTint(colors[0], colors[1], colors[2]);
    }

    static getAltitudeColors(h: number): number[] {
        // Determine intervals.
        let ALT_COLOR_SIZE: number = ALT_COLOR_MAP.size - 1;
        let base: number = Math.floor(h/ALT_COLOR_STEP);
        if (base >= ALT_COLOR_SIZE) {
            return ALT_COLOR_MAP.get(ALT_COLOR_SIZE);
        }
        let baseColors = ALT_COLOR_MAP.get(base);
        let ceilColors = ALT_COLOR_MAP.get(base + 1);
        let scalar: number = (h - base * ALT_COLOR_STEP) / ALT_COLOR_STEP;
        scalar = Math.floor(scalar*SUB_STEPS)/SUB_STEPS
        let diffColors = ceilColors.map((n, i) => n - baseColors[i]).map((n) => scalar * n);
        let finalColors = baseColors.map((n, i) => n + diffColors[i]);
        return finalColors;
    }

    static getTint(r: number, g: number, b: number): number {
        r = Math.floor(r);
        g = Math.floor(g);
        b = Math.floor(b);
        return r*256*256 + g*256 + b;
    }
}
