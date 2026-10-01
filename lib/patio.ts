/**
 * Patio and paving: slabs laid on a full mortar bed over a compacted MOT
 * Type 1 sub-base. Each patio is a rectangle laid slab by slab from the
 * corner by the house, so full slabs, cut pieces and joints are counted from
 * the actual layout rather than estimated from the area.
 *
 * Patio sizes are in metres, slab sizes, joints and layer depths in
 * millimetres, volumes in cubic metres and weights in kilograms.
 */

import { buyOptions, type BuyOptions, type Buying } from "@/lib/garden-materials";
import { fail, ok, type Result } from "@/lib/result";
import { clamp } from "@/lib/utils";

/* -------------------------------------------------------------- Slabs -- */

export const SLAB_KINDS = ["porcelain", "sandstone", "concrete"] as const;
export type SlabKind = (typeof SLAB_KINDS)[number];

export interface SlabInfo {
  label: string;
  /** Common sizes, length × width in mm. */
  sizes: readonly (readonly [number, number])[];
  thickness: number;
  /** Usual joint, mm. */
  joint: number;
  jointRange: readonly [number, number];
  /** Fall as 1 in N. */
  fall: number;
  pricePerM2: number;
  hint: string;
}

/**
 * Sizes, joints and falls from Marshalls and London Stone laying guides;
 * prices are rough Wickes per-m² figures, checked 2026-09-30.
 */
export const SLAB_INFO: Record<SlabKind, SlabInfo> = {
  porcelain: {
    label: "Porcelain",
    sizes: [
      [600, 600],
      [900, 600],
      [1200, 600],
      [800, 800],
    ],
    thickness: 20,
    joint: 5,
    jointRange: [3, 5],
    fall: 80,
    pricePerM2: 40,
    hint: "Smooth and dense: each slab needs a primer on the back so the mortar grips.",
  },
  sandstone: {
    label: "Sandstone",
    sizes: [
      [600, 600],
      [900, 600],
      [600, 290],
      [290, 290],
    ],
    thickness: 22,
    joint: 10,
    jointRange: [8, 10],
    fall: 60,
    pricePerM2: 45,
    hint: "Riven Indian sandstone, calibrated to one thickness. Prime the backs too.",
  },
  concrete: {
    label: "Concrete",
    sizes: [
      [600, 600],
      [450, 450],
      [600, 300],
      [900, 600],
    ],
    thickness: 38,
    joint: 10,
    jointRange: [8, 10],
    fall: 60,
    pricePerM2: 30,
    hint: "Pressed or wet-cast concrete flags.",
  },
};

export interface Slab {
  /** mm */
  length: number;
  width: number;
  thickness: number;
}

/** Grid lines up every joint; offset starts every other row half a slab along, like brickwork. */
export type Pattern = "grid" | "offset";
/** Which way the slab's long side runs: along the house or away from it. */
export type Direction = "along" | "away";

/* ------------------------------------------------------------- Patios -- */

/** A rectangle taken out of a patio, in metres from its corner by the house: a tree, drain or manhole. */
export interface CutOut {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** `length` runs along the house, `width` away from it. */
export interface Patio {
  length: number;
  width: number;
  cutOuts: CutOut[];
}

export const MAX_PATIOS = 6;
export const MAX_CUTOUTS = 4;
export const MAX_SIDE = 100;

/** Bounds shared by the inputs and the URL. */
export const LIMITS = {
  slab: { min: 100, max: 2000 },
  thickness: { min: 10, max: 100 },
  joint: { min: 1, max: 30 },
  subBase: { min: 0, max: 300 },
  bed: { min: 10, max: 100 },
  ratio: { min: 2, max: 10 },
  fall: { min: 20, max: 200 },
  extra: { min: 0, max: 50 },
  tub: { min: 1, max: 100 },
  /** Bag and bulk bag sizes, kg. */
  bagSize: { min: 1, max: 5000 },
} as const;

const n = (v: number) => String(Number(v.toFixed(3)));

/** `5x3@1,0.5,0.6x0.45_2.4x1.8`: length × width, then `@x,y,w×h` for each cut-out. */
export function encodePatios(patios: readonly Patio[]): string {
  return patios
    .map((p) => `${n(p.length)}x${n(p.width)}${p.cutOuts.map((c) => `@${n(c.x)},${n(c.y)},${n(c.w)}x${n(c.h)}`).join("")}`)
    .join("_");
}

export function parsePatios(raw: string): Result<Patio[]> {
  const parts = raw.split("_");
  if (parts.length > MAX_PATIOS) return fail(`At most ${MAX_PATIOS} patios`);
  const num = "(\\d+(?:\\.\\d+)?)";
  const side = (s: string) => clamp(Number(s), 0, MAX_SIDE);
  const patios: Patio[] = [];
  for (const part of parts) {
    const [size = "", ...cuts] = part.split("@");
    const m = new RegExp(`^${num}x${num}$`).exec(size);
    if (!m || cuts.length > MAX_CUTOUTS) return fail(`Not a patio: ${part}`);
    const cutOuts: CutOut[] = [];
    for (const cut of cuts) {
      const c = new RegExp(`^${num},${num},${num}x${num}$`).exec(cut);
      if (!c) return fail(`Not a cut-out: ${cut}`);
      cutOuts.push({ x: side(c[1]!), y: side(c[2]!), w: side(c[3]!), h: side(c[4]!) });
    }
    patios.push({ length: side(m[1]!), width: side(m[2]!), cutOuts });
  }
  return ok(patios);
}

export function patioArea(p: Patio): { gross: number; cut: number; net: number } {
  const gross = p.length * p.width;
  const cut = p.cutOuts.reduce((sum, c) => sum + overlap(c, { x: 0, y: 0, w: p.length, h: p.width }), 0);
  return { gross, cut, net: Math.max(gross - cut, 0) };
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 1e-9 && h > 1e-9 ? { x, y, w, h } : null;
}

function overlap(a: Rect, b: Rect): number {
  const r = intersect(a, b);
  return r ? r.w * r.h : 0;
}

/* ------------------------------------------------------------- Layout -- */

/**
 * One slab-sized cell of the layout, in mm from the patio's corner by the
 * house. `full` is a whole slab; `cut` a rectangle cut from one; `notched` a
 * slab with a cut-out taken from its middle or a corner, which uses a whole
 * slab. Cells entirely inside a cut-out are left out.
 */
export interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "full" | "cut" | "notched";
}

export interface Layout {
  pieces: Piece[];
  /** Total joint length inside the patio, metres. */
  jointLength: number;
  /** Slab size as laid: along the house (x) and away from it (y), mm. */
  tile: { x: number; y: number };
}

/** Joints within this many mm of a size count as the same cut, so float dust doesn't split groups. */
const MM = 0.5;

/**
 * Lay slabs from the corner by the house: rows run along the house, the
 * first row against it, cuts land on the far edges. Offset rows start half a
 * slab in, so every other row has a cut at both ends.
 */
export function layout(patio: Patio, slab: Slab, joint: number, pattern: Pattern, direction: Direction): Layout {
  const long = Math.max(slab.length, slab.width);
  const short = Math.min(slab.length, slab.width);
  const tile = direction === "along" ? { x: long, y: short } : { x: short, y: long };
  const L = patio.length * 1000;
  const W = patio.width * 1000;
  const holes = patio.cutOuts.map((c) => ({ x: c.x * 1000, y: c.y * 1000, w: c.w * 1000, h: c.h * 1000 }));
  const pieces: Piece[] = [];
  let jointLength = 0;
  if (L < 1 || W < 1 || tile.x <= 0 || tile.y <= 0) return { pieces, jointLength, tile };

  const pitchX = tile.x + joint;
  const pitchY = tile.y + joint;
  // A guard against links asking for millions of slabs.
  if ((L / pitchX + 2) * (W / pitchY + 1) > 20_000) return { pieces, jointLength, tile };

  for (let row = 0, y = 0; y < W - MM; row++, y += pitchY) {
    const h = Math.min(tile.y, W - y);
    if (y + h < W - MM) jointLength += L / 1000;
    const offset = pattern === "offset" && row % 2 === 1 ? pitchX / 2 : 0;
    for (let x = -offset; x < L - MM; x += pitchX) {
      const x0 = Math.max(x, 0);
      const w = Math.min(x + tile.x, L) - x0;
      if (w < MM) continue;
      if (x0 + w < L - MM) jointLength += h / 1000;
      const cell = { x: x0, y, w, h };
      const piece = carve(cell, holes);
      if (!piece) continue;
      const whole = Math.abs(piece.w - tile.x) < MM && Math.abs(piece.h - tile.y) < MM;
      pieces.push({ ...piece, kind: piece.kind === "notched" ? "notched" : whole ? "full" : "cut" });
    }
  }
  return { pieces, jointLength, tile };
}

/** What's left of a cell once the cut-outs are taken away: nothing, a smaller rectangle, or a notched slab. */
function carve(cell: Rect, holes: Rect[]): (Rect & { kind: "rect" | "notched" }) | null {
  const hits = holes.map((h) => intersect(cell, h)).filter((r): r is Rect => r !== null);
  if (hits.length === 0) return { ...cell, kind: "rect" };
  const area = cell.w * cell.h;
  const taken = hits.reduce((s, r) => s + r.w * r.h, 0);
  if (taken >= area - MM * MM) return null;
  if (hits.length === 1) {
    const [r] = hits as [Rect];
    const top = Math.abs(r.y - cell.y) < MM;
    const bottom = Math.abs(r.y + r.h - (cell.y + cell.h)) < MM;
    const left = Math.abs(r.x - cell.x) < MM;
    const right = Math.abs(r.x + r.w - (cell.x + cell.w)) < MM;
    // A cut-out across the whole cell leaves a straight cut, not a notch.
    if (left && right && (top || bottom)) return { x: cell.x, y: top ? r.y + r.h : cell.y, w: cell.w, h: cell.h - r.h, kind: "rect" };
    if (top && bottom && (left || right)) return { x: left ? r.x + r.w : cell.x, y: cell.y, w: cell.w - r.w, h: cell.h, kind: "rect" };
  }
  return { ...cell, kind: "notched" };
}

/** Saw blade width lost with every cut, mm. */
export const KERF = 3;

/** How many pieces of a×b come out of one slab, turning the piece if that fits more. */
export function piecesPerSlab(a: number, b: number, tile: { x: number; y: number }): number {
  const fit = (piece: number, slab: number) => Math.floor((slab + KERF + MM) / (piece + KERF));
  return Math.max(fit(a, tile.x) * fit(b, tile.y), fit(b, tile.x) * fit(a, tile.y), 1);
}

export interface SlabCount {
  full: number;
  /** Cut pieces, notched ones included. */
  cuts: number;
  /** Slabs the cut pieces come from, with pieces of the same size cut two or more to a slab. */
  cutFrom: number;
  /** Full slabs plus the ones cut up, before breakages. */
  needed: number;
  /** With the breakage allowance, rounded up. */
  order: number;
  /** The narrowest cut piece, mm, or null if there are none. */
  thinnest: number | null;
}

export function countSlabs(layouts: readonly Layout[], extraPct: number): SlabCount {
  let full = 0;
  let cuts = 0;
  let cutFrom = 0;
  let thinnest: number | null = null;
  for (const { pieces, tile } of layouts) {
    const groups = new Map<string, { a: number; b: number; count: number }>();
    for (const p of pieces) {
      if (p.kind === "full") {
        full++;
        continue;
      }
      cuts++;
      if (p.kind === "notched") {
        cutFrom++;
        continue;
      }
      const narrow = Math.min(p.w, p.h);
      thinnest = thinnest === null ? narrow : Math.min(thinnest, narrow);
      const key = `${Math.round(p.w)}x${Math.round(p.h)}`;
      const group = groups.get(key) ?? { a: p.w, b: p.h, count: 0 };
      group.count++;
      groups.set(key, group);
    }
    for (const { a, b, count } of groups.values()) cutFrom += Math.ceil(count / piecesPerSlab(a, b, tile));
  }
  const needed = full + cutFrom;
  return { full, cuts, cutFrom, needed, order: Math.ceil(needed * (1 + extraPct / 100) - 1e-9), thinnest };
}

/* ---------------------------------------------------------- Materials -- */

/**
 * Pavingexpert's rule for bedding mortar: about 2.1 t of sand and cement
 * per m³ of bed, split by the mix, so 4:1 is 1,680 kg of sand and 420 kg of
 * cement.
 */
export const MORTAR_DENSITY = 2.1;
export const CEMENT_BAG = 25;

/**
 * MOT Type 1 (Marshalls): 1.6 t per m³, times 1.3 because it compacts,
 * plus 10% for waste.
 */
export const MOT_WASTE = 10;

/** Brush-in jointing compound: a 12.5 kg tub of EASYJoint fills about 6.93 L of joint. */
export const COMPOUND = { kgPerLitre: 12.5 / 6.929, minDepth: 25, minWidth: 3, extra: 5 } as const;

/** The coverage already has 5% spare, so a tub that's short by under 1% still counts as enough. */
const TUB_SLACK = 0.01;

/** Dug soil takes up 1.2 to 1.4 times the space it did in the ground (Pavingexpert). */
export const BULKING = 1.3;

/** Starting figures, from Marshalls, Wickes and Azpects where noted in the guide. */
export const DEFAULTS = {
  slabExtra: 5,
  subBase: 100,
  subBaseExtra: 30,
  bed: 30,
  bedRatio: 4,
  pointingRatio: 4,
  tub: 12.5,
  tubPrice: 43,
  cementBag: 7.5,
  mot: { bag: 22.5, bagPrice: 5, bulk: 800, bulkPrice: 75, delivery: 0, density: 1.6 },
  sand: { bag: 20, bagPrice: 3.5, bulk: 800, bulkPrice: 75, delivery: 0, density: 1.6 },
} as const satisfies Record<string, number | Buying>;

export interface Mortar {
  /** m³ of bed or joint. */
  volume: number;
  sandKg: number;
  cementKg: number;
}

/** Sand and cement for a volume of mortar mixed `ratio` parts sand to one of cement. */
export function mortarFor(volume: number, ratio: number): Mortar {
  const kg = volume * MORTAR_DENSITY * 1000;
  return { volume, sandKg: (kg * ratio) / (ratio + 1), cementKg: kg / (ratio + 1) };
}

export type Jointing = "compound" | "mortar";

export interface Build {
  slab: Slab;
  joint: number;
  pattern: Pattern;
  direction: Direction;
  /** Breakage allowance on slabs, %. */
  slabExtra: number;
  /** mm, compacted. */
  subBase: number;
  /** Extra MOT to order because it compacts, %; waste comes on top. */
  subBaseExtra: number;
  /** mm */
  bed: number;
  /** Parts sharp sand to one part cement. */
  bedRatio: number;
  /** Fall as 1 in N. */
  fall: number;
  /** Which side the patio falls towards. */
  fallAlong: "width" | "length";
  jointing: Jointing;
  pointingRatio: number;
  /** Jointing compound tub, kg. */
  tub: number;
}

export interface Prices {
  /** Per m² of slabs, or per slab when `perSlab`. */
  slab: number;
  perSlab: boolean;
  mot: Buying;
  sand: Buying;
  cementBag: number;
  tub: number;
}

export interface PatioResult {
  layouts: Layout[];
  area: { gross: number; cut: number; net: number };
  slabs: SlabCount;
  subBase: { volume: number; kg: number; options: BuyOptions };
  bed: Mortar;
  pointing: Mortar | null;
  sand: { kg: number; options: BuyOptions };
  cement: { kg: number; bags: number };
  compound: { litres: number; kg: number; tubs: number; depth: number } | null;
  /** Joint length in metres and volume in litres, at the slab's depth. */
  joints: { length: number; litres: number };
  fall: { run: number; drop: number };
  /** Dig depth, mm, and the soil that comes out: in the ground, and once dug and loose. */
  dig: { depth: number; volume: number; loose: number };
  cost: { slabs: number; subBase: number | null; sand: number | null; cement: number; jointing: number; total: number };
}

export function calculate(patios: readonly Patio[], b: Build, prices: Prices): PatioResult {
  const layouts = patios.map((p) => layout(p, b.slab, b.joint, b.pattern, b.direction));
  const area = patios.map(patioArea).reduce((t, a) => ({ gross: t.gross + a.gross, cut: t.cut + a.cut, net: t.net + a.net }), { gross: 0, cut: 0, net: 0 });
  const slabs = countSlabs(layouts, b.slabExtra);

  const subBaseVolume = area.net * (b.subBase / 1000) * (1 + b.subBaseExtra / 100) * (1 + MOT_WASTE / 100);
  const subBase = { volume: subBaseVolume, kg: subBaseVolume * prices.mot.density * 1000, options: buyOptions(subBaseVolume, prices.mot, "kg") };

  const bed = mortarFor(area.net * (b.bed / 1000), b.bedRatio);
  const jointLength = layouts.reduce((s, l) => s + l.jointLength, 0);
  const jointLitres = (jointLength * b.joint * b.slab.thickness) / 1000;
  const pointing = b.jointing === "mortar" ? mortarFor(jointLitres / 1000, b.pointingRatio) : null;
  // Compound goes at least 25 mm deep, into the bed below a thin slab.
  const depth = Math.max(b.slab.thickness, COMPOUND.minDepth);
  const litres = ((jointLength * b.joint * depth) / 1000) * (1 + COMPOUND.extra / 100);
  const compound = b.jointing === "compound" ? { litres, kg: litres * COMPOUND.kgPerLitre, depth, tubs: Math.ceil((litres * COMPOUND.kgPerLitre) / b.tub - TUB_SLACK) } : null;

  const sandKg = bed.sandKg + (pointing?.sandKg ?? 0);
  const sand = { kg: sandKg, options: buyOptions(sandKg / 1000 / prices.sand.density, prices.sand, "kg") };
  const cementKg = bed.cementKg + (pointing?.cementKg ?? 0);
  const cement = { kg: cementKg, bags: Math.ceil(cementKg / CEMENT_BAG - 1e-9) };

  const run = Math.max(0, ...patios.map((p) => (b.fallAlong === "width" ? p.width : p.length)));
  const digDepth = b.slab.thickness + b.bed + b.subBase;

  const slabArea = (b.slab.length * b.slab.width) / 1e6;
  const slabCost = slabs.order * (prices.perSlab ? prices.slab : prices.slab * slabArea);
  const subBaseCost = subBase.options.best?.cost ?? null;
  const sandCost = sand.options.best?.cost ?? null;
  const cementCost = cement.bags * prices.cementBag;
  const jointingCost = compound ? compound.tubs * prices.tub : 0;

  return {
    layouts,
    area,
    slabs,
    subBase,
    bed,
    pointing,
    sand,
    cement,
    compound,
    joints: { length: jointLength, litres: jointLitres },
    fall: { run, drop: (run * 1000) / b.fall },
    dig: { depth: digDepth, volume: area.net * (digDepth / 1000), loose: area.net * (digDepth / 1000) * BULKING },
    cost: {
      slabs: slabCost,
      subBase: subBaseCost,
      sand: sandCost,
      cement: cementCost,
      jointing: jointingCost,
      total: slabCost + (subBaseCost ?? 0) + (sandCost ?? 0) + cementCost + jointingCost,
    },
  };
}
