import { Sim } from '../main/sim/sim';


const RIVER_THRESHOLD = 100000000; // 3m^3/s


function logProgression(sim: Sim, turn: number) {
    let riverTiles = 0;
    let lakeTiles = 0;
    let beachTiles = 0;
    sim.map.forEach((arr) => {
        arr.forEach((square) => {
            if (square.flow.flowVolume > RIVER_THRESHOLD) {
                riverTiles += 1;
            }
            lakeTiles += square.submerged ? 1 : 0;
            beachTiles += square.isShore ? 1 : 0;
        })
    })
    let logs = []
    logs.push('========================');
    logs.push(`TURN: ${turn}`);
    logs.push(`lakeTiles: ${lakeTiles}`);
    logs.push(`riverTiles: ${riverTiles}`);
    logs.push(`beachTiles: ${beachTiles}`);
    console.log(logs.join('\n'));
}


let testRunTurnBase = (sim: Sim) => {
    sim.run();
    // Get some information about one turn after.
    logProgression(sim, 0);
}


let testRunTurnTen = (sim: Sim) => {
    for (let i = 0; i<10; i++) {
        sim.run();
        logProgression(sim, i);
    }
}


let exportTests = {
    testRunTurnBase: testRunTurnBase,
    testRunTurnTen: testRunTurnTen,
}

export default exportTests;
