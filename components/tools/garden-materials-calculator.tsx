"use client";

import { Plus, SlidersHorizontal, X } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { NumericInput } from "@/components/calc/numeric-input";
import { PillButton, togglePillClass } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { AreaThumb, BagIcon, CrossSection, Swatch, TextureDefs } from "@/components/tools/garden-visuals";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, useUrlState, urlField, type NumberRange } from "@/hooks/use-url-state";
import { formatNumber } from "@/lib/currency";
import {
  BARROW,
  LIMITS,
  MATERIALS,
  MATERIAL_INFO,
  MAX_AREAS,
  MAX_DIMENSION,
  areaOf,
  calculate,
  encodeAreas,
  jobFor,
  parseAreas,
  reshape,
  unitVolume,
  type Area,
  type BagUnit,
  type GardenResult,
  type Job,
  type Material,
  type Plan,
  type Settings,
  type Shape,
} from "@/lib/garden-materials";
import { cn } from "@/lib/utils";

type Units = "metric" | "imperial";
const UNITS = ["metric", "imperial"] as const;
const UNIT_OPTIONS = [
  { value: "metric" as const, label: "Metres" },
  { value: "imperial" as const, label: "Feet" },
];

const FOOT = 0.3048;
const CM_PER_INCH = 2.54;
const CUBIC_YARD = 0.764555;

type Row = Area & { id: number };

/** Ids only need to be unique within the list; index-based so server and client agree. */
const withIds = (areas: Area[]): Row[] => areas.map((area, id) => ({ ...area, id }));
const nextId = (rows: Row[]) => rows.reduce((max, r) => Math.max(max, r.id), -1) + 1;

const DEFAULT_AREAS: Area[] = [{ shape: "rect", length: 4, width: 1.5, cut: false }];
const DEFAULT_AREAS_CODE = encodeAreas(DEFAULT_AREAS);

const DEFAULT_SETTINGS = Object.fromEntries(MATERIALS.map((m) => [m, MATERIAL_INFO[m].defaults])) as Record<Material, Settings>;

const SHAPE_OPTIONS: { value: Shape; label: string }[] = [
  { value: "rect", label: "Rectangle" },
  { value: "circle", label: "Circle" },
  { value: "known", label: "Know the area" },
];

/** Numeric settings mirrored into the URL per material, e.g. `bark-depth=10`. */
const NUMBER_FIELDS: [keyof Omit<Settings, "job">, string, NumberRange][] = [
  ["depth", "depth", LIMITS.depth],
  ["bag", "bag", LIMITS.size],
  ["bagPrice", "bagprice", MONEY_RANGE],
  ["bulk", "bulk", LIMITS.size],
  ["bulkPrice", "bulkprice", MONEY_RANGE],
  ["delivery", "delivery", MONEY_RANGE],
  ["extra", "extra", LIMITS.extra],
  ["density", "density", LIMITS.density],
];

export function GardenMaterialsCalculator() {
  const { code, currency, setCurrency, money, currencyField } = useCurrency();
  const [material, setMaterial] = React.useState<Material>("topsoil");
  const [all, setAll] = React.useState(DEFAULT_SETTINGS);
  const [rows, setRows] = React.useState<Row[]>(() => withIds(DEFAULT_AREAS));
  const [units, setUnits] = React.useState<Units>("metric");

  const setFor = (m: Material, patch: Partial<Settings>) => setAll((prev) => ({ ...prev, [m]: { ...prev[m], ...patch } }));
  const update = (patch: Partial<Settings>) => setFor(material, patch);

  useUrlState({
    mat: urlField(material, (v: string) => setMaterial(v as Material), "topsoil", MATERIALS),
    areas: urlField(encodeAreas(rows), (v: string) => {
      const parsed = parseAreas(v);
      if (parsed.ok) setRows(withIds(parsed.value));
    }, DEFAULT_AREAS_CODE),
    units: urlField(units, (v: string) => setUnits(v as Units), "metric", UNITS),
    currency: currencyField,
    ...Object.fromEntries(
      MATERIALS.flatMap((m) => [
        [
          `${m}-job`,
          urlField(all[m].job, (v: string) => setFor(m, { job: v }), MATERIAL_INFO[m].defaults.job, MATERIAL_INFO[m].jobs.map((j) => j.id)),
        ],
        ...NUMBER_FIELDS.map(([key, name, range]) => [
          `${m}-${name}`,
          urlField(all[m][key], (v: number) => setFor(m, { [key]: v }), MATERIAL_INFO[m].defaults[key], undefined, range),
        ]),
      ]),
    ),
  });

  const settings = all[material];
  const info = MATERIAL_INFO[material];
  const result = calculate(rows, material, settings);
  const cost = result.options.best?.cost ?? null;

  return (
    <>
      <TextureDefs />
      <MaterialTabs value={material} onChange={setMaterial} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Your garden</CardTitle>
            <Segmented label="Measure in" size="sm" value={units} onChange={setUnits} options={UNIT_OPTIONS} className="w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Areas rows={rows} onChange={setRows} material={material} units={units} />
            <Depth material={material} settings={settings} units={units} onChange={update} />
            <Buying
              material={material}
              settings={settings}
              onChange={update}
              currency={currency.symbol}
              code={code}
              onCurrency={setCurrency}
              money={money}
            />
          </CardContent>
        </Card>

        <Results material={material} settings={settings} result={result} units={units} money={money} />
      </div>
      <MobileResultBar
        label={cost !== null ? `${info.label} · ${price(cost, money)}` : info.label}
        value={`${cubic(result.volume)} m³`}
      />
    </>
  );
}

type Money = (v: number, decimals?: number) => string;

/** Cubic metres to 2 places (1 from 10 up), nudged so 1.725 shows as 1.73 like its 1,725 litres. */
function cubic(m3: number): string {
  return formatNumber(m3 + 1e-9, m3 < 10 ? 2 : 1);
}

/** Tonnes from one up, kilograms below. */
function weightText(t: number): string {
  return t >= 1 ? `${formatNumber(t, 2)} t` : `${formatNumber(t * 1000, 0)} kg`;
}

/** Pence while it matters, whole pounds once it doesn't. */
function price(v: number, money: Money): string {
  return money(v, v < 100 && !Number.isInteger(v) ? 2 : 0);
}

/* ---------------------------------------------------------------- Tabs -- */

function MaterialTabs({ value, onChange }: { value: Material; onChange: (m: Material) => void }) {
  return (
    <ChoiceGroup
      label="Material"
      value={value}
      onChange={onChange}
      options={MATERIALS.map((m) => ({ value: m }))}
      className="grid grid-cols-3 gap-2.5 sm:grid-cols-6"
      itemClassName={(active) =>
        cn(
          "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-[15px] font-bold transition-transform",
          active ? "sticker-sm -translate-y-0.5 bg-mint" : "border-2 border-foreground bg-card hover:-translate-y-0.5",
        )
      }
      renderLabel={({ value: m }) => (
        <>
          <Swatch material={m} className="size-7" />
          {MATERIAL_INFO[m].label}
        </>
      )}
    />
  );
}

/* --------------------------------------------------------------- Areas -- */

function lengthIn(units: Units): { factor: number; suffix: string; area: string } {
  return units === "imperial" ? { factor: FOOT, suffix: "ft", area: "ft²" } : { factor: 1, suffix: "m", area: "m²" };
}

function formatArea(m2: number, units: Units): string {
  const { factor, area } = lengthIn(units);
  const v = m2 / (factor * factor);
  return `${formatNumber(v, v < 10 ? 2 : 1)} ${area}`;
}

function Areas({ rows, onChange, material, units }: { rows: Row[]; onChange: (rows: Row[]) => void; material: Material; units: Units }) {
  const set = (id: number, area: Area) => onChange(rows.map((r) => (r.id === id ? { ...area, id } : r)));
  const add = (cut: boolean) => {
    const side = cut ? 1 : 2;
    onChange([...rows, { shape: "rect", length: side, width: side, cut, id: nextId(rows) }]);
  };
  const full = rows.length >= MAX_AREAS;
  let areaNo = 0;
  let cutNo = 0;

  return (
    <section className="space-y-3" aria-labelledby="gm-areas">
      <h3 id="gm-areas" className="text-[15px] font-bold">
        Areas to cover
      </h3>
      <ul className="space-y-3">
        {rows.map((row) => (
          <AreaRow
            key={row.id}
            row={row}
            name={row.cut ? `Cut-out ${++cutNo}` : `Area ${++areaNo}`}
            material={material}
            units={units}
            onChange={(area) => set(row.id, area)}
            onRemove={rows.length > 1 ? () => onChange(rows.filter((r) => r.id !== row.id)) : undefined}
          />
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <PillButton onClick={() => add(false)} disabled={full}>
          <Plus className="size-4" /> Add an area
        </PillButton>
        <PillButton onClick={() => add(true)} disabled={full}>
          <Plus className="size-4" /> Cut out a pond or patio
        </PillButton>
      </div>
    </section>
  );
}

function AreaRow({
  row,
  name,
  material,
  units,
  onChange,
  onRemove,
}: {
  row: Row;
  name: string;
  material: Material;
  units: Units;
  onChange: (area: Area) => void;
  onRemove?: () => void;
}) {
  const { factor, suffix, area } = lengthIn(units);
  const id = `gm-area-${row.id}`;
  const metres = (key: string, label: string, value: number, set: (m: number) => void) => (
    <NumberField
      id={`${id}-${key}`}
      label={label}
      value={Number((value / factor).toFixed(2))}
      onChange={(v) => set(v * factor)}
      max={MAX_DIMENSION / factor}
      suffix={suffix}
      decimals={2}
    />
  );

  return (
    <li className={cn("space-y-3 rounded-2xl border-[2.5px] border-foreground p-3", row.cut ? "border-dashed bg-secondary" : "bg-card")}>
      <div className="flex items-center gap-3">
        <AreaThumb area={row} material={material} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{name}</p>
          <p className="font-mono text-xs font-bold text-muted-foreground">
            {row.cut ? "−" : ""}
            {formatArea(areaOf(row), units)}
          </p>
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
      <Segmented
        label={`${name} shape`}
        size="sm"
        value={row.shape}
        onChange={(shape) => onChange(reshape(row, shape))}
        options={SHAPE_OPTIONS}
      />
      <div className="grid grid-cols-2 gap-3">
        {row.shape === "rect" && (
          <>
            {metres("length", "Length", row.length, (length) => onChange({ ...row, length }))}
            {metres("width", "Width", row.width, (width) => onChange({ ...row, width }))}
          </>
        )}
        {row.shape === "circle" && metres("diameter", "Across (diameter)", row.diameter, (diameter) => onChange({ ...row, diameter }))}
        {row.shape === "known" && (
          <NumberField
            id={`${id}-m2`}
            label="Area"
            value={Number((row.m2 / (factor * factor)).toFixed(2))}
            onChange={(v) => onChange({ ...row, m2: v * factor * factor })}
            max={MAX_DIMENSION / (factor * factor)}
            suffix={area}
            decimals={2}
          />
        )}
      </div>
    </li>
  );
}

/* --------------------------------------------------------------- Depth -- */

function depthText(cm: number, units: Units): string {
  return units === "imperial" ? `${formatNumber(cm / CM_PER_INCH, 1)} in` : `${formatNumber(cm, 1)} cm`;
}

/** A job's usual depth: "7.5 cm", or "20–30 cm" for a range. */
function depthRange({ min, max }: Job, units: Units): string {
  if (min === max) return depthText(min, units);
  const [low] = depthText(min, units).split(" ");
  return `${low}–${depthText(max, units)}`;
}

function Depth({ material, settings, units, onChange }: { material: Material; settings: Settings; units: Units; onChange: (p: Partial<Settings>) => void }) {
  const info = MATERIAL_INFO[material];
  const job = jobFor(material, settings.job);
  const imperial = units === "imperial";
  const outside = settings.depth < job.min - 1e-9 || settings.depth > job.max + 1e-9;

  return (
    <section className="space-y-4" aria-labelledby="gm-depth">
      <h3 id="gm-depth" className="text-[15px] font-bold">
        What&apos;s it for?
      </h3>
      <ChoiceGroup
        label="Job"
        value={job.id}
        onChange={(id) => onChange({ job: id, depth: jobFor(material, id).depth })}
        options={info.jobs.map((j) => ({ ...j, value: j.id }))}
        className="flex flex-wrap gap-2"
        itemClassName={(active) => togglePillClass(active)}
        renderLabel={(j, active) => (
          <>
            {j.label}
            <span className={cn("font-mono text-xs", active ? "text-background/70" : "text-muted-foreground")}>{depthRange(j, units)}</span>
          </>
        )}
      />
      <p className="text-xs font-semibold text-muted-foreground">{job.hint}</p>

      <CrossSection
        material={material}
        depth={settings.depth}
        job={job}
        unit={imperial ? "in" : "cm"}
        label={depthText(settings.depth, units)}
        onDepth={(depth) => onChange({ depth: Number(depth.toFixed(2)) })}
      />

      {imperial ? (
        <SliderField
          id="gm-depth-in"
          label="Depth"
          value={Number((settings.depth / CM_PER_INCH).toFixed(2))}
          onChange={(v) => onChange({ depth: Number((v * CM_PER_INCH).toFixed(2)) })}
          min={0.25}
          max={18}
          inputMax={LIMITS.depth.max / CM_PER_INCH}
          step={0.25}
          suffix="in"
          decimals={2}
        />
      ) : (
        <SliderField
          id="gm-depth-cm"
          label="Depth"
          value={settings.depth}
          onChange={(v) => onChange({ depth: v })}
          min={0.5}
          max={45}
          inputMax={LIMITS.depth.max}
          step={0.5}
          suffix="cm"
          decimals={1}
        />
      )}
      <p className="-mt-1 text-xs font-semibold text-muted-foreground">
        Drag the top of the layer or use the slider.
        {outside && ` Usual for ${job.label.toLowerCase()}: ${depthRange(job, units)}.`}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------- Buying -- */

function Buying({
  material,
  settings,
  onChange,
  currency,
  code,
  onCurrency,
  money,
}: {
  material: Material;
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  currency: string;
  code: string;
  onCurrency: (code: string) => void;
  money: Money;
}) {
  const info = MATERIAL_INFO[material];
  const sections = useSectionState([]);
  const defaults = info.defaults;
  const byWeight = info.bagUnit === "kg";
  const litres = (size: number) => `≈ ${formatNumber(unitVolume(size, "kg", settings.density) * 1000, 0)} L each`;

  return (
    <section className="space-y-5" aria-labelledby="gm-buying">
      <div className="flex items-center justify-between gap-3">
        <h3 id="gm-buying" className="text-[15px] font-bold">
          Buying
        </h3>
        <CurrencySelect value={code} onChange={onCurrency} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-4 rounded-2xl border-2 border-foreground/15 p-3.5">
          <SizePicker
            id="gm-bag"
            label="Bag size"
            unit={info.bagUnit}
            sizes={info.bagSizes}
            value={settings.bag}
            onChange={(bag) => onChange({ bag })}
            hint={byWeight ? litres(settings.bag) : undefined}
            icon={<BagIcon kind="bag" material={material} className="h-7 w-6" />}
          />
          <NumberField
            id="gm-bag-price"
            label="Price per bag"
            value={settings.bagPrice}
            onChange={(bagPrice) => onChange({ bagPrice })}
            max={MONEY_RANGE.max}
            prefix={currency}
            decimals={2}
          />
        </div>
        <div className="space-y-4 rounded-2xl border-2 border-foreground/15 p-3.5">
          <SizePicker
            id="gm-bulk"
            label="Bulk bag size"
            unit={info.bagUnit}
            sizes={info.bulkSizes}
            value={settings.bulk}
            onChange={(bulk) => onChange({ bulk })}
            hint={byWeight ? `≈ ${formatNumber(unitVolume(settings.bulk, "kg", settings.density), 2)} m³` : undefined}
            icon={<BagIcon kind="bulk" material={material} className="h-7 w-6" />}
          />
          <NumberField
            id="gm-bulk-price"
            label="Price per bulk bag"
            value={settings.bulkPrice}
            onChange={(bulkPrice) => onChange({ bulkPrice })}
            max={MONEY_RANGE.max}
            prefix={currency}
            decimals={2}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs font-semibold text-muted-foreground">
        Prices start at rough 2026 UK figures: put in your supplier&apos;s. Leave a price blank to rule that way out.
      </p>

      <div className="space-y-2">
        <SliderField
          id="gm-extra"
          label="Extra for waste and settling"
          value={settings.extra}
          onChange={(extra) => onChange({ extra })}
          min={0}
          max={30}
          inputMax={LIMITS.extra.max}
          step={1}
          suffix="%"
          decimals={0}
        />
        <p className="text-xs font-semibold text-muted-foreground">{info.extraHint}</p>
      </div>

      <Section
        icon={SlidersHorizontal}
        title="Weight and delivery"
        summary={`${formatNumber(settings.density, 2)} t/m³ · ${settings.delivery > 0 ? `${price(settings.delivery, money)} delivery` : "delivery included"}`}
        active={settings.density !== defaults.density || settings.delivery > 0}
        open={sections.isOpen("more")}
        onToggle={() => sections.toggle("more")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="gm-density"
            label="Density"
            value={settings.density}
            onChange={(density) => onChange({ density: density || defaults.density })}
            min={LIMITS.density.min}
            max={LIMITS.density.max}
            suffix="t/m³"
            decimals={2}
            hint={`Default ${defaults.density} for ${info.densityNote}. Usual range ${info.densityRange[0]}–${info.densityRange[1]}.`}
          />
          <NumberField
            id="gm-delivery"
            label="Bulk bag delivery"
            value={settings.delivery}
            onChange={(delivery) => onChange({ delivery })}
            max={MONEY_RANGE.max}
            prefix={currency}
            decimals={2}
            hint="Charged once per order with a bulk bag. Leave blank if it's in the price."
          />
        </div>
      </Section>
    </section>
  );
}

function SizePicker({
  id,
  label,
  unit,
  sizes,
  value,
  onChange,
  hint,
  icon,
}: {
  id: string;
  label: string;
  unit: BagUnit;
  sizes: readonly number[];
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-[15px] font-bold">
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === value}
            onClick={() => onChange(s)}
            className={cn(
              "h-8 rounded-full border-2 border-foreground px-2.5 font-mono text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              s === value ? "bg-foreground text-background" : "bg-card hover:bg-secondary",
            )}
          >
            {formatNumber(s, 1)} {unit}
          </button>
        ))}
      </div>
      <NumericInput id={id} value={value} onChange={onChange} min={LIMITS.size.min} max={LIMITS.size.max} suffix={unit} decimals={1} inputClassName="w-full" />
      {hint && <p className="text-xs font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- Results -- */

function planText(plan: Plan): string {
  const parts = [];
  if (plan.bulk) parts.push(`${plan.bulk} bulk bag${plan.bulk === 1 ? "" : "s"}`);
  if (plan.bags) parts.push(`${plan.bags} bag${plan.bags === 1 ? "" : "s"}`);
  return parts.join(" + ") || "Nothing";
}

function Results({
  material,
  settings,
  result,
  units,
  money,
}: {
  material: Material;
  settings: Settings;
  result: GardenResult;
  units: Units;
  money: Money;
}) {
  const info = MATERIAL_INFO[material];
  const { volume, weight, area, options } = result;
  const { best } = options;
  const cost = best?.cost ?? null;
  const empty = volume <= 0;
  const litres = volume * 1000;
  const rowsToShow: { key: string; label: string; plan: Plan }[] = [
    { key: "bags", label: `Bags only`, plan: options.bagsOnly },
    { key: "bulk", label: `Bulk bags only`, plan: options.bulkOnly },
    ...(options.mix ? [{ key: "mix", label: "Bulk bags and bags", plan: options.mix }] : []),
  ];

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-mint">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label={`${info.label} you need`}
            value={`${cubic(volume)} m³`}
            hint={
              empty
                ? "Add an area and a depth to see how much to buy."
                : `${formatNumber(litres, 0)} litres${units === "imperial" ? ` (${formatNumber(volume / CUBIC_YARD, 2)} cu yd)` : ""}, with ${settings.extra}% extra`
            }
          />

          {!empty && (
            <div className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
              <p className="text-[15px] font-bold">{best ? "Cheapest way to buy" : "What to buy"}</p>
              <p className="font-heading text-3xl font-black tracking-tight text-numeric">
                {planText(best ?? options.bulkOnly)}
                {cost !== null && <span className="text-muted-foreground"> · {price(cost, money)}</span>}
              </p>
              <Arrival plan={best ?? options.bulkOnly} material={material} settings={settings} volume={volume} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Weight" value={weightText(weight)} hint={`At ${formatNumber(settings.density, 2)} t/m³`} />
            <Stat label="Barrow loads" value={String(result.barrowLoads)} hint={`${BARROW.litres} L barrow, up to ${BARROW.kg} kg`} />
            <Stat
              label="Area"
              value={formatArea(area.net, units)}
              hint={area.cut > 0 ? `${formatArea(area.cut, units)} cut out` : `At ${depthText(settings.depth, units)} deep`}
            />
            <Stat
              label="Cost per m²"
              value={cost !== null && area.net > 0 ? price(cost / area.net, money) : "n/a"}
              hint={best ? "Cheapest way" : "Add a price"}
            />
          </div>

          {!empty && (
            <div className="space-y-2">
              <p className="text-[15px] font-bold">Ways to buy</p>
              <ul className="space-y-2">
                {rowsToShow.map(({ key, label, plan }) => (
                  <PlanRow key={key} label={label} plan={plan} cheapest={plan === best} settings={settings} unit={info.bagUnit} money={money} />
                ))}
              </ul>
            </div>
          )}

          <Notes material={material} settings={settings} result={result} units={units} />
        </CardContent>
      </Card>
    </div>
  );
}

/** What turns up: an icon per bag, the last one filled to show how much of it you'll use. */
function Arrival({ plan, material, settings, volume }: { plan: Plan; material: Material; settings: Settings; volume: number }) {
  const unit = MATERIAL_INFO[material].bagUnit;
  const bagVol = unitVolume(settings.bag, unit, settings.density);
  const bulkVol = unitVolume(settings.bulk, unit, settings.density);
  const lastBag = plan.bags > 0 && bagVol > 0 ? 1 - plan.spare / bagVol : 1;
  const lastBulk = plan.bags === 0 && plan.bulk > 0 && bulkVol > 0 ? 1 - plan.spare / bulkVol : 1;
  const MAX_ICONS = 16;

  const group = (kind: "bag" | "bulk", count: number, lastFill: number) => {
    if (count === 0) return null;
    const size = kind === "bulk" ? "h-12 w-11" : "h-8 w-7";
    if (count > MAX_ICONS) {
      return (
        <li className="flex items-center gap-1.5">
          <BagIcon kind={kind} material={material} className={size} />
          <span className="font-mono text-sm font-bold">× {count}</span>
        </li>
      );
    }
    return Array.from({ length: count }, (_, i) => (
      <li key={`${kind}${i}`}>
        <BagIcon kind={kind} material={material} fill={i === count - 1 ? lastFill : 1} className={size} />
      </li>
    ));
  };

  return (
    <>
      <ul className="flex flex-wrap items-end gap-1" aria-label={`${planText(plan)}, ${formatNumber(volume, 2)} m³`}>
        {group("bulk", plan.bulk, lastBulk)}
        {group("bag", plan.bags, lastBag)}
      </ul>
      {plan.spare > 0.0005 && (
        <p className="text-xs font-semibold text-muted-foreground">
          The last {plan.bags > 0 ? "bag" : "bulk bag"} is shown filled to what you&apos;ll use: {formatNumber(plan.spare * 1000, 0)} L
          left over.
        </p>
      )}
    </>
  );
}

function PlanRow({
  label,
  plan,
  cheapest,
  settings,
  unit,
  money,
}: {
  label: string;
  plan: Plan;
  cheapest: boolean;
  settings: Settings;
  unit: BagUnit;
  money: Money;
}) {
  const size = (n: number) => `${formatNumber(n, 1)} ${unit}`;
  const detail = [plan.bulk ? `${plan.bulk} × ${size(settings.bulk)}` : "", plan.bags ? `${plan.bags} × ${size(settings.bag)}` : ""]
    .filter(Boolean)
    .join(" + ");
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border-[2.5px] border-foreground px-3.5 py-2.5",
        cheapest ? "bg-yellow" : "bg-card",
      )}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          {label}
          {cheapest && <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] text-background">Cheapest</span>}
        </p>
        <p className="font-mono text-xs font-bold text-muted-foreground">{detail || "Nothing"}</p>
      </div>
      <p className="shrink-0 text-right font-heading text-xl font-extrabold tracking-tight text-numeric">
        {plan.cost === null ? <span className="text-sm text-muted-foreground">No price</span> : price(plan.cost, money)}
      </p>
    </li>
  );
}

/** At most two notes, most important first. */
function Notes({ material, settings, result, units }: { material: Material; settings: Settings; result: GardenResult; units: Units }) {
  const job = jobFor(material, settings.job);
  const { area, weight, options } = result;
  const notes: { tone: "info" | "warn"; text: string }[] = [];

  if (area.cut > 0 && area.cut >= area.added) {
    notes.push({ tone: "warn", text: "Your cut-outs are as big as your areas, so there's nothing left to cover." });
  }
  if (settings.depth > 60 && job.max < 60) {
    notes.push({ tone: "warn", text: `${depthText(settings.depth, units)} is very deep for ${job.label.toLowerCase()}. Did you mean ${depthText(settings.depth / 10, units)}?` });
  }
  if ((material === "mulch" || material === "bark") && settings.depth < 5 && job.min >= 5) {
    notes.push({ tone: "warn", text: "Under 5 cm, mulch won't keep weeds down. The RHS suggests at least 5 cm, ideally 7.5 cm." });
  }
  if (weight > 0.5) {
    notes.push({
      tone: "info",
      text: `${weightText(weight)} is more than most cars can carry in one go: check your car's payload, or get it delivered.`,
    });
  }
  if (options.best && options.best.bulk > 0) {
    notes.push({
      tone: "info",
      text: "Bulk bags are dropped by a lorry with a crane or on a pallet truck and can't be moved once full: check there's firm ground close to the road for them.",
    });
  }

  if (notes.length === 0) return null;
  return (
    <div className="space-y-2">
      {notes.slice(0, 2).map((n) => (
        <Callout key={n.text} tone={n.tone}>
          {n.text}
        </Callout>
      ))}
    </div>
  );
}
