import PAGE from './elements';
import { controller } from './main';
import { DisplayState, AlphaDisplayState } from './controller';


export function registerButtons(): void {
    let buttons = PAGE.buttons;
    let baseToggler = true;
    let precipToggler = true;
    let basinToggler = true;
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
    })
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
    })
}
