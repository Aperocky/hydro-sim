import PAGE from './elements';
import { controller } from './main';
import { DisplayState, AlphaDisplayState } from './controller';
import { GodModeAction } from '../sim/util/godMode';


export function registerButtons(): void {
    let buttons = PAGE.buttons;
    let baseToggler = true;
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
    let registerOverlay = (button: HTMLElement, state: AlphaDisplayState): void => {
        let enabled = false;
        button.addEventListener('click', () => {
            controller.changeAlphaDisplayState(enabled ? AlphaDisplayState.NONE : state);
            enabled = !enabled;
        });
    };
    registerOverlay(buttons.precipButton, AlphaDisplayState.PRECIP);
    registerOverlay(buttons.basinButton, AlphaDisplayState.BASIN);
    registerOverlay(buttons.aquiferButton, AlphaDisplayState.AQUIFER);
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
    buttons.sedimentationButton.addEventListener('click', () => {
        controller.changeAlphaDisplayState(
            controller.alphaDisplayState === AlphaDisplayState.SEDIMENTATION
                ? AlphaDisplayState.NONE : AlphaDisplayState.SEDIMENTATION);
    });
    let selectGodMode = (action: GodModeAction): void => {
        let selected = controller.changeGodModeAction(action);
        buttons.godPrecipButton.classList.toggle('active', selected === GodModeAction.PRECIPITATION);
        buttons.godAltitudeButton.classList.toggle('active', selected === GodModeAction.ALTITUDE);
    };
    buttons.godPrecipButton.addEventListener('click', () => selectGodMode(GodModeAction.PRECIPITATION));
    buttons.godAltitudeButton.addEventListener('click', () => selectGodMode(GodModeAction.ALTITUDE));
    buttons.godSize.addEventListener('input', () => {
        buttons.godSizeValue.textContent = buttons.godSize.value;
        controller.changeGodModeSize(Number(buttons.godSize.value));
    });
    buttons.godAmplitude.addEventListener('input', () => {
        buttons.godAmplitudeValue.textContent = buttons.godAmplitude.value;
        controller.changeGodModeAmplitude(Number(buttons.godAmplitude.value));
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
    buttons.earthquakeButton.addEventListener('click', () => {
        controller.earthquake();
    });
    let flatnessToggler = true;
    buttons.flatnessButton.addEventListener('click', () => {
        if (flatnessToggler) {
            controller.changeBaseDisplayState(DisplayState.FLATNESS);
        } else {
            let displayState = baseToggler ? DisplayState.BASE : DisplayState.ALTITUDE;
            controller.changeBaseDisplayState(displayState);
        }
        flatnessToggler = !flatnessToggler;
    });
}
