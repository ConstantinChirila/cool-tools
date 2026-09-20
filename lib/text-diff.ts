import { createTwoFilesPatch, diffArrays, diffWordsWithSpace } from "diff";

export interface DiffOptions {
  ignoreCase: boolean;
  /** Treats runs of spaces and tabs as one space and ignores them at the ends of a line. */
  ignoreWhitespace: boolean;
}

/** A run of text within a line; `changed` marks the words that differ from the paired line. */
export interface Segment {
  text: string;
  changed: boolean;
}

export interface DiffLine {
  /** 1-based line number in its own text. */
  no: number;
  segments: Segment[];
}

export type DiffBlock =
  | { kind: "same"; lines: { old: DiffLine; new: DiffLine }[] }
  | { kind: "change"; removed: DiffLine[]; added: DiffLine[] };

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export type DiffResult =
  | { status: "ok"; blocks: DiffBlock[]; stats: DiffStats; identical: boolean }
  /** The texts were too large and too different to compare within the time budget. */
  | { status: "timeout" };

/** On the main thread, give up rather than freeze the tab on huge, unrelated texts. */
export const MAIN_THREAD_TIMEOUT_MS = 1500;
/** In a worker nothing freezes, so the budget is how long someone will wait. */
export const WORKER_TIMEOUT_MS = 8000;
/** Word-level highlighting is skipped for lines longer than this. */
const INLINE_MAX_LENGTH = 1000;
/** Below this share of common characters a pair of lines reads as a rewrite, not an edit. */
const INLINE_MIN_SIMILARITY = 0.3;

/** Splits on any line ending. A final newline does not create an extra empty line. */
export function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split(/\r\n|\n|\r/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function lineKey(line: string, options: DiffOptions): string {
  let key = line;
  if (options.ignoreWhitespace) key = key.trim().replace(/\s+/g, " ");
  if (options.ignoreCase) key = key.toLowerCase();
  return key;
}

const plain = (text: string): Segment[] => [{ text, changed: false }];
const lineText = (line: DiffLine) => line.segments.map((s) => s.text).join("");

/** Merges neighbouring segments with the same flag and drops empty ones. */
function compact(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const seg of segments) {
    if (seg.text === "") continue;
    const last = out[out.length - 1];
    if (last && last.changed === seg.changed) last.text += seg.text;
    else out.push({ ...seg });
  }
  return out;
}

/** A space between two changed words joins them into one highlight instead of leaving a gap. */
function bridge(segments: Segment[]): Segment[] {
  const bridged = segments.map((seg, i) => {
    const between = segments[i - 1]?.changed && segments[i + 1]?.changed;
    return between && seg.text.trim() === "" ? { ...seg, changed: true } : seg;
  });
  return compact(bridged);
}

/**
 * Word-level comparison of two lines that sit opposite each other in a change.
 * Returns plain segments when the lines have too little in common for the
 * highlights to mean anything.
 */
export function diffInline(
  oldLine: string,
  newLine: string,
  options: DiffOptions,
): { old: Segment[]; new: Segment[] } {
  const unmarked = { old: plain(oldLine), new: plain(newLine) };
  if (oldLine.length > INLINE_MAX_LENGTH || newLine.length > INLINE_MAX_LENGTH) return unmarked;

  const changes = diffWordsWithSpace(oldLine, newLine, { ignoreCase: options.ignoreCase });
  const oldSegs: Segment[] = [];
  const newSegs: Segment[] = [];
  let common = 0;
  for (const change of changes) {
    const changed = options.ignoreWhitespace ? change.value.trim() !== "" : true;
    if (change.added) newSegs.push({ text: change.value, changed });
    else if (change.removed) oldSegs.push({ text: change.value, changed });
    else {
      common += change.value.length;
      // With ignoreCase this value comes from one side only; restoreText
      // puts each line's own casing back afterwards.
      oldSegs.push({ text: change.value, changed: false });
      newSegs.push({ text: change.value, changed: false });
    }
  }

  const longest = Math.max(oldLine.length, newLine.length);
  if (longest === 0 || common / longest < INLINE_MIN_SIMILARITY) return unmarked;
  return {
    old: restoreText(bridge(compact(oldSegs)), oldLine),
    new: restoreText(bridge(compact(newSegs)), newLine),
  };
}

/** Re-slices segments from the source line so ignored case differences keep their own casing. */
function restoreText(segments: Segment[], source: string): Segment[] {
  let at = 0;
  return segments.map((seg) => {
    const text = source.slice(at, at + seg.text.length);
    at += seg.text.length;
    return { text, changed: seg.changed };
  });
}

export function diffText(
  oldText: string,
  newText: string,
  options: DiffOptions,
  timeoutMs = MAIN_THREAD_TIMEOUT_MS,
): DiffResult {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const changes = diffArrays(
    oldLines.map((l) => lineKey(l, options)),
    newLines.map((l) => lineKey(l, options)),
    { timeout: timeoutMs },
  );
  if (!changes) return { status: "timeout" };

  const blocks: DiffBlock[] = [];
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };
  let oldAt = 0;
  let newAt = 0;

  for (const change of changes) {
    if (!change.added && !change.removed) {
      const lines = [];
      for (let i = 0; i < change.count; i++, oldAt++, newAt++) {
        lines.push({
          old: { no: oldAt + 1, segments: plain(oldLines[oldAt] ?? "") },
          new: { no: newAt + 1, segments: plain(newLines[newAt] ?? "") },
        });
      }
      stats.unchanged += change.count;
      blocks.push({ kind: "same", lines });
      continue;
    }

    // A removal directly followed by an addition is one change block.
    const last = blocks[blocks.length - 1];
    const block: Extract<DiffBlock, { kind: "change" }> =
      last?.kind === "change" ? last : { kind: "change", removed: [], added: [] };
    if (block !== last) blocks.push(block);

    for (let i = 0; i < change.count; i++) {
      if (change.removed) {
        block.removed.push({ no: oldAt + 1, segments: plain(oldLines[oldAt] ?? "") });
        oldAt++;
      } else {
        block.added.push({ no: newAt + 1, segments: plain(newLines[newAt] ?? "") });
        newAt++;
      }
    }
    if (change.removed) stats.removed += change.count;
    else stats.added += change.count;
  }

  for (const block of blocks) {
    if (block.kind !== "change") continue;
    block.removed.forEach((removed, i) => {
      const added = block.added[i];
      if (!added) return;
      const inline = diffInline(lineText(removed), lineText(added), options);
      removed.segments = inline.old;
      added.segments = inline.new;
    });
  }

  return { status: "ok", blocks, stats, identical: stats.added === 0 && stats.removed === 0 };
}

/** Standard unified diff (the format `git diff` and `patch` use). Undefined if it takes too long. */
export function unifiedPatch(oldText: string, newText: string): string | undefined {
  return createTwoFilesPatch("original", "changed", oldText, newText, undefined, undefined, {
    timeout: MAIN_THREAD_TIMEOUT_MS,
  });
}
