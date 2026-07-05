import { Sim } from '../main/sim/sim';
import { Basin } from '../main/components/basin/basin';

const SIZE = 120;

function selectUsableBasin(sim: Sim): Basin {
    let selected: Basin;
    sim.basins.forEach((basin) => {
        if (
            basin.basinHold.holdCapacity > 1000000 &&
            (!selected || basin.basinHold.holdCapacity > selected.basinHold.holdCapacity)
        ) {
            selected = basin;
        }
    });
    return selected;
}

test('over-capacity basin emits excess overflow and drains lake to hold capacity', () => {
    let sim = new Sim(SIZE);
    let basin = selectUsableBasin(sim);
    let capacity = basin.basinHold.holdCapacity;
    let overCapacityVolume = capacity * 1.2;
    let inflow = capacity * 0.1;

    basin.lake.fillToVolume(sim, overCapacityVolume);
    expect(basin.lake.getVolume()).toBeGreaterThan(capacity);

    let event = basin.processInflow(inflow, sim, {fillAquifer: false});

    expect(event).not.toBeNull();
    expect(event.overflowVolume).toBeCloseTo(overCapacityVolume + inflow - capacity, -2);
    expect(basin.lake.getVolume()).toBeCloseTo(capacity, -2);
});
