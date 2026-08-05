import PAGE from './elements';
import { MapContainer } from './container';
import { registerButtons } from './buttons';
import { SimAdapter } from './simAdapter';
import { Square } from '../components/square';
import { GodModeAction } from '../sim/util/godMode';


//registerButtons();
//export const mapContainer = new MapContainer();
//export const simAdapter = new SimAdapter();


export enum DisplayState {
    BASE = "base",
    ALTITUDE = "altitude",
    FLORA = "flora",
    FLATNESS = "flatness",
}

export enum AlphaDisplayState {
    NONE = "none",
    PRECIP = "precip",
    BASIN = "basin",
    AQUIFER = "aquifer",
    FLORA = "flora",
    SEDIMENTATION = "sedimentation",
}

export class StateController {

    displayState: DisplayState;
    alphaDisplayState: AlphaDisplayState
    mapContainer: MapContainer;
    simAdapter: SimAdapter;
    godModeAction: GodModeAction;
    godModeSize: number;
    godModeAmplitude: number;

    constructor() {
        this.displayState = DisplayState.ALTITUDE;
        this.alphaDisplayState = AlphaDisplayState.NONE;
        this.godModeAction = GodModeAction.NONE;
        this.godModeSize = 15;
        this.godModeAmplitude = 10;
        this.mapContainer = new MapContainer();
        this.simAdapter = new SimAdapter()
        this.mapContainer.initialize(this.simAdapter.sim);
        this.mapContainer.setGodModeHandler((square) => this.applyGodMode(square));
    }

    reloadMap() {
        this.simAdapter.reloadSim();
        this.mapContainer.initialize(this.simAdapter.sim);
    }

    changeBaseDisplayState(displayState: DisplayState): void {
        if (this.displayState == displayState) {
            return;
        }
        this.mapContainer.createColorMap(displayState);
        this.displayState = displayState;
    }

    changeAlphaDisplayState(alphaDisplayState: AlphaDisplayState): void {
        if (this.alphaDisplayState == alphaDisplayState) {
            return;
        }
        if (alphaDisplayState == AlphaDisplayState.NONE) {
            this.mapContainer.createColorMap(this.displayState);
            this.alphaDisplayState = AlphaDisplayState.NONE;
            return;
        }
        this.mapContainer.createAlphaColorMap(this.displayState, alphaDisplayState);
        this.alphaDisplayState = alphaDisplayState;
    }

    private refreshDisplay(): void {
        if (this.alphaDisplayState != AlphaDisplayState.NONE) {
            this.mapContainer.createAlphaColorMap(this.displayState, this.alphaDisplayState);
        } else {
            this.mapContainer.createColorMap(this.displayState);
        }
    }

    changePrecipitation(ratio: number): void {
        this.simAdapter.changePrecipitation(ratio);
        this.refreshDisplay();
    }

    shiftPrecipitation(): void {
        this.simAdapter.shiftPrecipitation();
        this.refreshDisplay();
    }

    earthquake(): void {
        this.simAdapter.earthquake();
        this.refreshDisplay();
    }

    changeGodModeAction(action: GodModeAction): GodModeAction {
        this.godModeAction = this.godModeAction === action ? GodModeAction.NONE : action;
        return this.godModeAction;
    }

    changeGodModeSize(size: number): void {
        this.godModeSize = size;
    }

    changeGodModeAmplitude(amplitude: number): void {
        this.godModeAmplitude = amplitude;
    }

    private applyGodMode(square: Square): boolean {
        if (this.godModeAction === GodModeAction.NONE) return false;
        this.simAdapter.applyGodMode(
            square, this.godModeAction, this.godModeSize, this.godModeAmplitude);
        this.refreshDisplay();
        return true;
    }

    runTurn() {
        this.simAdapter.run();
        this.mapContainer.renderRivers(this.simAdapter.sim);
        if (this.alphaDisplayState != AlphaDisplayState.NONE) {
            this.mapContainer.createAlphaColorMap(this.displayState, this.alphaDisplayState);
        } else {
            this.mapContainer.createColorMap(this.displayState);
        }
    }

}
