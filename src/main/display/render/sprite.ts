import * as PIXI from 'pixi.js';
import * as COLOR from '../../constant/colors';


export class SpriteUtil {

    static getBaseSprite(x: number, y: number): PIXI.Sprite {
        let sprite: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.scale.set(0.375);
        sprite.x = x;
        sprite.y = y;
        return sprite;
    }

    static getColor(n: number, conf: COLOR.MapConfig): number[] {
        let colors = SpriteUtil.getColorMapColor(conf.name, n, conf.stepSize, conf.subStep)
        return colors;
    }

    static getTint(n: number, conf: COLOR.MapConfig): number {
        let colors = SpriteUtil.getColorMapColor(conf.name, n, conf.stepSize, conf.subStep)
        return SpriteUtil.getColorCode(colors[0], colors[1], colors[2]);
    }

    static getColorMapColor(mapType: string, n: number, stepSize: number, subSteps=100): number[] {
        let colorMap = COLOR.COLOR_MAPS[mapType]
        let mapSize: number = colorMap.size - 1;
        let base: number = Math.floor(n/stepSize);
        if (base >= mapSize) {
            return colorMap.get(mapSize);
        }
        let baseColors = colorMap.get(base);
        let ceilColors = colorMap.get(base + 1);
        let scalar: number = (n - base * stepSize) / stepSize;
        if (subSteps < 50) {
            scalar = Math.floor(scalar*subSteps)/subSteps;
        }
        let diffColors = ceilColors.map((n, i) => n - baseColors[i]).map((n) => scalar * n);
        let finalColors = baseColors.map((n, i) => n + diffColors[i]).map((n) => Math.floor(n));
        return finalColors;
    }

    static getColorCode(r: number, g: number, b: number): number {
        r = Math.floor(r);
        g = Math.floor(g);
        b = Math.floor(b);
        return r*256*256 + g*256 + b;
    }

    // out = alpha * new + (1 - alpha) * old
    // Alpha blending
    static alphaBlend(alphaColor: number[], baseColor: number[], alpha: number): number {
        let newColor: number[] = baseColor.map((n, i) => (1-alpha)*n + alpha*alphaColor[i]);
        return SpriteUtil.getColorCode(newColor[0], newColor[1], newColor[2]);
    }
}
