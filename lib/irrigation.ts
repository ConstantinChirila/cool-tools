/**
 * Drip irrigation from an outside tap: how many drippers the tap can run at
 * once, how to split plants into zones that run one after another, how long
 * each zone runs, the water it all uses and what that costs, and how much
 * the pipes hold when you flush them.
 *
 * Flows are in litres per hour (drippers are sold that way), water in
 * litres, times in minutes, pipe sizes in millimetres and lengths in metres.
 */

import { fail, ok, type Result } from "@/lib/result";
import { clamp } from "@/lib/utils";

/* ----------------------------------------------------------------- Tap -- */

export interface Tap {
  /** Bucket test: litres collected… */
  litres: number;
  /** …in this many seconds, tap fully open, pressure reducer fitted. */
  seconds: number;
  /** Most the kit's pressure reducer or master unit passes, L/h. 0 for no limit. */
  limit: number;
  /** Whole % of the measured flow to design to. */
  margin: number;
}

/**
 * A 10 L bucket in 40 seconds is 15 L/min, mid-range for a UK garden tap.
 * Designing to 75% of the measured flow is Rain Bird's rule for a water
 * meter, which Land F/X calls the accepted standard; used here by analogy,
 * as no drip kit maker publishes a margin.
 */
export const TAP_DEFAULTS: Tap = { litres: 10, seconds: 40, limit: 0, margin: 75 };

/**
 * Water companies must give at least 7 m head (0.7 bar), and Ofwat's
 * reference level is 10 m head at 9 L/min. A tap slower than this is worth
 * a word with the water company.
 */
export const LOW_FLOW_LPM = 9;

/** L/h from a bucket test, Hozelock's method: litres × 3,600 ÷ seconds. */
export function tapFlow(tap: Pick<Tap, "litres" | "seconds">): number {
  return tap.seconds > 0 ? (Math.max(tap.litres, 0) * 3600) / tap.seconds : 0;
}

/** L/h the zones may use at once: the margin of the tap, capped by the kit. */
export function usableFlow(tap: Tap): number {
  const byTap = tapFlow(tap) * (clamp(tap.margin, 1, 100) / 100);
  return tap.limit > 0 ? Math.min(byTap, tap.limit) : byTap;
}

/* --------------------------------------------------------------- Zones -- */

export const KINDS = ["tomato", "pot", "basket", "bed", "shrub", "custom"] as const;
export type Kind = (typeof KINDS)[number];

export interface KindInfo {
  label: string;
  /** What one "plant" is, for the count. */
  unit: string;
  /** One-letter code in the URL. */
  code: string;
  preset: { drippers: number; lph: number; litres: number };
  hint: string;
}

/**
 * Daily water per plant in summer. Only the hanging basket figure comes
 * from a trial (RHS: 142–380 ml a day for a 30 cm basket); the others are
 * rules of thumb: about 10% of a pot's volume a day (a tip attributed to the
 * RHS), a grow bag of three tomatoes taking about 2 L a day in July, and
 * the RHS's 24 L/m² every 7–10 days for a densely planted bed.
 */
export const KIND_INFO: Record<Kind, KindInfo> = {
  tomato: {
    label: "Tomatoes",
    unit: "plant",
    code: "t",
    preset: { drippers: 1, lph: 4, litres: 1.5 },
    hint: "In a grow bag or big pot: about 1.5 L a plant a day in high summer, more in a hot greenhouse.",
  },
  pot: {
    label: "Pots",
    unit: "pot",
    code: "p",
    preset: { drippers: 1, lph: 4, litres: 1.5 },
    hint: "A 30 cm pot holds about 15 L: give it roughly a tenth of that a day in summer.",
  },
  basket: {
    label: "Hanging baskets",
    unit: "basket",
    code: "b",
    preset: { drippers: 1, lph: 2, litres: 0.4 },
    hint: "An RHS trial watered 30 cm baskets with 140–380 ml a day; a little every day works best.",
  },
  bed: {
    label: "Veg bed",
    unit: "m²",
    code: "v",
    preset: { drippers: 4, lph: 2, litres: 3 },
    hint: "Count square metres. The RHS gives a densely planted bed about 24 L/m² every 7–10 days: roughly 3 L/m² a day.",
  },
  shrub: {
    label: "Shrubs",
    unit: "shrub",
    code: "s",
    preset: { drippers: 2, lph: 4, litres: 4 },
    hint: "A rough figure for a young shrub in dry weather. Established shrubs in the ground rarely need watering.",
  },
  custom: {
    label: "Other",
    unit: "plant",
    code: "c",
    preset: { drippers: 1, lph: 4, litres: 1 },
    hint: "Set your own water per plant and drippers.",
  },
};

/** Common dripper flows, L/h: Gardena's 2 L/h head, Hozelock's 4 L/h, and adjustable ones opened up. */
export const DRIPPER_FLOWS = [1, 2, 4, 8] as const;

export interface Zone {
  kind: Kind;
  /** Plants, pots, baskets or m² of bed. */
  plants: number;
  drippersPerPlant: number;
  /** L/h per dripper. */
  lph: number;
  /** Litres per plant per day. */
  litres: number;
}

export function zoneFromKind(kind: Kind, plants: number): Zone {
  const p = KIND_INFO[kind].preset;
  return { kind, plants, drippersPerPlant: p.drippers, lph: p.lph, litres: p.litres };
}

export const MAX_ZONES = 6;

export const LIMITS = {
  litres: { min: 0.1, max: 100 },
  seconds: { min: 1, max: 600 },
  limit: { min: 0, max: 10_000 },
  margin: { min: 10, max: 100 },
  plants: { min: 0, max: 500 },
  drippers: { min: 1, max: 20 },
  lph: { min: 0.5, max: 100 },
  perPlant: { min: 0, max: 100 },
  /** m */
  length: { min: 0, max: 500 },
  days: { min: 1, max: 7 },
  /** Minutes after midnight. */
  start: { min: 0, max: 1439 },
} as const;

/** `t6x1x4x1.5_p10x1x4x1.5`: kind code, plants, drippers per plant, L/h, litres a day. */
export function encodeZones(zones: readonly Zone[]): string {
  return zones.map((z) => `${KIND_INFO[z.kind].code}${z.plants}x${z.drippersPerPlant}x${z.lph}x${z.litres}`).join("_");
}

/** The reverse of `encodeZones`, with each number clamped to its limits. */
export function parseZones(raw: string): Result<Zone[]> {
  const parts = raw.split("_");
  if (parts.length === 0 || parts.length > MAX_ZONES) return fail(`One to ${MAX_ZONES} zones`);
  const zones: Zone[] = [];
  for (const part of parts) {
    const match = /^([a-z])([\d.]+)x([\d.]+)x([\d.]+)x([\d.]+)$/.exec(part);
    const kind = match && KINDS.find((k) => KIND_INFO[k].code === match[1]);
    if (!match || !kind) return fail(`Not a zone: ${part}`);
    const num = (s: string | undefined, r: { min: number; max: number }) => {
      const n = Number(s);
      return Number.isFinite(n) ? clamp(n, r.min, r.max) : r.min;
    };
    zones.push({
      kind,
      plants: Math.round(num(match[2], LIMITS.plants)),
      drippersPerPlant: Math.round(num(match[3], LIMITS.drippers)),
      lph: num(match[4], LIMITS.lph),
      litres: num(match[5], LIMITS.perPlant),
    });
  }
  return ok(zones);
}

/* --------------------------------------------------------------- Pipes -- */

export const SUPPLY_PIPES = ["13", "16"] as const;
export type SupplyPipe = (typeof SUPPLY_PIPES)[number];

/**
 * Inside diameters, mm. 16 mm LDPE is 13.6 mm inside (1.2 mm wall).
 * Hozelock's 13 mm supply hose has a 1.3 mm wall, so about 10.4 mm inside
 * (derived, rough). Micro tube is sold as 4/6 mm: 4 mm inside.
 */
export const PIPE_ID: Record<SupplyPipe | "micro", number> = { "13": 10.4, "16": 13.6, micro: 4 };

export interface Pipes {
  supply: SupplyPipe;
  /** m of supply pipe. */
  supplyLength: number;
  /** m of 4 mm micro tube, all the drops added up. */
  microLength: number;
}

export const PIPE_DEFAULTS: Pipes = { supply: "13", supplyLength: 15, microLength: 10 };

/** Water must move at 0.3 m/s (1 ft/s) to scour a drip line clean: ASAE EP405 and UC ANR. */
export const FLUSH_SPEED = 0.3;

/** Litres in `length` metres of pipe `id` mm across inside. */
export function pipeLitres(id: number, length: number): number {
  const r = id / 2000;
  return Math.PI * r * r * Math.max(length, 0) * 1000;
}

/** L/h needed to move water at `FLUSH_SPEED` through a pipe `id` mm across. */
export function flushFlow(id: number): number {
  const r = id / 2000;
  return Math.PI * r * r * FLUSH_SPEED * 3600 * 1000;
}

/* ------------------------------------------------------------ Schedule -- */

export interface Schedule {
  /** 1 or 2 a day; the day's water is split between them. */
  waterings: number;
  /** Minutes after midnight. */
  start: number;
  second: number;
  /** Watering days a week. */
  days: number;
}

export const SCHEDULE_DEFAULTS: Schedule = { waterings: 1, start: 6 * 60, second: 18 * 60, days: 7 };

/* -------------------------------------------------------------- Result -- */

export interface ZoneResult {
  drippers: number;
  /** L/h with every dripper running. */
  flow: number;
  /** Most drippers of this flow the tap can run at once. */
  maxDrippers: number;
  over: boolean;
  /** Zones this one should become to fit the tap. */
  split: number;
  /** Minutes per watering. */
  minutes: number;
  /** Litres a day. */
  litres: number;
}

export interface IrrigationResult {
  /** L/h measured. */
  tap: number;
  /** L/h the zones may use. */
  usable: number;
  zones: ZoneResult[];
  /** Minutes per watering, all zones one after another. */
  minutes: number;
  daily: number;
  weekly: number;
  weeklyCost: number;
  pipes: {
    supplyLitres: number;
    microLitres: number;
    litres: number;
    /** Minutes for one pipe volume to run out at the full tap flow. */
    flushMinutes: number;
    /** How many times over the tap gives the flow to scour the supply pipe. */
    flushRatio: number;
  };
}

export interface IrrigationInput {
  tap: Tap;
  zones: readonly Zone[];
  schedule: Schedule;
  pipes: Pipes;
  /** Per 1,000 L, water and sewerage together. */
  price: number;
}

export function calculateZone(zone: Zone, usable: number, waterings: number): ZoneResult {
  const drippers = Math.max(Math.round(zone.plants), 0) * Math.max(Math.round(zone.drippersPerPlant), 1);
  const flow = drippers * zone.lph;
  const maxDrippers = zone.lph > 0 ? Math.floor(usable / zone.lph + 1e-9) : 0;
  const perPlantLph = Math.max(Math.round(zone.drippersPerPlant), 1) * zone.lph;
  const each = zone.litres / Math.max(waterings, 1);
  const minutes = drippers > 0 && perPlantLph > 0 ? (each / perPlantLph) * 60 : 0;
  const over = flow > usable + 1e-9;
  return {
    drippers,
    flow,
    maxDrippers,
    over,
    split: usable > 0 ? Math.max(Math.ceil(flow / usable - 1e-9), 1) : 1,
    minutes,
    litres: Math.max(zone.plants, 0) * Math.max(zone.litres, 0),
  };
}

export function calculate({ tap, zones, schedule, pipes, price }: IrrigationInput): IrrigationResult {
  const flow = tapFlow(tap);
  const usable = usableFlow(tap);
  const waterings = clamp(Math.round(schedule.waterings), 1, 2);
  const results = zones.map((z) => calculateZone(z, usable, waterings));
  const daily = results.reduce((s, z) => s + z.litres, 0);
  const weekly = daily * clamp(Math.round(schedule.days), 0, 7);
  const supplyId = PIPE_ID[pipes.supply];
  const supplyLitres = pipeLitres(supplyId, pipes.supplyLength);
  const microLitres = pipeLitres(PIPE_ID.micro, pipes.microLength);
  const litres = supplyLitres + microLitres;
  return {
    tap: flow,
    usable,
    zones: results,
    minutes: results.reduce((s, z) => s + z.minutes, 0),
    daily,
    weekly,
    weeklyCost: (weekly / 1000) * Math.max(price, 0),
    pipes: {
      supplyLitres,
      microLitres,
      litres,
      flushMinutes: flow > 0 ? (litres / flow) * 60 : 0,
      flushRatio: flow / flushFlow(supplyId),
    },
  };
}

/** "06:00" from minutes after midnight, wrapping past midnight. */
export function clockText(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Minutes after midnight from "06:30", or null. */
export function parseClock(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
}
