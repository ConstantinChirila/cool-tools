import { describe, expect, it } from "vitest";
import {
  compile,
  countGroups,
  expandReplacement,
  findMatches,
  highlights,
  MAX_MATCHES,
  normaliseFlags,
  replacePieces,
  runRegex,
  type GroupNames,
} from "@/lib/regex";
import { explain } from "@/lib/regex-explain";
import { LIBRARY } from "@/lib/regex-library";

function re(pattern: string, flags = "") {
  const result = compile(pattern, flags);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

const names = (pattern: string, flags = ""): GroupNames => explain(pattern, flags).groups.map((g) => g.name);

describe("compile", () => {
  it("drops the engine's preamble from errors", () => {
    const result = compile("(abc", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("Invalid regular expression");
      expect(result.error).toMatch(/^Unterminated group/);
    }
  });

  it("refuses u with v", () => {
    expect(compile("a", "uv").ok).toBe(false);
  });

  it("normalises flags", () => {
    expect(normaliseFlags("yigzg")).toBe("giy");
  });
});

describe("findMatches", () => {
  it("finds every match with g and only the first without", () => {
    expect(findMatches(re("a", "g"), "banana").matches.map((m) => m.start)).toEqual([1, 3, 5]);
    expect(findMatches(re("a"), "banana").matches).toHaveLength(1);
  });

  it("steps past empty matches like matchAll", () => {
    const text = "abc";
    const ours = findMatches(re("x*", "g"), text).matches.map((m) => m.start);
    const native = [...text.matchAll(/x*/g)].map((m) => m.index);
    expect(ours).toEqual(native);
  });

  it("steps over a whole emoji in unicode mode", () => {
    const text = "😀😀";
    expect(findMatches(re("", "gu"), text).matches.map((m) => m.start)).toEqual([...text.matchAll(/(?:)/gu)].map((m) => m.index));
    expect(findMatches(re("", "g"), text).matches).toHaveLength(5);
  });

  it("reports group spans, and -1 for groups that did not take part", () => {
    const [m] = findMatches(re("(a)|(b)", "g"), "b").matches;
    expect(m?.groups).toEqual([
      { value: undefined, start: -1, end: -1 },
      { value: "b", start: 0, end: 1 },
    ]);
  });

  it("stops at the cap", () => {
    const result = findMatches(re("a", "g"), "a".repeat(MAX_MATCHES + 5));
    expect(result.matches).toHaveLength(MAX_MATCHES);
    expect(result.capped).toBe(true);
  });

  it("honours sticky", () => {
    expect(findMatches(re("a", "gy"), "aab").matches).toHaveLength(2);
    expect(findMatches(re("b", "gy"), "aab").matches).toHaveLength(0);
  });
});

describe("countGroups", () => {
  it("counts capturing groups only", () => {
    expect(countGroups(re(String.raw`(a)(?:b)(?<c>c)[(]\(`))).toBe(2);
  });
});

describe("expandReplacement", () => {
  const cases: [string, string, string][] = [
    ["(\\w+)-(\\w+)", "g", "$2-$1"],
    ["(\\w+)", "g", "[$&] $$ $` $' $0 $00 $9 $10 $01"],
    ["(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)", "", "$11 $10 $1a $012 $100"],
    ["(?<first>\\w)(?<rest>\\w*)", "g", "$<rest>$<first>ay $<nope> $<first"],
    ["(\\w)", "g", "$<first>"],
    ["(a)|(b)", "g", "<$1|$2>"],
    ["x*", "g", "-"],
    ["(?<n>a)|(?<n>b)", "g", "[$<n>]"],
  ];
  const text = "abcdefghijk hello-world ab";

  it.each(cases)("%s with %s and %s matches String.replace", (pattern, flags, replacement) => {
    const compiled = re(pattern, flags);
    const { matches } = findMatches(compiled, text);
    const pieces = replacePieces(text, matches, replacement, names(pattern, flags));
    expect(pieces.map((p) => p.text).join("")).toBe(text.replace(new RegExp(pattern, flags), replacement));
  });

  it("leaves $<name> alone when the pattern has no named groups", () => {
    const [m] = findMatches(re("(a)"), "a").matches;
    if (!m) throw new Error("no match");
    expect(expandReplacement("$<x>", m, "a", [undefined])).toBe("$<x>");
  });
});

describe("highlights", () => {
  it("colours each run by its innermost group", () => {
    const { matches } = findMatches(re("(a(b))c"), "abc");
    expect(highlights(matches)).toEqual([
      { start: 0, end: 1, match: 0, group: 1 },
      { start: 1, end: 2, match: 0, group: 2 },
      { start: 2, end: 3, match: 0, group: 0 },
    ]);
  });

  it("clips lookahead groups to the match", () => {
    const { matches } = findMatches(re("a(?=(bc))"), "abc");
    expect(highlights(matches)).toEqual([{ start: 0, end: 1, match: 0, group: 0 }]);
  });

  it("keeps empty matches as zero-width runs", () => {
    const { matches } = findMatches(re("(?=b)", "g"), "abab");
    expect(highlights(matches).map((h) => [h.start, h.end])).toEqual([
      [1, 1],
      [3, 3],
    ]);
  });
});

describe("runRegex", () => {
  it("returns the full replaced text and its pieces", () => {
    const result = runRegex({ pattern: "o", flags: "g", text: "foo", replacement: "0", names: [] });
    expect(result.ok && result.value.output).toBe("f00");
    expect(result.ok && result.value.pieces?.filter((p) => p.kind === "sub")).toHaveLength(2);
  });

  it("passes compile errors through", () => {
    expect(runRegex({ pattern: "[", flags: "", text: "", replacement: null, names: [] }).ok).toBe(false);
  });
});

describe("library", () => {
  it.each(LIBRARY.map((p) => [p.id, p] as const))("%s finds the expected matches in its sample", (_, p) => {
    const result = runRegex({ pattern: p.pattern, flags: p.flags, text: p.sample, replacement: p.replacement ?? null, names: names(p.pattern, p.flags) });
    if (!result.ok) throw new Error(result.error);
    expect(result.value.matches.length).toBe(p.expected);
  });

  it("has unique ids", () => {
    expect(new Set(LIBRARY.map((p) => p.id)).size).toBe(LIBRARY.length);
  });
});
