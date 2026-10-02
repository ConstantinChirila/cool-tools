import { fail, ok, type Result } from "@/lib/result";

/**
 * Regex tester engine: JavaScript's own RegExp, so what you see is exactly
 * what a browser or Node does. Matching runs in a worker (lib/regex.worker.ts)
 * because a badly written pattern can backtrack for minutes on a short text.
 */

export type FlagId = "g" | "i" | "m" | "s" | "u" | "v" | "y";

export interface FlagInfo {
  id: FlagId;
  label: string;
  hint: string;
}

/** `d` is left out: the tester always turns it on to find where groups matched. */
export const FLAGS: readonly FlagInfo[] = [
  { id: "g", label: "Global", hint: "Find every match, not just the first" },
  { id: "i", label: "Ignore case", hint: "a matches A" },
  { id: "m", label: "Multiline", hint: "^ and $ match at the start and end of every line" },
  { id: "s", label: "Dot all", hint: ". matches line breaks too" },
  { id: "u", label: "Unicode", hint: "Stricter syntax, \\p{…} and \\u{…}, emoji count as one character" },
  { id: "v", label: "Unicode sets", hint: "Like u, plus set operations in classes: [\\p{L}--[a-z]]" },
  { id: "y", label: "Sticky", hint: "Each match must start exactly where the last one ended" },
];

const FLAG_ORDER = FLAGS.map((f) => f.id).join("");

/** Known flags only, each once, in a fixed order: "gig" and "zg" both become "g". */
export function normaliseFlags(flags: string): string {
  return [...FLAG_ORDER].filter((f) => flags.includes(f)).join("");
}

/** Strips the engine's "Invalid regular expression: /…/: " preamble, which repeats the pattern. */
function tidyError(message: string): string {
  const tidied = message.replace(/^Invalid regular expression: \/[\s\S]*\/[a-z]*: /, "").replace(/^Invalid flags supplied to RegExp constructor '[a-z]*'$/, "Invalid flags");
  return tidied.charAt(0).toUpperCase() + tidied.slice(1);
}

export function compile(pattern: string, flags: string): Result<RegExp> {
  if (flags.includes("u") && flags.includes("v")) return fail("The u and v flags cannot be used together: v already includes u");
  try {
    return ok(new RegExp(pattern, normaliseFlags(flags) + "d"));
  } catch (e) {
    return fail(tidyError(e instanceof Error ? e.message : String(e)));
  }
}

/** Number of capturing groups, from the engine itself: an empty alternative always matches. */
export function countGroups(re: RegExp): number {
  const probe = new RegExp(`|${re.source}`, re.flags.replace(/[gy]/g, ""));
  return (probe.exec("")?.length ?? 1) - 1;
}

export interface GroupSpan {
  /** Undefined when the group did not take part in this match. */
  value: string | undefined;
  start: number;
  end: number;
}

export interface Match {
  start: number;
  end: number;
  text: string;
  /** Index 0 is group 1. */
  groups: GroupSpan[];
}

/** Stop collecting here: the page cannot show more and the count would only slow typing down. */
export const MAX_MATCHES = 10_000;

export interface MatchList {
  matches: Match[];
  /** True when the text had more than MAX_MATCHES matches. */
  capped: boolean;
}

/** Where the next search starts after an empty match: one character on, or one code point in Unicode mode. */
function advance(text: string, index: number, unicode: boolean): number {
  if (!unicode || index + 1 >= text.length) return index + 1;
  const unit = text.charCodeAt(index);
  return unit >= 0xd800 && unit <= 0xdbff ? index + 2 : index + 1;
}

function toMatch(m: RegExpExecArray): Match {
  const groups: GroupSpan[] = [];
  for (let g = 1; g < m.length; g++) {
    const span = m.indices?.[g];
    groups.push({ value: m[g], start: span?.[0] ?? -1, end: span?.[1] ?? -1 });
  }
  return { start: m.index, end: m.index + m[0].length, text: m[0], groups };
}

/**
 * Every match the way String.prototype.matchAll (with g) or exec (without)
 * finds them, including the empty-match step that stops `a*` looping forever.
 */
export function findMatches(re: RegExp, text: string): MatchList {
  const r = new RegExp(re.source, re.flags.includes("d") ? re.flags : re.flags + "d");
  if (!r.global) {
    const m = r.exec(text);
    return { matches: m ? [toMatch(m)] : [], capped: false };
  }
  const unicode = r.unicode || r.unicodeSets;
  const matches: Match[] = [];
  r.lastIndex = 0;
  for (;;) {
    const m = r.exec(text);
    if (!m) return { matches, capped: false };
    if (matches.length === MAX_MATCHES) return { matches, capped: true };
    matches.push(toMatch(m));
    if (m[0] === "") r.lastIndex = advance(text, r.lastIndex, unicode);
  }
}

/** Group names by number (index 0 is group 1), or undefined for unnamed groups. */
export type GroupNames = (string | undefined)[];

/**
 * A replacement string for one match, following the spec's GetSubstitution:
 * $$, $&, $`, $', $1–$99 (two digits only when that group exists) and
 * $<name> (literal when the pattern has no named groups).
 */
export function expandReplacement(replacement: string, match: Match, text: string, names: GroupNames): string {
  const hasNames = names.some((n) => n !== undefined);
  let out = "";
  let i = 0;
  while (i < replacement.length) {
    const ch = replacement[i];
    const next = replacement[i + 1];
    if (ch !== "$" || next === undefined) {
      out += ch;
      i++;
      continue;
    }
    if (next === "$") {
      out += "$";
      i += 2;
    } else if (next === "&") {
      out += match.text;
      i += 2;
    } else if (next === "`") {
      out += text.slice(0, match.start);
      i += 2;
    } else if (next === "'") {
      out += text.slice(Math.min(match.end, text.length));
      i += 2;
    } else if (next >= "0" && next <= "9") {
      const two = replacement[i + 2];
      let digits = two !== undefined && two >= "0" && two <= "9" ? next + two : next;
      if (Number(digits) > match.groups.length && digits.length === 2) digits = next;
      const index = Number(digits);
      if (index >= 1 && index <= match.groups.length) out += match.groups[index - 1]?.value ?? "";
      else out += "$" + digits;
      i += 1 + digits.length;
    } else if (next === "<" && hasNames) {
      const close = replacement.indexOf(">", i + 2);
      if (close === -1) {
        out += "$<";
        i += 2;
        continue;
      }
      const name = replacement.slice(i + 2, close);
      // With duplicate names only one of the groups can have matched.
      out += names.flatMap((n, g) => (n === name ? [match.groups[g]?.value] : [])).find((v) => v !== undefined) ?? "";
      i = close + 1;
    } else {
      out += "$";
      i++;
    }
  }
  return out;
}

export type ReplacePiece = { kind: "text"; text: string } | { kind: "sub"; text: string; match: number };

/** The replaced text as pieces, so the page can mark what each match turned into. */
export function replacePieces(text: string, matches: Match[], replacement: string, names: GroupNames): ReplacePiece[] {
  const pieces: ReplacePiece[] = [];
  let at = 0;
  matches.forEach((m, index) => {
    if (m.start > at) pieces.push({ kind: "text", text: text.slice(at, m.start) });
    pieces.push({ kind: "sub", text: expandReplacement(replacement, m, text, names), match: index });
    at = m.end;
  });
  if (at < text.length) pieces.push({ kind: "text", text: text.slice(at) });
  return pieces;
}

export interface Highlight {
  start: number;
  end: number;
  /** Which match this run belongs to. */
  match: number;
  /** Innermost group covering the run (1-based), or 0 for the match itself. */
  group: number;
}

/**
 * Splits each match into runs coloured by its innermost group. Groups nest,
 * so at any point the one that started last (and ends first) is innermost.
 * Lookahead groups can reach past the match; they are clipped to it.
 */
export function highlights(matches: Match[]): Highlight[] {
  const out: Highlight[] = [];
  matches.forEach((m, index) => {
    if (m.start === m.end) {
      out.push({ start: m.start, end: m.end, match: index, group: 0 });
      return;
    }
    const cuts = new Set([m.start, m.end]);
    for (const g of m.groups) {
      if (g.start < 0 || g.start === g.end) continue;
      cuts.add(Math.max(m.start, Math.min(m.end, g.start)));
      cuts.add(Math.max(m.start, Math.min(m.end, g.end)));
    }
    const points = [...cuts].sort((a, b) => a - b);
    for (let p = 0; p + 1 < points.length; p++) {
      const start = points[p] ?? 0;
      const end = points[p + 1] ?? 0;
      let group = 0;
      let best: GroupSpan | undefined;
      m.groups.forEach((g, gi) => {
        if (g.start < 0 || g.start > start || g.end < end || g.start === g.end) return;
        if (!best || g.start > best.start || (g.start === best.start && g.end <= best.end)) {
          best = g;
          group = gi + 1;
        }
      });
      const last = out[out.length - 1];
      if (last && last.match === index && last.group === group && last.end === start) last.end = end;
      else out.push({ start, end, match: index, group });
    }
  });
  return out;
}

export interface RunResult {
  matches: Match[];
  capped: boolean;
  groupCount: number;
  /** Present when a replacement was asked for: the whole replaced text. */
  output?: string;
  /** The replaced text in pieces; left out when the match list was capped. */
  pieces?: ReplacePiece[];
}

export interface RunInput {
  pattern: string;
  flags: string;
  text: string;
  /** Null when replace mode is off. */
  replacement: string | null;
  names: GroupNames;
}

/** Everything the page shows for one set of inputs. Can take forever on a bad pattern: run it in the worker. */
export function runRegex({ pattern, flags, text, replacement, names }: RunInput): Result<RunResult> {
  const compiled = compile(pattern, flags);
  if (!compiled.ok) return compiled;
  const re = compiled.value;
  const { matches, capped } = findMatches(re, text);
  const result: RunResult = { matches, capped, groupCount: countGroups(re) };
  if (replacement !== null) {
    result.output = text.replace(new RegExp(re.source, re.flags), replacement);
    if (!capped) result.pieces = replacePieces(text, matches, replacement, names);
  }
  return ok(result);
}
