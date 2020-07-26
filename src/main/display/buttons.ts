import PAGE from './elements';
import { mapContainer, simAdapter } from './controller';


export function registerButtons(): void {
    let buttons = PAGE.buttons;
    buttons.loadButton.addEventListener('click', () => {
        console.log("loadButton triggered");
        reloadMap(mapContainer, simAdapter);
    })
}


function reloadMap(mapContainer, simAdapter) {
    simAdapter.reloadSim();
    mapContainer.initialize(simAdapter.sim);
}
