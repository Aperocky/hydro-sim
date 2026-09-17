import { Sim } from '../main/sim/sim';
import seasonalRain from '../main/sim/util/seasonalRain';


test('seasonal rain adds smooth storms without accumulating', () => {
    let sim = new Sim(60);
    let random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    let baseline = sim.map[30][30].precipitation;

    seasonalRain(sim);
    let added = sim.map[30][30].seasonalRain;
    expect(added).toBeGreaterThan(0);
    expect(sim.map[0][0].seasonalRain).toBe(0);

    seasonalRain(sim);
    expect(sim.map[30][30].seasonalRain).toBeCloseTo(added);
    expect(sim.map[30][30].precipitation).toBeCloseTo(baseline + added);
    random.mockRestore();
});

test('removing stale seasonal rain cannot make precipitation negative', () => {
    let sim = new Sim(60);
    sim.map[0][0].precipitation = 0;
    sim.map[0][0].seasonalRain = 100;
    let random = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    seasonalRain(sim);

    expect(sim.map[0][0].precipitation).toBe(0);
    random.mockRestore();
});
