import PAGE from './elements';
import { controller } from './main';
import { DisplayState, AlphaDisplayState } from './controller';


export function registerButtons(): void {
    let buttons = PAGE.buttons;
    let baseToggler = true;
    let precipToggler = true;
    let basinToggler = true;
    let aquiferToggler = true;
    let floraToggler = true;
    buttons.loadButton.addEventListener('click', () => {
        controller.reloadMap();
    })
    buttons.altButton.addEventListener('click', () => {
        if (baseToggler) {
            controller.changeBaseDisplayState(DisplayState.ALTITUDE);
        } else {
            controller.changeBaseDisplayState(DisplayState.BASE);
        }
        baseToggler = !baseToggler;
    });
    buttons.precipButton.addEventListener('click', () => {
        if (precipToggler) {
            controller.changeAlphaDisplayState(AlphaDisplayState.PRECIP);
        } else {
            controller.changeAlphaDisplayState(AlphaDisplayState.NONE);
        }
        precipToggler = !precipToggler;
    });
    buttons.basinButton.addEventListener('click', () => {
        if (basinToggler) {
            controller.changeAlphaDisplayState(AlphaDisplayState.BASIN);
        } else {
            controller.changeAlphaDisplayState(AlphaDisplayState.NONE);
        }
        basinToggler = !basinToggler;
    });
    buttons.runButton.addEventListener('click', () => {
        controller.runTurn();
    });
    buttons.decadeButton.addEventListener('click', () => {
        let turns = 0
        let timer = () => {
            turns++;
            if (turns > 10) {
                return;
            } else {
                controller.runTurn();
                setTimeout(timer, 200);
            }
        }
        timer();
    });
    buttons.aquiferButton.addEventListener('click', () => {
        if (aquiferToggler) {
            controller.changeAlphaDisplayState(AlphaDisplayState.AQUIFER);
        } else {
            controller.changeAlphaDisplayState(AlphaDisplayState.NONE);
        }
        aquiferToggler = !aquiferToggler;
    });
    buttons.floraButton.addEventListener('click', () => {
        if (floraToggler) {
            controller.changeBaseDisplayState(DisplayState.FLORA);
        } else {
            let displayState = baseToggler ? DisplayState.BASE : DisplayState.ALTITUDE;
            controller.changeBaseDisplayState(displayState);
        }
        floraToggler = !floraToggler;
    });
    buttons.floraAlpha.addEventListener('click', () => {
        if (floraToggler) {
            controller.changeAlphaDisplayState(AlphaDisplayState.FLORA);
        } else {
            controller.changeAlphaDisplayState(AlphaDisplayState.NONE);
        }
        floraToggler = !floraToggler;
    });
    buttons.dryButton.addEventListener('click', () => {
        controller.changePrecipitation(0.8);
    });
    buttons.wetButton.addEventListener('click', () => {
        controller.changePrecipitation(1.2);
    });
    buttons.shiftButton.addEventListener('click', () => {
        controller.shiftPrecipitation();
    });
}
