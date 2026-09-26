import { fromBase, parseNumber, toBase } from "@/lib/units/convert";
import { categories, type Unit, type UnitCategory } from "@/lib/units/data";

export interface UnitRef {
  category: UnitCategory;
  unit: Unit;
}

/** Collapse spelling differences so "Litres per 100 km" and "l/100km" meet in the middle. */
export function normalise(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/₂/g, "2")
    .replace(/₀/g, "0")
    .replace(/[°º]/g, "")
    .replace(/\b(deg|degree|degrees)\b/g, "")
    .replace(/\s+per\s+|\bper\b/g, "/")
    .replace(/[\s\-·._()]/g, "")
    .replace(/\^/g, "")
    .replace(/metre/g, "meter")
    .replace(/litre/g, "liter");
}

/**
 * Two indexes: a case-sensitive one (so MB is a megabyte and Mbit a megabit,
 * K is kelvin, C is Celsius), then a forgiving lowercase one. In both, explicit
 * aliases are indexed before symbols and names, and earlier categories win
 * ties: that is how "pint" lands on the UK pint and "cup" on the US cup.
 */
const exact = new Map<string, UnitRef>();
const loose = new Map<string, UnitRef>();

function put(map: Map<string, UnitRef>, key: string, ref: UnitRef) {
  if (key && !map.has(key)) map.set(key, ref);
}

for (const category of categories) {
  for (const unit of category.units) {
    const ref = { category, unit };
    for (const alias of unit.aliases) {
      put(exact, alias, ref);
      put(loose, normalise(alias), ref);
    }
  }
}
for (const category of categories) {
  for (const unit of category.units) {
    const ref = { category, unit };
    put(exact, unit.sym, ref);
    put(loose, normalise(unit.sym), ref);
    put(loose, normalise(unit.name), ref);
    put(loose, normalise(unit.id), ref);
  }
}

/** Resolve a typed unit name, symbol or alias. Plurals are tolerated. */
function lookupUnit(raw: string): UnitRef | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const direct = exact.get(trimmed);
  if (direct) return direct;
  const key = normalise(trimmed);
  if (!key) return null;
  return (
    loose.get(key) ??
    (key.endsWith("es") ? loose.get(key.slice(0, -2)) : undefined) ??
    (key.endsWith("s") ? loose.get(key.slice(0, -1)) : undefined) ??
    loose.get(`${key}s`) ??
    null
  );
}

interface Segment {
  numberRaw: string;
  value: number;
  ref: UnitRef;
}

/** "5'11\"" → "5 ft 11 in", "6'" → "6 ft", "30\"" → "30 in". */
function expandMarks(s: string): string {
  return s
    .replace(/(\d)\s*['′]\s*(\d+(?:\.\d+)?)\s*(?:["″]|'')?/g, "$1 ft $2 in")
    .replace(/(\d)\s*['′]/g, "$1 ft")
    .replace(/(\d)\s*(?:["″]|'')/g, "$1 in");
}

const SEGMENT = /([-+]?(?:\d[\d,]*(?:\.\d*)?|\.\d+))\s*([^\d\s][^\d]*?)?(?=\s*[-+]?\d|$)/g;

/**
 * Split "5 ft 11 in" or "11st 4lb" into number-unit segments. A trailing
 * number with no unit takes the previous unit's minor ("5ft11" is 5 ft 11 in).
 * Returns null unless every segment resolves to a unit in one category that
 * can be added up (no temperature scales, no reciprocal units).
 */
function parseSegments(text: string): Segment[] | null {
  const segments: Segment[] = [];
  let previous: UnitRef | null = null;
  for (const match of text.trim().matchAll(SEGMENT)) {
    const numberRaw = match[1] ?? "";
    const unitText = (match[2] ?? "").trim();
    let ref: UnitRef | null = null;
    if (unitText) ref = lookupUnit(unitText);
    else if (previous?.unit.minor) {
      const minorId = previous.unit.minor;
      const minorUnit: Unit | undefined = previous.category.units.find((u: Unit) => u.id === minorId);
      if (minorUnit) ref = { category: previous.category, unit: minorUnit };
    }
    if (!ref || ref.unit.inverse || ref.unit.offset) return null;
    if (previous && ref.category !== previous.category) return null;
    const value = parseNumber(numberRaw);
    if (Number.isNaN(value)) return null;
    segments.push({ numberRaw, value, ref });
    previous = ref;
  }
  return segments.length > 0 ? segments : null;
}

/**
 * Read a typed amount in a given unit: a plain number, m:ss, or a compound
 * like "5 ft 11 in" whose parts all belong to the unit's category. NaN when
 * the text is not an amount in this category.
 */
export function parseQuantity(raw: string, unit: Unit, category: UnitCategory): number {
  const plain = parseNumber(raw);
  if (!Number.isNaN(plain)) return plain;
  if (!/[a-z°µ′″'"]/i.test(raw)) return NaN;
  const segments = parseSegments(expandMarks(raw));
  if (!segments || segments.some((s) => s.ref.category !== category)) return NaN;
  const base = segments.reduce((sum, s) => sum + toBase(s.ref.unit, s.value), 0);
  return fromBase(unit, base);
}

export interface ParsedQuery {
  /** The amount as typed: a number, or the whole compound ("5 ft 11 in"); "" when absent. */
  numberRaw: string;
  /** Everything after the number, or the compound text. */
  rest: string;
  from: UnitRef | null;
  to: UnitRef | null;
  /** True when the amount was a compound of several units. */
  compound: boolean;
}

/** "to", "into", "as" and arrows always separate the two halves. */
const STRONG_SEPARATOR = /\s+(?:to|into|as|→|->|=)\s+|\s*(?:→|->|=)\s*/i;
const LEADING_NUMBER =
  /^([-+]?\d+:\d{1,2}(?::\d{1,2})?|[-+]?(?:\d[\d,]*(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?)?\s*(.*)$/i;

/** Does this look like "45 mpg in l/100km" rather than a bare number? */
export function isPhrase(raw: string): boolean {
  return /[a-z°µ′″'"]/i.test(raw) && !/^[-+]?(\d+\.?\d*|\.\d+)e[-+]?\d+$/i.test(raw.trim());
}

function splitOn(text: string, separator: RegExp): [string, string] | null {
  const match = text.match(separator);
  if (!match || match.index === undefined) return null;
  const left = text.slice(0, match.index).trim();
  const right = text.slice(match.index + match[0].length).trim();
  return left && right ? [left, right] : null;
}

/**
 * "in" is also a unit (inches), so it only separates as a last resort, and
 * at its last occurrence: "5 ft 11 in in cm" splits before "cm".
 */
function splitOnLastIn(text: string): [string, string] | null {
  let at = -1;
  for (const match of text.matchAll(/\bin\b/gi)) {
    const i = match.index;
    if (/\s/.test(text[i - 1] ?? "") && /\s/.test(text[i + 2] ?? "")) at = i;
  }
  if (at < 0) return null;
  const left = text.slice(0, at).trim();
  const right = text.slice(at + 2).trim();
  return left && right ? [left, right] : null;
}

function readHalves(left: string, right: string): ParsedQuery {
  const segments = /\d/.test(left) ? parseSegments(left) : null;
  if (segments && segments.length >= 2 && segments[0]) {
    return {
      numberRaw: left,
      rest: left,
      from: segments[0].ref,
      to: right ? lookupUnit(right) : null,
      compound: true,
    };
  }

  const match = left.match(LEADING_NUMBER);
  const numberRaw = match?.[1] ?? "";
  const rest = (match?.[2] ?? "").trim();
  let from: UnitRef | null = null;
  let to: UnitRef | null = null;
  if (right) {
    from = lookupUnit(rest);
    to = lookupUnit(right);
  } else if (rest) {
    from = lookupUnit(rest);
    if (!from) {
      // "stone kg" or "in cm" with no separator: try every split point.
      const tokens = rest.split(/\s+/);
      for (let i = 1; i < tokens.length && !from; i++) {
        const a = lookupUnit(tokens.slice(0, i).join(" "));
        const b = lookupUnit(tokens.slice(i).join(" "));
        if (a && b) {
          from = a;
          to = b;
        }
      }
    }
  }
  return { numberRaw, rest, from, to, compound: false };
}

/**
 * Parse "45 mpg in l/100km", "6 ft to cm", "5 ft 11 in to cm", "stone kg" or
 * just "psi". The number is optional; the target unit is optional. "in" is
 * tried as a separator only when nothing stronger is present, and only if
 * the left half then reads as a unit, so "5 in to cm" still means inches.
 */
export function parseQuery(text: string): ParsedQuery {
  const expanded = expandMarks(text.trim());
  const strong = splitOn(expanded, STRONG_SEPARATOR);
  if (strong) return readHalves(strong[0], strong[1]);
  const weak = splitOnLastIn(expanded);
  if (weak) {
    const parsed = readHalves(weak[0], weak[1]);
    if (parsed.from) return parsed;
  }
  return readHalves(expanded, "");
}

/** Search every unit for the picker: name, symbol or alias containing the query. */
export function searchUnits(query: string): UnitRef[] {
  const key = normalise(query);
  if (!key) return [];
  const hits: UnitRef[] = [];
  for (const category of categories) {
    for (const unit of category.units) {
      if (
        normalise(unit.name).includes(key) ||
        normalise(unit.sym).includes(key) ||
        unit.aliases.some((a) => normalise(a).includes(key))
      ) {
        hits.push({ category, unit });
      }
    }
  }
  const best = lookupUnit(query);
  if (best) {
    const i = hits.findIndex((h) => h.unit === best.unit && h.category === best.category);
    if (i > 0) hits.unshift(...hits.splice(i, 1));
  }
  return hits;
}
