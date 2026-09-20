"use client";

import * as React from "react";
import { ArrowLeftRight, Check, Copy, Eraser, FoldVertical, LoaderCircle, Sparkles, UnfoldVertical } from "lucide-react";
import { Callout } from "@/components/calc/callout";
import { CodeTextarea } from "@/components/calc/code-textarea";
import { PillButton, TogglePill } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { Card, CardContent } from "@/components/ui/card";
import { useCopy, type CopyState } from "@/hooks/use-copy";
import { createPatch, useTextDiff } from "@/hooks/use-text-diff";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  buildRows,
  countLines,
  rowKey,
  type DiffLine,
  type DiffResult,
  type DiffRow,
  type DiffView,
} from "@/lib/text-diff";
import { cn } from "@/lib/utils";

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

/** Rows drawn at once: two huge unrelated texts would otherwise put 100,000 cells on the page. */
const ROW_PAGE = 2000;

const EMPTY: ReadonlySet<number> = new Set();

const COPY_LABEL: Record<CopyState, string> = {
  idle: "Copy patch",
  copied: "Patch copied",
  failed: "Could not copy",
};

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

function RowCells({ row, view }: { row: Exclude<DiffRow, { kind: "fold" }>; view: DiffView }) {
  if (view === "split") {
    const left = row.kind === "same" ? row.old : row.removed;
    const right = row.kind === "same" ? row.new : row.added;
    const leftTone = row.kind === "same" ? "same" : "removed";
    const rightTone = row.kind === "same" ? "same" : "added";
    return (
      <>
        <LineNumber line={left} tone={leftTone} />
        <LineText line={left} tone={leftTone} />
        <LineNumber line={right} tone={rightTone} divider />
        <LineText line={right} tone={rightTone} />
      </>
    );
  }
  if (row.kind === "same") {
    return (
      <>
        <LineNumber line={row.old} tone="same" />
        <LineNumber line={row.new} tone="same" />
        <LineText line={row.new} tone="same" />
      </>
    );
  }
  const tone = row.removed ? "removed" : "added";
  return (
    <>
      <div className={cn(NUMBER_CELL, TONE[tone].row)}>{row.removed?.no}</div>
      <div className={cn(NUMBER_CELL, TONE[tone].row)}>{row.added?.no}</div>
      <LineText line={row.removed ?? row.added} tone={tone} />
    </>
  );
}

// Memoised: the grid can hold thousands of cells, and typing re-renders its parent before the new diff exists.
const DiffRows = React.memo(function DiffRows({
  rows,
  view,
  onUnfold,
}: {
  rows: readonly DiffRow[];
  view: DiffView;
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
      {rows.map((row) =>
        row.kind === "fold" ? (
          <button
            key={rowKey(row)}
            type="button"
            onClick={() => onUnfold(row.block)}
            className="col-span-full my-1 flex h-8 items-center justify-center gap-2 border-y-2 border-dashed border-foreground/25 bg-secondary font-sans text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <UnfoldVertical className="size-3.5" strokeWidth={2.5} />
            Show {row.count} unchanged lines
          </button>
        ) : (
          <RowCells key={rowKey(row)} row={row} view={view} />
        ),
      )}
    </div>
  );
});

const TextPane = React.memo(function TextPane({
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
  const lines = React.useMemo(() => countLines(value), [value]);
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
      <CodeTextarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-80"
      />
    </div>
  );
});

function count(n: number, noun: string) {
  return `${n.toLocaleString("en-GB")} ${noun}`;
}

const NOTE = "rounded-2xl border-[2.5px] border-dashed border-foreground/30 px-4 py-10 text-center font-semibold text-muted-foreground";

/** The body of the results card: exactly one of these states applies, checked in this order. */
function DiffPanel({
  result,
  pending,
  empty,
  ignoring,
  rows,
  rowLimit,
  view,
  onUnfold,
  onShowMore,
}: {
  result: DiffResult | null;
  pending: boolean;
  empty: boolean;
  /** "case and whitespace", or "" when comparing exactly. */
  ignoring: string;
  rows: readonly DiffRow[];
  rowLimit: number;
  view: DiffView;
  onUnfold: (block: number) => void;
  onShowMore: () => void;
}) {
  const visible = React.useMemo(() => rows.slice(0, rowLimit), [rows, rowLimit]);

  if (result === null) return <p className={NOTE}>Comparing…</p>;
  if (result.status === "timeout") {
    return (
      <Callout tone="warn">
        These texts are too large and too different to compare in a reasonable time. Try comparing a smaller section at
        a time.
      </Callout>
    );
  }
  if (empty) {
    return <p className={NOTE}>Paste two versions of a text above and the differences show up here as you type.</p>;
  }
  if (result.identical) {
    const newlineOnly = result.finalNewlineDiffers && !ignoring.includes("whitespace");
    return (
      <div className={cn("sticker tilt-3 mx-auto my-4 w-fit rounded-2xl px-6 py-5 text-center", newlineOnly ? "bg-yellow" : "bg-mint")}>
        <p className="font-heading text-2xl font-extrabold">{newlineOnly ? "Same, apart from the final line break" : "No differences"}</p>
        <p className="mt-1 text-sm font-semibold">
          {newlineOnly
            ? "Every line matches, but only one of the texts ends with a line break. Copy patch includes it."
            : `The two texts match${ignoring ? `, ignoring ${ignoring}` : " exactly"}.`}
        </p>
      </div>
    );
  }

  const remaining = rows.length - rowLimit;
  return (
    <div
      role="region"
      aria-label="Line by line differences"
      aria-busy={pending}
      className={cn(
        "overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-card py-1 transition-opacity",
        pending && "opacity-50",
      )}
    >
      <DiffRows rows={visible} view={view} onUnfold={onUnfold} />
      {remaining > 0 && (
        <button
          type="button"
          onClick={onShowMore}
          className="mt-1 flex h-10 w-full items-center justify-center border-t-2 border-dashed border-foreground/25 bg-secondary text-[13px] font-bold transition-colors hover:bg-yellow focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          Show the next {Math.min(ROW_PAGE, remaining).toLocaleString("en-GB")} of{" "}
          {remaining.toLocaleString("en-GB")} remaining rows
        </button>
      )}
    </div>
  );
}

// Memoised so that typing, which re-renders TextDiff at once, only reaches this card when the deferred texts catch up.
const ResultsCard = React.memo(function ResultsCard({
  oldText,
  newText,
  ignoreCase,
  ignoreWhitespace,
  view,
  onViewChange,
  fold,
  onFoldChange,
}: {
  oldText: string;
  newText: string;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  view: DiffView;
  onViewChange: (view: DiffView) => void;
  fold: boolean;
  onFoldChange: (fold: boolean) => void;
}) {
  const { result, pending } = useTextDiff(oldText, newText, { ignoreCase, ignoreWhitespace });
  const { state: copyState, copy } = useCopy();

  // What has been opened up belongs to one result; a new diff starts folded and capped again.
  const [opened, setOpened] = React.useState<{ of: DiffResult | null; blocks: ReadonlySet<number>; rows: number }>({
    of: result,
    blocks: EMPTY,
    rows: ROW_PAGE,
  });
  const unfoldedBlocks = opened.of === result ? opened.blocks : EMPTY;
  const rowLimit = opened.of === result ? opened.rows : ROW_PAGE;
  const unfoldBlock = React.useCallback(
    (block: number) =>
      setOpened((o) => {
        const mine = o.of === result;
        return { of: result, blocks: new Set(mine ? o.blocks : EMPTY).add(block), rows: mine ? o.rows : ROW_PAGE };
      }),
    [result],
  );
  const showMoreRows = React.useCallback(
    () =>
      setOpened((o) => {
        const mine = o.of === result;
        return { of: result, blocks: mine ? o.blocks : EMPTY, rows: (mine ? o.rows : ROW_PAGE) + ROW_PAGE };
      }),
    [result],
  );

  const isWide = useIsWide();
  const shownView: DiffView = isWide ? view : "unified";
  const rows = React.useMemo(
    () => (result?.status === "ok" ? buildRows(result.blocks, shownView, fold, unfoldedBlocks) : []),
    [result, shownView, fold, unfoldedBlocks],
  );

  const empty = oldText === "" && newText === "";
  const ignoring = [ignoreCase && "case", ignoreWhitespace && "whitespace"].filter(Boolean).join(" and ");
  const nothingToCopy = result?.status !== "ok" || (result.identical && !result.finalNewlineDiffers);

  return (
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
          <TogglePill pressed={fold} onPressedChange={onFoldChange}>
            <FoldVertical className="size-4" strokeWidth={2.5} />
            Fold unchanged
          </TogglePill>
          <Segmented
            label="Layout"
            size="sm"
            value={view}
            onChange={onViewChange}
            options={[
              { value: "split", label: "Side by side" },
              { value: "unified", label: "Inline" },
            ]}
            className="hidden md:flex"
          />
          <PillButton onClick={() => copy(createPatch(oldText, newText))} disabled={pending || empty || nothingToCopy} aria-live="polite">
            {copyState === "copied" ? (
              <Check className="size-4" strokeWidth={2.5} />
            ) : (
              <Copy className="size-4" strokeWidth={2.5} />
            )}
            {COPY_LABEL[copyState]}
          </PillButton>
        </div>

        <DiffPanel
          result={result}
          pending={pending}
          empty={empty}
          ignoring={ignoring}
          rows={rows}
          rowLimit={rowLimit}
          view={shownView}
          onUnfold={unfoldBlock}
          onShowMore={showMoreRows}
        />
      </CardContent>
    </Card>
  );
});

export function TextDiff() {
  const [oldText, setOldText] = React.useState(SAMPLE_OLD);
  const [newText, setNewText] = React.useState(SAMPLE_NEW);
  const [view, setView] = React.useState<DiffView>("split");
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(false);
  const [fold, setFold] = React.useState(true);

  // The texts stay out of the URL on purpose: they can be long and private.
  useUrlState({
    view: urlField(view, setView, "split" as DiffView, ["split", "unified"]),
    ic: urlField(ignoreCase, setIgnoreCase, false),
    iw: urlField(ignoreWhitespace, setIgnoreWhitespace, false),
    fold: urlField(fold, setFold, true),
  });

  const deferredOld = React.useDeferredValue(oldText);
  const deferredNew = React.useDeferredValue(newText);
  const empty = oldText === "" && newText === "";

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
            <PillButton
              onClick={() => {
                setOldText(newText);
                setNewText(oldText);
              }}
              disabled={empty}
            >
              <ArrowLeftRight className="size-4" strokeWidth={2.5} />
              Swap
            </PillButton>
            <PillButton
              onClick={() => {
                setOldText(SAMPLE_OLD);
                setNewText(SAMPLE_NEW);
              }}
            >
              <Sparkles className="size-4" strokeWidth={2.5} />
              Sample
            </PillButton>
            <PillButton
              onClick={() => {
                setOldText("");
                setNewText("");
              }}
              disabled={empty}
            >
              <Eraser className="size-4" strokeWidth={2.5} />
              Clear
            </PillButton>
          </div>
        </CardContent>
      </Card>

      <ResultsCard
        oldText={deferredOld}
        newText={deferredNew}
        ignoreCase={ignoreCase}
        ignoreWhitespace={ignoreWhitespace}
        view={view}
        onViewChange={setView}
        fold={fold}
        onFoldChange={setFold}
      />
    </div>
  );
}
