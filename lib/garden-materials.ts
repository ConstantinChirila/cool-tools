/**
 * Garden materials: how much topsoil, compost, mulch, bark, gravel or sand
 * covers a set of areas to a depth, what it weighs, and the cheapest way to
 * buy it in bags, bulk bags or a mix of both.
 *
 * Lengths are in metres, depths in centimetres, volumes in cubic metres and
 * weights in tonnes. Bag sizes are litres for soils and bark, kilograms for
 * gravel and sand, which is how UK shops label them.
 */

import { fail, ok, type Result } from "@/lib/result";

export const MATERIALS = ["topsoil", "compost", "mulch", "bark", "gravel", "sand"] as const;
export type Material = (typeof MATERIALS)[number];

export type BagUnit = "L" | "kg";

export interface Job {
  id: string;
  label: string;
  /** Usual depth range for the job, in cm. */
  min: number;
  max: number;
  /** Depth a preset sets, in cm. */
  depth: number;
  hint: string;
}

export interface Settings {
  job: string;
  /** cm */
  depth: number;
  /** Bag size, in the material's bag unit. */
  bag: number;
  bagPrice: number;
  /** Bulk bag size, in the material's bag unit. */
  bulk: number;
  bulkPrice: number;
  /** Delivery charged once on any order with a bulk bag. */
  delivery: number;
  /** Extra for waste and settling, as a whole percentage. */
  extra: number;
  /** Tonnes per cubic metre. */
  density: number;
}

export interface MaterialInfo {
  label: string;
  bagUnit: BagUnit;
  bagSizes: readonly number[];
  bulkSizes: readonly number[];
  densityRange: readonly [number, number];
  /** What the default density describes. */
  densityNote: string;
  extraHint: string;
  jobs: readonly Job[];
  defaults: Settings;
}

/**
 * Densities and sizes from UK suppliers (Rolawn, Melcourt, Wickes, B&Q, M P
 * Moran) checked 2026-09-28; depths from the RHS and suppliers where noted.
 * Prices are rough starting points to be replaced with a real quote.
 */
export const MATERIAL_INFO: Record<Material, MaterialInfo> = {
  topsoil: {
    label: "Topsoil",
    bagUnit: "L",
    bagSizes: [20, 25, 30, 40],
    bulkSizes: [500, 750, 1000],
    densityRange: [1.0, 1.5],
    densityNote: "screened and damp",
    extraHint: "Loose topsoil settles by 10–15% once firmed, so 15% extra is usual.",
    jobs: [
      { id: "dressing", label: "Lawn top dressing", min: 1, max: 2.5, depth: 1.5, hint: "A thin layer brushed into the grass." },
      { id: "lawn", label: "New lawn", min: 10, max: 15, depth: 12.5, hint: "The RHS says at least 10 cm under new turf or seed." },
      { id: "border", label: "New bed or border", min: 20, max: 30, depth: 25, hint: "The RHS suggests about 20 cm or more for beds and borders." },
      { id: "raised", label: "Raised bed", min: 30, max: 45, depth: 30, hint: "Fill to the height of the bed, less any compost you'll mix in." },
    ],
    defaults: { job: "border", depth: 25, bag: 25, bagPrice: 3.5, bulk: 750, bulkPrice: 95, delivery: 0, extra: 15, density: 1.3 },
  },
  compost: {
    label: "Compost",
    bagUnit: "L",
    bagSizes: [40, 50, 60, 70, 100],
    bulkSizes: [500, 750, 1000],
    densityRange: [0.4, 1.1],
    densityNote: "damp soil improver; bagged potting compost is lighter",
    extraHint: "Compost shrinks a little as it breaks down: 10% is plenty.",
    jobs: [
      { id: "clay", label: "Improve clay soil", min: 7.5, max: 7.5, depth: 7.5, hint: "Spread 7.5 cm on clay, then dig it in to about 20 cm (Rolawn)." },
      { id: "chalk", label: "Improve chalky soil", min: 5, max: 5, depth: 5, hint: "Spread 5 cm on chalk, then dig it in to about 20 cm (Rolawn)." },
      { id: "sandy", label: "Improve sandy soil", min: 3, max: 3, depth: 3, hint: "Spread 3 cm on sandy soil, then dig it in to about 20 cm (Rolawn)." },
    ],
    defaults: { job: "clay", depth: 7.5, bag: 50, bagPrice: 6, bulk: 500, bulkPrice: 100, delivery: 0, extra: 10, density: 0.7 },
  },
  mulch: {
    label: "Mulch",
    bagUnit: "L",
    bagSizes: [50, 60, 70, 100],
    bulkSizes: [500, 750, 1000],
    densityRange: [0.4, 0.75],
    densityNote: "composted green waste",
    extraHint: "10% covers what settles and what ends up on the path.",
    jobs: [
      { id: "beds", label: "Beds and borders", min: 5, max: 7.5, depth: 7.5, hint: "The RHS says at least 5 cm, ideally 7.5 cm, to keep weeds down." },
      { id: "topup", label: "Top up old mulch", min: 2.5, max: 5, depth: 2.5, hint: "Bring last year's layer back up to 5–7.5 cm." },
    ],
    defaults: { job: "beds", depth: 7.5, bag: 60, bagPrice: 5, bulk: 750, bulkPrice: 85, delivery: 0, extra: 10, density: 0.6 },
  },
  bark: {
    label: "Bark",
    bagUnit: "L",
    bagSizes: [50, 60, 70, 75, 80, 100],
    bulkSizes: [500, 600, 750, 1000],
    densityRange: [0.2, 0.35],
    densityNote: "ornamental bark chips",
    extraHint: "Bark settles by 5–10% (Melcourt), so 10% extra is usual.",
    jobs: [
      { id: "beds", label: "Beds and borders", min: 5, max: 10, depth: 7.5, hint: "Melcourt suggests 5–10 cm on beds and borders." },
      { id: "path", label: "Woodland path", min: 5, max: 10, depth: 7.5, hint: "Top up once a year as it breaks down underfoot." },
      { id: "play", label: "Play area", min: 30, max: 30, depth: 30, hint: "Play-grade bark tested to BS EN 1177 is usually laid 30 cm deep for falls up to 3 m. Check the product's rating." },
    ],
    defaults: { job: "beds", depth: 7.5, bag: 60, bagPrice: 6, bulk: 1000, bulkPrice: 110, delivery: 0, extra: 10, density: 0.25 },
  },
  gravel: {
    label: "Gravel",
    bagUnit: "kg",
    bagSizes: [20, 22.5, 25],
    bulkSizes: [800, 850, 1000],
    densityRange: [1.5, 1.8],
    densityNote: "10–20 mm gravel or shingle",
    extraHint: "Gravel doesn't settle much: 5% covers spills and uneven ground.",
    jobs: [
      { id: "path", label: "Path", min: 2.5, max: 4, depth: 3.5, hint: "Thin enough to walk on without sinking in." },
      { id: "border", label: "Decorative border", min: 3, max: 5, depth: 4, hint: "Over a weed membrane, deep enough to hide it." },
      { id: "drive", label: "Driveway", min: 5, max: 7.5, depth: 5, hint: "The top layer only, over 10–15 cm of compacted MOT Type 1." },
    ],
    defaults: { job: "border", depth: 4, bag: 22.5, bagPrice: 4.1, bulk: 800, bulkPrice: 75, delivery: 0, extra: 5, density: 1.6 },
  },
  sand: {
    label: "Sand",
    bagUnit: "kg",
    bagSizes: [20, 22.5, 25],
    bulkSizes: [800, 850, 1000],
    densityRange: [1.5, 1.8],
    densityNote: "sharp or building sand",
    extraHint: "5% covers spills. Sand compacts, but bedding depths are quoted loose.",
    jobs: [
      { id: "patio", label: "Patio bedding", min: 2.5, max: 5, depth: 4, hint: "Loose sharp sand under slabs or block paving, before compacting." },
      { id: "sandpit", label: "Sandpit", min: 15, max: 30, depth: 20, hint: "Deep enough to dig in, shallow enough to stay dry. Use washed play sand." },
    ],
    defaults: { job: "patio", depth: 4, bag: 22.5, bagPrice: 3.5, bulk: 800, bulkPrice: 75, delivery: 0, extra: 5, density: 1.6 },
  },
};

export function jobFor(material: Material, id: string): Job {
  const { jobs } = MATERIAL_INFO[material];
  return jobs.find((j) => j.id === id) ?? jobs[0]!;
}

/* ---------------------------------------------------------------- Areas -- */

export type Shape = "rect" | "circle" | "known";

export interface Area {
  shape: Shape;
  /** Rectangle length, or circle diameter, in metres. */
  a: number;
  /** Rectangle width in metres; the size in m² for a known area. */
  b: number;
  /** Subtracted from the total: a pond, patio or shed base. */
  cut: boolean;
}

export const MAX_AREAS = 8;
/** Largest length or area accepted from the URL. */
export const MAX_DIMENSION = 10_000;

export function areaOf({ shape, a, b }: Area): number {
  if (shape === "rect") return a * b;
  if (shape === "circle") return (Math.PI * a * a) / 4;
  return b;
}

export interface AreaTotal {
  /** m² being covered, after cut-outs; never below zero. */
  net: number;
  added: number;
  cut: number;
}

export function totalArea(areas: readonly Area[]): AreaTotal {
  let added = 0;
  let cut = 0;
  for (const area of areas) {
    if (area.cut) cut += areaOf(area);
    else added += areaOf(area);
  }
  return { net: Math.max(0, added - cut), added, cut };
}

const num = (n: number) => String(Number(n.toFixed(3)));

/**
 * Areas as a short URL-safe string: `r5x3_c2.4_k12_-r1x1` is a 5 × 3 m
 * rectangle, a 2.4 m circle, 12 m² and a 1 × 1 m cut-out.
 */
export function encodeAreas(areas: readonly Area[]): string {
  return areas
    .map(({ shape, a, b, cut }) => {
      const body = shape === "rect" ? `r${num(a)}x${num(b)}` : shape === "circle" ? `c${num(a)}` : `k${num(b)}`;
      return cut ? `-${body}` : body;
    })
    .join("_");
}

/** The reverse of `encodeAreas`. */
export function parseAreas(raw: string): Result<Area[]> {
  const parts = raw.split("_");
  if (parts.length > MAX_AREAS) return fail(`At most ${MAX_AREAS} areas`);
  const areas: Area[] = [];
  for (const part of parts) {
    const match = /^(-?)(?:r([\d.]+)x([\d.]+)|c([\d.]+)|k([\d.]+))$/.exec(part);
    if (!match) return fail(`Not an area: ${part}`);
    const [, minus, rl, rw, cd, ka] = match;
    const size = (s: string | undefined) => {
      const n = Number(s);
      return Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_DIMENSION) : 0;
    };
    const cut = minus === "-";
    if (rl !== undefined) areas.push({ shape: "rect", a: size(rl), b: size(rw), cut });
    else if (cd !== undefined) areas.push({ shape: "circle", a: size(cd), b: 0, cut });
    else areas.push({ shape: "known", a: 0, b: size(ka), cut });
  }
  return ok(areas);
}

/* ------------------------------------------------------------- Buying -- */

/** Cubic metres in one bag or bulk bag, whether it is sold by litres or by weight. */
export function unitVolume(size: number, unit: BagUnit, density: number): number {
  if (unit === "L") return size / 1000;
  return density > 0 ? size / 1000 / density : 0;
}

export interface Plan {
  bags: number;
  bulk: number;
  /** Null when a price it needs is missing. */
  cost: number | null;
  /** m³ bought beyond what is needed. */
  spare: number;
}

/** How many units cover `volume`, forgiving float dust so 1.5 / 0.75 is 2, not 3. */
function unitsFor(volume: number, each: number): number {
  if (volume <= 1e-9) return 0;
  if (each <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil(volume / each - 1e-9);
}

export interface BuyOptions {
  bagsOnly: Plan;
  bulkOnly: Plan;
  /** Bulk bags topped up with bags, when that beats both. */
  mix: Plan | null;
  /** The cheapest priced plan (fewest items on a tie), or null if nothing is priced. */
  best: Plan | null;
}

export function buyOptions(volume: number, s: Settings, unit: BagUnit): BuyOptions {
  const bagVol = unitVolume(s.bag, unit, s.density);
  const bulkVol = unitVolume(s.bulk, unit, s.density);

  const plan = (bulk: number): Plan => {
    const bags = unitsFor(volume - bulk * bulkVol, bagVol);
    const priced = (bags === 0 || s.bagPrice > 0) && (bulk === 0 || s.bulkPrice > 0) && Number.isFinite(bags);
    const cost = priced ? bags * s.bagPrice + bulk * s.bulkPrice + (bulk > 0 ? s.delivery : 0) : null;
    return { bags, bulk, cost, spare: Math.max(0, bags * bagVol + bulk * bulkVol - volume) };
  };

  const bagsOnly = plan(0);
  const maxBulk = unitsFor(volume, bulkVol);
  const bulkOnly = Number.isFinite(maxBulk) ? plan(maxBulk) : { bags: 0, bulk: 0, cost: null, spare: 0 };

  let mix: Plan | null = null;
  for (let n = 1; n < maxBulk && Number.isFinite(maxBulk); n++) {
    const p = plan(n);
    if (p.bags > 0 && cheaper(p, mix)) mix = p;
  }
  if (mix && !(cheaper(mix, bagsOnly) && cheaper(mix, bulkOnly))) mix = null;

  const best = [bagsOnly, bulkOnly, mix].reduce<Plan | null>((acc, p) => (p && p.cost !== null && cheaper(p, acc) ? p : acc), null);
  return { bagsOnly, bulkOnly, mix, best };
}

/** Cheaper on price, or as cheap with fewer things to carry. Unpriced plans never win. */
function cheaper(p: Plan, than: Plan | null): boolean {
  if (p.cost === null) return false;
  if (!than || than.cost === null) return true;
  if (Math.abs(p.cost - than.cost) > 0.005) return p.cost < than.cost;
  return p.bags + p.bulk < than.bags + than.bulk;
}

/* ------------------------------------------------------------ Results -- */

/** A 90 L builder's barrow, rated for about 140 kg. */
export const BARROW = { litres: 90, kg: 140 } as const;

export interface GardenResult {
  area: AreaTotal;
  /** m³ to cover the area at the depth, before the extra. */
  exact: number;
  /** m³ to buy, including the extra. */
  volume: number;
  /** tonnes */
  weight: number;
  barrowLoads: number;
  options: BuyOptions;
}

export function calculate(areas: readonly Area[], material: Material, s: Settings): GardenResult {
  const area = totalArea(areas);
  const exact = area.net * (s.depth / 100);
  const volume = exact * (1 + s.extra / 100);
  const weight = volume * s.density;
  const barrowLoads = volume > 0 ? Math.ceil(Math.max((volume * 1000) / BARROW.litres, (weight * 1000) / BARROW.kg) - 1e-9) : 0;
  return { area, exact, volume, weight, barrowLoads, options: buyOptions(volume, s, MATERIAL_INFO[material].bagUnit) };
}
