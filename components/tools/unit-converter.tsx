"use client";

import * as React from "react";
import { ArrowLeftRight, Check, ChevronDown, Copy } from "lucide-react";
import { Segmented } from "@/components/calc/segmented";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  PRECISIONS,
  convert,
  describeRelation,
  formatCompound,
  formatNumber,
  formatQuantity,
  fromBase,
  toBase,
  type Precision,
} from "@/lib/units/convert";
import {
  categories,
  getCategory,
  getGroup,
  getUnit,
  groups,
  unitCount,
  type Unit,
  type UnitCategory,
  type UnitGroupId,
} from "@/lib/units/data";
import { isPhrase, normalise, parseQuantity, parseQuery, searchUnits, type UnitRef } from "@/lib/units/parse";
import { cn } from "@/lib/utils";

const DEFAULT = { category: "fuel", from: "mpg_uk", to: "l100km", value: "45" } as const;
const CATEGORY_IDS = categories.map((c) => c.id);
const UNIT_IDS = [...new Set(categories.flatMap((c) => c.units.map((u) => u.id)))];
const MAX_INPUT = 60;

const PRECISION_OPTIONS: { value: Precision; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "2dp", label: "2 dp" },
  { value: "4dp", label: "4 dp" },
  { value: "max", label: "Max" },
];

type Side = "from" | "to";
type GroupTab = UnitGroupId | "all";

/** Where a page opens the converter (pair landing pages pass this). */
export interface UnitConverterInitial {
  category: string;
  from: string;
  to: string;
  value: string;
}

function fallbackTo(category: UnitCategory, fromId: string): string {
  return category.preset.to !== fromId ? category.preset.to : category.preset.from;
}

/** Resolve possibly stale ids (after a URL load or category switch) to real units. */
function resolve(categoryId: string, fromId: string, toId: string) {
  const category = getCategory(categoryId) ?? getCategory(DEFAULT.category);
  if (!category) throw new Error("Unit data has no default category");
  const from = getUnit(category, fromId) ?? getUnit(category, category.preset.from);
  if (!from) throw new Error(`Category ${category.id} has no preset unit`);
  const toCandidate = getUnit(category, toId);
  const to =
    toCandidate && toCandidate.id !== from.id
      ? toCandidate
      : getUnit(category, fallbackTo(category, from.id));
  if (!to) throw new Error(`Category ${category.id} needs at least two units`);
  return { category, from, to };
}

export function UnitConverter({ initial }: { initial?: UnitConverterInitial }) {
  const start: UnitConverterInitial = initial ?? DEFAULT;
  const [categoryId, setCategoryId] = React.useState<string>(start.category);
  const [fromId, setFromId] = React.useState<string>(start.from);
  const [toId, setToId] = React.useState<string>(start.to);
  const [raw, setRaw] = React.useState<string>(start.value);
  const [precision, setPrecision] = React.useState<Precision>("auto");
  /** null means "follow the current category's group". */
  const [groupTab, setGroupTab] = React.useState<GroupTab | null>(null);
  const [listFilter, setListFilter] = React.useState("");
  const [picker, setPicker] = React.useState<Side | null>(null);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useUrlState({
    c: urlField(categoryId, setCategoryId, start.category, CATEGORY_IDS),
    f: urlField(fromId, setFromId, start.from, UNIT_IDS),
    t: urlField(toId, setToId, start.to, UNIT_IDS),
    v: urlField(raw, setRaw, start.value),
    p: urlField(precision, setPrecision, "auto", PRECISIONS),
  });

  const { category, from, to } = resolve(categoryId, fromId, toId);
  const group = getGroup(category.group);
  const activeTab: GroupTab = groupTab ?? category.group;
  const visibleCategories =
    activeTab === "all" ? categories : categories.filter((c) => c.group === activeTab);

  const input = raw.length > MAX_INPUT ? "" : raw;
  // A plain number, m:ss, or a compound in this category ("5 ft 11 in"); NaN otherwise.
  const value = parseQuantity(input, from, category);
  /** Text that is not an amount here yet: a phrase waiting for Enter. */
  const pending = Number.isNaN(value) && isPhrase(input);
  const compoundInput = !Number.isNaN(value) && isPhrase(input);
  const result = Number.isNaN(value) ? NaN : convert(from, to, value);
  const resultText = Number.isNaN(result) ? "…" : formatQuantity(to, result, precision);
  const compoundResult = Number.isNaN(result) ? null : formatCompound(category, to, result);
  const base = Number.isNaN(value) ? NaN : toBase(from, value);

  /* ---------- state changes ---------- */

  const setUnits = (nextCategory: UnitCategory, nextFrom: string, nextTo: string) => {
    if (nextCategory.id !== category.id) {
      setCategoryId(nextCategory.id);
      setGroupTab(null);
      setListFilter("");
    }
    setFromId(nextFrom);
    setToId(nextTo);
  };

  const selectCategory = (next: UnitCategory) => {
    if (next.id === category.id) return;
    setUnits(next, next.preset.from, next.preset.to);
    if (!pending) setRaw(String(next.preset.value));
  };

  const chooseUnit = (side: Side, ref: UnitRef) => {
    const { category: next, unit } = ref;
    if (next.id !== category.id) {
      if (side === "from") setUnits(next, unit.id, fallbackTo(next, unit.id));
      else setUnits(next, next.preset.from !== unit.id ? next.preset.from : next.preset.to, unit.id);
      return;
    }
    if (side === "from") setUnits(next, unit.id, unit.id === to.id ? from.id : to.id);
    else setUnits(next, unit.id === from.id ? to.id : from.id, unit.id);
  };

  const swap = () => {
    if (!Number.isNaN(result)) setRaw(formatQuantity(to, result, precision).replace(/,/g, ""));
    setUnits(category, to.id, from.id);
  };

  /** Turn "45 mpg in l/100km" typed into the value box into units plus a number. */
  const commitPhrase = (): boolean => {
    if (!pending) return false;
    const parsed = parseQuery(input);
    if (!parsed.from) {
      if (!parsed.to) return false;
      chooseUnit("to", parsed.to);
      setRaw(parsed.numberRaw || String(parsed.to.category.preset.value));
      return true;
    }
    if (parsed.to && parsed.to.category.id !== parsed.from.category.id) return false;
    const next = parsed.from.category;
    const nextTo = parsed.to
      ? parsed.to.unit.id
      : next.id === category.id && to.id !== parsed.from.unit.id
        ? to.id
        : fallbackTo(next, parsed.from.unit.id);
    setUnits(next, parsed.from.unit.id, nextTo);
    setRaw(parsed.numberRaw || String(next.preset.value));
    return true;
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(`${resultText} ${to.sym}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked: nothing sensible to do beyond leaving the value on screen.
    }
  };

  /* ---------- derived copy ---------- */

  const hint = (() => {
    if (compoundInput) {
      return (
        <>
          {input.trim()} = {formatQuantity(from, value, precision)} {from.sym}
        </>
      );
    }
    if (!pending) {
      return (
        <>
          Type a number, a phrase like <b>11 stone to kg</b>, or a compound like <b>5 ft 11 in</b>.
        </>
      );
    }
    const parsed = parseQuery(input);
    if (!parsed.from) {
      if (parsed.to) return <>Converting into {parsed.to.unit.name}: press <Kbd>↵</Kbd></>;
      return <span className="text-destructive">No unit called “{parsed.rest}” yet. Try mpg, psi, stone, knots, kWh…</span>;
    }
    if (parsed.to && parsed.to.category.id !== parsed.from.category.id) {
      return (
        <span className="text-destructive">
          Can&apos;t turn {parsed.from.unit.name} ({parsed.from.category.name}) into {parsed.to.unit.name} ({parsed.to.category.name}).
        </span>
      );
    }
    const target = parsed.to
      ? parsed.to.unit
      : parsed.from.category.id === category.id && to.id !== parsed.from.unit.id
        ? to
        : getUnit(parsed.from.category, fallbackTo(parsed.from.category, parsed.from.unit.id));
    return (
      <>
        Press <Kbd>↵</Kbd> for {parsed.numberRaw || "…"} {parsed.from.unit.name} → {target?.name}
      </>
    );
  })();

  const relation = describeRelation(from, to);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Group tabs + category chips */}
      <nav aria-label="Categories" className="space-y-3">
        <div role="tablist" aria-label="Category groups" className="flex flex-wrap gap-2">
          {(["all", ...groups.map((g) => g.id)] as GroupTab[]).map((tab) => {
            const selected = tab === activeTab;
            const g = tab === "all" ? null : getGroup(tab);
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setGroupTab(tab)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border-[2.5px] border-foreground px-3.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
                  selected ? "bg-foreground text-background" : "bg-card",
                )}
              >
                {g && <span aria-hidden="true" className={cn("size-2.5 rounded-[3px] border-2 border-foreground", selected ? "border-background" : "", g.bg)} />}
                {g ? g.label : "All"}
              </button>
            );
          })}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2 sm:flex-wrap sm:overflow-visible">
          {visibleCategories.map((c) => {
            const selected = c.id === category.id;
            const g = getGroup(c.group);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => selectCategory(c)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border-[2.5px] border-foreground px-3 text-[13px] font-extrabold whitespace-nowrap transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
                  selected ? cn("sticker-sm", g.bg) : "bg-card",
                )}
              >
                <span aria-hidden="true" className={cn("size-2.5 rounded-[3px] border-2 border-foreground", selected ? "bg-foreground" : g.bg)} />
                {c.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Converter card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-3 px-5 pt-5 pb-4 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              <p>
                <span className="text-foreground">{category.name}</span> · base unit {category.base}
              </p>
              <p>
                {from.name} → {to.name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-[1_1_200px]">
                <label htmlFor="unit-value" className="sr-only">
                  Value to convert, or a phrase such as 45 mpg in l/100km
                </label>
                <input
                  ref={inputRef}
                  id="unit-value"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={input}
                  maxLength={MAX_INPUT}
                  onChange={(e) => setRaw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitPhrase();
                    }
                  }}
                  onBlur={() => commitPhrase()}
                  placeholder={String(category.preset.value)}
                  className="w-full border-0 border-b-[3px] border-foreground bg-transparent py-1 font-heading text-4xl font-extrabold tracking-tight text-numeric outline-none placeholder:text-foreground/30 focus:border-ring sm:text-5xl"
                />
              </div>
              <UnitButton unit={from} side="from" onClick={() => setPicker("from")} />
              <button
                type="button"
                onClick={swap}
                aria-label="Swap the two units"
                className="grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-foreground bg-foreground text-background transition-transform duration-300 hover:rotate-180 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none motion-reduce:transition-none"
              >
                <ArrowLeftRight className="size-5" strokeWidth={3} />
              </button>
            </div>
            <p className="min-h-5 text-[13px] font-bold text-muted-foreground" aria-live="polite">
              {hint}
            </p>
          </div>

          <div className={cn("space-y-3 border-t-[3px] border-foreground px-5 pt-5 pb-4 transition-colors sm:px-6", group.bg)}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <div className="flex min-w-0 flex-[1_1_240px] items-baseline gap-2.5">
                <span aria-hidden="true" className="font-heading text-2xl font-extrabold text-foreground/50">
                  =
                </span>
                <output
                  htmlFor="unit-value"
                  aria-live="polite"
                  className="min-w-0 font-heading text-5xl font-black tracking-tighter text-numeric [overflow-wrap:anywhere] sm:text-6xl"
                >
                  {resultText}
                </output>
                <span className="shrink-0 font-mono text-base font-bold">{to.sym}</span>
                {compoundResult && (
                  <span className="shrink-0 rounded-full border-2 border-foreground bg-card px-2.5 py-0.5 font-mono text-[13px] font-bold text-numeric">
                    {compoundResult}
                  </span>
                )}
              </div>
              <div className="flex max-w-full flex-wrap items-center gap-2.5">
                <UnitButton unit={to} side="to" onClick={() => setPicker("to")} />
                <button
                  type="button"
                  onClick={copyResult}
                  disabled={Number.isNaN(result)}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-3.5 text-[13px] font-extrabold transition-transform hover:-translate-y-0.5 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                >
                  {copied ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" strokeWidth={2.5} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t-2 border-dashed border-foreground/35 pt-3">
              <p className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 font-mono text-[13px] font-bold text-foreground/70">
                {relation.kind === "reciprocal" && (
                  <>
                    <span>
                      <b className="text-foreground">{to.sym}</b> = <b className="text-foreground">{formatNumber(relation.constant)}</b> ÷ {from.sym}
                    </span>
                    <Tag>reciprocal</Tag>
                    <span>double one, halve the other</span>
                  </>
                )}
                {relation.kind === "affine" && (
                  <>
                    <span>
                      <b className="text-foreground">{to.sym}</b> = {from.sym} × <b className="text-foreground">{formatNumber(relation.factor)}</b>{" "}
                      {relation.offset < 0 ? "−" : "+"} <b className="text-foreground">{formatNumber(Math.abs(relation.offset))}</b>
                    </span>
                    <Tag>offset scale</Tag>
                  </>
                )}
                {relation.kind === "linear" && (
                  <>
                    <span>
                      1 {from.sym} = <b className="text-foreground">{formatNumber(relation.factor)}</b> {to.sym}
                    </span>
                    <span>
                      {to.sym} = {from.sym} × <b className="text-foreground">{formatNumber(relation.factor)}</b>
                    </span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-foreground/70 uppercase">Precision</span>
                <Segmented size="sm" label="Precision" value={precision} onChange={setPrecision} options={PRECISION_OPTIONS} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular pairs */}
      <section aria-labelledby="unit-pairs" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="unit-pairs" className="text-xl font-extrabold">
            Popular here
          </h2>
          <p className="text-sm font-semibold text-muted-foreground">Common pairs in {category.name.toLowerCase()}.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {category.pairs.map(([a, b]) => {
            const ua = getUnit(category, a);
            const ub = getUnit(category, b);
            if (!ua || !ub) return null;
            const selected = a === from.id && b === to.id;
            return (
              <button
                key={`${a}-${b}`}
                type="button"
                aria-pressed={selected}
                onClick={() => setUnits(category, a, b)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground px-3.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
                  selected ? cn("sticker-sm", group.bg) : "bg-card",
                )}
              >
                {ua.sym} <span className="font-mono text-xs font-normal">→</span> {ub.sym}
              </button>
            );
          })}
        </div>
      </section>

      {/* Everything at once */}
      <section aria-labelledby="unit-all" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 id="unit-all" className="text-xl font-extrabold">
              Everything at once
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">Click a unit to convert into it.</p>
          </div>
          <label className="sr-only" htmlFor="unit-filter">
            Filter units
          </label>
          <input
            id="unit-filter"
            type="search"
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
            placeholder="Filter units"
            className="h-10 w-48 max-w-full rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold outline-none focus:ring-[3px] focus:ring-ring/60"
          />
        </div>
        <ol className="sticker divide-y-2 divide-foreground/15 overflow-hidden rounded-[22px] bg-card">
          {(() => {
            const key = normalise(listFilter);
            const rows = category.units.filter(
              (u) =>
                !key ||
                normalise(u.name).includes(key) ||
                normalise(u.sym).includes(key) ||
                u.aliases.some((a) => normalise(a).includes(key)),
            );
            if (rows.length === 0) {
              return (
                <li className="px-5 py-4 text-sm font-semibold text-muted-foreground">
                  No unit in {category.name} matches “{listFilter}”.
                </li>
              );
            }
            return rows.map((u) => {
              const isFrom = u.id === from.id;
              const isTo = u.id === to.id;
              const text = Number.isNaN(base) ? "" : formatQuantity(u, fromBase(u, base), precision);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    aria-label={`Convert into ${u.name}`}
                    onClick={() => (isFrom ? swap() : setUnits(category, from.id, u.id))}
                    className={cn(
                      "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 text-left transition-colors sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,1fr)] sm:px-5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none focus-visible:ring-inset",
                      isTo ? group.bg : "hover:bg-secondary",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[15px] font-bold">
                      <span className="truncate">{u.name}</span>
                      {(isFrom || isTo) && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full border-2 border-foreground px-1.5 font-mono text-[10px] leading-4 tracking-[0.1em] uppercase",
                            isTo ? "bg-foreground text-background" : "bg-card",
                          )}
                        >
                          {isTo ? "to" : "from"}
                        </span>
                      )}
                    </span>
                    <span className="hidden font-mono text-[13px] text-muted-foreground sm:block">{u.sym}</span>
                    <span
                      className={cn(
                        "text-right font-heading text-lg font-extrabold text-numeric [overflow-wrap:anywhere] sm:text-xl",
                        isFrom && "text-muted-foreground",
                      )}
                    >
                      {text}
                    </span>
                  </button>
                </li>
              );
            });
          })()}
        </ol>
        <p className="text-xs font-semibold text-muted-foreground">
          {categories.length} categories, {unitCount} units. Bare words follow UK usage: pint, gallon, mpg and ton are imperial; US versions are named.
        </p>
      </section>

      <UnitPicker
        side={picker}
        category={category}
        selectedId={picker === "from" ? from.id : to.id}
        onClose={() => setPicker(null)}
        onChoose={(side, ref) => {
          chooseUnit(side, ref);
          setPicker(null);
        }}
      />
    </div>
  );
}

/* ---------- small pieces ---------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border-2 border-foreground bg-secondary px-1.5 font-mono text-[11px] text-foreground">
      {children}
    </kbd>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border-2 border-foreground bg-card px-2 text-[10px] tracking-[0.08em] text-foreground uppercase">
      {children}
    </span>
  );
}

function UnitButton({ unit, side, onClick }: { unit: Unit; side: Side; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`${side === "from" ? "From" : "To"} unit: ${unit.name}. Change`}
      className="inline-flex h-11 min-w-0 max-w-full items-center gap-2 rounded-full border-[2.5px] border-foreground bg-card pr-3 pl-3.5 text-[15px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
    >
      <span className="shrink-0 rounded-full border-2 border-foreground bg-secondary px-2 font-mono text-[13px] font-bold">{unit.sym}</span>
      <span className="truncate">{unit.name}</span>
      <ChevronDown className="size-4 shrink-0" strokeWidth={3} />
    </button>
  );
}

function UnitPicker({
  side,
  category,
  selectedId,
  onClose,
  onChoose,
}: {
  side: Side | null;
  category: UnitCategory;
  selectedId: string;
  onClose: () => void;
  onChoose: (side: Side, ref: UnitRef) => void;
}) {
  const [query, setQuery] = React.useState("");
  const ordered = [category, ...categories.filter((c) => c.id !== category.id)];
  // The engine ranks matches (exact alias first, then substrings), so cmdk's fuzzy filter is off.
  const hits = query.trim() ? searchUnits(query) : null;

  const item = (c: UnitCategory, u: Unit, showCategory: boolean) => (
    <CommandItem
      key={`${c.id}-${u.id}`}
      value={`${c.id}/${u.id}`}
      data-checked={c.id === category.id && u.id === selectedId}
      onSelect={() => side && onChoose(side, { category: c, unit: u })}
      className="justify-between font-semibold"
    >
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate">{u.name}</span>
        {showCategory && c.id !== category.id && (
          <span className="shrink-0 text-xs font-bold text-muted-foreground">{c.name}</span>
        )}
      </span>
      <span className="ml-auto font-mono text-xs text-muted-foreground">{u.sym}</span>
    </CommandItem>
  );

  return (
    <CommandDialog
      open={side !== null}
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
          onClose();
        }
      }}
      title={side === "to" ? "Choose the unit to convert into" : "Choose the unit to convert from"}
      description={`Search all ${unitCount} units by name, symbol or common spelling`}
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={`Search ${unitCount} units: psi, stone, l/100km…`}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[min(24rem,60vh)]">
          {hits && hits.length === 0 && (
            <p className="py-6 text-center text-sm font-semibold text-muted-foreground">
              Nothing by that name. Try a symbol like psi or a name like stone.
            </p>
          )}
          {hits && hits.length > 0 && (
            <CommandGroup heading={`${hits.length} ${hits.length === 1 ? "match" : "matches"}`}>
              {hits.map(({ category: c, unit: u }) => item(c, u, true))}
            </CommandGroup>
          )}
          {!hits &&
            ordered.map((c) => (
              <CommandGroup key={c.id} heading={c.id === category.id ? c.name : `${c.name} · switches category`}>
                {c.units.map((u) => item(c, u, false))}
              </CommandGroup>
            ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
