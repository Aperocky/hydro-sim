import { Sim } from '../main/sim/sim';


let testRunTurnBase = (sim: Sim) => {
    sim.run();
}


let exportTests = {
    testRunTurnBase: testRunTurnBase,
}

export default exportTests;
