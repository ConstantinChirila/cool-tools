import { getUnit, type Unit, type UnitCategory } from "@/lib/units/data";

export type Precision = "auto" | "2dp" | "4dp" | "max";

export const PRECISIONS: readonly Precision[] = ["auto", "2dp", "4dp", "max"];

export function toBase(unit: Unit, x: number): number {
  return unit.inverse ? unit.factor / x : x * unit.factor + (unit.offset ?? 0);
}

export function fromBase(unit: Unit, base: number): number {
  return unit.inverse ? unit.factor / base : (base - (unit.offset ?? 0)) / unit.factor;
}

export function convert(from: Unit, to: Unit, x: number): number {
  return fromBase(to, toBase(from, x));
}

/**
 * Parse what someone typed as a quantity: plain decimals with optional
 * thousands separators or exponent, or m:ss / h:mm:ss for paces and times.
 * Returns NaN for anything else (including the empty string).
 */
export function parseNumber(raw: string): number {
  const s = raw.trim().replace(/,/g, "");
  if (!s) return NaN;
  const clock = s.match(/^(-?\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const [, h = "0", m = "0", sec] = clock;
    return Number(h) + Number(m) / 60 + (sec ? Number(sec) / 3600 : 0);
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return Number(s);
}

const formatters = new Map<string, Intl.NumberFormat>();
function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-GB", options);
    formatters.set(key, f);
  }
  return f;
}

/** Format a converted value: significant figures by default, exponent for extremes. */
export function formatNumber(n: number, precision: Precision = "auto"): string {
  if (Number.isNaN(n)) return "";
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  if (n === 0) return "0";
  const magnitude = Math.abs(n);
  if (precision === "2dp" || precision === "4dp") {
    return nf({ maximumFractionDigits: precision === "2dp" ? 2 : 4 }).format(n);
  }
  const sig = precision === "max" ? 15 : 8;
  if (magnitude >= 1e15 || magnitude < 1e-6) {
    return n.toExponential(sig - 1).replace(/\.?0+e/, "e").replace("e+", "e");
  }
  return nf({ maximumSignificantDigits: sig }).format(n);
}

/** Format a value in a given unit, honouring the unit's display format (m:ss for paces). */
export function formatQuantity(unit: Unit, n: number, precision: Precision = "auto"): string {
  if (unit.format === "minsec" && Number.isFinite(n) && n >= 0) {
    let minutes = Math.floor(n);
    let seconds = Math.round((n - minutes) * 60);
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  return formatNumber(n, precision);
}

export type Relation =
  /** to = from * factor */
  | { kind: "linear"; factor: number }
  /** to = from * factor + offset */
  | { kind: "affine"; factor: number; offset: number }
  /** to = constant / from */
  | { kind: "reciprocal"; constant: number };

/** How two units of one category relate, for the "how it's worked out" line. */
export function describeRelation(from: Unit, to: Unit): Relation {
  const fromInverse = Boolean(from.inverse);
  const toInverse = Boolean(to.inverse);
  if (fromInverse !== toInverse) {
    return { kind: "reciprocal", constant: fromInverse ? from.factor / to.factor : to.factor / from.factor };
  }
  const factor = fromInverse ? to.factor / from.factor : from.factor / to.factor;
  const offset = ((from.offset ?? 0) - (to.offset ?? 0)) / to.factor;
  return offset === 0 ? { kind: "linear", factor } : { kind: "affine", factor, offset };
}

/**
 * Express a value in a unit's customary pair, "5 ft 11 in" or "11 st 4 lb",
 * for units that declare a minor unit. Returns null when it does not apply.
 */
export function formatCompound(category: UnitCategory, unit: Unit, value: number): string | null {
  if (!unit.minor || !Number.isFinite(value) || unit.inverse || unit.offset) return null;
  const minor = getUnit(category, unit.minor);
  if (!minor) return null;
  // 12 inches to the foot, 14 pounds to the stone; rounded so 0.3048/0.0254 is exactly 12.
  const perMajor = Math.round((unit.factor / minor.factor) * 1e6) / 1e6;
  const sign = value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  let major = Math.floor(magnitude);
  let rest = Math.round((magnitude - major) * perMajor * 10) / 10;
  if (rest >= perMajor) {
    major += 1;
    rest = 0;
  }
  const restText = Number.isInteger(rest) ? String(rest) : rest.toFixed(1);
  return `${sign}${major.toLocaleString("en-GB")} ${unit.sym} ${restText} ${minor.sym}`;
}
