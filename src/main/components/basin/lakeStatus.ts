export type LakeStatus = {
    surfaceLevel: number;
    submerged: string[];
    volume: number;
}

export class LakeStatusUtil {

    static getEmptyLake(bottom: number): LakeStatus {
        return {
            surfaceLevel: bottom,
            submerged: [],
            volume: 0,
        }
    }
}
