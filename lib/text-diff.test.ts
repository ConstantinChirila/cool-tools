import { describe, expect, it } from "vitest";
import { diffInline, diffText, splitLines, unifiedPatch, type DiffOptions } from "@/lib/text-diff";

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

describe("diffText", () => {
  it("reports identical texts", () => {
    const r = ok("one\ntwo", "one\ntwo\n");
    expect(r.identical).toBe(true);
    expect(r.stats).toEqual({ added: 0, removed: 0, unchanged: 2 });
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
