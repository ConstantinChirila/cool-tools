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

interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export type DiffResult =
  | {
      status: "ok";
      blocks: DiffBlock[];
      stats: DiffStats;
      /** No line was added or removed, under the options given. */
      identical: boolean;
      /** One text ends with a line break and the other does not: invisible line by line, real in a patch. */
      finalNewlineDiffers: boolean;
    }
  /** The texts were too large and too different to compare within the time budget. */
  | { status: "timeout" };

/** On the main thread, give up rather than freeze the tab on huge, unrelated texts. */
const MAIN_THREAD_TIMEOUT_MS = 1500;
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

const endsWithNewline = (text: string) => /[\r\n]$/.test(text);

/** Line count without building the lines: cheap enough to run on every keystroke. */
export function countLines(text: string): number {
  if (text === "") return 0;
  let lines = 1;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // \r\n is one break: count the \r and skip the \n.
    if (code === 13) {
      lines++;
      if (text.charCodeAt(i + 1) === 10) i++;
    } else if (code === 10) lines++;
  }
  return endsWithNewline(text) ? lines - 1 : lines;
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

  return {
    status: "ok",
    blocks,
    stats,
    identical: stats.added === 0 && stats.removed === 0,
    finalNewlineDiffers: endsWithNewline(oldText) !== endsWithNewline(newText),
  };
}

/** Standard unified diff (the format `git diff` and `patch` use). Undefined if it takes too long. */
export function unifiedPatch(
  oldText: string,
  newText: string,
  timeoutMs = MAIN_THREAD_TIMEOUT_MS,
): string | undefined {
  return createTwoFilesPatch("original", "changed", oldText, newText, undefined, undefined, {
    timeout: timeoutMs,
  });
}

/* ---------- Rows: what the result view draws ---------- */

export type DiffView = "split" | "unified";

export type DiffRow =
  | { kind: "same"; old: DiffLine; new: DiffLine }
  /** Split view pairs a removed line with an added one; unified view has one or the other. */
  | { kind: "change"; removed?: DiffLine; added?: DiffLine }
  /** Stands in for `count` unchanged lines of block `block`. */
  | { kind: "fold"; block: number; count: number };

/** Unchanged lines kept either side of a change when the rest is folded away. */
export const FOLD_CONTEXT = 3;
/** Folding fewer lines than this saves no space once the fold row itself is counted. */
const FOLD_MIN = 4;

/**
 * Flattens blocks into display rows. With `fold` on, the middle of a long
 * unchanged block becomes one fold row, unless its index is in `unfolded`.
 * The first block keeps no leading context and the last no trailing context,
 * since there is no change on that side to give context to.
 */
export function buildRows(
  blocks: readonly DiffBlock[],
  view: DiffView,
  fold: boolean,
  unfolded: ReadonlySet<number>,
): DiffRow[] {
  const rows: DiffRow[] = [];
  blocks.forEach((block, index) => {
    if (block.kind === "change") {
      if (view === "unified") {
        for (const removed of block.removed) rows.push({ kind: "change", removed });
        for (const added of block.added) rows.push({ kind: "change", added });
      } else {
        const height = Math.max(block.removed.length, block.added.length);
        for (let i = 0; i < height; i++) {
          rows.push({ kind: "change", removed: block.removed[i], added: block.added[i] });
        }
      }
      return;
    }
    const start = index === 0 ? 0 : FOLD_CONTEXT;
    const end = block.lines.length - (index === blocks.length - 1 ? 0 : FOLD_CONTEXT);
    const folded = fold && !unfolded.has(index) && end - start >= FOLD_MIN;
    block.lines.forEach((line, i) => {
      if (folded && i >= start && i < end) {
        if (i === start) rows.push({ kind: "fold", block: index, count: end - start });
        return;
      }
      rows.push({ kind: "same", ...line });
    });
  });
  return rows;
}

/** A key that stays with its row when a fold opens above it. */
export function rowKey(row: DiffRow): string {
  if (row.kind === "fold") return `fold-${row.block}`;
  if (row.kind === "same") return `same-${row.old.no}`;
  return `change-${row.removed?.no ?? ""}-${row.added?.no ?? ""}`;
}
