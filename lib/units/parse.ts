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
export function lookupUnit(raw: string): UnitRef | null {
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

export interface ParsedQuery {
  /** The number as typed, or "" when the phrase had no number. */
  numberRaw: string;
  /** Everything after the number. */
  rest: string;
  from: UnitRef | null;
  to: UnitRef | null;
}

const SEPARATOR = /\s+(?:to|in|into|as|→|->|=)\s+|\s*(?:→|->|=)\s*/i;
const LEADING_NUMBER =
  /^([-+]?\d+:\d{1,2}(?::\d{1,2})?|[-+]?(?:\d[\d,]*(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?)?\s*(.*)$/i;

/** Does this look like "45 mpg in l/100km" rather than a bare number? */
export function isPhrase(raw: string): boolean {
  return /[a-z°µ′″]/i.test(raw) && !/^[-+]?(\d+\.?\d*|\.\d+)e[-+]?\d+$/i.test(raw.trim());
}

/**
 * Parse "45 mpg in l/100km", "6 ft to cm", "stone kg" or just "psi". The
 * number is optional; the target unit is optional; "in" only separates when
 * it has a space on both sides, so "5 in to cm" still means inches.
 */
export function parseQuery(text: string): ParsedQuery {
  const match = text.trim().match(LEADING_NUMBER);
  const numberRaw = match?.[1] ?? "";
  const rest = (match?.[2] ?? "").trim();
  const parts = rest.split(SEPARATOR).map((p) => p.trim()).filter(Boolean);
  let from: UnitRef | null = null;
  let to: UnitRef | null = null;
  if (parts.length >= 2) {
    from = lookupUnit(parts[0] ?? "");
    to = lookupUnit(parts[parts.length - 1] ?? "");
  } else if (parts.length === 1) {
    const only = parts[0] ?? "";
    from = lookupUnit(only);
    if (!from) {
      // "stone kg" with no separator: try every split point.
      const tokens = only.split(/\s+/);
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
  return { numberRaw, rest, from, to };
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
