/**
 * Solar panels and home batteries: what a system generates, how much of it
 * the home uses, what that saves on the bill and earns from export, and how
 * many years it takes to pay for itself.
 *
 * Savings depend on *when* the sun shines against when the home uses power,
 * which no yearly total can tell. So the engine builds an hourly year of
 * generation (from the place's yield, the season, the day's length and a
 * seeded dose of cloudy days) and an hourly year of use (from the home's
 * daily pattern), then runs every hour: solar to the home first, then into
 * the battery, then out to the grid; shortfalls from the battery, then the
 * grid. The same year is rerun for each year of the system's life with the
 * panels and battery ageing and prices rising.
 *
 * Energy in kWh, power in kW, prices in pence per kWh, costs in pounds.
 */

import { hashSeed, seededRandom } from "@/lib/seeded";
import { MONTH_SHAPE, SOLAR_PLACES, type SolarPlaceId } from "@/lib/solar-data";
import { DAYS, DAYS_IN_MONTH, MONTH_OF_DAY, MONTH_START } from "@/lib/year";

export { SOLAR_PLACES, type SolarPlaceId };

/* ---------------------------------------------------------------- Roof -- */

export const ORIENTATIONS = ["south", "southeast", "eastwest", "flat", "north"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

/**
 * Yield against a south-facing roof at 35°, from PVGIS runs for London
 * (2026-10-01): south-east 0.95 and south-west 0.93, east 0.80 and west
 * 0.77, north 0.53, flat 0.83 and a 10° frame 0.90. The MCS tables that
 * installers use say much the same (S 100%, SE/SW 95%, E/W 80%, flat 85%).
 */
export const ORIENTATION_INFO: Record<Orientation, { label: string; factor: number; hint: string }> = {
  south: { label: "South", factor: 1, hint: "The best case: full sun from mid-morning to mid-afternoon." },
  southeast: { label: "South-east or south-west", factor: 0.94, hint: "Nearly as good as south, with the peak shifted earlier or later in the day." },
  eastwest: { label: "East or west", factor: 0.79, hint: "About a fifth less than south. Panels split over both slopes give a flatter day." },
  flat: { label: "Flat roof", factor: 0.86, hint: "Panels on low frames at about 10°: a bit less than a pitched roof, and easy to point south." },
  north: { label: "North", factor: 0.53, hint: "Only diffuse light, so about half of south. Rarely worth it." },
};

export const SHADINGS = ["none", "some", "heavy"] as const;
export type Shading = (typeof SHADINGS)[number];

/** Rough shading factors, in the spirit of the MCS shade table: a rule of thumb, not a survey. */
export const SHADING_INFO: Record<Shading, { label: string; factor: number }> = {
  none: { label: "No shade", factor: 1 },
  some: { label: "A little", factor: 0.9 },
  heavy: { label: "A lot", factor: 0.75 },
};

/* ----------------------------------------------------------------- Use -- */

export const PATTERNS = ["out", "home", "weekdays"] as const;
export type Pattern = (typeof PATTERNS)[number];

export const PATTERN_INFO: Record<Pattern, { label: string; hint: string }> = {
  out: { label: "Out in the day", hint: "Morning rush, quiet house, evening peak: little use while the sun is up." },
  home: { label: "Home in the day", hint: "Working from home or retired: use spread through the day, so more solar gets used." },
  weekdays: { label: "Out on weekdays", hint: "Out Monday to Friday, home at the weekend." },
};

/**
 * Share of a day's electricity used in each hour, midnight first, for a home
 * that is out in the day (a morning rush, a quiet house, an evening peak)
 * and one that is in (a flatter day). Shaped around the SERL smart-meter
 * median for 2023 (a low of 0.13 kWh an hour before dawn, a peak of 0.45 at
 * 18:30), made peakier for the home that's out: a rule of thumb, not a meter.
 */
const OUT_PROFILE = [1.6, 1.4, 1.3, 1.3, 1.3, 1.6, 3.2, 4.6, 3, 1.6, 1.5, 1.5, 1.6, 1.5, 1.5, 1.9, 3.6, 6.4, 7.6, 7.4, 6.4, 5, 3.6, 2.3];
const HOME_PROFILE = [1.6, 1.4, 1.3, 1.3, 1.3, 1.6, 3, 4.2, 4, 3.6, 3.6, 3.9, 4.3, 3.9, 3.7, 3.9, 4.5, 5.6, 6.3, 6, 5.3, 4.4, 3.3, 2.2];

function normalise(values: number[]): readonly number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  return values.map((v) => v / sum);
}

const PROFILES: Record<"out" | "home", readonly number[]> = { out: normalise(OUT_PROFILE), home: normalise(HOME_PROFILE) };

/**
 * How electricity use moves through the year for a home without electric
 * heating: lights and heating pumps in winter, less in summer. Mean 1, with
 * December about 1.45 times June, as SERL smart-meter medians show.
 */
export const SEASON_USE: readonly number[] = normalise([1.2, 1.15, 1.05, 0.95, 0.9, 0.85, 0.83, 0.85, 0.92, 1.02, 1.12, 1.2]).map((v) => v * 12);

export interface UsePreset {
  label: string;
  kwh: number;
  hint: string;
}

/**
 * Ofgem's typical domestic consumption values for electricity from July
 * 2026 (low 1,600, medium 2,500, high 3,800 kWh), plus a medium home with a
 * heat pump (about 2,800 kWh more, from SERL smart-meter data) or an EV
 * charged at home (about 2,200 kWh for 7,400 miles).
 */
export const USE_PRESETS: readonly UsePreset[] = [
  { label: "Low", kwh: 1600, hint: "A flat or a one-person home: Ofgem's low figure." },
  { label: "Medium", kwh: 2500, hint: "A typical two- or three-bedroom home: Ofgem's medium figure." },
  { label: "High", kwh: 3800, hint: "A big or busy home: Ofgem's high figure." },
  { label: "Heat pump", kwh: 5300, hint: "A medium home with a heat pump: most of the extra is in winter, when there's little sun." },
  { label: "EV at home", kwh: 4700, hint: "A medium home charging an electric car at home, about 7,000 miles a year." },
];

/* -------------------------------------------------------------- Prices -- */

/** Pence per kWh: the Ofgem price cap unit rate for electricity, 1 October to 31 December 2026 (no VAT on electricity until 31 March 2027). */
export const DEFAULT_IMPORT = 26.3;
/** Pence per kWh: Octopus Outgoing Fixed since 1 March 2026, typical of the export rates suppliers give their own customers (12–16p; 3–6p otherwise). */
export const DEFAULT_EXPORT = 12;
/** Pence per kWh overnight on an EV tariff in 2026: E.ON Next Drive 6.5–7.5p, EDF GoElectric 6.7p, Octopus Go about 7.5–9.5p. */
export const DEFAULT_OFF_PEAK = 7.5;
/** Hours the cheap rate runs: E.ON and EDF give 00:00–06:00, Octopus Go 00:30–05:30. */
export const DEFAULT_OFF_PEAK_HOURS = 6;
/** Pence per kWh these tariffs charge the rest of the day, above the cap. */
export const OFF_PEAK_DAY_RATE = 30;

/* ----------------------------------------------------------------- Kit -- */

/** Common home battery sizes, usable kWh. */
export const BATTERY_SIZES = [3.5, 5, 8, 10, 13.5, 16, 20] as const;

/**
 * Installed cost in pounds of a solar system, no VAT (0% until 31 March
 * 2027). The DESNZ/MCS cost data for 2025/26 puts the median at about
 * £1,780 per kW for systems up to 4 kW and £1,700 for 4–10 kW, so a fixed
 * share for scaffolding and the inverter plus a rate per kWp: 4 kWp about
 * £7,100.
 */
export function solarCostFor(kwp: number): number {
  if (kwp <= 0) return 0;
  return Math.round((1200 + 1475 * kwp) / 50) * 50;
}

/**
 * Installed cost in pounds of a home battery, no VAT: installer guides in
 * 2026 put 5 kWh at £2,500–4,000 and 10 kWh at £4,000–6,500, so a fixed
 * share for the inverter and fitting plus £400 per usable kWh. A Powerwall
 * 3 costs more (£8,000–10,500 for 13.5 kWh): type the quote.
 */
export function batteryCostFor(kwh: number): number {
  if (kwh <= 0) return 0;
  return Math.round((1250 + 400 * kwh) / 50) * 50;
}

/** Round-trip efficiency of a home battery: a tenth is lost charging and discharging (Powerwall 3 datasheet: 89%). */
export const BATTERY_EFFICIENCY = 0.9;
/** Capacity lost each year, as a share of the original: warranties promise 70% after ten years. */
export const BATTERY_FADE = 0.03;
/** Capacity never falls below this share of the original. */
const BATTERY_FLOOR = 0.6;

/** kW a battery can charge or discharge at, in step with its size: a 5 kWh unit about 3 kW, a 13.5 kWh Powerwall 5 kW. */
export function batteryPower(kwh: number): number {
  return Math.min(Math.max(kwh * 0.5, 3), 5);
}

/** Years the engine looks ahead: the usual panel performance warranty. */
export const HORIZON = 25;

/** kg CO₂e per kWh of grid electricity, DESNZ conversion factors 2026: 0.131 generation plus 0.013 transmission and distribution. */
export const GRID_CO2 = 0.144;

/* -------------------------------------------------------------- Inputs -- */

export interface SolarInput {
  /** Panel capacity in kWp. 0 for a battery on its own. */
  kwp: number;
  place: SolarPlaceId;
  orientation: Orientation;
  shading: Shading;
  /** kWh a year the panels generate; 0 means work it out from the roof. */
  generation: number;
  /** kWh a year the home uses. */
  use: number;
  pattern: Pattern;
  /** Pence per kWh. */
  importPrice: number;
  exportPrice: number;
  /** A cheap overnight window, as on EV tariffs. */
  offPeak: boolean;
  offPeakPrice: number;
  /** Hours from midnight that the cheap rate runs for. */
  offPeakHours: number;
  /** Usable kWh. 0 for no battery. */
  battery: number;
  /** Pounds; 0 means use the typical cost. */
  solarCost: number;
  batteryCost: number;
  /** Percent a year electricity prices rise. */
  priceRise: number;
  /** Percent a year the panels lose. */
  degradation: number;
  /** Year the inverter is replaced (0 for never) and what it costs. */
  inverterYear: number;
  inverterCost: number;
  /** Years a battery lasts before it is replaced at today's price (0 for never). */
  batteryLife: number;
}

export const LIMITS = {
  kwp: { min: 0, max: 50 },
  generation: { min: 0, max: 100_000 },
  use: { min: 0, max: 100_000 },
  price: { min: 0, max: 200 },
  offPeakHours: { min: 1, max: 12 },
  battery: { min: 0, max: 100 },
  cost: { min: 0, max: 1_000_000 },
  priceRise: { min: -10, max: 20 },
  degradation: { min: 0, max: 5 },
  year: { min: 0, max: HORIZON },
} as const;

/* ------------------------------------------------------------ The year -- */

export const HOURS = DAYS * 24;

/** Days of the year on British Summer Time, roughly: the clocks go forward at the end of March and back at the end of October. */
const BST_START = 87;
const BST_END = 300;

/**
 * When the sun is up on a given day, in clock hours, for the middle of
 * Britain: about 7.6 hours of daylight at midwinter and 16.4 at midsummer,
 * centred on 12 by the clock in winter and 13 in summer.
 */
export function sunTimes(day: number): { rise: number; set: number; noon: number } {
  const length = 12 + 4.4 * Math.cos((2 * Math.PI * (day - 172)) / DAYS);
  const noon = day >= BST_START && day < BST_END ? 13 : 12;
  return { rise: noon - length / 2, set: noon + length / 2, noon };
}

/**
 * How much the sun varies from day to day within a month: the spread of a
 * log-normal clearness factor. Winter days swing from gloom to crisp sun
 * more than summer ones, in relative terms. A rule of thumb.
 */
const CLOUD_SPREAD = [0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.3, 0.3, 0.35, 0.45, 0.5, 0.55] as const;

/**
 * Daily generation factors for a year, averaging exactly 1 within each
 * month, seeded from the place so the same inputs always give the same
 * weather.
 */
export function cloudFactors(seed: string): Float64Array {
  const next = seededRandom(hashSeed(`solar:${seed}`));
  const raw = new Float64Array(DAYS);
  for (let d = 0; d < DAYS; d++) {
    const s = CLOUD_SPREAD[MONTH_OF_DAY[d] ?? 0] ?? 0.4;
    // Box–Muller normal, then log-normal; rounded so the server and the
    // browser (whose Math.log and Math.cos can differ in the last digit)
    // build exactly the same year.
    const u = Math.max(next(), 1e-12);
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
    raw[d] = Math.round(Math.exp(s * z - (s * s) / 2) * 1000) / 1000;
  }
  const factors = new Float64Array(DAYS);
  for (let m = 0; m < 12; m++) {
    const start = MONTH_START[m] ?? 0;
    const n = DAYS_IN_MONTH[m] ?? 30;
    let sum = 0;
    for (let d = start; d < start + n; d++) sum += raw[d] ?? 0;
    for (let d = start; d < start + n; d++) factors[d] = Math.round(((raw[d] ?? 0) / (sum / n)) * 1000) / 1000;
  }
  return factors;
}

/**
 * Generation for every hour of the year, kWh, adding up to `annual`: each
 * month's share (for the place's north or south shape) spread over its
 * days, each day scaled by its cloud factor and shaped as a hump between
 * sunrise and sunset.
 */
export function generationProfile(annual: number, place: SolarPlaceId): Float64Array {
  const gen = new Float64Array(HOURS);
  if (annual <= 0) return gen;
  const clouds = cloudFactors(place);
  const shape = new Float64Array(24);
  const months = MONTH_SHAPE[(SOLAR_PLACES.find((p) => p.id === place) ?? SOLAR_PLACES[0]).shape];
  const shareSum = months.reduce((a, b) => a + b, 0);
  for (let d = 0; d < DAYS; d++) {
    const m = MONTH_OF_DAY[d] ?? 0;
    const daily = (annual * ((months[m] ?? 0) / shareSum) * (clouds[d] ?? 1)) / (DAYS_IN_MONTH[m] ?? 30);
    const { rise, set, noon } = sunTimes(d);
    const half = (set - rise) / 2;
    let sum = 0;
    for (let h = 0; h < 24; h++) {
      const t = Math.abs(h + 0.5 - noon);
      const w = t < half ? Math.round(Math.cos((Math.PI * t) / (2 * half)) ** 1.4 * 1e6) / 1e6 : 0;
      shape[h] = w;
      sum += w;
    }
    for (let h = 0; h < 24; h++) gen[d * 24 + h] = sum > 0 ? Math.round(((daily * (shape[h] ?? 0)) / sum) * 1e6) / 1e6 : 0;
  }
  return gen;
}

/** Whether a day of the year is a Saturday or Sunday; day 0 is taken as a Monday. */
export function isWeekend(day: number): boolean {
  return day % 7 >= 5;
}

/** Electricity use for every hour of the year, kWh, adding up to `annual`. */
export function loadProfile(annual: number, pattern: Pattern): Float64Array {
  const load = new Float64Array(HOURS);
  if (annual <= 0) return load;
  // The season factors average 1 over the months, not the days, so the year
  // is rescaled at the end to land exactly on `annual`.
  let total = 0;
  for (let d = 0; d < DAYS; d++) {
    const m = MONTH_OF_DAY[d] ?? 0;
    const daily = ((annual / DAYS) * (SEASON_USE[m] ?? 1)) ;
    const profile = PROFILES[pattern === "weekdays" ? (isWeekend(d) ? "home" : "out") : pattern];
    for (let h = 0; h < 24; h++) {
      const v = daily * (profile[h] ?? 0);
      load[d * 24 + h] = v;
      total += v;
    }
  }
  const fix = annual / total;
  for (let h = 0; h < HOURS; h++) load[h] = Math.round((load[h] ?? 0) * fix * 1e6) / 1e6;
  return load;
}

/* ------------------------------------------------------------ Dispatch -- */

/** kWh totals for a period. */
export interface Flows {
  generated: number;
  load: number;
  /** Solar used in the home as it was made. */
  direct: number;
  solarToBattery: number;
  gridToBattery: number;
  fromBattery: number;
  exported: number;
  /** All grid imports, including charging the battery. */
  imported: number;
  /** The part of `imported` at the off-peak price. */
  importedOffPeak: number;
}

export function emptyFlows(): Flows {
  return { generated: 0, load: 0, direct: 0, solarToBattery: 0, gridToBattery: 0, fromBattery: 0, exported: 0, imported: 0, importedOffPeak: 0 };
}

/** What happened in each hour of a simulated year. */
export interface Hourly {
  /** kWh in the battery at the end of the hour. */
  soc: Float64Array;
  solarToBattery: Float64Array;
  gridToBattery: Float64Array;
  fromBattery: Float64Array;
  exported: Float64Array;
  imported: Float64Array;
}

export interface SystemSpec {
  /** Usable kWh this year. */
  capacity: number;
  /** kW. */
  power: number;
  /** Hours from midnight the cheap rate runs, or 0 for a flat tariff. */
  offPeakHours: number;
  /** Multiplier on the generation profile (fewer panels, older panels); 1 by default. */
  scale?: number;
}

export interface YearSim {
  flows: Flows;
  months: Flows[];
  hourly?: Hourly;
}

/**
 * Runs a year hour by hour. Solar serves the home first; the surplus charges
 * the battery (a tenth lost on the way) and the rest is exported. A
 * shortfall comes from the battery, then the grid. In a cheap overnight
 * window the home runs on the grid and the battery charges from it, but
 * only by as much as the coming day would otherwise import at the day rate,
 * which assumes a perfect forecast (smart tariffs come close).
 */
export function simulateYear(gen: Float64Array, load: Float64Array, spec: SystemSpec, detail = false): YearSim {
  const cap = Math.max(spec.capacity, 0);
  const power = Math.max(spec.power, 0);
  const scale = spec.scale ?? 1;
  const window = cap > 0 ? Math.min(Math.max(Math.round(spec.offPeakHours), 0), 24) : 0;
  const flatWindow = Math.min(Math.max(Math.round(spec.offPeakHours), 0), 24);
  const months = Array.from({ length: 12 }, emptyFlows);
  const hourly: Hourly | undefined = detail
    ? {
        soc: new Float64Array(HOURS),
        solarToBattery: new Float64Array(HOURS),
        gridToBattery: new Float64Array(HOURS),
        fromBattery: new Float64Array(HOURS),
        exported: new Float64Array(HOURS),
        imported: new Float64Array(HOURS),
      }
    : undefined;

  // Grid imports a day would make at the day rate, from hour `from`, starting with `soc` in the battery and no grid charging.
  const dayImports = (day: number, from: number, soc: number): number => {
    let imported = 0;
    for (let h = from; h < 24; h++) {
      const i = day * 24 + h;
      const g = (gen[i] ?? 0) * scale;
      const l = load[i] ?? 0;
      const direct = Math.min(g, l);
      let surplus = g - direct;
      let deficit = l - direct;
      if (surplus > 0) {
        const charge = Math.min(surplus, power, (cap - soc) / BATTERY_EFFICIENCY);
        soc += charge * BATTERY_EFFICIENCY;
        surplus -= charge;
      }
      if (deficit > 0) {
        const give = Math.min(deficit, power, soc);
        soc -= give;
        deficit -= give;
        imported += deficit;
      }
    }
    return imported;
  };

  let soc = 0;
  let target = 0;
  for (let d = 0; d < DAYS; d++) {
    const m = MONTH_OF_DAY[d] ?? 0;
    const month = months[m]!;
    if (window > 0) {
      // Charge overnight by what tomorrow's day rate would otherwise cost.
      target = soc + Math.min(cap - soc, dayImports(d, window, soc) - dayImports(d, window, cap));
    }
    for (let h = 0; h < 24; h++) {
      const i = d * 24 + h;
      const g = (gen[i] ?? 0) * scale;
      const l = load[i] ?? 0;
      const inWindow = h < flatWindow;
      const direct = Math.min(g, l);
      let surplus = g - direct;
      let deficit = l - direct;
      let charged = 0;
      month.generated += g;
      month.load += l;
      month.direct += direct;
      if (surplus > 0 && cap > 0) {
        charged = Math.min(surplus, power, (cap - soc) / BATTERY_EFFICIENCY);
        soc += charged * BATTERY_EFFICIENCY;
        surplus -= charged;
        month.solarToBattery += charged;
        if (hourly) hourly.solarToBattery[i] = charged;
      }
      month.exported += surplus;
      if (hourly) hourly.exported[i] = surplus;
      let imported = 0;
      if (deficit > 0) {
        if (h >= window) {
          const give = Math.min(deficit, power, soc);
          soc -= give;
          deficit -= give;
          month.fromBattery += give;
          if (hourly) hourly.fromBattery[i] = give;
        }
        imported = deficit;
      }
      if (h < window && target > soc + 1e-9) {
        const fromGrid = Math.min(Math.max(power - charged, 0), (target - soc) / BATTERY_EFFICIENCY);
        soc += fromGrid * BATTERY_EFFICIENCY;
        imported += fromGrid;
        month.gridToBattery += fromGrid;
        if (hourly) hourly.gridToBattery[i] = fromGrid;
      }
      month.imported += imported;
      if (inWindow) month.importedOffPeak += imported;
      if (hourly) {
        hourly.imported[i] = imported;
        hourly.soc[i] = soc;
      }
    }
  }

  const flows = emptyFlows();
  for (const m of months) for (const k of Object.keys(flows) as (keyof Flows)[]) flows[k] += m[k];
  return { flows, months, hourly };
}

/* ------------------------------------------------------------- Finance -- */

export interface YearRow {
  /** 1 to HORIZON. */
  year: number;
  /** Bill cut plus export income this year, pounds. */
  saving: number;
  /** Replacement kit bought this year, pounds. */
  spent: number;
  /** Savings so far minus everything spent, including the system itself. */
  cumulative: number;
}

export interface FirstYear {
  flows: Flows;
  /** Pounds. */
  saving: number;
  billSaving: number;
  exportIncome: number;
  /** What the home would pay with no kit, pounds. */
  baseline: number;
  /** Share of generation used in the home, directly or via the battery. */
  selfUse: number;
  /** Share of the home's electricity that came from its own panels. */
  selfSufficiency: number;
}

export interface ScenarioResult {
  kwp: number;
  battery: number;
  /** Pounds spent on day one. */
  capex: number;
  first: FirstYear;
  years: YearRow[];
  /** Years until savings cover every cost, or null if they never do within HORIZON. */
  payback: number | null;
  /** Cumulative position at the end of HORIZON, pounds. */
  net: number;
  /** All savings over HORIZON, pounds. */
  lifetimeSaving: number;
  /** First-year saving as a share of the cost. */
  simpleReturn: number;
  months: Flows[];
  hourly?: Hourly;
}

/** Pounds a year's electricity costs under the tariff, given its flows. */
function bill(flows: Flows, prices: { importPrice: number; exportPrice: number; offPeakPrice: number }): number {
  const dayRate = (flows.imported - flows.importedOffPeak) * prices.importPrice;
  const nightRate = flows.importedOffPeak * prices.offPeakPrice;
  return (dayRate + nightRate - flows.exported * prices.exportPrice) / 100;
}

/** The flows of a home with no panels and no battery: everything imported. */
function baselineFlows(load: Float64Array, offPeakHours: number): Flows {
  const f = emptyFlows();
  for (let i = 0; i < HOURS; i++) {
    const l = load[i] ?? 0;
    f.load += l;
    f.imported += l;
    if (i % 24 < offPeakHours) f.importedOffPeak += l;
  }
  return f;
}

export interface Scenario {
  kwp: number;
  battery: number;
}

/** Where in year `age` the cumulative line crossed zero, with the year's kit bought at its start. */
function crossing(age: number, before: number, saving: number, spent: number): number {
  return age + (saving > 0 ? Math.min(Math.max((spent - before) / saving, 0), 1) : 1);
}

/** Runs one system through HORIZON years. */
export function runScenario(input: SolarInput, scenario: Scenario, profiles: { gen: Float64Array; load: Float64Array }, detail = false): ScenarioResult {
  const kwp = Math.max(scenario.kwp, 0);
  const battery = Math.max(scenario.battery, 0);
  const offPeakHours = input.offPeak ? input.offPeakHours : 0;
  const prices = { importPrice: input.importPrice, exportPrice: input.exportPrice, offPeakPrice: input.offPeak ? input.offPeakPrice : input.importPrice };
  const solarCost = kwp > 0 ? (input.solarCost > 0 ? input.solarCost : solarCostFor(kwp)) : 0;
  const batteryCost = battery > 0 ? (input.batteryCost > 0 ? input.batteryCost : batteryCostFor(battery)) : 0;
  const capex = solarCost + batteryCost;
  const baseline = bill(baselineFlows(profiles.load, offPeakHours), prices);
  // The profile was built for input.kwp; this scenario's panels scale it.
  const genScale = input.kwp > 0 ? kwp / input.kwp : 0;
  const power = batteryPower(battery);

  // One year of the system's life: the kit replaced at its start, the panels and battery aged, prices risen.
  let batteryAge = 0;
  const runYear = (y: number) => {
    const age = y - 1;
    let spent = 0;
    if (kwp > 0 && input.inverterYear > 0 && y === input.inverterYear) spent += input.inverterCost;
    if (battery > 0 && input.batteryLife > 0 && y > 1 && age % input.batteryLife === 0) {
      spent += batteryCost;
      batteryAge = 0;
    }
    const scale = genScale * (1 - input.degradation / 100) ** age;
    const capacity = battery * Math.max(1 - BATTERY_FADE * batteryAge, BATTERY_FLOOR);
    const sim = simulateYear(profiles.gen, profiles.load, { capacity, power, offPeakHours, scale }, detail && y === 1);
    const saving = (baseline - bill(sim.flows, prices)) * (1 + input.priceRise / 100) ** age;
    batteryAge++;
    return { sim, saving, spent };
  };

  const years: YearRow[] = [];
  let cumulative = -capex;
  let payback: number | null = null;
  let lifetimeSaving = 0;
  const book = (y: number, saving: number, spent: number) => {
    const before = cumulative;
    cumulative += saving - spent;
    lifetimeSaving += saving;
    if (payback === null && cumulative >= 0) payback = crossing(y - 1, before, saving, spent);
    years.push({ year: y, saving, spent, cumulative });
  };

  const year1 = runYear(1);
  book(1, year1.saving, year1.spent);
  const f = year1.sim.flows;
  const exportIncome = (f.exported * prices.exportPrice) / 100;
  const solarShare = f.solarToBattery + f.gridToBattery > 0 ? f.solarToBattery / (f.solarToBattery + f.gridToBattery) : 0;
  const first: FirstYear = {
    flows: f,
    saving: year1.saving,
    billSaving: year1.saving - exportIncome,
    exportIncome,
    baseline,
    selfUse: f.generated > 0 ? (f.direct + f.solarToBattery) / f.generated : 0,
    selfSufficiency: f.load > 0 ? (f.direct + f.fromBattery * solarShare) / f.load : 0,
  };
  for (let y = 2; y <= HORIZON; y++) {
    const { saving, spent } = runYear(y);
    book(y, saving, spent);
  }

  return {
    kwp,
    battery,
    capex,
    first,
    years,
    payback,
    net: cumulative,
    lifetimeSaving,
    simpleReturn: capex > 0 ? first.saving / capex : 0,
    months: year1.sim.months,
    hourly: year1.sim.hourly,
  };
}

/** Years for a battery to earn back its own cost from what it adds to the panels, its replacements included. */
export function marginalPayback(both: ScenarioResult, panels: ScenarioResult): number | null {
  let cumulative = -(both.capex - panels.capex);
  for (let i = 0; i < both.years.length; i++) {
    const b = both.years[i]!;
    const p = panels.years[i]!;
    const saving = b.saving - p.saving;
    const spent = b.spent - p.spent;
    const before = cumulative;
    cumulative += saving - spent;
    if (cumulative >= 0) return crossing(i, before, saving, spent);
  }
  return null;
}

/* -------------------------------------------------------------- Result -- */

/** Battery sizes the "is a battery worth it" curve is drawn at. */
export const SWEEP_STEP = 1;
export const SWEEP_MAX = 20;

export interface SweepPoint {
  kwh: number;
  /** First-year saving with the panels and this battery, pounds. */
  saving: number;
  /** Rough payback of the whole system, years, from the first year scaled by price rises and ageing. */
  payback: number | null;
}

export interface SolarResult {
  /** kWh a year the panels make, before any ageing. */
  generation: number;
  /** The system as entered. */
  system: ScenarioResult;
  /** The same panels with no battery. */
  panelsOnly: ScenarioResult;
  /** The battery with no panels: only a cheap overnight rate gives it anything to do. */
  batteryOnly: ScenarioResult | null;
  sweep: SweepPoint[];
  /** kg CO₂e a year the panels' generation displaces. */
  co2: number;
  profiles: { gen: Float64Array; load: Float64Array };
}

/** kWh a year the roof would make. */
export function roofGeneration(input: Pick<SolarInput, "kwp" | "place" | "orientation" | "shading">): number {
  const place = SOLAR_PLACES.find((p) => p.id === input.place) ?? SOLAR_PLACES[0];
  return Math.max(input.kwp, 0) * place.yield * ORIENTATION_INFO[input.orientation].factor * SHADING_INFO[input.shading].factor;
}

/** Rough payback from a first-year saving: the saving grows with prices and shrinks with age, kit is replaced on schedule. */
export function approxPayback(input: SolarInput, saving1: number, capex: number, batteryCost: number): number | null {
  let cumulative = -capex;
  for (let y = 1; y <= HORIZON; y++) {
    const age = y - 1;
    const saving = saving1 * (1 + input.priceRise / 100) ** age * (1 - input.degradation / 100) ** age;
    let spent = 0;
    if (input.inverterYear > 0 && y === input.inverterYear) spent += input.inverterCost;
    if (batteryCost > 0 && input.batteryLife > 0 && y > 1 && (y - 1) % input.batteryLife === 0) spent += batteryCost;
    const before = cumulative;
    cumulative += saving - spent;
    if (cumulative >= 0) return crossing(age, before, saving, spent);
  }
  return null;
}

/** The battery size on the curve with the quickest payback: 0 when no battery pays back sooner than the panels alone. */
export function bestSweep(sweep: readonly SweepPoint[]): number {
  let best = sweep[0];
  if (!best) return 0;
  for (const p of sweep) if (p.payback !== null && (best.payback === null || p.payback < best.payback - 1e-9)) best = p;
  return best.kwh;
}

export function calculate(input: SolarInput): SolarResult {
  // No panels means no generation, whatever figure was typed for them.
  const generation = input.kwp > 0 ? (input.generation > 0 ? input.generation : roofGeneration(input)) : 0;
  const profiles = {
    gen: generationProfile(generation, input.place),
    load: loadProfile(input.use, input.pattern),
  };
  const system = runScenario(input, { kwp: input.kwp, battery: input.battery }, profiles, true);
  const panelsOnly = input.battery > 0 ? runScenario(input, { kwp: input.kwp, battery: 0 }, profiles) : system;
  const batteryOnly = input.battery > 0 && input.kwp > 0 ? runScenario(input, { kwp: 0, battery: input.battery }, profiles) : null;

  const sweep: SweepPoint[] = [];
  if (input.kwp > 0) {
    const offPeakHours = input.offPeak ? input.offPeakHours : 0;
    const prices = { importPrice: input.importPrice, exportPrice: input.exportPrice, offPeakPrice: input.offPeak ? input.offPeakPrice : input.importPrice };
    const baseline = bill(baselineFlows(profiles.load, offPeakHours), prices);
    const solarCost = input.solarCost > 0 ? input.solarCost : solarCostFor(input.kwp);
    for (let kwh = 0; kwh <= SWEEP_MAX; kwh += SWEEP_STEP) {
      const sim = simulateYear(profiles.gen, profiles.load, { capacity: kwh, power: batteryPower(kwh), offPeakHours });
      const saving = baseline - bill(sim.flows, prices);
      const batteryCost = kwh > 0 ? batteryCostFor(kwh) : 0;
      sweep.push({ kwh, saving, payback: approxPayback(input, saving, solarCost + batteryCost, batteryCost) });
    }
  }

  return { generation, system, panelsOnly, batteryOnly, sweep, co2: generation * GRID_CO2, profiles };
}

/* ---------------------------------------------------------- Day picker -- */

/**
 * The day of a month to show: the one whose generation is nearest the
 * month's average, among weekdays or weekend days to match the pattern.
 */
export function typicalDay(gen: Float64Array, month: number, weekend: boolean | null): number {
  const start = MONTH_START[month] ?? 0;
  const n = DAYS_IN_MONTH[month] ?? 30;
  const daily = (d: number) => {
    let s = 0;
    for (let h = 0; h < 24; h++) s += gen[d * 24 + h] ?? 0;
    return s;
  };
  let sum = 0;
  for (let d = start; d < start + n; d++) sum += daily(d);
  const mean = sum / n;
  let best = start;
  let bestGap = Infinity;
  for (let d = start; d < start + n; d++) {
    if (weekend !== null && isWeekend(d) !== weekend) continue;
    const gap = Math.abs(daily(d) - mean);
    if (gap < bestGap) {
      bestGap = gap;
      best = d;
    }
  }
  return best;
}
