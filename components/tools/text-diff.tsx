"use client";

import * as React from "react";
import { ArrowLeftRight, Check, Copy, Eraser, FoldVertical, LoaderCircle, Sparkles, UnfoldVertical } from "lucide-react";
import { Callout } from "@/components/calc/callout";
import { Segmented } from "@/components/calc/segmented";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTextDiff } from "@/hooks/use-text-diff";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  splitLines,
  unifiedPatch,
  type DiffBlock,
  type DiffLine,
  type DiffResult,
} from "@/lib/text-diff";
import { cn } from "@/lib/utils";

type View = "split" | "unified";

const SAMPLE_OLD = `Shopping list for Saturday

2 pints of semi-skimmed milk
1 sliced white loaf
6 free range eggs
Cheddar, mature
Tea bags (80)
Digestive biscuits
Washing up liquid

Pick up the parcel from the post office before noon.`;

const SAMPLE_NEW = `Shopping list for Sunday

2 pints of semi-skimmed milk
1 sliced wholemeal loaf
12 free range eggs
Cheddar, mature
Tea bags (80)
Chocolate digestive biscuits
Washing up liquid
Kitchen roll

Pick up the parcel from the post office before noon.`;

/** Unchanged lines kept either side of a change when the rest is folded away. */
const CONTEXT = 3;
/** Folding fewer lines than this saves no space once the fold row itself is counted. */
const MIN_FOLD = 4;
/** Rows drawn at once: two huge unrelated texts would otherwise put 100,000 cells on the page. */
const ROW_PAGE = 2000;

const EMPTY: Set<number> = new Set();

type Row =
  | { kind: "same"; old: DiffLine; new: DiffLine }
  | { kind: "change"; removed?: DiffLine; added?: DiffLine }
  | { kind: "fold"; block: number; count: number };

function buildRows(blocks: DiffBlock[], view: View, fold: boolean, unfolded: Set<number>): Row[] {
  const rows: Row[] = [];
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
    const start = index === 0 ? 0 : CONTEXT;
    const end = block.lines.length - (index === blocks.length - 1 ? 0 : CONTEXT);
    const folded = fold && !unfolded.has(index) && end - start >= MIN_FOLD;
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

function useIsWide() {
  return React.useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(min-width: 768px)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );
}

const NUMBER_CELL = "select-none px-2 text-right text-xs leading-6 text-muted-foreground";
const TONE = {
  removed: { row: "bg-pink/35", mark: "bg-pink", sign: "−" },
  added: { row: "bg-mint/45", mark: "bg-mint", sign: "+" },
  same: { row: "", mark: "", sign: "" },
} as const;

function LineText({ line, tone }: { line?: DiffLine; tone: keyof typeof TONE }) {
  if (!line) return <div className="bg-secondary/70" />;
  const { row, mark, sign } = TONE[tone];
  return (
    <div className={cn("flex min-w-0 pr-3 leading-6", row)}>
      <span className="w-5 shrink-0 select-none text-center font-bold" aria-hidden={sign === ""}>
        {sign}
      </span>
      <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
        {line.segments.map((seg, i) =>
          seg.changed ? (
            <mark key={i} className={cn("rounded-[3px] text-foreground", mark)}>
              {seg.text}
            </mark>
          ) : (
            <React.Fragment key={i}>{seg.text}</React.Fragment>
          ),
        )}
        {line.segments.every((seg) => seg.text === "") && "\u00a0"}
      </span>
    </div>
  );
}

function LineNumber({ line, tone, divider }: { line?: DiffLine; tone: keyof typeof TONE; divider?: boolean }) {
  return (
    <div
      className={cn(
        NUMBER_CELL,
        line ? TONE[tone].row : "bg-secondary/70",
        divider && "border-l-2 border-foreground/15",
      )}
    >
      {line?.no}
    </div>
  );
}

function DiffRows({
  rows,
  view,
  onUnfold,
}: {
  rows: Row[];
  view: View;
  onUnfold: (block: number) => void;
}) {
  return (
    <div
      className={cn(
        "grid font-mono text-[13px]",
        view === "split"
          ? "grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
          : "grid-cols-[auto_auto_minmax(0,1fr)]",
      )}
    >
      {rows.map((row, i) => {
        if (row.kind === "fold") {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onUnfold(row.block)}
              className="col-span-full my-1 flex h-8 items-center justify-center gap-2 border-y-2 border-dashed border-foreground/25 bg-secondary font-sans text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <UnfoldVertical className="size-3.5" strokeWidth={2.5} />
              Show {row.count} unchanged lines
            </button>
          );
        }
        if (view === "split") {
          const left = row.kind === "same" ? row.old : row.removed;
          const right = row.kind === "same" ? row.new : row.added;
          const leftTone = row.kind === "same" ? "same" : "removed";
          const rightTone = row.kind === "same" ? "same" : "added";
          return (
            <React.Fragment key={i}>
              <LineNumber line={left} tone={leftTone} />
              <LineText line={left} tone={leftTone} />
              <LineNumber line={right} tone={rightTone} divider />
              <LineText line={right} tone={rightTone} />
            </React.Fragment>
          );
        }
        if (row.kind === "same") {
          return (
            <React.Fragment key={i}>
              <LineNumber line={row.old} tone="same" />
              <LineNumber line={row.new} tone="same" />
              <LineText line={row.new} tone="same" />
            </React.Fragment>
          );
        }
        const tone = row.removed ? "removed" : "added";
        return (
          <React.Fragment key={i}>
            <div className={cn(NUMBER_CELL, TONE[tone].row)}>{row.removed?.no}</div>
            <div className={cn(NUMBER_CELL, TONE[tone].row)}>{row.added?.no}</div>
            <LineText line={row.removed ?? row.added} tone={tone} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TextPane({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const lines = splitLines(value).length;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-bold">
          {label}
        </label>
        <span className="text-xs font-semibold text-muted-foreground text-numeric">
          {lines.toLocaleString("en-GB")} {lines === 1 ? "line" : "lines"}
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        className="h-80 resize-y field-sizing-fixed rounded-2xl border-[2.5px] border-foreground bg-card px-3.5 py-3 font-mono text-base leading-6 focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 md:text-[13px]"
      />
    </div>
  );
}

const PILL =
  "inline-flex h-9 items-center gap-1.5 rounded-full border-[2.5px] border-foreground px-3.5 text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

function TogglePill({
  pressed,
  onPressedChange,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(PILL, pressed ? "bg-foreground text-background" : "bg-card hover:bg-secondary")}
    >
      {children}
    </button>
  );
}

function count(n: number, noun: string) {
  return `${n.toLocaleString("en-GB")} ${noun}`;
}

export function TextDiff() {
  const [oldText, setOldText] = React.useState(SAMPLE_OLD);
  const [newText, setNewText] = React.useState(SAMPLE_NEW);
  const [view, setView] = React.useState<View>("split");
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(false);
  const [fold, setFold] = React.useState(true);
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle");

  // The texts stay out of the URL on purpose: they can be long and private.
  useUrlState({
    view: urlField(view, setView, "split" as View, ["split", "unified"]),
    ic: urlField(ignoreCase, setIgnoreCase, false),
    iw: urlField(ignoreWhitespace, setIgnoreWhitespace, false),
    fold: urlField(fold, setFold, true),
  });

  const deferredOld = React.useDeferredValue(oldText);
  const deferredNew = React.useDeferredValue(newText);
  const { result, pending } = useTextDiff(deferredOld, deferredNew, { ignoreCase, ignoreWhitespace });

  // What has been opened up belongs to one result; a new diff starts folded and capped again.
  const [opened, setOpened] = React.useState<{ of: DiffResult | null; blocks: Set<number>; rows: number }>({
    of: result,
    blocks: EMPTY,
    rows: ROW_PAGE,
  });
  const unfoldedBlocks = opened.of === result ? opened.blocks : EMPTY;
  const rowLimit = opened.of === result ? opened.rows : ROW_PAGE;
  const unfoldBlock = (block: number) =>
    setOpened({ of: result, blocks: new Set(unfoldedBlocks).add(block), rows: rowLimit });
  const showMoreRows = () => setOpened({ of: result, blocks: unfoldedBlocks, rows: rowLimit + ROW_PAGE });

  const isWide = useIsWide();
  const shownView: View = isWide ? view : "unified";
  const rows = React.useMemo(
    () => (result?.status === "ok" ? buildRows(result.blocks, shownView, fold, unfoldedBlocks) : []),
    [result, shownView, fold, unfoldedBlocks],
  );

  const empty = oldText === "" && newText === "";
  const ignoring = [ignoreCase && "case", ignoreWhitespace && "whitespace"].filter(Boolean).join(" and ");

  const copyPatch = async () => {
    const patch = unifiedPatch(oldText, newText);
    let state: typeof copyState = "failed";
    if (patch !== undefined) {
      try {
        await navigator.clipboard.writeText(patch);
        state = "copied";
      } catch {
        // Clipboard is unavailable (permissions or an insecure context).
      }
    }
    setCopyState(state);
    window.setTimeout(() => setCopyState("idle"), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <TextPane
              id="diff-old"
              label="Original"
              value={oldText}
              onChange={setOldText}
              placeholder="Paste the original text here"
            />
            <TextPane
              id="diff-new"
              label="Changed"
              value={newText}
              onChange={setNewText}
              placeholder="Paste the changed text here"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TogglePill pressed={ignoreCase} onPressedChange={setIgnoreCase}>
              Ignore case
            </TogglePill>
            <TogglePill pressed={ignoreWhitespace} onPressedChange={setIgnoreWhitespace}>
              Ignore whitespace
            </TogglePill>
            <span className="grow" />
            <button
              type="button"
              onClick={() => {
                setOldText(newText);
                setNewText(oldText);
              }}
              disabled={empty}
              className={cn(PILL, "bg-card hover:bg-secondary")}
            >
              <ArrowLeftRight className="size-4" strokeWidth={2.5} />
              Swap
            </button>
            <button
              type="button"
              onClick={() => {
                setOldText(SAMPLE_OLD);
                setNewText(SAMPLE_NEW);
              }}
              className={cn(PILL, "bg-card hover:bg-secondary")}
            >
              <Sparkles className="size-4" strokeWidth={2.5} />
              Sample
            </button>
            <button
              type="button"
              onClick={() => {
                setOldText("");
                setNewText("");
              }}
              disabled={empty}
              className={cn(PILL, "bg-card hover:bg-secondary")}
            >
              <Eraser className="size-4" strokeWidth={2.5} />
              Clear
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 font-heading text-xl font-extrabold">Differences</h2>
            {pending && (
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground" role="status">
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={2.5} />
                Comparing…
              </p>
            )}
            {!pending && result?.status === "ok" && !empty && (
              <p className="flex flex-wrap gap-2 text-[13px] font-bold text-numeric" aria-live="polite">
                <span className="rounded-full border-2 border-foreground bg-mint px-2.5 py-0.5">
                  + {count(result.stats.added, "added")}
                </span>
                <span className="rounded-full border-2 border-foreground bg-pink px-2.5 py-0.5">
                  − {count(result.stats.removed, "removed")}
                </span>
                <span className="rounded-full border-2 border-foreground/25 px-2.5 py-0.5 text-muted-foreground">
                  {count(result.stats.unchanged, "unchanged")}
                </span>
              </p>
            )}
            <span className="grow" />
            <TogglePill pressed={fold} onPressedChange={setFold}>
              <FoldVertical className="size-4" strokeWidth={2.5} />
              Fold unchanged
            </TogglePill>
            <Segmented
              label="Layout"
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "split", label: "Side by side" },
                { value: "unified", label: "Inline" },
              ]}
              className="hidden md:flex"
            />
            <button
              type="button"
              onClick={copyPatch}
              disabled={pending || result?.status !== "ok" || result.identical}
              aria-live="polite"
              className={cn(PILL, "bg-card hover:bg-secondary")}
            >
              {copyState === "copied" ? (
                <Check className="size-4" strokeWidth={2.5} />
              ) : (
                <Copy className="size-4" strokeWidth={2.5} />
              )}
              {copyState === "copied" ? "Patch copied" : copyState === "failed" ? "Could not copy" : "Copy patch"}
            </button>
          </div>

          {result === null ? (
            <p className="rounded-2xl border-[2.5px] border-dashed border-foreground/30 px-4 py-10 text-center font-semibold text-muted-foreground">
              Comparing…
            </p>
          ) : result.status === "timeout" ? (
            <Callout tone="warn">
              These texts are too large and too different to compare in a reasonable time. Try comparing a smaller
              section at a time.
            </Callout>
          ) : empty ? (
            <p className="rounded-2xl border-[2.5px] border-dashed border-foreground/30 px-4 py-10 text-center font-semibold text-muted-foreground">
              Paste two versions of a text above and the differences show up here as you type.
            </p>
          ) : result.identical ? (
            <div className="sticker tilt-3 mx-auto my-4 w-fit rounded-2xl bg-mint px-6 py-5 text-center">
              <p className="font-heading text-2xl font-extrabold">No differences</p>
              <p className="mt-1 text-sm font-semibold">
                The two texts match{ignoring ? `, ignoring ${ignoring}` : " exactly"}.
              </p>
            </div>
          ) : (
            <div
              role="region"
              aria-label="Line by line differences"
              aria-busy={pending}
              className={cn(
                "overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-card py-1 transition-opacity",
                pending && "opacity-50",
              )}
            >
              <DiffRows rows={rows.slice(0, rowLimit)} view={shownView} onUnfold={unfoldBlock} />
              {rows.length > rowLimit && (
                <button
                  type="button"
                  onClick={showMoreRows}
                  className="mt-1 flex h-10 w-full items-center justify-center border-t-2 border-dashed border-foreground/25 bg-secondary text-[13px] font-bold transition-colors hover:bg-yellow focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  Show the next {Math.min(ROW_PAGE, rows.length - rowLimit).toLocaleString("en-GB")} of{" "}
                  {(rows.length - rowLimit).toLocaleString("en-GB")} remaining rows
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

