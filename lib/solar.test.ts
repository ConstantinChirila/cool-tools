import { describe, expect, it } from "vitest";
import {
  BATTERY_EFFICIENCY,
  HORIZON,
  HOURS,
  ORIENTATION_INFO,
  SOLAR_PLACES,
  approxPayback,
  batteryCostFor,
  bestSweep,
  calculate,
  cloudFactors,
  generationProfile,
  isWeekend,
  loadProfile,
  marginalPayback,
  roofGeneration,
  runScenario,
  simulateYear,
  solarCostFor,
  sunTimes,
  typicalDay,
  type Flows,
  type SolarInput,
} from "@/lib/solar";
import { DAYS_IN_MONTH, MONTH_START } from "@/lib/year";

const base: SolarInput = {
  kwp: 4,
  place: "london",
  orientation: "south",
  shading: "none",
  generation: 0,
  use: 2700,
  pattern: "out",
  importPrice: 26,
  exportPrice: 15,
  offPeak: false,
  offPeakPrice: 8.5,
  offPeakHours: 5,
  battery: 0,
  solarCost: 0,
  batteryCost: 0,
  priceRise: 3,
  degradation: 0.5,
  inverterYear: 12,
  inverterCost: 1000,
  batteryLife: 12,
};

const sum = (a: Float64Array, from = 0, to = a.length) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i] ?? 0;
  return s;
};

/** Energy in equals energy out, give or take rounding. */
function expectBalanced(f: Flows) {
  expect(f.generated + f.imported + f.fromBattery).toBeCloseTo(f.load + f.exported + f.solarToBattery + f.gridToBattery, 6);
  expect(f.importedOffPeak).toBeLessThanOrEqual(f.imported + 1e-9);
}

describe("sun and clouds", () => {
  it("gives short winter days and long summer ones, on the clock", () => {
    const dec = sunTimes(355);
    const jun = sunTimes(172);
    expect(dec.set - dec.rise).toBeCloseTo(7.6, 1);
    expect(jun.set - jun.rise).toBeCloseTo(16.4, 1);
    expect(dec.noon).toBe(12);
    expect(jun.noon).toBe(13);
  });

  it("averages exactly 1 within every month and repeats for the same seed", () => {
    const a = cloudFactors("london");
    const b = cloudFactors("london");
    expect(Array.from(a)).toEqual(Array.from(b));
    for (let m = 0; m < 12; m++) {
      const start = MONTH_START[m] ?? 0;
      const n = DAYS_IN_MONTH[m] ?? 30;
      expect(sum(a, start, start + n) / n).toBeCloseTo(1, 2);
    }
    expect(Array.from(cloudFactors("glasgow"))).not.toEqual(Array.from(a));
  });
});

describe("profiles", () => {
  it("generation adds up to the year and is zero at night", () => {
    const gen = generationProfile(4000, "london");
    expect(gen.length).toBe(HOURS);
    expect(sum(gen)).toBeCloseTo(4000, 0);
    // 2 am on midsummer's day and 7 am at midwinter.
    expect(gen[172 * 24 + 2]).toBe(0);
    expect(gen[355 * 24 + 7]).toBe(0);
    // June makes several times what December does.
    expect(sum(gen, MONTH_START[5]! * 24, MONTH_START[6]! * 24)).toBeGreaterThan(sum(gen, MONTH_START[11]! * 24) * 2.5);
  });

  it("load adds up to the year and follows the pattern", () => {
    const out = loadProfile(2700, "out");
    const home = loadProfile(2700, "home");
    const mixed = loadProfile(2700, "weekdays");
    expect(sum(out)).toBeCloseTo(2700, 1);
    expect(sum(home)).toBeCloseTo(2700, 1);
    expect(sum(mixed)).toBeCloseTo(2700, 1);
    // Out in the day: less at noon, more at 7 pm.
    expect(out[100 * 24 + 12]).toBeLessThan(home[100 * 24 + 12] ?? 0);
    expect(out[100 * 24 + 19]).toBeGreaterThan(home[100 * 24 + 19] ?? 0);
    // Day 5 is a Saturday: the mixed pattern is at home.
    expect(isWeekend(5)).toBe(true);
    expect(isWeekend(7)).toBe(false);
    const ratio = (mixed[5 * 24 + 12] ?? 0) / (home[5 * 24 + 12] ?? 1);
    const ratioWeekday = (mixed[7 * 24 + 12] ?? 0) / (out[7 * 24 + 12] ?? 1);
    expect(ratio).toBeCloseTo(ratioWeekday, 6);
  });
});

describe("simulateYear", () => {
  const gen = generationProfile(4000, "london");
  const load = loadProfile(2700, "out");

  it("without a battery, solar goes to the home then the grid", () => {
    const { flows } = simulateYear(gen, load, { capacity: 0, power: 0, offPeakHours: 0 });
    expectBalanced(flows);
    expect(flows.fromBattery).toBe(0);
    expect(flows.solarToBattery).toBe(0);
    expect(flows.exported).toBeCloseTo(flows.generated - flows.direct, 6);
    expect(flows.imported).toBeCloseTo(flows.load - flows.direct, 6);
    expect(flows.direct / flows.generated).toBeGreaterThan(0.1);
    expect(flows.direct / flows.generated).toBeLessThan(0.4);
  });

  it("a battery cuts exports and imports and loses a tenth on the way", () => {
    const none = simulateYear(gen, load, { capacity: 0, power: 0, offPeakHours: 0 }).flows;
    const { flows, months, hourly } = simulateYear(gen, load, { capacity: 5, power: 2.5, offPeakHours: 0 }, true);
    expectBalanced(flows);
    expect(flows.exported).toBeLessThan(none.exported);
    expect(flows.imported).toBeLessThan(none.imported);
    expect(flows.gridToBattery).toBe(0);
    // Everything that went in came out, less losses and what's left at year end.
    const left = hourly!.soc[HOURS - 1] ?? 0;
    expect(flows.fromBattery + left).toBeCloseTo(flows.solarToBattery * BATTERY_EFFICIENCY, 6);
    expect(months.reduce((s, m) => s + m.generated, 0)).toBeCloseTo(flows.generated, 6);
    expect(Math.max(...hourly!.soc)).toBeLessThanOrEqual(5 + 1e-9);
  });

  it("on an off-peak tariff the battery charges from the grid overnight and the home runs on the cheap rate", () => {
    const { flows, hourly } = simulateYear(gen, load, { capacity: 10, power: 4, offPeakHours: 5 }, true);
    expectBalanced(flows);
    expect(flows.gridToBattery).toBeGreaterThan(0);
    expect(flows.importedOffPeak).toBeGreaterThan(0);
    // No discharging inside the window.
    for (let d = 0; d < 365; d++) for (let h = 0; h < 5; h++) expect(hourly!.fromBattery[d * 24 + h]).toBe(0);
    // A January night fills the battery for the day; a June night hardly needs to.
    const jan = sum(hourly!.gridToBattery, 10 * 24, 11 * 24);
    const jun = sum(hourly!.gridToBattery, 172 * 24, 173 * 24);
    expect(jan).toBeGreaterThan(jun);
  });

  it("never charges from the grid on a flat tariff", () => {
    const { flows } = simulateYear(gen, load, { capacity: 10, power: 4, offPeakHours: 0 });
    expect(flows.gridToBattery).toBe(0);
    expect(flows.importedOffPeak).toBe(0);
  });
});

describe("finance", () => {
  it("pays back when savings cover the cost, with no growth", () => {
    const input = { ...base, priceRise: 0, degradation: 0, inverterYear: 0 };
    const r = calculate(input);
    const s = r.system;
    expect(s.capex).toBe(solarCostFor(4));
    expect(s.payback).toBeCloseTo(s.capex / s.first.saving, 1);
    expect(s.years).toHaveLength(HORIZON);
    expect(s.years[HORIZON - 1]!.cumulative).toBeCloseTo(s.first.saving * HORIZON - s.capex, 3);
    expect(s.first.saving).toBeCloseTo(s.first.billSaving + s.first.exportIncome, 6);
  });

  it("rising prices and ageing panels show up year on year", () => {
    const r = calculate({ ...base, inverterYear: 0 });
    const [y1, y2] = r.system.years;
    expect(y2!.saving / y1!.saving).toBeCloseTo(1.03 * 0.995, 2);
  });

  it("replaces the inverter and the battery on schedule", () => {
    const r = calculate({ ...base, battery: 5, inverterYear: 12, inverterCost: 1000, batteryLife: 10 });
    const spent = r.system.years.map((y) => y.spent);
    expect(spent[11]).toBe(1000);
    expect(spent[10]).toBe(batteryCostFor(5));
    expect(spent[20]).toBe(batteryCostFor(5));
    expect(spent.filter((s) => s > 0)).toHaveLength(3);
    expect(r.system.capex).toBe(solarCostFor(4) + batteryCostFor(5));
  });

  it("uses the typed costs and generation when given", () => {
    const r = calculate({ ...base, generation: 3000, solarCost: 5000, battery: 5, batteryCost: 3000 });
    expect(r.generation).toBe(3000);
    expect(r.system.first.flows.generated).toBeCloseTo(3000, 0);
    expect(r.system.capex).toBe(8000);
  });

  it("a battery alone does nothing on a flat tariff but earns on an off-peak one", () => {
    const flat = calculate({ ...base, battery: 10 });
    expect(flat.batteryOnly!.first.saving).toBeCloseTo(0, 6);
    expect(flat.batteryOnly!.payback).toBeNull();
    const cheap = calculate({ ...base, battery: 10, offPeak: true });
    expect(cheap.batteryOnly!.first.saving).toBeGreaterThan(300);
    expect(cheap.system.first.saving).toBeGreaterThan(flat.system.first.saving);
  });

  it("the sweep starts at the panels alone and flattens", () => {
    const r = calculate(base);
    expect(r.sweep[0]!.kwh).toBe(0);
    expect(r.sweep[0]!.saving).toBeCloseTo(r.panelsOnly.first.saving, 6);
    const gains = r.sweep.map((p, i, a) => (i ? p.saving - a[i - 1]!.saving : 0));
    expect(gains[1]).toBeGreaterThan(gains[8]!);
    expect(approxPayback(base, r.sweep[0]!.saving, r.system.capex, 0)).toBeCloseTo(r.panelsOnly.payback!, 1);
  });

  it("the battery's own payback counts its extra cost, extra saving and its replacement", () => {
    const forever = calculate({ ...base, battery: 5, offPeak: true, importPrice: 30, priceRise: 0, degradation: 0, inverterYear: 0, batteryLife: 0 });
    const extra = forever.system.first.saving - forever.panelsOnly.first.saving;
    expect(extra).toBeGreaterThan(0);
    // The battery fades 3% a year, so its payback is a little past cost over the first year's extra.
    const simple = batteryCostFor(5) / extra;
    const own = marginalPayback(forever.system, forever.panelsOnly);
    expect(own).not.toBeNull();
    expect(own!).toBeGreaterThanOrEqual(simple);
    expect(own!).toBeLessThan(simple * 1.25);
    // A replacement in year 11 shows up only in the system with a battery, and pushes its own payback later.
    const replaced = calculate({ ...base, battery: 5, offPeak: true, importPrice: 30, priceRise: 0, degradation: 0, inverterYear: 0, batteryLife: 10 });
    expect(replaced.system.years[10]!.spent - replaced.panelsOnly.years[10]!.spent).toBe(batteryCostFor(5));
    const later = marginalPayback(replaced.system, replaced.panelsOnly);
    expect(later === null || later > own!).toBe(true);
    // A battery that adds nothing never pays for itself.
    const flat = calculate({ ...base, battery: 5, exportPrice: base.importPrice });
    expect(marginalPayback(flat.system, flat.panelsOnly)).toBeNull();
  });

  it("picks no battery when none on the curve pays back sooner than the panels alone", () => {
    expect(bestSweep([{ kwh: 0, saving: 500, payback: 10 }, { kwh: 5, saving: 600, payback: null }])).toBe(0);
    expect(bestSweep([{ kwh: 0, saving: 500, payback: 10 }, { kwh: 5, saving: 700, payback: 9 }, { kwh: 10, saving: 720, payback: 11 }])).toBe(5);
    expect(bestSweep([])).toBe(0);
  });

  it("makes nothing without panels, whatever generation was typed", () => {
    const r = calculate({ ...base, kwp: 0, generation: 3400, battery: 5 });
    expect(r.generation).toBe(0);
    expect(r.co2).toBe(0);
    expect(r.system.first.flows.generated).toBe(0);
    expect(r.profiles.gen.every((v) => v === 0)).toBe(true);
  });

  it("scales a scenario's panels from the profile", () => {
    const r = calculate(base);
    const half = runScenario(base, { kwp: 2, battery: 0 }, r.profiles);
    expect(half.first.flows.generated).toBeCloseTo(r.system.first.flows.generated / 2, 3);
  });
});

describe("roof", () => {
  it("multiplies yield by orientation and shade", () => {
    const london = SOLAR_PLACES.find((p) => p.id === "london")!;
    expect(roofGeneration({ kwp: 4, place: "london", orientation: "south", shading: "none" })).toBeCloseTo(4 * london.yield, 6);
    expect(roofGeneration({ kwp: 4, place: "london", orientation: "north", shading: "heavy" })).toBeCloseTo(4 * london.yield * ORIENTATION_INFO.north.factor * 0.75, 6);
  });

  it("picks a typical day in the month that matches the week", () => {
    const gen = generationProfile(4000, "london");
    const d = typicalDay(gen, 5, false);
    expect(d).toBeGreaterThanOrEqual(MONTH_START[5]!);
    expect(d).toBeLessThan(MONTH_START[6]!);
    expect(isWeekend(d)).toBe(false);
    expect(isWeekend(typicalDay(gen, 5, true))).toBe(true);
  });
});
