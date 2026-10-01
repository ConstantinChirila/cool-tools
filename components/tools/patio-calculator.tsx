"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Plus, Receipt, Ruler, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { PillButton } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SplitBar } from "@/components/charts/split-bar";
import { BagFields } from "@/components/tools/bag-fields";
import { bagDetail, cubic, formatArea, lengthIn, planText, price, weightText, UNIT_OPTIONS, UNITS, type Money, type Units } from "@/components/tools/garden-format";
import { BagIcon, TextureDefs } from "@/components/tools/garden-visuals";
import { BuildUp, CementBag, PatioPlan, PlanLegend, SlabIcon, Tub, planWidths } from "@/components/tools/patio-visuals";
import { ShopRow } from "@/components/tools/shop-row";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, inputFields, useUrlState, urlField, type FieldUpdate } from "@/hooks/use-url-state";
import { formatNumber, plural } from "@/lib/currency";
import { planOrFallback, type Buying } from "@/lib/garden-materials";
import {
  CEMENT_BAG,
  COMPOUND,
  DEFAULTS,
  LIMITS,
  MAX_CUTOUTS,
  MAX_PATIOS,
  MAX_PIECES,
  MAX_SIDE,
  MOT_WASTE,
  SLAB_INFO,
  SLAB_KINDS,
  calculate,
  encodePatios,
  parsePatios,
  patioArea,
  type CutOut,
  type Direction,
  type Jointing,
  type Patio,
  type PatioResult,
  type Pattern,
  type SlabKind,
} from "@/lib/patio";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------- State -- */

/** Everything about the slabs and how they're laid, flat so each is one URL field. */
interface Laying {
  kind: SlabKind;
  length: number;
  width: number;
  thickness: number;
  joint: number;
  pattern: Pattern;
  direction: Direction;
  slabExtra: number;
  subBase: number;
  subBaseExtra: number;
  bed: number;
  bedRatio: number;
  fall: number;
  fallAlong: "width" | "length";
  jointing: Jointing;
  pointingRatio: number;
  tub: number;
}

interface Costs {
  slab: number;
  perSlab: boolean;
  cementBag: number;
  tubPrice: number;
}

const START_KIND: SlabKind = "porcelain";
const START_SIZE = SLAB_INFO[START_KIND].sizes[0]!;

const DEFAULT_LAYING: Laying = {
  kind: START_KIND,
  length: START_SIZE[0],
  width: START_SIZE[1],
  thickness: SLAB_INFO[START_KIND].thickness,
  joint: SLAB_INFO[START_KIND].joint,
  pattern: "grid",
  direction: "along",
  slabExtra: DEFAULTS.slabExtra,
  subBase: DEFAULTS.subBase,
  subBaseExtra: DEFAULTS.subBaseExtra,
  bed: DEFAULTS.bed,
  bedRatio: DEFAULTS.bedRatio,
  fall: SLAB_INFO[START_KIND].fall,
  fallAlong: "width",
  jointing: "compound",
  pointingRatio: DEFAULTS.pointingRatio,
  tub: DEFAULTS.tub,
};

const DEFAULT_COSTS: Costs = {
  slab: SLAB_INFO[START_KIND].pricePerM2,
  perSlab: false,
  cementBag: DEFAULTS.cementBag,
  tubPrice: DEFAULTS.tubPrice,
};

const DEFAULT_PATIOS: Patio[] = [{ length: 4.8, width: 3.6, cutOuts: [] }];
const DEFAULT_PATIOS_CODE = encodePatios(DEFAULT_PATIOS);

const BUYING_KEYS: [keyof Buying, string][] = [
  ["bag", "bag"],
  ["bagPrice", "bag-price"],
  ["bulk", "bulk"],
  ["bulkPrice", "bulk-price"],
  ["delivery", "delivery"],
];

const PATTERN_OPTIONS: { value: Pattern; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "offset", label: "Offset rows" },
];
const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "along", label: "Along the house" },
  { value: "away", label: "Away from it" },
];
const FALL_ALONG_OPTIONS: { value: "width" | "length"; label: string }[] = [
  { value: "width", label: "Away from the house" },
  { value: "length", label: "Along the house" },
];
const JOINTING_OPTIONS: { value: Jointing; label: string }[] = [
  { value: "compound", label: "Jointing compound" },
  { value: "mortar", label: "Mortar" },
];
const RATIO_OPTIONS = ["3", "4", "5", "6"].map((value) => ({ value, label: `${value}:1` }));
const FALL_OPTIONS = ["40", "60", "80", "100"].map((value) => ({ value, label: `1:${value}` }));

const COST_COLORS = {
  slabs: "var(--chart-3)",
  subBase: "var(--chart-4)",
  sand: "oklch(0.8 0.1 88)",
  cement: "var(--chart-neutral)",
  jointing: "var(--chart-1)",
};

// Rows carry ids so React keeps each editor (and its half-typed draft) with its own patio or cut-out when one is removed.
type CutOutRow = CutOut & { id: number };
type PatioRow = Omit<Patio, "cutOuts"> & { id: number; cutOuts: CutOutRow[] };
const withIds = (patios: Patio[]): PatioRow[] => patios.map((p, id) => ({ ...p, id, cutOuts: p.cutOuts.map((c, cid) => ({ ...c, id: cid })) }));
const stripIds = (rows: PatioRow[]): Patio[] => rows.map(({ length, width, cutOuts }) => ({ length, width, cutOuts: cutOuts.map(({ x, y, w, h }) => ({ x, y, w, h })) }));
const nextId = (rows: readonly { id: number }[]) => rows.reduce((max, r) => Math.max(max, r.id), -1) + 1;

export function PatioCalculator() {
  const { code, currency, setCurrency, money, currencyField } = useCurrency();
  const [rows, setRows] = React.useState<PatioRow[]>(() => withIds(DEFAULT_PATIOS));
  const [laying, setLaying] = React.useState(DEFAULT_LAYING);
  const [costs, setCosts] = React.useState(DEFAULT_COSTS);
  const [mot, setMot] = React.useState<Buying>(DEFAULTS.mot);
  const [sand, setSand] = React.useState<Buying>(DEFAULTS.sand);
  const [units, setUnits] = React.useState<Units>("metric");

  const updateLaying: FieldUpdate<Laying> = (key, value) => setLaying((prev) => ({ ...prev, [key]: value }));
  const updateCosts: FieldUpdate<Costs> = (key, value) => setCosts((prev) => ({ ...prev, [key]: value }));
  const updateMot: FieldUpdate<Buying> = (key, value) => setMot((prev) => ({ ...prev, [key]: value }));
  const updateSand: FieldUpdate<Buying> = (key, value) => setSand((prev) => ({ ...prev, [key]: value }));

  const lay = inputFields(laying, updateLaying, DEFAULT_LAYING);
  const cost = inputFields(costs, updateCosts, DEFAULT_COSTS);
  const motField = inputFields(mot, updateMot, DEFAULTS.mot);
  const sandField = inputFields(sand, updateSand, DEFAULTS.sand);
  const patios = stripIds(rows);

  useUrlState({
    patios: urlField(encodePatios(patios), (v: string) => {
      const parsed = parsePatios(v);
      if (parsed.ok && parsed.value.length > 0) setRows(withIds(parsed.value));
    }, DEFAULT_PATIOS_CODE),
    units: urlField(units, (v: string) => setUnits(v as Units), "metric", UNITS),
    currency: currencyField,
    slab: lay("kind", { allowed: SLAB_KINDS }),
    "slab-length": lay("length", { range: LIMITS.slab }),
    "slab-width": lay("width", { range: LIMITS.slab }),
    thickness: lay("thickness", { range: LIMITS.thickness }),
    joint: lay("joint", { range: LIMITS.joint }),
    pattern: lay("pattern", { allowed: ["grid", "offset"] }),
    direction: lay("direction", { allowed: ["along", "away"] }),
    breakage: lay("slabExtra", { range: LIMITS.extra }),
    "sub-base": lay("subBase", { range: LIMITS.subBase }),
    "sub-base-extra": lay("subBaseExtra", { range: LIMITS.extra }),
    bed: lay("bed", { range: LIMITS.bed }),
    mix: lay("bedRatio", { range: LIMITS.ratio }),
    fall: lay("fall", { range: LIMITS.fall }),
    "fall-along": lay("fallAlong", { allowed: ["width", "length"] }),
    jointing: lay("jointing", { allowed: ["compound", "mortar"] }),
    "pointing-mix": lay("pointingRatio", { range: LIMITS.ratio }),
    tub: lay("tub", { range: LIMITS.tub }),
    "slab-price": cost("slab", { range: MONEY_RANGE }),
    "per-slab": cost("perSlab"),
    "cement-price": cost("cementBag", { range: MONEY_RANGE }),
    "tub-price": cost("tubPrice", { range: MONEY_RANGE }),
    ...Object.fromEntries(BUYING_KEYS.map(([key, name]) => [`mot-${name}`, motField(key, { range: key.endsWith("rice") || key === "delivery" ? MONEY_RANGE : LIMITS.bagSize })])),
    ...Object.fromEntries(BUYING_KEYS.map(([key, name]) => [`sand-${name}`, sandField(key, { range: key.endsWith("rice") || key === "delivery" ? MONEY_RANGE : LIMITS.bagSize })])),
  });

  /** A new slab material brings its own usual size, thickness, joint, fall and price. */
  const chooseKind = (kind: SlabKind) => {
    const info = SLAB_INFO[kind];
    const [length, width] = info.sizes[0]!;
    setLaying((prev) => ({ ...prev, kind, length, width, thickness: info.thickness, joint: info.joint, fall: info.fall }));
    if (!costs.perSlab) updateCosts("slab", info.pricePerM2);
  };

  const slab = { length: laying.length, width: laying.width, thickness: laying.thickness };
  const result = calculate(patios, { ...laying, slab }, { slab: costs.slab, perSlab: costs.perSlab, mot, sand, cementBag: costs.cementBag, tub: costs.tubPrice });

  return (
    <>
      <TextureDefs />
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Your patio</CardTitle>
            <Segmented label="Measure in" size="sm" value={units} onChange={setUnits} options={UNIT_OPTIONS} className="w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <SlabPicker laying={laying} update={updateLaying} onKind={chooseKind} />
            <PatioList rows={rows} onChange={setRows} units={units} />
            <Plans rows={rows} result={result} kind={laying.kind} setRows={setRows} />
            <Settings
              laying={laying}
              update={updateLaying}
              costs={costs}
              updateCosts={updateCosts}
              mot={mot}
              updateMot={updateMot}
              sand={sand}
              updateSand={updateSand}
              result={result}
              money={money}
              symbol={currency.symbol}
              code={code}
              onCurrency={setCurrency}
            />
          </CardContent>
        </Card>
        <Results result={result} laying={laying} costs={costs} mot={mot} sand={sand} units={units} money={money} />
      </div>
      <MobileResultBar label={`Slabs · ${price(result.cost.total, money)}`} value={result.tooMany ? "Too many" : plural(result.slabs.order, "slab")} />
    </>
  );
}

/* -------------------------------------------------------------- Slabs -- */

function SlabPicker({ laying, update, onKind }: { laying: Laying; update: FieldUpdate<Laying>; onKind: (k: SlabKind) => void }) {
  const info = SLAB_INFO[laying.kind];
  const square = laying.length === laying.width;
  return (
    <section className="space-y-4" aria-labelledby="pt-slabs">
      <h3 id="pt-slabs" className="text-[15px] font-bold">
        Slabs
      </h3>
      <ChoiceGroup
        label="Slab material"
        value={laying.kind}
        onChange={onKind}
        options={SLAB_KINDS.map((value) => ({ value, label: SLAB_INFO[value].label }))}
        className="grid grid-cols-3 gap-2"
        itemClassName={(active) =>
          cn(
            "flex flex-col items-center gap-1.5 rounded-2xl border-[2.5px] border-foreground px-2 py-3 text-sm font-bold transition-colors",
            active ? "bg-foreground text-background" : "bg-card hover:bg-secondary",
          )
        }
        renderLabel={(o) => (
          <>
            <SlabIcon kind={o.value} className="h-7 w-9" />
            {o.label}
          </>
        )}
      />
      <p className="text-xs font-semibold text-muted-foreground">{info.hint}</p>

      <div className="space-y-2">
        <p className="text-[15px] font-bold">Size</p>
        <div className="flex flex-wrap gap-1.5">
          {info.sizes.map(([l, w]) => {
            const on = laying.length === l && laying.width === w;
            return (
              <button
                key={`${l}x${w}`}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  update("length", l);
                  update("width", w);
                }}
                className={cn(
                  "h-8 rounded-full border-2 border-foreground px-2.5 font-mono text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on ? "bg-foreground text-background" : "bg-card hover:bg-secondary",
                )}
              >
                {l} × {w}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumberField id="pt-slab-l" label="Length" value={laying.length} onChange={(v) => update("length", v)} min={LIMITS.slab.min} max={LIMITS.slab.max} decimals={0} suffix="mm" />
          <NumberField id="pt-slab-w" label="Width" value={laying.width} onChange={(v) => update("width", v)} min={LIMITS.slab.min} max={LIMITS.slab.max} decimals={0} suffix="mm" />
          <NumberField id="pt-slab-t" label="Thickness" value={laying.thickness} onChange={(v) => update("thickness", v)} min={LIMITS.thickness.min} max={LIMITS.thickness.max} decimals={0} suffix="mm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="pt-joint"
          label="Joint width"
          value={laying.joint}
          onChange={(v) => update("joint", v)}
          min={LIMITS.joint.min}
          max={LIMITS.joint.max}
          decimals={0}
          suffix="mm"
          hint={`${info.jointRange[0]}–${info.jointRange[1]} mm is usual for ${info.label.toLowerCase()}`}
        />
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">Pattern</p>
          <Segmented label="Pattern" size="sm" value={laying.pattern} onChange={(v) => update("pattern", v)} options={PATTERN_OPTIONS} />
        </div>
      </div>
      {!square && (
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">Long side runs</p>
          <Segmented label="Long side runs" size="sm" value={laying.direction} onChange={(v) => update("direction", v)} options={DIRECTION_OPTIONS} />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- Patios -- */

function PatioList({ rows, onChange, units }: { rows: PatioRow[]; onChange: (rows: PatioRow[]) => void; units: Units }) {
  const set = (patio: PatioRow) => onChange(rows.map((r) => (r.id === patio.id ? patio : r)));
  return (
    <section className="space-y-3" aria-labelledby="pt-area">
      <div>
        <h3 id="pt-area" className="text-[15px] font-bold">
          Patio size
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Length runs along the house, width away from it. Make an L shape from two rectangles.
        </p>
      </div>
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <PatioItem
            key={row.id}
            id={`pt-${row.id}`}
            name={`Patio ${i + 1}`}
            patio={row}
            units={units}
            onChange={set}
            onRemove={rows.length > 1 ? () => onChange(rows.filter((r) => r.id !== row.id)) : undefined}
          />
        ))}
      </ul>
      <PillButton
        onClick={() => onChange([...rows, { length: 2, width: 2, cutOuts: [], id: nextId(rows) }])}
        disabled={rows.length >= MAX_PATIOS}
      >
        <Plus className="size-4" /> Add a rectangle
      </PillButton>
    </section>
  );
}

function PatioItem({
  id,
  name,
  patio,
  units,
  onChange,
  onRemove,
}: {
  id: string;
  name: string;
  patio: PatioRow;
  units: Units;
  onChange: (p: PatioRow) => void;
  onRemove?: () => void;
}) {
  const { factor, suffix } = lengthIn(units);
  const len = (key: string, label: string, metres: number, set: (m: number) => void, hint?: string) => (
    <NumberField
      id={`${id}-${key}`}
      label={label}
      value={Number((metres / factor).toFixed(2))}
      onChange={(v) => set(v * factor)}
      max={MAX_SIDE / factor}
      decimals={2}
      suffix={suffix}
      hint={hint}
    />
  );
  const setCut = (cut: CutOutRow) => onChange({ ...patio, cutOuts: patio.cutOuts.map((c) => (c.id === cut.id ? cut : c)) });

  return (
    <li className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{name}</p>
          <p className="font-mono text-xs font-bold text-muted-foreground">{formatArea(patioArea(patio).net, units)}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${name.toLowerCase()}`}
            className="flex size-9 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {len("length", "Length", patio.length, (length) => onChange({ ...patio, length }))}
        {len("width", "Width", patio.width, (width) => onChange({ ...patio, width }))}
      </div>
      {patio.cutOuts.map((cut, i) => (
        <div key={cut.id} className="space-y-3 rounded-xl border-2 border-dashed border-foreground bg-secondary p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Cut-out {i + 1}</p>
            <button
              type="button"
              onClick={() => onChange({ ...patio, cutOuts: patio.cutOuts.filter((c) => c.id !== cut.id) })}
              aria-label={`Remove cut-out ${i + 1} from ${name.toLowerCase()}`}
              className="flex size-8 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {len(`cut${cut.id}-w`, "Length", cut.w, (w) => setCut({ ...cut, w }))}
            {len(`cut${cut.id}-h`, "Width", cut.h, (h) => setCut({ ...cut, h }))}
            {len(`cut${cut.id}-x`, "From the left", cut.x, (x) => setCut({ ...cut, x }))}
            {len(`cut${cut.id}-y`, "From the house", cut.y, (y) => setCut({ ...cut, y }))}
          </div>
        </div>
      ))}
      <PillButton
        onClick={() => onChange({ ...patio, cutOuts: [...patio.cutOuts, { x: 0.6, y: 0.6, w: 0.6, h: 0.45, id: nextId(patio.cutOuts) }] })}
        disabled={patio.cutOuts.length >= MAX_CUTOUTS}
      >
        <Plus className="size-4" /> Cut out a drain, tree or step
      </PillButton>
    </li>
  );
}

function Plans({ rows, result, kind, setRows }: { rows: PatioRow[]; result: PatioResult; kind: SlabKind; setRows: (rows: PatioRow[]) => void }) {
  const counts = { full: 0, cut: 0, notched: 0 };
  for (const l of result.layouts) for (const p of l.pieces) counts[p.kind]++;
  const cutOuts = rows.reduce((s, r) => s + r.cutOuts.length, 0);
  if (result.layouts.every((l) => l.pieces.length === 0)) return null;
  const widths = planWidths(rows);

  return (
    <section className="space-y-3" aria-labelledby="pt-plan">
      <h3 id="pt-plan" className="text-[15px] font-bold">
        Laying plan
      </h3>
      <div className="space-y-5">
        {rows.map((row, i) => {
          const layout = result.layouts[i];
          return layout ? (
            <PatioPlan
              key={row.id}
              patio={row}
              layout={layout}
              kind={kind}
              label={`Patio ${i + 1}`}
              width={widths[i] ?? "100%"}
              onMoveCutOut={(index, cut) =>
                setRows(rows.map((r) => (r.id === row.id ? { ...r, cutOuts: r.cutOuts.map((c, j) => (j === index ? { ...c, ...cut } : c)) } : r)))
              }
            />
          ) : null;
        })}
      </div>
      <PlanLegend kind={kind} {...counts} cutOuts={cutOuts} />
      <p className="text-xs font-semibold text-muted-foreground">
        Laid from the corner by the house, so the cuts land on the far edges where they&apos;re least seen.
      </p>
    </section>
  );
}

/* ----------------------------------------------------------- Settings -- */

function Settings({
  laying,
  update,
  costs,
  updateCosts,
  mot,
  updateMot,
  sand,
  updateSand,
  result,
  money,
  symbol,
  code,
  onCurrency,
}: {
  laying: Laying;
  update: FieldUpdate<Laying>;
  costs: Costs;
  updateCosts: FieldUpdate<Costs>;
  mot: Buying;
  updateMot: FieldUpdate<Buying>;
  sand: Buying;
  updateSand: FieldUpdate<Buying>;
  result: PatioResult;
  money: Money;
  symbol: string;
  code: string;
  onCurrency: (c: string) => void;
}) {
  const sections = useSectionState([]);
  const info = SLAB_INFO[laying.kind];
  return (
    <div className="space-y-2.5">
      <Section
        icon={Layers}
        title="Layers and fall"
        summary={`${laying.subBase} mm MOT · ${laying.bed} mm bed at ${laying.bedRatio}:1 · fall 1:${laying.fall}`}
        active={laying.subBase !== DEFAULT_LAYING.subBase || laying.bed !== DEFAULT_LAYING.bed || laying.bedRatio !== DEFAULT_LAYING.bedRatio || laying.fall !== info.fall}
        open={sections.isOpen("layers")}
        onToggle={() => sections.toggle("layers")}
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="pt-subbase" label="Sub-base" value={laying.subBase} onChange={(v) => update("subBase", v)} max={LIMITS.subBase.max} decimals={0} suffix="mm" hint="Compacted MOT Type 1: 100 mm for a patio" />
          <NumberField id="pt-bed" label="Mortar bed" value={laying.bed} onChange={(v) => update("bed", v)} min={LIMITS.bed.min} max={LIMITS.bed.max} decimals={0} suffix="mm" hint="A full bed under every slab" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">Bed mix, sharp sand to cement</p>
          <Segmented label="Bed mix" size="sm" value={String(laying.bedRatio)} onChange={(v) => update("bedRatio", Number(v))} options={RATIO_OPTIONS} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">Fall</p>
          <Segmented label="Fall" size="sm" value={String(laying.fall)} onChange={(v) => update("fall", Number(v))} options={FALL_OPTIONS} />
          <p className="text-xs font-semibold text-muted-foreground">
            1:{info.fall} suits {info.label.toLowerCase()}. 1:{laying.fall} drops 1 mm for every {laying.fall} mm.
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">Falls towards</p>
          <Segmented label="Falls towards" size="sm" value={laying.fallAlong} onChange={(v) => update("fallAlong", v)} options={FALL_ALONG_OPTIONS} />
        </div>
        <NumberField id="pt-subbase-extra" label="Compaction allowance" value={laying.subBaseExtra} onChange={(v) => update("subBaseExtra", v)} max={LIMITS.extra.max} decimals={0} suffix="%" hint={`MOT compacts by about 30%. ${MOT_WASTE}% for waste goes on top`} />
      </Section>

      <Section
        icon={Ruler}
        title="Joints"
        summary={laying.jointing === "compound" ? `Jointing compound, ${laying.tub} kg tubs` : `Mortar, ${laying.pointingRatio}:1`}
        active={laying.jointing !== DEFAULT_LAYING.jointing}
        open={sections.isOpen("joints")}
        onToggle={() => sections.toggle("joints")}
      >
        <Segmented label="Fill the joints with" size="sm" value={laying.jointing} onChange={(v) => update("jointing", v)} options={JOINTING_OPTIONS} />
        {laying.jointing === "compound" ? (
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="pt-tub" label="Tub size" value={laying.tub} onChange={(v) => update("tub", v)} min={LIMITS.tub.min} max={LIMITS.tub.max} decimals={1} suffix="kg" />
            <NumberField id="pt-tub-price" label="Price per tub" value={costs.tubPrice} onChange={(v) => updateCosts("tubPrice", v)} max={MONEY_RANGE.max} prefix={symbol} decimals={2} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[15px] font-bold">Pointing mix, sand to cement</p>
            <Segmented label="Pointing mix" size="sm" value={String(laying.pointingRatio)} onChange={(v) => update("pointingRatio", Number(v))} options={RATIO_OPTIONS} />
          </div>
        )}
        <p className="text-xs font-semibold text-muted-foreground">
          {formatNumber(result.joints.length, 1)} m of joint, {laying.joint} mm wide.{" "}
          {laying.jointing === "compound"
            ? `Brush-in compound needs joints at least ${COMPOUND.minWidth} mm wide and ${COMPOUND.minDepth} mm deep, so rake the bed out below thinner slabs.`
            : laying.kind === "porcelain"
              ? "Porcelain is usually jointed with compound or an exterior grout: sand and cement doesn't bond well to it."
              : "Mortar pointing is a wet mix pressed in and struck off, using the same sand and cement as the bed."}
        </p>
      </Section>

      <Section
        icon={Receipt}
        title="Prices"
        summary={`${money(costs.slab, 2)} ${costs.perSlab ? "a slab" : "a m²"} · ${laying.slabExtra}% extra slabs`}
        active={false}
        open={sections.isOpen("prices")}
        onToggle={() => sections.toggle("prices")}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-bold">Currency</p>
          <CurrencySelect value={code} onChange={onCurrency} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="pt-slab-price" label={costs.perSlab ? "Price per slab" : "Price per m²"} value={costs.slab} onChange={(v) => updateCosts("slab", v)} max={MONEY_RANGE.max} prefix={symbol} decimals={2} />
          <NumberField id="pt-breakage" label="Extra slabs" value={laying.slabExtra} onChange={(v) => update("slabExtra", v)} max={LIMITS.extra.max} decimals={0} suffix="%" hint="For breakages and mistakes" />
        </div>
        <Segmented
          label="Slab price is"
          size="sm"
          value={costs.perSlab ? "slab" : "m2"}
          onChange={(v) => updateCosts("perSlab", v === "slab")}
          options={[
            { value: "m2", label: "Per m²" },
            { value: "slab", label: "Per slab" },
          ]}
        />
        <p className="pt-2 text-[15px] font-bold">MOT Type 1</p>
        <BagFields id="pt-mot" unit="kg" sizes={{ bag: [20, 25], bulk: [800, 850, 1000] }} s={mot} update={updateMot} material="gravel" currency={symbol} />
        <p className="pt-2 text-[15px] font-bold">Sharp sand</p>
        <BagFields id="pt-sand" unit="kg" sizes={{ bag: [20, 22.5, 25], bulk: [800, 850, 1000] }} s={sand} update={updateSand} material="sand" currency={symbol} />
        <NumberField id="pt-cement" label={`Cement, per ${CEMENT_BAG} kg bag`} value={costs.cementBag} onChange={(v) => updateCosts("cementBag", v)} max={MONEY_RANGE.max} prefix={symbol} decimals={2} />
        <p className="text-xs font-semibold text-muted-foreground">Prices start at rough 2026 UK figures: put in your supplier&apos;s. Leave a bulk price blank to rule bulk bags out.</p>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------ Results -- */

function Results({
  result,
  laying,
  costs,
  mot,
  sand,
  units,
  money,
}: {
  result: PatioResult;
  laying: Laying;
  costs: Costs;
  mot: Buying;
  sand: Buying;
  units: Units;
  money: Money;
}) {
  const { slabs, area, cost, fall, dig, tooMany } = result;
  const empty = area.net <= 0;
  const segments = [
    { name: "Slabs", value: cost.slabs, color: COST_COLORS.slabs },
    { name: "Sub-base", value: cost.subBase ?? 0, color: COST_COLORS.subBase },
    { name: "Sand", value: cost.sand ?? 0, color: COST_COLORS.sand },
    { name: "Cement", value: cost.cement, color: COST_COLORS.cement },
    { name: "Jointing", value: cost.jointing, color: COST_COLORS.jointing },
  ].filter((s) => s.value > 0);
  const unpriced = [cost.subBase === null && "MOT", cost.sand === null && "sand"].filter(Boolean);
  const thin = slabs.thinnest !== null && slabs.thinnest < THIN_CUT;

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-sky">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label="Slabs to order"
            value={tooMany ? "Too many" : plural(slabs.order, "slab")}
            hint={
              empty
                ? "Add your patio's size to see how many to order."
                : tooMany
                  ? `Over ${formatNumber(MAX_PIECES, 0)} pieces: too many to lay out, so slabs and jointing aren't counted below.`
                  : `${slabs.full} whole, ${plural(slabs.cuts, "cut piece")} from ${plural(slabs.cutFrom, "slab")}, plus ${laying.slabExtra}% for breakages`
            }
          />
          {tooMany && (
            <Callout tone="warn">
              A patio this big in slabs this small would take more than {formatNumber(MAX_PIECES, 0)} pieces. Use bigger slabs, or split it into
              rectangles and total them.
            </Callout>
          )}

          <div className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <p className="text-[15px] font-bold">Estimated cost</p>
            <p className="font-heading text-4xl font-black tracking-tight text-numeric">{price(cost.total, money)}</p>
            {segments.length > 0 && <SplitBar segments={segments} format={(v) => price(v, money)} />}
            {unpriced.length > 0 && <p className="text-xs font-semibold text-muted-foreground">Not counted: {unpriced.join(" and ")} has no price.</p>}
          </div>

          {!empty && <ShoppingList result={result} laying={laying} costs={costs} mot={mot} sand={sand} money={money} />}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Patio area" value={formatArea(area.net, units)} hint={area.cut > 0 ? `${formatArea(area.cut, units)} cut out` : "No cut-outs"} />
            <Stat label="Cost per m²" value={area.net > 0 ? price(cost.total / area.net, money) : "n/a"} hint="Materials only" />
            <Stat
              label="Fall"
              value={`${formatNumber(fall.drop, 0)} mm`}
              hint={`over ${formatNumber(fall.run, 2)} m at 1:${laying.fall}, ${laying.fallAlong === "width" ? "away from the house" : "along the house"}`}
            />
            <Stat label="Dig down" value={`${formatNumber(dig.depth, 0)} mm`} hint={`plus the fall; ${cubic(dig.loose)} m³ of loose soil to shift`} />
          </div>

          <div className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <p className="text-[15px] font-bold">How it&apos;s built</p>
            <BuildUp kind={laying.kind} slab={laying.thickness} bed={laying.bed} subBase={laying.subBase} />
          </div>

          <div className="space-y-2.5">
            {thin && (
              <Callout tone="warn">
                The narrowest cut is {formatNumber(slabs.thinnest ?? 0, 0)} mm. Strips under about {THIN_CUT} mm snap easily and
                look fiddly: nudge the patio size, or start from the middle so both edges get a wider cut.
              </Callout>
            )}
            <Callout>
              Keep the finished patio at least 150 mm below the damp-proof course, and fall it away from the house.
              {laying.kind === "porcelain" ? " Porcelain needs a priming slurry brushed onto the back of each slab so the mortar grips." : ""}
            </Callout>
            <p className="text-xs font-semibold text-muted-foreground">
              Measured in other units? Convert with{" "}
              <Link href="/unit-converter/metres-to-feet" className="underline underline-offset-2">
                metres to feet
              </Link>
              ,{" "}
              <Link href="/unit-converter/square-metres-to-square-feet" className="underline underline-offset-2">
                m² to ft²
              </Link>{" "}
              or the{" "}
              <Link href="/unit-converter" className="underline underline-offset-2">
                unit converter
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Cut pieces narrower than this are flagged: a rule of thumb, not a standard. */
const THIN_CUT = 100;

function ShoppingList({ result, laying, costs, mot, sand, money }: { result: PatioResult; laying: Laying; costs: Costs; mot: Buying; sand: Buying; money: Money }) {
  const { slabs, subBase, compound, pointing, cement, tooMany } = result;
  const motPlan = planOrFallback(subBase.options);
  const sandPlan = planOrFallback(result.sand.options);
  const slabArea = (laying.length * laying.width) / 1e6;
  return (
    <div className="space-y-2">
      <p className="text-[15px] font-bold">Shopping list</p>
      <ul className="space-y-2">
        {/* Slabs and jointing come off the laying plan, which a patio with too many pieces doesn't get. */}
        {!tooMany && (
          <ShopRow
            icon={<SlabIcon kind={laying.kind} className="h-8 w-9" />}
            title={`${SLAB_INFO[laying.kind].label} slabs`}
            detail={`${laying.length} × ${laying.width} × ${laying.thickness} mm`}
            buy={plural(slabs.order, "slab")}
            buyDetail={`${formatNumber(slabs.order * slabArea, 1)} m²`}
            cost={result.cost.slabs}
            money={money}
          />
        )}
        <ShopRow
          icon={<BagIcon kind="bulk" material="gravel" className="h-9 w-8" />}
          title="MOT Type 1"
          detail={`${weightText(subBase.kg / 1000)} for ${laying.subBase} mm`}
          buy={planText(motPlan)}
          buyDetail={bagDetail(motPlan, mot, "kg")}
          cost={result.cost.subBase}
          money={money}
        />
        <ShopRow
          icon={<BagIcon kind="bag" material="sand" className="h-9 w-8" />}
          title="Sharp sand"
          detail={pointing ? "Bed and pointing" : `${laying.bed} mm bed at ${laying.bedRatio}:1`}
          buy={planText(sandPlan)}
          buyDetail={`${weightText(result.sand.kg / 1000)} · ${bagDetail(sandPlan, sand, "kg")}`}
          cost={result.cost.sand}
          money={money}
        />
        <ShopRow
          icon={<CementBag className="h-9 w-8" />}
          title="Cement"
          detail={`${formatNumber(cement.kg, 0)} kg`}
          buy={plural(cement.bags, "bag")}
          buyDetail={`${CEMENT_BAG} kg each`}
          cost={result.cost.cement}
          money={money}
        />
        {compound && !tooMany && (
          <ShopRow
            icon={<Tub className="h-9 w-8" />}
            title="Jointing compound"
            detail={`${formatNumber(compound.litres, 1)} L of joint, ${compound.depth} mm deep`}
            buy={plural(compound.tubs, "tub")}
            buyDetail={`${laying.tub} kg each at ${price(costs.tubPrice, money)}`}
            cost={result.cost.jointing}
            money={money}
          />
        )}
      </ul>
    </div>
  );
}
