import { Sim } from '../main/sim/sim';
import { Basin } from '../main/components/basin/basin';
import LakeFormation from '../main/components/basin/lakeFormation';


const assert = require('assert');
const MIN_HOLD_CAPACITY = 2000000000;
const MIN_MEMBERS = 1000;


function selectLargeBasin(sim: Sim): Basin {
    let selectedBasin: Basin;
    sim.basins.forEach((basin) => {
        if (basin.basinHold.holdCapacity > MIN_HOLD_CAPACITY &&
                basin.members.length > MIN_MEMBERS) {
            selectedBasin = basin;
        }
    })
    if (!selectedBasin) {
        console.log("NO SUITABLE BASIN");
        throw new Error('no suitable basin generated this time');
    }
    console.log(`Selected basin: ${selectedBasin.anchor}`);
    return selectedBasin;
}


function assertAreas(lake: LakeFormation, sim: Sim) {
    let totalSubmerged = 0;
    let totalShore = 0;
    sim.map.forEach((arr) => {
        arr.forEach((square) => {
            totalSubmerged += square.submerged ? 1 : 0;
            totalShore += square.isShore ? 1 : 0;
        })
    })
    console.log(`SIM DATA: submerged: ${totalSubmerged}, shore: ${totalShore}`);
    assert(totalSubmerged >= lake.flooded.length);
    assert(totalShore >= lake.shore.length);
}


let testLakeFormation = (sim: Sim) => {
    let basin = selectLargeBasin(sim);
    let lakeFormation: LakeFormation = basin.lake;
    let HOLD_UNIT = MIN_HOLD_CAPACITY/2;
    let testCapacity = Math.floor(basin.basinHold.holdCapacity/MIN_HOLD_CAPACITY) * HOLD_UNIT;
    lakeFormation.fillToVolume(sim, testCapacity);
    let logs: string[] = [];
    logs.push('-------- BEGIN FILL TEST ----------');
    for (let [key, value] of Object.entries(lakeFormation.getInfo())) {
        logs.push(`${key}: ${value}`)
    }
    console.log(logs.join("\n"));
    assert(lakeFormation.volume == testCapacity);
    assertAreas(lakeFormation, sim);
    // Test draining
    let drainToElevation = (lakeFormation.surfaceElevation - lakeFormation.anchorElevation)/2 + lakeFormation.anchorElevation;
    lakeFormation.drainToElevation(sim, drainToElevation);
    logs = []
    logs.push('-------- BEGIN DRAIN TEST 0--------');
    for (let [key, value] of Object.entries(lakeFormation.getInfo())) {
        logs.push(`${key}: ${value}`)
    }
    console.log(logs.join("\n"));
    assert(lakeFormation.surfaceElevation = drainToElevation);
    assertAreas(lakeFormation, sim);
    // Sanity check.
    lakeFormation.drainToElevation(sim, lakeFormation.anchorElevation+1);
    logs = []
    logs.push('-------- BEGIN DRAIN TEST 1--------');
    for (let [key, value] of Object.entries(lakeFormation.getInfo())) {
        logs.push(`${key}: ${value}`)
    }
    console.log(logs.join("\n"));
    assertAreas(lakeFormation, sim);
    // Clear everything
    lakeFormation.drainToElevation(sim, lakeFormation.anchorElevation-1)
    assertAreas(lakeFormation, sim);
}


let testFillFullLake = (sim: Sim) => {
    let basin = selectLargeBasin(sim);
    let lakeFormation: LakeFormation = basin.lake;
    lakeFormation.fillToVolume(sim, basin.basinHold.holdCapacity);
    let logs = [];
    logs.push('------ BEGIN FULL FILL TEST -------');
    for (let [key, value] of Object.entries(lakeFormation.getInfo())) {
        logs.push(`${key}: ${value}`)
    }
    logs.push(`HOLD ELEVATION: ${basin.basinHold.holdElevation}`);
    console.log(logs.join("\n"));
    assert(Math.abs(basin.basinHold.holdElevation - lakeFormation.surfaceElevation) < 0.001);
    lakeFormation.drainToElevation(sim, lakeFormation.anchorElevation-1)
}


let exportTests = {
    testLakeFormation: testLakeFormation,
    testFullFill: testFillFullLake,
}


export default exportTests;
