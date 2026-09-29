/**
 * Raised beds: how much soil mix fills them, how much of each ingredient to
 * buy and in what bags, how many boards and posts build them, and what it
 * all costs.
 *
 * Bed sizes are internal, in metres, with the fill depth in centimetres.
 * Timber is in millimetres for board sections and metres for lengths, which
 * is how UK merchants sell it. Volumes are cubic metres, weights tonnes.
 */

import { MATERIAL_INFO, barrowLoads, buyOptions, type BuyOptions, type Buying } from "@/lib/garden-materials";

/* --------------------------------------------------------- Ingredients -- */

export const INGREDIENTS = ["topsoil", "compost", "manure"] as const;
export type Ingredient = (typeof INGREDIENTS)[number];

/** Whole percentages. They needn't add up to 100: they're used as parts. */
export type Mix = Record<Ingredient, number>;

export interface IngredientInfo {
  label: string;
  bagSizes: readonly number[];
  bulkSizes: readonly number[];
  densityNote: string;
  defaults: Buying;
}

const buying = ({ bag, bagPrice, bulk, bulkPrice, delivery, density }: Buying): Buying => ({ bag, bagPrice, bulk, bulkPrice, delivery, density });

/**
 * Topsoil and compost share the garden materials calculator's figures. Manure
 * bags are commonly 50 L and bulk bags 600 to 1,000 L (UK suppliers checked
 * 2026-09-29); its density is a rough figure for damp, well-rotted manure.
 * All bags are sold by the litre.
 */
export const INGREDIENT_INFO: Record<Ingredient, IngredientInfo> = {
  topsoil: {
    label: "Topsoil",
    bagSizes: MATERIAL_INFO.topsoil.bagSizes,
    bulkSizes: MATERIAL_INFO.topsoil.bulkSizes,
    densityNote: MATERIAL_INFO.topsoil.densityNote,
    defaults: buying(MATERIAL_INFO.topsoil.defaults),
  },
  compost: {
    label: "Compost",
    bagSizes: MATERIAL_INFO.compost.bagSizes,
    bulkSizes: MATERIAL_INFO.compost.bulkSizes,
    densityNote: MATERIAL_INFO.compost.densityNote,
    defaults: buying(MATERIAL_INFO.compost.defaults),
  },
  manure: {
    label: "Manure",
    bagSizes: [40, 50, 60],
    bulkSizes: [600, 750, 1000],
    densityNote: "damp, well-rotted farmyard manure",
    defaults: { bag: 50, bagPrice: 6, bulk: 750, bulkPrice: 90, delivery: 0, density: 0.7 },
  },
};

export interface MixPreset {
  id: string;
  label: string;
  mix: Mix;
  hint: string;
}

export const MIX_PRESETS: readonly MixPreset[] = [
  {
    id: "classic",
    label: "Classic",
    mix: { topsoil: 50, compost: 30, manure: 20 },
    hint: "Topsoil for body, compost and manure for food. A good all-round veg bed.",
  },
  {
    id: "topsoil-compost",
    label: "Topsoil and compost",
    mix: { topsoil: 60, compost: 40, manure: 0 },
    hint: "Simpler to buy, and fine for flowers, herbs and most veg.",
  },
  {
    id: "no-dig",
    label: "All compost",
    mix: { topsoil: 0, compost: 100, manure: 0 },
    hint: "How no-dig growers fill beds. Lighter and richer, but it sinks more as it breaks down.",
  },
];

export function presetFor(mix: Mix): MixPreset | undefined {
  return MIX_PRESETS.find((p) => INGREDIENTS.every((i) => p.mix[i] === mix[i]));
}

/** Each ingredient's share of the mix, 0 to 1, summing to 1 (all zero when the mix is empty). */
export function shares(mix: Mix): Mix {
  const total = INGREDIENTS.reduce((sum, i) => sum + Math.max(0, mix[i]), 0);
  const share = (i: Ingredient) => (total > 0 ? Math.max(0, mix[i]) / total : 0);
  return { topsoil: share("topsoil"), compost: share("compost"), manure: share("manure") };
}

/* -------------------------------------------------------------- Timber -- */

export const TIMBERS = ["scaffold", "sleeper", "decking", "none"] as const;
export type TimberKind = (typeof TIMBERS)[number];

export interface Timber {
  kind: TimberKind;
  /** Board face height, mm. */
  height: number;
  /** Board thickness, mm. */
  thickness: number;
  /** Length boards are sold in, m. */
  length: number;
  price: number;
  /** Posts inside the corners and along long sides, cut from 2.4 m lengths. */
  posts: boolean;
  postPrice: number;
}

export interface TimberInfo {
  label: string;
  lengths: readonly number[];
  hint: string;
  defaults: Omit<Timber, "kind" | "postPrice">;
}

/**
 * Standard UK sections: BS 2482 scaffold boards are 225 × 38 mm and up to
 * 3.9 m long; new softwood sleepers 200 × 100 mm × 2.4 m; decking boards
 * 144 × 28 mm. Prices are rough 2026 figures.
 */
export const TIMBER_INFO: Record<Exclude<TimberKind, "none">, TimberInfo> = {
  scaffold: {
    label: "Scaffold boards",
    lengths: [2.4, 3, 3.9],
    hint: "Thick and cheap. Screw them to corner posts.",
    defaults: { height: 225, thickness: 38, length: 3.9, price: 22, posts: true },
  },
  sleeper: {
    label: "Sleepers",
    lengths: [1.2, 2.4],
    hint: "Heavy enough to stack without posts. Fix each layer to the one below with long timber screws.",
    defaults: { height: 200, thickness: 100, length: 2.4, price: 30, posts: false },
  },
  decking: {
    label: "Decking boards",
    lengths: [2.4, 3.6, 4.8],
    hint: "Light, easy to cut and sold in long lengths. Screw them to corner posts.",
    defaults: { height: 144, thickness: 28, length: 3.6, price: 12, posts: true },
  },
};

export const DEFAULT_POST_PRICE = 6;
/** Treated 47 × 50 mm posts are sold in 2.4 m lengths. */
export const POST_STOCK = 2.4;
/** Longest run of board between two posts, m. A rule of thumb, not a standard. */
export const POST_SPACING = 1.5;
/** Width of a saw cut, m. */
export const KERF = 0.003;

export function timberFor(kind: TimberKind, postPrice = DEFAULT_POST_PRICE): Timber {
  const d = kind === "none" ? TIMBER_INFO.scaffold.defaults : TIMBER_INFO[kind].defaults;
  return { kind, ...d, postPrice };
}

export interface Board {
  /** Piece lengths cut from this board, m, longest first. */
  cuts: number[];
  /** What's left, m. */
  offcut: number;
}

/**
 * Pieces cut from stock lengths, first fit decreasing: each piece goes in
 * the first board with room for it and a saw cut. Close to the fewest boards
 * for the handful of pieces a bed needs.
 */
export function cutList(pieces: readonly number[], stock: number): Board[] {
  const boards: Board[] = [];
  for (const piece of [...pieces].sort((a, b) => b - a)) {
    if (piece <= 0) continue;
    const board = boards.find((b) => b.offcut + 1e-9 >= piece + KERF);
    if (board) {
      board.cuts.push(piece);
      board.offcut -= piece + KERF;
    } else {
      boards.push({ cuts: [piece], offcut: stock - piece });
    }
  }
  for (const b of boards) b.offcut = Math.max(0, b.offcut);
  return boards;
}

/** A side longer than a board, split into equal pieces that join over a post. */
function split(length: number, stock: number): number[] {
  const n = Math.max(1, Math.ceil(length / stock - 1e-9));
  return Array.from({ length: n }, () => length / n);
}

export interface Bed {
  /** Internal length and width, m. */
  length: number;
  width: number;
  /** Fill depth, cm. */
  depth: number;
  count: number;
}

export const LIMITS = {
  /** m */
  side: { min: 0.1, max: 20 },
  /** cm */
  depth: { min: 1, max: 150 },
  count: { min: 1, max: 50 },
  /** mm */
  boardHeight: { min: 20, max: 500 },
  boardThickness: { min: 10, max: 300 },
  /** m */
  boardLength: { min: 0.5, max: 6 },
  /** % */
  extra: { min: 0, max: 100 },
  /** t/m³ */
  density: { min: 0.05, max: 3 },
  /** L */
  size: { min: 1, max: 5000 },
} as const;

export interface TimberResult {
  /** Rows of boards to reach the fill depth. */
  courses: number;
  /** Height the boards stand, mm. */
  height: number;
  /** Outside footprint, m. */
  outside: { length: number; width: number };
  /** Every board bought, across all beds. */
  boards: Board[];
  posts: { count: number; each: number; stock: Board[] };
  /** Whether a side is longer than a board, so it joins. */
  joins: boolean;
  cost: number;
  /** Boards alone, for the breakdown. */
  boardCost: number;
  postCost: number;
}

export function calculateTimber(bed: Bed, t: Timber): TimberResult | null {
  if (t.kind === "none" || bed.length <= 0 || bed.width <= 0 || bed.depth <= 0 || t.height <= 0 || t.length <= 0) return null;
  const courses = Math.max(1, Math.ceil((bed.depth * 10) / t.height - 1e-9));
  const thick = t.thickness / 1000;

  // One pair of sides overlaps the ends of the other. Try it both ways round and keep the one using fewer boards.
  const layout = (over: number, under: number) => {
    const course = [...split(over + 2 * thick, t.length), ...split(over + 2 * thick, t.length), ...split(under, t.length), ...split(under, t.length)];
    const pieces = Array.from({ length: courses * bed.count }, () => course).flat();
    return { boards: cutList(pieces, t.length), joins: Math.max(over + 2 * thick, under) > t.length + 1e-9 };
  };
  const a = layout(bed.length, bed.width);
  const b = layout(bed.width, bed.length);
  const offcuts = (bs: Board[]) => bs.reduce((s, x) => s + x.offcut, 0);
  const lengthOver = a.boards.length < b.boards.length || (a.boards.length === b.boards.length && offcuts(a.boards) <= offcuts(b.boards));
  const { boards, joins } = lengthOver ? a : b;
  const outside = { length: bed.length + 2 * thick, width: bed.width + 2 * thick };

  const height = courses * t.height;
  let posts = { count: 0, each: 0, stock: [] as Board[] };
  if (t.posts) {
    const between = (side: number) => Math.max(0, Math.ceil(side / POST_SPACING - 1e-9) - 1);
    const count = (4 + 2 * between(bed.length) + 2 * between(bed.width)) * bed.count;
    const each = height / 1000;
    // A post taller than a stock length takes a longer post of its own.
    const stock = each <= POST_STOCK ? cutList(Array<number>(count).fill(each), POST_STOCK) : Array.from({ length: count }, () => ({ cuts: [each], offcut: 0 }));
    posts = { count, each, stock };
  }

  const boardCost = boards.length * t.price;
  const postCost = posts.stock.length * t.postPrice;
  return { courses, height, outside, boards, posts, joins, cost: boardCost + postCost, boardCost, postCost };
}

/** Boards with the same cuts, grouped for a cut list: "4 × [2.476, 1.2]". */
export function groupBoards(boards: readonly Board[]): { count: number; cuts: number[]; offcut: number }[] {
  const groups = new Map<string, { count: number; cuts: number[]; offcut: number }>();
  for (const b of boards) {
    const key = b.cuts.map((c) => c.toFixed(3)).join(",");
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { count: 1, cuts: b.cuts, offcut: b.offcut });
  }
  return [...groups.values()];
}

/* ------------------------------------------------------------- Results -- */

export interface IngredientResult {
  ingredient: Ingredient;
  share: number;
  /** m³ to buy, including the extra. */
  volume: number;
  /** tonnes */
  weight: number;
  options: BuyOptions;
}

export interface RaisedBedResult {
  /** m³ in one bed, before the extra. */
  perBed: number;
  /** m³ in all beds, before the extra. */
  exact: number;
  /** m³ to buy, including the extra. */
  volume: number;
  /** tonnes */
  weight: number;
  barrowLoads: number;
  /** Ingredients in the mix, in INGREDIENTS order; zero shares left out. */
  parts: IngredientResult[];
  timber: TimberResult | null;
  cost: {
    soil: number;
    timber: number;
    other: number;
    total: number;
    /** Ingredients in the mix with no priced way to buy them. */
    unpriced: Ingredient[];
  };
}

export interface RaisedBedInput {
  bed: Bed;
  mix: Mix;
  /** Extra for settling, whole %. */
  extra: number;
  buying: Record<Ingredient, Buying>;
  timber: Timber;
  /** Screws, liner and the like, per bed. */
  otherPerBed: number;
}

export function calculate({ bed, mix, extra, buying, timber, otherPerBed }: RaisedBedInput): RaisedBedResult {
  const perBed = Math.max(0, bed.length) * Math.max(0, bed.width) * (Math.max(0, bed.depth) / 100);
  const exact = perBed * bed.count;
  const volume = exact * (1 + extra / 100);
  const split = shares(mix);

  const parts = INGREDIENTS.filter((i) => split[i] > 0).map((ingredient): IngredientResult => {
    const v = volume * split[ingredient];
    const s = buying[ingredient];
    return { ingredient, share: split[ingredient], volume: v, weight: v * s.density, options: buyOptions(v, s, "L") };
  });

  const t = calculateTimber(bed, timber);
  const unpriced = parts.filter((p) => p.volume > 0 && p.options.best === null).map((p) => p.ingredient);
  const soil = parts.reduce((sum, p) => sum + (p.options.best?.cost ?? 0), 0);
  const timberCost = t?.cost ?? 0;
  const other = otherPerBed * bed.count;

  const weight = parts.reduce((sum, p) => sum + p.weight, 0);
  return {
    perBed,
    exact,
    volume,
    weight,
    barrowLoads: barrowLoads(volume, weight),
    parts,
    timber: t,
    cost: { soil, timber: timberCost, other, total: soil + timberCost + other, unpriced },
  };
}
