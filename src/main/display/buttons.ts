import PAGE from './elements';
import { controller } from './main';
import { DisplayState, AlphaDisplayState } from './controller';


export function registerButtons(): void {
    let buttons = PAGE.buttons;
    let baseToggler = true;
    let precipToggler = true;
    let basinToggler = true;
    buttons.loadButton.addEventListener('click', () => {
        console.log("loadButton triggered");
        controller.reloadMap();
    })
    buttons.altButton.addEventListener('click', () => {
        console.log("altButton triggered");
        if (baseToggler) {
            controller.changeBaseDisplayState(DisplayState.ALTITUDE);
        } else {
            controller.changeBaseDisplayState(DisplayState.BASE);
        }
        baseToggler = !baseToggler;
    });
    buttons.precipButton.addEventListener('click', () => {
        console.log("precipButton triggered");
        if (precipToggler) {
            controller.changeAlphaDisplayState(AlphaDisplayState.PRECIP);
        } else {
            controller.changeAlphaDisplayState(AlphaDisplayState.NONE);
        }
        precipToggler = !precipToggler;
    });
    buttons.basinButton.addEventListener('click', () => {
        console.log("basinButton triggered");
        if (basinToggler) {
            controller.changeAlphaDisplayState(AlphaDisplayState.BASIN);
        } else {
            controller.changeAlphaDisplayState(AlphaDisplayState.NONE);
        }
        basinToggler = !basinToggler;
    });
}
