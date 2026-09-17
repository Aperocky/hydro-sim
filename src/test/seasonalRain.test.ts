import { Sim } from '../main/sim/sim';
import seasonalRain from '../main/sim/util/seasonalRain';


test('seasonal rain adds a smooth 30-50 cell storm without accumulating', () => {
    let sim = new Sim(60);
    let random = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0) // one storm
        .mockReturnValue(0.5);  // centered, 40 wide, 150 mm peak
    let baseline = sim.map[30][30].precipitation;

    seasonalRain(sim);
    expect(sim.map[30][30].precipitation).toBeCloseTo(baseline + 150);
    expect(sim.map[30][30].seasonalRain).toBeCloseTo(150);
    expect(sim.map[30][10].seasonalRain).toBe(0);

    random.mockClear().mockReturnValueOnce(0).mockReturnValue(0.5);
    seasonalRain(sim);
    expect(sim.map[30][30].precipitation).toBeCloseTo(baseline + 150);
    random.mockRestore();
});
