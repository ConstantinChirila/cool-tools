import { describe, expect, it } from "vitest";
import {
  BUTT_SIZES,
  DAYS,
  FILTER_EFFICIENCY,
  MONTH_OF_DAY,
  MONTH_START,
  PLACES,
  ROOF_INFO,
  YEARS,
  buttsFor,
  calculate,
  dailyNeed,
  litresPerMm,
  simulate,
  simulateRain,
  type ButtInput,
} from "@/lib/water-butt";

const place = PLACES[0]!;

const base: ButtInput = {
  length: 10,
  width: 5,
  downpipes: 2,
  roof: "tiles",
  place: place.id,
  annual: place.annual,
  use: 80,
  size: 210,
  butts: 1,
  price: 4.5,
};

/** Rain on given days of every simulated year. */
function rainOn(days: Record<number, number>): Float64Array {
  const rain = new Float64Array(YEARS * DAYS);
  for (let y = 0; y < YEARS; y++) for (const [d, mm] of Object.entries(days)) rain[y * DAYS + Number(d)] = mm;
  return rain;
}

describe("calendar", () => {
  it("has 365 days starting each month in order", () => {
    expect(MONTH_OF_DAY).toHaveLength(365);
    expect(MONTH_START).toEqual([0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]);
    expect(MONTH_OF_DAY[181]).toBe(6);
  });
});

describe("litresPerMm", () => {
  it("splits the roof between downpipes and takes off runoff and filter losses", () => {
    // 50 m² over two downpipes is 25 m²; tiles shed 75% and the diverter passes 90%.
    expect(litresPerMm(base)).toBeCloseTo(25 * ROOF_INFO.tiles.runoff * FILTER_EFFICIENCY);
    expect(litresPerMm({ ...base, downpipes: 1 })).toBeCloseTo(2 * litresPerMm(base));
  });

  it("is zero with no roof", () => {
    expect(litresPerMm({ ...base, width: 0 })).toBe(0);
  });
});

describe("dailyNeed", () => {
  it("follows the season, with nothing in winter", () => {
    expect(dailyNeed(70, 6)).toBe(10);
    expect(dailyNeed(70, 0)).toBe(0);
    expect(dailyNeed(70, 3)).toBeCloseTo(3);
  });
});

describe("simulate", () => {
  it("overflows what it can't hold", () => {
    // 100 mm on 1 January onto 10 L/mm: 1,000 L into a full 200 L butt.
    const sim = simulate(rainOn({ 0: 100 }), 10, 0, 200);
    expect(sim.average.caught).toBeCloseTo(1000);
    expect(sim.average.overflow).toBeCloseTo(1000);
    expect(sim.average.overflowDays).toBe(1);
  });

  it("waters the garden until the butt runs dry", () => {
    // With no rain ever, the 100 L it starts with is all it gives, over all the years.
    const sim = simulate(new Float64Array(YEARS * DAYS), 10, 70, 100);
    expect(sim.average.supplied).toBeCloseTo(100 / YEARS);
    expect(sim.average.dryDays).toBeGreaterThan(150);
  });

  it("skips watering on a wet day", () => {
    // Rain every day of July: the garden needs nothing then.
    const july: Record<number, number> = {};
    for (let d = 181; d < 212; d++) july[d] = 2;
    const wet = simulate(rainOn(july), 0, 70, 0);
    const dry = simulate(new Float64Array(YEARS * DAYS), 0, 70, 0);
    expect(dry.average.need - wet.average.need).toBeCloseTo(310);
  });

  it("never gives more than the garden needs or more than came in plus the first fill", () => {
    const rain = simulateRain(place, place.annual);
    const sim = simulate(rain, 20, 150, 250);
    expect(sim.average.supplied).toBeLessThanOrEqual(sim.average.need + 1e-6);
    expect(sim.average.supplied * YEARS).toBeLessThanOrEqual(sim.average.caught * YEARS + 250 + 1e-6);
  });

  it("gives more water from a bigger butt", () => {
    const rain = simulateRain(place, place.annual);
    const sizes = BUTT_SIZES.map((s) => simulate(rain, 20, 150, s, false).average.supplied);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]!).toBeGreaterThanOrEqual(sizes[i - 1]!);
  });
});

describe("simulateRain", () => {
  it("averages close to the yearly figure and repeats exactly", () => {
    const rain = simulateRain(place, place.annual);
    const total = rain.reduce((a, b) => a + b, 0) / YEARS;
    expect(Math.abs(total - place.annual) / place.annual).toBeLessThan(0.08);
    expect(simulateRain(place, place.annual)).toEqual(rain);
  });

  it("rains on about the right number of days", () => {
    const rain = simulateRain(place, place.annual);
    const wet = rain.filter((mm) => mm >= 1).length / YEARS;
    const expected = place.rainDays.reduce((a, b) => a + b, 0);
    expect(Math.abs(wet - expected) / expected).toBeLessThan(0.1);
  });

  it("scales with the yearly figure", () => {
    const rain = simulateRain(place, place.annual * 2);
    const total = rain.reduce((a, b) => a + b, 0) / YEARS;
    expect(Math.abs(total - place.annual * 2) / (place.annual * 2)).toBeLessThan(0.08);
  });
});

describe("calculate", () => {
  it("works out the yearly catch from the roof", () => {
    const r = calculate(base);
    expect(r.area).toBe(25);
    expect(r.yearly).toBeCloseTo(place.annual * 25 * ROOF_INFO.tiles.runoff * FILTER_EFFICIENCY);
    expect(r.capacity).toBe(210);
  });

  it("links common sizes together, four at most", () => {
    expect(buttsFor(1500)).toEqual({ size: 500, butts: 3 });
    expect(buttsFor(2000)).toEqual({ size: 1000, butts: 2 });
    expect(buttsFor(210)).toEqual({ size: 210, butts: 1 });
    // Nothing in the range divides it: one butt of that odd size.
    expect(buttsFor(170)).toEqual({ size: 170, butts: 1 });
  });

  it("recommends a common size and saves money on a meter", () => {
    const r = calculate(base);
    expect([...BUTT_SIZES, 1500, 2000]).toContain(r.sizing.recommended);
    expect(r.saving).toBeCloseTo((r.sim.average.supplied / 1000) * 4.5);
    expect(calculate({ ...base, price: 0 }).saving).toBe(0);
  });

  it("counts linked butts together", () => {
    expect(calculate({ ...base, butts: 3 }).capacity).toBe(630);
  });

  it("flags a roof too small for the garden", () => {
    const r = calculate({ ...base, length: 2, width: 1.5, downpipes: 1, roof: "felt", use: 400 });
    expect(r.sizing.roofLimited).toBe(true);
  });
});
