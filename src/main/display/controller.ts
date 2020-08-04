import PAGE from './elements';
import { MapContainer } from './container';
import { registerButtons } from './buttons';
import { SimAdapter } from './simAdapter';


//registerButtons();
//export const mapContainer = new MapContainer();
//export const simAdapter = new SimAdapter();


export enum DisplayState {
    BASE = "base",
    ALTITUDE = "altitude",
}

export enum AlphaDisplayState {
    NONE = "none",
    PRECIP = "precip",
    BASIN = "basin",
}

export class StateController {

    displayState: DisplayState;
    alphaDisplayState: AlphaDisplayState
    mapContainer: MapContainer;
    simAdapter: SimAdapter;

    constructor() {
        this.displayState = DisplayState.ALTITUDE;
        this.alphaDisplayState = AlphaDisplayState.NONE;
        this.mapContainer = new MapContainer();
        this.simAdapter = new SimAdapter()
        this.mapContainer.initialize(this.simAdapter.sim);
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

    runTurn() {
        this.simAdapter.sim.run();
        this.mapContainer.renderRivers(this.simAdapter.sim);
        if (this.alphaDisplayState != AlphaDisplayState.NONE) {
            this.mapContainer.createAlphaColorMap(this.displayState, this.alphaDisplayState);
        } else {
            this.mapContainer.createColorMap(this.displayState);
        }
    }
}
