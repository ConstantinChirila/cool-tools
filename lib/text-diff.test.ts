import { describe, expect, it } from "vitest";
import {
  buildRows,
  countLines,
  diffInline,
  diffText,
  FOLD_CONTEXT,
  rowKey,
  splitLines,
  unifiedPatch,
  type DiffOptions,
  type DiffRow,
} from "@/lib/text-diff";

const exact: DiffOptions = { ignoreCase: false, ignoreWhitespace: false };

function ok(oldText: string, newText: string, options: DiffOptions = exact) {
  const result = diffText(oldText, newText, options);
  if (result.status !== "ok") throw new Error("diff timed out");
  return result;
}

function changeAt(result: ReturnType<typeof ok>, index: number) {
  const block = result.blocks[index];
  if (block?.kind !== "change") throw new Error(`block ${index} is not a change`);
  return block;
}

function sameAt(result: ReturnType<typeof ok>, index: number) {
  const block = result.blocks[index];
  if (block?.kind !== "same") throw new Error(`block ${index} is not unchanged`);
  return block;
}

const text = (segments: { text: string }[]) => segments.map((s) => s.text).join("");
const marked = (segments: { text: string; changed: boolean }[]) =>
  segments.filter((s) => s.changed).map((s) => s.text);

describe("splitLines", () => {
  it("handles every line ending and ignores one final newline", () => {
    expect(splitLines("a\nb\r\nc\rd\n")).toEqual(["a", "b", "c", "d"]);
  });

  it("keeps blank lines, and an empty text has no lines", () => {
    expect(splitLines("a\n\nb")).toEqual(["a", "", "b"]);
    expect(splitLines("")).toEqual([]);
  });
});

describe("countLines", () => {
  it("agrees with splitLines without building the lines", () => {
    for (const text of ["", "a", "a\n", "a\n\n", "a\r\nb\rc\n", "\n", "a\nb"]) {
      expect(countLines(text)).toBe(splitLines(text).length);
    }
  });
});

describe("diffText", () => {
  it("reports identical texts", () => {
    const r = ok("one\ntwo", "one\ntwo");
    expect(r.identical).toBe(true);
    expect(r.finalNewlineDiffers).toBe(false);
    expect(r.stats).toEqual({ added: 0, removed: 0, unchanged: 2 });
  });

  it("flags texts whose only difference is the final line break", () => {
    const r = ok("one\ntwo", "one\ntwo\n");
    expect(r.identical).toBe(true);
    expect(r.finalNewlineDiffers).toBe(true);
    expect(unifiedPatch("one\ntwo", "one\ntwo\n")).toContain("No newline at end of file");
    expect(ok("one\n", "two\n").finalNewlineDiffers).toBe(false);
  });

  it("groups a replaced line into one change block with correct line numbers", () => {
    const r = ok("a\nb\nc", "a\nB2\nc\nd");
    expect(r.blocks.map((b) => b.kind)).toEqual(["same", "change", "same", "change"]);
    expect(r.stats).toEqual({ added: 2, removed: 1, unchanged: 2 });

    const change = changeAt(r, 1);
    expect(change.removed.map((l) => l.no)).toEqual([2]);
    expect(change.added.map((l) => l.no)).toEqual([2]);

    const tail = changeAt(r, 3);
    expect(tail.removed).toEqual([]);
    expect(tail.added.map((l) => [l.no, text(l.segments)])).toEqual([[4, "d"]]);
  });

  it("treats everything as added when the original is empty", () => {
    const r = ok("", "x\ny");
    expect(r.stats).toEqual({ added: 2, removed: 0, unchanged: 0 });
  });

  it("ignores case only when asked", () => {
    expect(ok("Hello", "hello").identical).toBe(false);
    expect(ok("Hello", "hello", { ...exact, ignoreCase: true }).identical).toBe(true);
  });

  it("ignores indentation, trailing and repeated spaces only when asked", () => {
    const a = "  if (x)  {\nreturn 1;";
    const b = "if (x) {\t\n    return 1;";
    expect(ok(a, b).identical).toBe(false);
    expect(ok(a, b, { ...exact, ignoreWhitespace: true }).identical).toBe(true);
  });

  it("shows each side's own text for lines matched under an ignore option", () => {
    const r = ok("Hello", "hello", { ...exact, ignoreCase: true });
    const [line] = sameAt(r, 0).lines;
    expect(text(line?.old.segments ?? [])).toBe("Hello");
    expect(text(line?.new.segments ?? [])).toBe("hello");
  });

  it("highlights the words that changed within a paired line", () => {
    const r = ok("the quick brown fox", "the quick red fox");
    const block = changeAt(r, 0);
    const removed = block.removed[0]?.segments ?? [];
    const added = block.added[0]?.segments ?? [];
    expect(marked(removed)).toEqual(["brown"]);
    expect(marked(added)).toEqual(["red"]);
    expect(text(removed)).toBe("the quick brown fox");
    expect(text(added)).toBe("the quick red fox");
  });
});

describe("diffInline", () => {
  it("leaves unrelated lines unmarked", () => {
    const r = diffInline("completely different", "nothing shared at all here", exact);
    expect(marked(r.old)).toEqual([]);
    expect(marked(r.new)).toEqual([]);
  });

  it("keeps each line's casing when case is ignored", () => {
    const r = diffInline("The Quick brown fox", "the quick red fox", { ...exact, ignoreCase: true });
    expect(text(r.old)).toBe("The Quick brown fox");
    expect(text(r.new)).toBe("the quick red fox");
    expect(marked(r.old)).toEqual(["brown"]);
  });

  it("joins neighbouring changed words into one highlight", () => {
    const r = diffInline("see the red fox run", "see a blue fox run", exact);
    expect(marked(r.old)).toEqual(["the red"]);
    expect(marked(r.new)).toEqual(["a blue"]);
  });

  it("does not mark whitespace-only differences when whitespace is ignored", () => {
    const r = diffInline("a  b c", "a b d", { ...exact, ignoreWhitespace: true });
    expect(marked(r.old)).toEqual(["c"]);
    expect(marked(r.new)).toEqual(["d"]);
  });
});

describe("unifiedPatch", () => {
  it("produces a unified diff with hunk markers", () => {
    const patch = unifiedPatch("a\nb\n", "a\nc\n");
    expect(patch).toContain("--- original");
    expect(patch).toContain("+++ changed");
    expect(patch).toContain("-b\n+c");
  });
});

describe("buildRows", () => {
  const numbered = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`);
  /** 20 lines with line 10 edited: blocks are same(9), change, same(10). */
  const edited = () => {
    const before = numbered(20);
    const after = before.map((l, i) => (i === 9 ? `${l} edited` : l));
    return ok(before.join("\n"), after.join("\n"));
  };
  const NONE = new Set<number>();
  const kinds = (rows: DiffRow[]) => rows.map((r) => (r.kind === "fold" ? `fold:${r.count}` : r.kind));
  const shownAndHidden = (rows: DiffRow[]) =>
    rows.reduce((n, r) => n + (r.kind === "same" ? 1 : r.kind === "fold" ? r.count : 0), 0);

  it("keeps three lines of context either side of a change and folds the rest", () => {
    const r = edited();
    const rows = buildRows(r.blocks, "split", true, NONE);
    expect(kinds(rows)).toEqual(["fold:6", "same", "same", "same", "change", "same", "same", "same", "fold:7"]);
    expect(FOLD_CONTEXT).toBe(3);
    // The context really is the lines next to the change, and nothing is lost.
    const same = rows.flatMap((row) => (row.kind === "same" ? [row.old.no] : []));
    expect(same).toEqual([7, 8, 9, 11, 12, 13]);
    expect(shownAndHidden(rows)).toBe(r.stats.unchanged);
  });

  it("shows every line when folding is off or the block has been opened", () => {
    const r = edited();
    expect(buildRows(r.blocks, "split", false, NONE).filter((row) => row.kind === "same")).toHaveLength(19);
    const opened = buildRows(r.blocks, "split", true, new Set([0]));
    expect(kinds(opened).slice(0, 10)).toEqual([...Array<string>(9).fill("same"), "change"]);
    expect(kinds(opened).at(-1)).toBe("fold:7");
    expect(shownAndHidden(opened)).toBe(r.stats.unchanged);
  });

  it("does not fold a gap too short to be worth a fold row", () => {
    // Changes at lines 2 and 12: the block between them has 9 lines, so 3 hidden after context, below the minimum.
    const before = numbered(13);
    const after = before.map((l, i) => (i === 1 || i === 11 ? `${l} edited` : l));
    const rows = buildRows(ok(before.join("\n"), after.join("\n")).blocks, "split", true, NONE);
    expect(rows.some((row) => row.kind === "fold")).toBe(false);

    // One more line in the gap and it folds exactly the 4 lines without context.
    const longer = numbered(14);
    const longerAfter = longer.map((l, i) => (i === 1 || i === 12 ? `${l} edited` : l));
    const folded = buildRows(ok(longer.join("\n"), longerAfter.join("\n")).blocks, "split", true, NONE);
    expect(kinds(folded).filter((k) => k.startsWith("fold"))).toEqual(["fold:4"]);
  });

  it("pairs lines in split view and lists removals before additions in unified view", () => {
    const r = ok("a\nb\nc", "x\ny\nc\n");
    const split = buildRows(r.blocks, "split", true, NONE);
    expect(split[0]).toMatchObject({ kind: "change", removed: { no: 1 }, added: { no: 1 } });
    expect(split[1]).toMatchObject({ kind: "change", removed: { no: 2 }, added: { no: 2 } });

    const unified = buildRows(r.blocks, "unified", true, NONE);
    expect(unified.slice(0, 4).map((row) => (row.kind === "change" ? (row.removed ? `-${row.removed.no}` : `+${row.added?.no}`) : ""))).toEqual(["-1", "-2", "+1", "+2"]);
  });

  it("gives every row a distinct key that survives opening a fold", () => {
    const r = edited();
    for (const view of ["split", "unified"] as const) {
      const folded = buildRows(r.blocks, view, true, NONE).map(rowKey);
      const opened = buildRows(r.blocks, view, true, new Set([0, 2])).map(rowKey);
      expect(new Set(opened).size).toBe(opened.length);
      for (const key of folded.filter((k) => !k.startsWith("fold"))) expect(opened).toContain(key);
    }
  });
});
