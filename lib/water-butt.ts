/**
 * Water butts: how much rain a roof sends down its downpipe, how much of it a
 * butt of a given size catches and hands back to the garden, how often it
 * overflows or runs dry, and what that saves on a water meter.
 *
 * Overflow and running dry depend on how rain falls day to day, which no
 * yearly figure can tell. So the engine simulates 30 years of daily rain from
 * each place's monthly averages (how much falls, and on how many days), and
 * runs the butt through every day of them: rain in, overflow out, garden
 * watering out. The weather is seeded from the place, so the same inputs
 * always give the same answer.
 *
 * Lengths are in metres, rain in millimetres (1 mm on 1 m² is 1 litre),
 * water in litres, prices per cubic metre (1,000 L).
 */

import { PLACES, type Place, type PlaceId } from "@/lib/rainfall-data";

export { PLACES, type Place, type PlaceId };

/* --------------------------------------------------------------- Roofs -- */

export const ROOFS = ["tiles", "metal", "felt", "flat", "gravel", "green", "glass"] as const;
export type Roof = (typeof ROOFS)[number];

export interface RoofInfo {
  label: string;
  /** Share of the rain that runs off into the gutter. */
  runoff: number;
  /** Which outline the drawing uses. */
  shape: "pitched" | "flat" | "shed" | "greenhouse";
  hint: string;
}

/**
 * Runoff coefficients from BS 8515 and CIRIA C753 as tabled by Unda (pitched
 * metal 0.95, tiles 0.9, flat 0.8, flat with gravel 0.6, extensive green
 * roof 0.5). The Environment Agency gives tiles 0.8, so tiles may catch a
 * little less. No standard gives glass or shed felt: glass is taken as metal
 * and felt as a smooth flat roof, which is a guess.
 */
export const ROOF_INFO: Record<Roof, RoofInfo> = {
  tiles: { label: "Tiles or slate", runoff: 0.9, shape: "pitched", hint: "A house roof. Some rain soaks into tiles or blows off before it reaches the gutter." },
  metal: { label: "Metal sheet", runoff: 0.95, shape: "pitched", hint: "Profiled metal sheds almost everything: garages, carports, outbuildings." },
  felt: { label: "Shed felt", runoff: 0.8, shape: "shed", hint: "A shed or summerhouse roof. A small roof, so it fills a butt slowly." },
  flat: { label: "Flat, smooth", runoff: 0.8, shape: "flat", hint: "Membrane, rubber or bitumen: extensions and garages. Puddles stay behind and dry off." },
  gravel: { label: "Flat, gravel", runoff: 0.6, shape: "flat", hint: "Gravel holds rain and lets it evaporate, so less reaches the gutter." },
  green: { label: "Green roof", runoff: 0.5, shape: "flat", hint: "A sedum roof drinks about half the rain itself." },
  glass: { label: "Greenhouse", runoff: 0.95, shape: "greenhouse", hint: "Glass or polycarbonate sheds nearly everything, and the butt sits right where the water's needed." },
};

/** Share of what reaches the downpipe that gets through the diverter or filter into the butt. */
export const FILTER_EFFICIENCY = 0.9;

/* -------------------------------------------------------------- Butts -- */

/** Common UK water butt sizes in litres, from slimline to an IBC tote. */
export const BUTT_SIZES = [100, 160, 210, 250, 300, 350, 500, 1000] as const;

/** A capacity as common butts linked together: the biggest size that divides it, four at most. */
export function buttsFor(capacity: number): { size: number; butts: number } {
  for (const size of [...BUTT_SIZES].reverse()) {
    const butts = capacity / size;
    if (Number.isInteger(butts) && butts <= 4) return { size, butts };
  }
  return { size: capacity, butts: 1 };
}

/* -------------------------------------------------------------- Garden -- */

/**
 * How much of a dry summer week's watering each month needs, January first.
 * A rule of thumb (gardens need little from November to February, most in
 * June to August); days with rain need none.
 */
export const SEASON = [0, 0, 0.1, 0.3, 0.6, 0.9, 1, 0.9, 0.5, 0.2, 0, 0] as const;

export interface UsePreset {
  label: string;
  /** Litres in a dry summer week. */
  litres: number;
  hint: string;
}

/** Typical gardens, rough: what a dry summer week takes. */
export const USE_PRESETS: readonly UsePreset[] = [
  { label: "A few pots", litres: 30, hint: "Half a dozen pots and a basket or two." },
  { label: "Pots and baskets", litres: 80, hint: "A patio full of pots, watered most days." },
  { label: "Beds and borders", litres: 150, hint: "Pots plus new or thirsty plants in the borders." },
  { label: "Veg patch", litres: 300, hint: "A veg bed or greenhouse as well as pots." },
];

/** A day with at least this much rain (mm) waters the garden for you. */
export const WET_DAY = 1;

/* -------------------------------------------------------------- Inputs -- */

export interface ButtInput {
  /** Plan size of the roof (as seen from above), metres. */
  length: number;
  width: number;
  /** Downpipes the roof drains into, of which one feeds the butt. */
  downpipes: number;
  roof: Roof;
  place: PlaceId;
  /** mm a year: the place's figure until edited, which scales its months. */
  annual: number;
  /** Litres the garden takes in a dry summer week. */
  use: number;
  /** Litres per butt, and how many are linked together. */
  size: number;
  butts: number;
  /** Per cubic metre, water and sewerage together. 0 when not on a meter. */
  price: number;
}

export const LIMITS = {
  /** m */
  side: { min: 0, max: 100 },
  downpipes: { min: 1, max: 8 },
  /** mm a year */
  annual: { min: 100, max: 5000 },
  /** L a week */
  use: { min: 0, max: 5000 },
  /** L */
  size: { min: 10, max: 30000 },
  butts: { min: 1, max: 10 },
} as const;

/* ------------------------------------------------------------- Weather -- */

export const YEARS = 30;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
export const DAYS = 365;

/** Month (0–11) of each day of a 365-day year. */
export const MONTH_OF_DAY: readonly number[] = DAYS_IN_MONTH.flatMap((n, m) => Array.from({ length: n }, () => m));
/** Day of the year each month starts on. */
export const MONTH_START: readonly number[] = DAYS_IN_MONTH.map((_, m) => DAYS_IN_MONTH.slice(0, m).reduce((a, b) => a + b, 0));

/** A small, fast seeded generator (mulberry32), so the weather repeats exactly. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * How much more likely rain is the day after rain than on any day. UK rain
 * comes in spells; this keeps dry spells from being too short. A rule of
 * thumb, not fitted to station records.
 */
const PERSISTENCE = 0.35;

/**
 * Months vary from year to year: one June is a washout, the next hardly
 * rains. Each month of each simulated year gets a wetness factor averaging 1
 * (an Erlang draw of shape `MONTH_SHAPE`, so about half the time it is
 * within ±40%) that scales how many days it rains. Without it every summer
 * would be average and the butt would hardly ever run dry. Also a rule of
 * thumb: UK monthly rainfall varies by roughly this much.
 */
const MONTH_SHAPE = 3;

/**
 * Daily rain in mm for `YEARS` years of 365 days. Each month rains on its
 * average share of days (rain days of 1 mm or more) times its wetness
 * factor that year, wet days cluster through `PERSISTENCE`, and each wet
 * day's amount is 1 mm plus an exponential share of the rest, so the average
 * month matches the place's average once scaled to `annual`.
 */
export function simulateRain(place: Place, annual: number): Float64Array {
  const next = random(hash(place.id));
  const scale = place.annual > 0 ? annual / place.annual : 1;
  const rain = new Float64Array(YEARS * DAYS);
  let wet = false;
  let factor = 1;
  for (let d = 0; d < rain.length; d++) {
    const m = MONTH_OF_DAY[d % DAYS] ?? 0;
    if (d % DAYS === MONTH_START[m]) {
      let sum = 0;
      for (let k = 0; k < MONTH_SHAPE; k++) sum -= Math.log(1 - next());
      // Rounded, like the rain below, so the server and the browser (whose
      // Math.log can differ in the last digit) build exactly the same weather.
      factor = Math.round((sum / MONTH_SHAPE) * 1000) / 1000;
    }
    const days = DAYS_IN_MONTH[m] ?? 30;
    const p = Math.min(((place.rainDays[m] ?? 0) / days) * factor, 0.95);
    const stay = p + PERSISTENCE * (1 - p);
    const pWet: number = wet ? stay : (p * (1 - stay)) / Math.max(1 - p, 1e-9);
    wet = next() < pWet;
    if (!wet) continue;
    const mean = ((place.monthly[m] ?? 0) * scale) / Math.max(place.rainDays[m] ?? 1, 0.1);
    // To the tenth of a millimetre, as a rain gauge reads.
    rain[d] = Math.round((mean <= 1 ? mean : 1 - (mean - 1) * Math.log(1 - next())) * 10) / 10;
  }
  return rain;
}

/* ---------------------------------------------------------- Simulation -- */

/** Litres a day the roof sends into the butt for each mm of rain. */
export function litresPerMm(input: Pick<ButtInput, "length" | "width" | "downpipes" | "roof">): number {
  const area = Math.max(input.length, 0) * Math.max(input.width, 0);
  return (area / Math.max(Math.round(input.downpipes), 1)) * ROOF_INFO[input.roof].runoff * FILTER_EFFICIENCY;
}

/** Litres the garden asks for each day, before rain lets it off. */
export function dailyNeed(use: number, month: number): number {
  return (Math.max(use, 0) / 7) * (SEASON[month] ?? 0);
}

export interface YearTotals {
  /** Litres that ran into the butt (before overflow). */
  caught: number;
  /** Litres the garden asked for. */
  need: number;
  /** Litres the butt gave the garden. */
  supplied: number;
  overflow: number;
  overflowDays: number;
  /** Days the garden wanted water and the butt couldn't give all of it. */
  dryDays: number;
}

export interface Simulation {
  /** Average year. */
  average: YearTotals;
  /** Per month, average year: litres in, litres needed, litres from the butt, days dry. */
  months: { caught: number; need: number; supplied: number; dryDays: number; overflowDays: number }[];
  /** A typical year day by day: litres in the butt at the end of the day, overflow and dry flags. */
  year: { level: Float64Array; overflow: Uint8Array; dry: Uint8Array; rain: Float64Array; index: number };
}

/**
 * Runs a butt of `capacity` litres through the simulated weather. Each day
 * the rain comes in first, anything over the brim overflows, then the garden
 * takes what it needs on a dry day. It starts full on 1 January, which it
 * would be after a UK winter.
 */
export function simulate(rain: Float64Array, perMm: number, use: number, capacity: number, detail = true): Simulation {
  const cap = Math.max(capacity, 0);
  let level = cap;
  const years: YearTotals[] = [];
  const months = Array.from({ length: 12 }, () => ({ caught: 0, need: 0, supplied: 0, dryDays: 0, overflowDays: 0 }));
  const levels = detail ? new Float64Array(rain.length) : null;
  const overflowFlags = detail ? new Uint8Array(rain.length) : null;
  const dryFlags = detail ? new Uint8Array(rain.length) : null;

  for (let y = 0; y < YEARS; y++) {
    const t: YearTotals = { caught: 0, need: 0, supplied: 0, overflow: 0, overflowDays: 0, dryDays: 0 };
    for (let d = 0; d < DAYS; d++) {
      const i = y * DAYS + d;
      const m = MONTH_OF_DAY[d] ?? 0;
      const mm = rain[i] ?? 0;
      const inflow = mm * perMm;
      level += inflow;
      t.caught += inflow;
      months[m]!.caught += inflow;
      if (level > cap) {
        const spill = level - cap;
        level = cap;
        t.overflow += spill;
        if (spill > 0.5) {
          t.overflowDays++;
          months[m]!.overflowDays++;
          if (overflowFlags) overflowFlags[i] = 1;
        }
      }
      const need = mm >= WET_DAY ? 0 : dailyNeed(use, m);
      if (need > 0) {
        const given = Math.min(level, need);
        level -= given;
        t.need += need;
        t.supplied += given;
        months[m]!.need += need;
        months[m]!.supplied += given;
        if (given < need - 1e-9) {
          t.dryDays++;
          months[m]!.dryDays++;
          if (dryFlags) dryFlags[i] = 1;
        }
      }
      if (levels) levels[i] = level;
    }
    years.push(t);
  }

  const avg = (key: keyof YearTotals) => years.reduce((s, t) => s + t[key], 0) / YEARS;
  const average: YearTotals = {
    caught: avg("caught"),
    need: avg("need"),
    supplied: avg("supplied"),
    overflow: avg("overflow"),
    overflowDays: avg("overflowDays"),
    dryDays: avg("dryDays"),
  };

  // The typical year: the one whose supply is the median, so the day-by-day
  // picture is neither a drought nor a washout.
  const order = years.map((t, y) => ({ y, s: t.supplied + t.caught / 1e6 })).sort((a, b) => a.s - b.s);
  const index = order[Math.floor(YEARS / 2)]?.y ?? 0;
  const start = index * DAYS;
  return {
    average,
    months: months.map((m) => ({
      caught: m.caught / YEARS,
      need: m.need / YEARS,
      supplied: m.supplied / YEARS,
      dryDays: m.dryDays / YEARS,
      overflowDays: m.overflowDays / YEARS,
    })),
    year: {
      level: levels ? levels.slice(start, start + DAYS) : new Float64Array(DAYS),
      overflow: overflowFlags ? overflowFlags.slice(start, start + DAYS) : new Uint8Array(DAYS),
      dry: dryFlags ? dryFlags.slice(start, start + DAYS) : new Uint8Array(DAYS),
      rain: rain.slice(start, start + DAYS),
      index,
    },
  };
}

/* ---------------------------------------------------------- Sizing -- */

/** Capacities the size curve is drawn at, litres. */
export const CURVE_STEP = 50;
export const CURVE_MAX = 2000;

/** Share of what the biggest tank on the curve would give that a recommended size must reach. */
export const ENOUGH = 0.9;

export interface Sizing {
  /** Litres a year from the butt at each capacity on the curve (0, 50, 100 … CURVE_MAX). */
  curve: { capacity: number; supplied: number }[];
  /** Smallest common size (from `BUTT_SIZES`, linked if need be) that gets `ENOUGH` of the curve's best. */
  recommended: number;
  /** True when even the biggest size gets less than `ENOUGH` of the garden's need: the roof is the limit. */
  roofLimited: boolean;
}

export function sizing(rain: Float64Array, perMm: number, use: number): Sizing {
  const curve: Sizing["curve"] = [];
  for (let c = 0; c <= CURVE_MAX; c += CURVE_STEP) curve.push({ capacity: c, supplied: simulate(rain, perMm, use, c, false).average.supplied });
  const best = curve[curve.length - 1]?.supplied ?? 0;
  const supplyAt = (cap: number) => simulate(rain, perMm, use, cap, false).average.supplied;
  const candidates = [...BUTT_SIZES, 1500, 2000];
  const recommended = best <= 0 ? (BUTT_SIZES[0] ?? 100) : (candidates.find((c) => supplyAt(c) >= ENOUGH * best) ?? CURVE_MAX);
  const need = simulate(rain, perMm, use, 0, false).average.need;
  return { curve, recommended, roofLimited: need > 0 && best < ENOUGH * need };
}

/* -------------------------------------------------------------- Result -- */

export interface ButtResult {
  /** m² of roof feeding this downpipe. */
  area: number;
  /** Litres a year the roof sends into the butt, on average. */
  yearly: number;
  capacity: number;
  sim: Simulation;
  sizing: Sizing;
  /** Per year on a water meter. */
  saving: number;
  /** Share of the garden's need the butt covers. */
  covered: number;
}

export function calculate(input: ButtInput): ButtResult {
  const place = PLACES.find((p) => p.id === input.place) ?? PLACES[0]!;
  const rain = simulateRain(place, input.annual);
  const perMm = litresPerMm(input);
  const capacity = Math.max(input.size, 0) * Math.max(Math.round(input.butts), 1);
  const sim = simulate(rain, perMm, input.use, capacity);
  const area = (Math.max(input.length, 0) * Math.max(input.width, 0)) / Math.max(Math.round(input.downpipes), 1);
  return {
    area,
    yearly: input.annual * perMm,
    capacity,
    sim,
    sizing: sizing(rain, perMm, input.use),
    saving: (sim.average.supplied / 1000) * Math.max(input.price, 0),
    covered: sim.average.need > 0 ? sim.average.supplied / sim.average.need : 0,
  };
}
