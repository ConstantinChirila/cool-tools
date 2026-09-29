/**
 * Lawns: seed or turf for a new lawn, or seed for overseeding an old one,
 * plus the topsoil or top dressing, starter feed and water to get it going,
 * and what the whole job costs.
 *
 * Areas are in square metres (the garden materials area list, cut-outs
 * taken off). Seed and feed are in grams per m² and kilograms, soil depths
 * in centimetres, volumes in cubic metres, water in litres.
 */

import {
  LIMITS as GARDEN_LIMITS,
  MATERIAL_INFO,
  barrowLoads,
  buyOptions,
  totalArea,
  type Area,
  type AreaTotal,
  type BuyOptions,
  type Buying,
  type Plan,
} from "@/lib/garden-materials";

export const PROJECTS = ["seed", "turf", "overseed"] as const;
export type Project = (typeof PROJECTS)[number];

export interface ProjectInfo {
  label: string;
  hint: string;
}

export const PROJECT_INFO: Record<Project, ProjectInfo> = {
  seed: { label: "New lawn from seed", hint: "Cheapest, but takes a couple of months to fill in and most of a year to use hard." },
  turf: { label: "New lawn from turf", hint: "A lawn the same day, walkable in two weeks, for several times the price of seed." },
  overseed: { label: "Overseed a lawn", hint: "Thicken up a thin or patchy lawn: scarify, sow, top dress and water." },
};

/* ---------------------------------------------------------------- Seed -- */

export interface Seed {
  /** g/m² for a new lawn. */
  newRate: number;
  /** g/m² when overseeding. */
  overRate: number;
  /** Sow half as much again where birds take the seed. */
  birds: boolean;
  /** Pack sizes in kg, and their prices. */
  small: number;
  smallPrice: number;
  big: number;
  bigPrice: number;
}

/** Extra seed where birds are a problem: the RHS suggests half as much again. */
export const BIRD_EXTRA = 0.5;

/**
 * Johnsons (DLF) sow new lawns at 35 g/m² and overseed at 25 g/m²; the RHS
 * patches at 15–25 g/m². Pack sizes are common UK ones; prices are rough
 * 2026 figures (B&Q had 1.6 kg of Gro-Sure for £20).
 */
export const SEED_DEFAULTS: Seed = { newRate: 35, overRate: 25, birds: false, small: 1.5, smallPrice: 18, big: 10, bigPrice: 75 };
export const SEED_PACKS = { small: [0.5, 1, 1.5, 2], big: [5, 10, 20] } as const;

export function seedRate(project: Project, seed: Seed): number {
  const base = project === "overseed" ? seed.overRate : seed.newRate;
  return base * (seed.birds ? 1 + BIRD_EXTRA : 1);
}

/**
 * The cheapest mix of small and big packs for `kg` of seed. Packs are the
 * bags and bulk bags of the garden materials solver, sold by weight: at a
 * density of 1 t/m³, a kilogram is a litre, so the volumes line up.
 */
export function seedPacks(kg: number, seed: Seed): BuyOptions {
  return buyOptions(kg / 1000, { bag: seed.small, bagPrice: seed.smallPrice, bulk: seed.big, bulkPrice: seed.bigPrice, delivery: 0, density: 1 }, "kg");
}

/* ---------------------------------------------------------------- Turf -- */

export interface Turf {
  /** m² per roll. */
  roll: number;
  /** Per roll. */
  price: number;
  /** Whole % extra for cutting round edges. */
  extra: number;
  /** Charged once per order. */
  delivery: number;
}

/**
 * A standard UK roll is 1.64 × 0.61 m, 1 m² (Rolawn, Turfonline,
 * Harrowden). Rolawn adds 5% for cutting and shaping, 5–10% on awkward
 * shapes. About £5/m² delivered on orders of 40 m² or more (Rolawn
 * Medallion, B&Q Harrowden, 2026); small orders cost more per m².
 */
export const TURF_DEFAULTS: Turf = { roll: 1, price: 5, extra: 5, delivery: 0 };

/* ---------------------------------------------------------------- Soil -- */

/** Topsoil spread under a new lawn. */
export interface Topsoil extends Buying {
  /** cm */
  depth: number;
  /** Whole % extra for settling. */
  extra: number;
}

/** Rolawn wants at least 10 cm of good soil under turf, ideally 15. Buying figures are the garden calculator's topsoil. */
export const TOPSOIL_DEFAULTS: Topsoil = (({ bag, bagPrice, bulk, bulkPrice, delivery, density, extra }) => ({ bag, bagPrice, bulk, bulkPrice, delivery, density, extra, depth: 10 }))(
  MATERIAL_INFO.topsoil.defaults,
);

/** Top dressing brushed in after overseeding, sold by weight. */
export interface Dressing extends Buying {
  /** kg/m² */
  rate: number;
}

/**
 * The RHS top dresses at 2–3 kg/m², "about a shovelful", of sandy loam,
 * sharp sand and compost: about 2 mm. Bags are commonly 20–25 kg. The
 * density (for the volume) and the prices are rough.
 */
export const DRESSING_DEFAULTS: Dressing = { rate: 2.5, bag: 25, bagPrice: 7, bulk: 850, bulkPrice: 120, delivery: 0, density: 1.5 };
export const DRESSING_SIZES = { bag: [20, 25], bulk: [800, 850, 1000] } as const;

/* ---------------------------------------------------------------- Feed -- */

export interface Feed {
  /** g/m² */
  rate: number;
  /** kg per pack. */
  pack: number;
  price: number;
}

/**
 * A lawn starter (pre-seed or pre-turf) feed at 40 g/m², as for Rolawn
 * GroRight: £33.99 for 2 kg in 2026. The RHS gives about 35 g/m² for a
 * pre-turf feed. Johnsons feeds the day it overseeds.
 */
export const FEED_DEFAULTS: Feed = { rate: 40, pack: 2, price: 34 };
export const FEED_PACKS = [1, 1.5, 2, 5] as const;

/* --------------------------------------------------------------- Water -- */

export interface Water {
  /** Per cubic metre (1,000 L), water and sewerage together. */
  price: number;
}

/**
 * Thames Water charges £4.21/m³ and United Utilities £5.51/m³ for water
 * and sewerage together in 2026/27. Sewerage is charged on garden water too.
 */
export const WATER_DEFAULTS: Water = { price: 4.5 };

export interface WateringSpell {
  /** Weeks after sowing or laying, inclusive. */
  from: number;
  to: number;
  perWeek: number;
  /** L/m² each time: 1 L/m² is 1 mm of rain. */
  litres: number;
}

/**
 * How much to water until the lawn roots, in dry weather. Growers give how
 * often but not how much (Rolawn: daily for two weeks, then less; Lindum:
 * twice a day for a week, then 2–3 times a week; Johnsons: keep the seed bed
 * moist). The litres are a rule of thumb.
 */
export const WATERING: Record<Project, readonly WateringSpell[]> = {
  turf: [
    { from: 1, to: 2, perWeek: 7, litres: 10 },
    { from: 3, to: 4, perWeek: 3, litres: 10 },
  ],
  seed: [
    { from: 1, to: 2, perWeek: 7, litres: 5 },
    { from: 3, to: 6, perWeek: 2, litres: 10 },
  ],
  overseed: [
    { from: 1, to: 2, perWeek: 7, litres: 5 },
    { from: 3, to: 4, perWeek: 2, litres: 10 },
  ],
};

/* -------------------------------------------------------------- Limits -- */

export const LIMITS = {
  /** g/m² */
  seedRate: { min: 1, max: 200 },
  /** kg */
  seedPack: { min: 0.1, max: 50 },
  /** m² */
  roll: { min: 0.1, max: 50 },
  /** % */
  extra: { min: 0, max: 100 },
  /** cm */
  depth: { min: 0, max: 50 },
  /** kg/m² */
  dressingRate: { min: 0, max: 20 },
  /** g/m² */
  feedRate: { min: 0, max: 500 },
  /** kg */
  feedPack: { min: 0.1, max: 50 },
  /** Bag sizes, L or kg. */
  size: GARDEN_LIMITS.size,
  /** t/m³ */
  density: GARDEN_LIMITS.density,
} as const;

/* ------------------------------------------------------------ Results -- */

export interface SeedResult {
  /** g/m², with any extra for birds. */
  rate: number;
  kg: number;
  options: BuyOptions;
}

export interface TurfResult {
  /** m² to order, with the extra. */
  m2: number;
  rolls: number;
  cost: number;
}

export interface SoilResult {
  kind: "topsoil" | "dressing";
  /** m³ to buy. */
  volume: number;
  /** tonnes */
  weight: number;
  barrowLoads: number;
  options: BuyOptions;
}

export interface FeedResult {
  kg: number;
  packs: number;
  cost: number;
}

export interface WaterResult {
  litres: number;
  /** Times you water over the whole spell. */
  waterings: number;
  weeks: number;
  cost: number;
  spells: readonly WateringSpell[];
}

export interface LawnResult {
  area: AreaTotal;
  seed: SeedResult | null;
  turf: TurfResult | null;
  soil: SoilResult | null;
  feed: FeedResult | null;
  water: WaterResult | null;
  cost: {
    grass: number;
    soil: number;
    feed: number;
    water: number;
    total: number;
    /** Parts with no priced way to buy them. */
    unpriced: ("seed" | "soil")[];
  };
}

export interface LawnInput {
  areas: readonly Area[];
  project: Project;
  seed: Seed;
  turf: Turf;
  topsoil: Topsoil;
  dressing: Dressing;
  feed: Feed;
  water: Water;
  /** Which extras to include: topsoil under a new lawn, top dressing over an overseeded one. */
  include: { topsoil: boolean; dressing: boolean; feed: boolean; water: boolean };
}

const ceil = (n: number) => (n > 1e-9 ? Math.ceil(n - 1e-9) : 0);

export function calculateTurf(m2: number, t: Turf): TurfResult {
  const need = m2 * (1 + t.extra / 100);
  const rolls = t.roll > 0 ? ceil(need / t.roll) : 0;
  return { m2: need, rolls, cost: rolls * t.price + (rolls > 0 ? t.delivery : 0) };
}

export function calculateSoil(m2: number, project: Project, topsoil: Topsoil, dressing: Dressing): SoilResult {
  if (project === "overseed") {
    const tonnes = (m2 * dressing.rate) / 1000;
    const volume = dressing.density > 0 ? tonnes / dressing.density : 0;
    return { kind: "dressing", volume, weight: tonnes, barrowLoads: barrowLoads(volume, tonnes), options: buyOptions(volume, dressing, "kg") };
  }
  const volume = m2 * (topsoil.depth / 100) * (1 + topsoil.extra / 100);
  const weight = volume * topsoil.density;
  return { kind: "topsoil", volume, weight, barrowLoads: barrowLoads(volume, weight), options: buyOptions(volume, topsoil, "L") };
}

export function calculateFeed(m2: number, f: Feed): FeedResult {
  const kg = (m2 * f.rate) / 1000;
  const packs = f.pack > 0 ? ceil(kg / f.pack) : 0;
  return { kg, packs, cost: packs * f.price };
}

export function calculateWater(m2: number, project: Project, w: Water): WaterResult {
  const spells = WATERING[project];
  let perM2 = 0;
  let waterings = 0;
  for (const s of spells) {
    const times = (s.to - s.from + 1) * s.perWeek;
    waterings += times;
    perM2 += times * s.litres;
  }
  const litres = m2 * perM2;
  return { litres, waterings, weeks: Math.max(...spells.map((s) => s.to)), cost: (litres / 1000) * w.price, spells };
}

export function calculate({ areas, project, seed, turf, topsoil, dressing, feed, water, include }: LawnInput): LawnResult {
  const area = totalArea(areas);
  const m2 = area.net;

  let seedResult: SeedResult | null = null;
  let turfResult: TurfResult | null = null;
  if (project === "turf") {
    turfResult = calculateTurf(m2, turf);
  } else {
    const rate = seedRate(project, seed);
    const kg = (m2 * rate) / 1000;
    seedResult = { rate, kg, options: seedPacks(kg, seed) };
  }
  const soil = (project === "overseed" ? include.dressing : include.topsoil) ? calculateSoil(m2, project, topsoil, dressing) : null;
  const feedResult = include.feed ? calculateFeed(m2, feed) : null;
  const waterResult = include.water ? calculateWater(m2, project, water) : null;

  const unpriced: LawnResult["cost"]["unpriced"] = [];
  if (seedResult && seedResult.kg > 0 && seedResult.options.best === null) unpriced.push("seed");
  if (soil && soil.volume > 0 && soil.options.best === null) unpriced.push("soil");

  const grass = turfResult?.cost ?? seedResult?.options.best?.cost ?? 0;
  const soilCost = soil?.options.best?.cost ?? 0;
  const feedCost = feedResult?.cost ?? 0;
  const waterCost = waterResult?.cost ?? 0;
  return {
    area,
    seed: seedResult,
    turf: turfResult,
    soil,
    feed: feedResult,
    water: waterResult,
    cost: { grass, soil: soilCost, feed: feedCost, water: waterCost, total: grass + soilCost + feedCost + waterCost, unpriced },
  };
}

/** The plan to show when nothing is priced: the fewest packs or bags. */
export function planOrFallback(options: BuyOptions): Plan {
  return options.best ?? options.bulkOnly;
}
