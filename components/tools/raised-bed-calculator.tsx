"use client";

import { Ruler } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { togglePillClass } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SizePicker } from "@/components/calc/size-picker";
import { SliderField } from "@/components/calc/slider-field";
import { SwitchField } from "@/components/calc/switch-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SplitBar } from "@/components/charts/split-bar";
import {
  CM_PER_INCH,
  FOOT,
  UNITS,
  UNIT_OPTIONS,
  cubic,
  depthText,
  lengthText,
  planText,
  price,
  weightText,
  type Money,
  type Units,
} from "@/components/tools/garden-format";
import { BagIcon, Swatch, TextureDefs } from "@/components/tools/garden-visuals";
import { ShopRow } from "@/components/tools/shop-row";
import { BedDrawing, MixBar } from "@/components/tools/raised-bed-visuals";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, PERCENT_RANGE, inputFields, useUrlState, urlField, type FieldUpdate, type NumberRange } from "@/hooks/use-url-state";
import { formatNumber, plural } from "@/lib/currency";
import { BARROW, type Buying } from "@/lib/garden-materials";
import {
  DEFAULT_POST_PRICE,
  INGREDIENTS,
  INGREDIENT_INFO,
  LIMITS,
  MIX_PRESETS,
  POST_SPACING,
  POST_STOCK,
  TIMBERS,
  TIMBER_INFO,
  calculate,
  groupBoards,
  presetFor,
  timberFor,
  type Bed,
  type Ingredient,
  type Mix,
  type RaisedBedResult,
  type Timber,
  type TimberKind,
} from "@/lib/raised-bed";
import { cn } from "@/lib/utils";

const DEFAULT_BED: Bed = { length: 2.4, width: 1.2, depth: 45, count: 1 };
const DEFAULT_MIX: Mix = MIX_PRESETS[0]!.mix;
const DEFAULT_TIMBER = timberFor("scaffold");
const DEFAULT_BUYING = Object.fromEntries(INGREDIENTS.map((i) => [i, INGREDIENT_INFO[i].defaults])) as Record<Ingredient, Buying>;
const DEFAULT_EXTRA = 15;

const TIMBER_OPTIONS: { value: TimberKind; label: string; size: string }[] = [
  ...(["scaffold", "sleeper", "decking"] as const).map((k) => ({
    value: k,
    label: TIMBER_INFO[k].label,
    size: `${TIMBER_INFO[k].defaults.height} × ${TIMBER_INFO[k].defaults.thickness}`,
  })),
  { value: "none", label: "Already built", size: "soil only" },
];

/** Buying settings mirrored into the URL per ingredient, e.g. `manure-bulkprice=80`. */
const BUYING_FIELDS: [keyof Buying, string, NumberRange][] = [
  ["bag", "bag", LIMITS.size],
  ["bagPrice", "bagprice", MONEY_RANGE],
  ["bulk", "bulk", LIMITS.size],
  ["bulkPrice", "bulkprice", MONEY_RANGE],
  ["delivery", "delivery", MONEY_RANGE],
  ["density", "density", LIMITS.density],
];

/** Each ingredient's swatch as a Section icon. */
const SWATCH_ICONS = Object.fromEntries(
  INGREDIENTS.map((i) => [i, ({ className }: { className?: string }) => <Swatch material={i} className={cn(className, "size-5")} />]),
) as Record<Ingredient, React.ComponentType<{ className?: string }>>;

export function RaisedBedCalculator() {
  const { code, currency, setCurrency, money, currencyField } = useCurrency();
  const [bed, setBed] = React.useState(DEFAULT_BED);
  const [mix, setMix] = React.useState(DEFAULT_MIX);
  const [extra, setExtra] = React.useState(DEFAULT_EXTRA);
  const [timber, setTimber] = React.useState(DEFAULT_TIMBER);
  const [buying, setBuying] = React.useState(DEFAULT_BUYING);
  const [other, setOther] = React.useState(0);
  const [units, setUnits] = React.useState<Units>("metric");

  const updateBed: FieldUpdate<Bed> = (key, value) => setBed((prev) => ({ ...prev, [key]: value }));
  const updateMix: FieldUpdate<Mix> = (key, value) => setMix((prev) => ({ ...prev, [key]: value }));
  const updateTimber: FieldUpdate<Timber> = (key, value) => setTimber((prev) => ({ ...prev, [key]: value }));
  const setBuyingFor = (i: Ingredient, patch: Partial<Buying>) => setBuying((prev) => ({ ...prev, [i]: { ...prev[i], ...patch } }));

  const bedField = inputFields(bed, updateBed, DEFAULT_BED);
  const mixField = inputFields(mix, updateMix, DEFAULT_MIX);
  const timberField = inputFields(timber, updateTimber, DEFAULT_TIMBER);
  useUrlState({
    length: bedField("length", { range: LIMITS.side }),
    width: bedField("width", { range: LIMITS.side }),
    depth: bedField("depth", { range: LIMITS.depth }),
    beds: bedField("count", { range: LIMITS.count }),
    ...Object.fromEntries(INGREDIENTS.map((i) => [`mix-${i}`, mixField(i, { range: PERCENT_RANGE })])),
    extra: urlField(extra, setExtra, DEFAULT_EXTRA, undefined, LIMITS.extra),
    timber: timberField("kind", { allowed: TIMBERS }),
    "board-h": timberField("height", { range: LIMITS.boardHeight }),
    "board-t": timberField("thickness", { range: LIMITS.boardThickness }),
    "board-len": timberField("length", { range: LIMITS.boardLength }),
    "board-price": timberField("price", { range: MONEY_RANGE }),
    posts: timberField("posts"),
    "post-price": timberField("postPrice", { range: MONEY_RANGE }),
    other: urlField(other, setOther, 0, undefined, MONEY_RANGE),
    units: urlField(units, (v: string) => setUnits(v as Units), "metric", UNITS),
    currency: currencyField,
    ...Object.fromEntries(
      INGREDIENTS.flatMap((i) =>
        BUYING_FIELDS.map(([key, name, range]) => [
          `${i}-${name}`,
          urlField(buying[i][key], (v: number) => setBuyingFor(i, { [key]: v }), DEFAULT_BUYING[i][key], undefined, range),
        ]),
      ),
    ),
  });

  const result = calculate({ bed, mix, extra, buying, timber, otherPerBed: other });
  const total = result.cost.total;

  return (
    <>
      <TextureDefs />
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Your beds</CardTitle>
            <Segmented label="Measure in" size="sm" value={units} onChange={setUnits} options={UNIT_OPTIONS} className="w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <BedSize bed={bed} update={updateBed} timber={timber} result={result} mix={mix} units={units} />
            <MixSection mix={mix} setMix={setMix} update={updateMix} extra={extra} setExtra={setExtra} />
            <TimberSection timber={timber} setTimber={setTimber} update={updateTimber} currency={currency.symbol} />
            <BuyingSection
              mix={mix}
              buying={buying}
              onChange={setBuyingFor}
              other={other}
              setOther={setOther}
              currency={currency.symbol}
              code={code}
              onCurrency={setCurrency}
              money={money}
            />
          </CardContent>
        </Card>

        <Results bed={bed} timber={timber} result={result} extra={extra} buying={buying} units={units} money={money} />
      </div>
      <MobileResultBar label={`Soil mix · ${price(total, money)}`} value={`${cubic(result.volume)} m³`} />
    </>
  );
}

/* ------------------------------------------------------------ Formats -- */

/** Board lengths are always metric in the UK. */
const metres = (m: number) => `${formatNumber(m, m < 1 ? 3 : 2)} m`;
/** Cuts in millimetres, as they're marked on the wood. */
const mm = (m: number) => `${formatNumber(m * 1000, 0)} mm`;

/* ---------------------------------------------------------------- Bed -- */

function BedSize({
  bed,
  update,
  timber,
  result,
  mix,
  units,
}: {
  bed: Bed;
  update: FieldUpdate<Bed>;
  timber: Timber;
  result: RaisedBedResult;
  mix: Mix;
  units: Units;
}) {
  const imperial = units === "imperial";
  const factor = imperial ? FOOT : 1;
  const suffix = imperial ? "ft" : "m";
  const t = result.timber;
  const built = timber.kind === "none";
  const heightMm = t?.height ?? bed.depth * 10;
  const soil: Ingredient = mix.topsoil > 0 ? "topsoil" : mix.compost > 0 ? "compost" : "manure";
  const side = (key: "length" | "width", label: string) => (
    <NumberField
      id={`rb-${key}`}
      label={label}
      value={Number((bed[key] / factor).toFixed(2))}
      onChange={(v) => update(key, v * factor)}
      min={LIMITS.side.min / factor}
      max={LIMITS.side.max / factor}
      suffix={suffix}
      decimals={2}
    />
  );
  // Depths that fill whole boards to the top, for the pills under the slider.
  const boardDepths = built || timber.height <= 0 ? [] : [1, 2, 3, 4].map((n) => ({ n, cm: (n * timber.height) / 10 })).filter((d) => d.cm <= LIMITS.depth.max);

  return (
    <section className="space-y-4" aria-labelledby="rb-bed">
      <h3 id="rb-bed" className="text-[15px] font-bold">
        Bed size (inside)
      </h3>
      <BedDrawing
        length={bed.length}
        width={bed.width}
        height={heightMm / 1000}
        depth={bed.depth / 100}
        thickness={(built ? 38 : timber.thickness) / 1000}
        boardHeight={built ? 0 : timber.height / 1000}
        soil={soil}
        count={bed.count}
        labels={{
          length: lengthText(bed.length, units),
          width: lengthText(bed.width, units),
          height: t ? `${depthText(heightMm / 10, units)} · ${plural(t.courses, "board")} high` : depthText(bed.depth, units),
        }}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {side("length", "Length")}
        {side("width", "Width")}
        <NumberField
          id="rb-count"
          label="Number of beds"
          value={bed.count}
          onChange={(v) => update("count", Math.max(1, Math.round(v)))}
          min={LIMITS.count.min}
          max={LIMITS.count.max}
          decimals={0}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {imperial ? (
        <SliderField
          id="rb-depth-in"
          label="Soil depth"
          value={Number((bed.depth / CM_PER_INCH).toFixed(1))}
          onChange={(v) => update("depth", Number((v * CM_PER_INCH).toFixed(2)))}
          min={2}
          max={36}
          inputMax={LIMITS.depth.max / CM_PER_INCH}
          step={0.5}
          suffix="in"
          decimals={1}
        />
      ) : (
        <SliderField
          id="rb-depth-cm"
          label="Soil depth"
          value={bed.depth}
          onChange={(v) => update("depth", v)}
          min={5}
          max={90}
          inputMax={LIMITS.depth.max}
          step={0.5}
          suffix="cm"
          decimals={1}
        />
      )}
      {boardDepths.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Fill to the top of</span>
          {boardDepths.map(({ n, cm }) => (
            <button key={n} type="button" aria-pressed={Math.abs(bed.depth - cm) < 0.01} onClick={() => update("depth", cm)} className={togglePillClass(Math.abs(bed.depth - cm) < 0.01)}>
              {plural(n, "board")}
              <span className="font-mono text-xs opacity-70">{depthText(cm, units)}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-xs font-semibold text-muted-foreground">
        Most veg grows well in 30–45 cm of soil. Measure inside the boards: that&apos;s what you fill.
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- Mix -- */

function MixSection({
  mix,
  setMix,
  update,
  extra,
  setExtra,
}: {
  mix: Mix;
  setMix: (m: Mix) => void;
  update: FieldUpdate<Mix>;
  extra: number;
  setExtra: (v: number) => void;
}) {
  const preset = presetFor(mix);
  const sum = INGREDIENTS.reduce((s, i) => s + mix[i], 0);

  return (
    <section className="space-y-4" aria-labelledby="rb-mix">
      <h3 id="rb-mix" className="text-[15px] font-bold">
        Soil mix
      </h3>
      <ChoiceGroup
        label="Mix"
        value={preset?.id ?? ""}
        onChange={(id) => {
          const p = MIX_PRESETS.find((x) => x.id === id);
          if (p) setMix(p.mix);
        }}
        options={MIX_PRESETS.map((p) => ({ ...p, value: p.id }))}
        className="flex flex-wrap gap-2"
        itemClassName={(active) => togglePillClass(active)}
        renderLabel={(p, active) => (
          <>
            {p.label}
            <span className={cn("font-mono text-xs", active ? "text-background/70" : "text-muted-foreground")}>
              {INGREDIENTS.filter((i) => p.mix[i] > 0)
                .map((i) => p.mix[i])
                .join("/")}
            </span>
          </>
        )}
      />
      <p className="text-xs font-semibold text-muted-foreground">{preset?.hint ?? "Your own mix. Drag the yellow handles or type the percentages."}</p>

      <MixBar mix={mix} onChange={setMix} />

      <div className="grid grid-cols-3 gap-3">
        {INGREDIENTS.map((i) => (
          <NumberField
            key={i}
            id={`rb-mix-${i}`}
            label={INGREDIENT_INFO[i].label}
            value={mix[i]}
            onChange={(v) => update(i, v)}
            max={100}
            suffix="%"
            decimals={0}
          />
        ))}
      </div>
      {sum !== 100 && sum > 0 && (
        <p className="text-xs font-semibold text-muted-foreground">
          These add up to {sum}%, so they&apos;re used as parts of the whole: the bar shows the real split.
        </p>
      )}

      <div className="space-y-2">
        <SliderField
          id="rb-extra"
          label="Extra for settling"
          value={extra}
          onChange={setExtra}
          min={0}
          max={30}
          inputMax={LIMITS.extra.max}
          step={1}
          suffix="%"
          decimals={0}
        />
        <p className="text-xs font-semibold text-muted-foreground">
          A new bed sinks as the soil firms and the compost breaks down. 15% extra keeps it near the top.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Timber -- */

function TimberSection({
  timber,
  setTimber,
  update,
  currency,
}: {
  timber: Timber;
  setTimber: (t: Timber) => void;
  update: FieldUpdate<Timber>;
  currency: string;
}) {
  const info = timber.kind === "none" ? null : TIMBER_INFO[timber.kind];

  return (
    <section className="space-y-4" aria-labelledby="rb-timber">
      <h3 id="rb-timber" className="text-[15px] font-bold">
        Timber
      </h3>
      <ChoiceGroup
        label="Timber"
        value={timber.kind}
        onChange={(kind) => setTimber(kind === "none" ? { ...timber, kind } : timberFor(kind, timber.postPrice))}
        options={TIMBER_OPTIONS}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        itemClassName={(active) =>
          cn(
            "rounded-2xl px-3 py-2.5 text-left transition-transform",
            active ? "sticker-sm -translate-y-0.5 bg-yellow" : "border-2 border-foreground bg-card hover:-translate-y-0.5",
          )
        }
        renderLabel={(o) => (
          <>
            <span className="block text-[15px] font-bold">{o.label}</span>
            <span className="block font-mono text-xs font-bold text-muted-foreground">{o.size}</span>
          </>
        )}
      />
      {info ? (
        <>
          <p className="text-xs font-semibold text-muted-foreground">{info.hint}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4 rounded-2xl border-2 border-foreground/15 p-3.5">
              <SizePicker
                id="rb-board-length"
                label="Board length"
                unit="m"
                sizes={info.lengths}
                value={timber.length}
                onChange={(v) => update("length", v)}
                min={LIMITS.boardLength.min}
                max={LIMITS.boardLength.max}
                decimals={2}
                icon={<Ruler className="size-5" />}
              />
              <NumberField
                id="rb-board-price"
                label="Price per board"
                value={timber.price}
                onChange={(v) => update("price", v)}
                max={MONEY_RANGE.max}
                prefix={currency}
                decimals={2}
              />
            </div>
            <div className="space-y-4 rounded-2xl border-2 border-foreground/15 p-3.5">
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  id="rb-board-height"
                  label="Board height"
                  value={timber.height}
                  onChange={(v) => update("height", v || DEFAULT_TIMBER.height)}
                  min={LIMITS.boardHeight.min}
                  max={LIMITS.boardHeight.max}
                  suffix="mm"
                  decimals={0}
                />
                <NumberField
                  id="rb-board-thickness"
                  label="Thickness"
                  value={timber.thickness}
                  onChange={(v) => update("thickness", v || DEFAULT_TIMBER.thickness)}
                  min={LIMITS.boardThickness.min}
                  max={LIMITS.boardThickness.max}
                  suffix="mm"
                  decimals={0}
                />
              </div>
              <SwitchField
                id="rb-posts"
                label="Corner posts"
                hint={`Inside each corner, and every ${formatNumber(POST_SPACING, 1)} m along long sides.`}
                checked={timber.posts}
                onCheckedChange={(v) => update("posts", v)}
              />
              {timber.posts && (
                <NumberField
                  id="rb-post-price"
                  label={`Price per ${formatNumber(POST_STOCK, 1)} m post`}
                  value={timber.postPrice}
                  onChange={(v) => update("postPrice", v)}
                  max={MONEY_RANGE.max}
                  prefix={currency}
                  decimals={2}
                  hint={`Treated 47 × 50 mm, cut to the bed's height. About ${currency}${DEFAULT_POST_PRICE}.`}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs font-semibold text-muted-foreground">No timber: just the soil to fill the beds you have.</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- Buying -- */

function BuyingSection({
  mix,
  buying,
  onChange,
  other,
  setOther,
  currency,
  code,
  onCurrency,
  money,
}: {
  mix: Mix;
  buying: Record<Ingredient, Buying>;
  onChange: (i: Ingredient, patch: Partial<Buying>) => void;
  other: number;
  setOther: (v: number) => void;
  currency: string;
  code: string;
  onCurrency: (code: string) => void;
  money: Money;
}) {
  const sections = useSectionState([]);
  const used = INGREDIENTS.filter((i) => mix[i] > 0);

  return (
    <section className="space-y-4" aria-labelledby="rb-buying">
      <div className="flex items-center justify-between gap-3">
        <h3 id="rb-buying" className="text-[15px] font-bold">
          Bags and prices
        </h3>
        <CurrencySelect value={code} onChange={onCurrency} />
      </div>
      <div className="space-y-3">
        {used.map((i) => {
          const s = buying[i];
          const info = INGREDIENT_INFO[i];
          const d = info.defaults;
          const changed = BUYING_FIELDS.some(([key]) => s[key] !== d[key]);
          return (
            <Section
              key={i}
              icon={SWATCH_ICONS[i]}
              title={info.label}
              summary={`${formatNumber(s.bag, 0)} L bag ${price(s.bagPrice, money)} · ${formatNumber(s.bulk, 0)} L bulk ${price(s.bulkPrice, money)}`}
              active={changed}
              open={sections.isOpen(i)}
              onToggle={() => sections.toggle(i)}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-4">
                  <SizePicker
                    id={`rb-${i}-bag`}
                    label="Bag size"
                    unit="L"
                    sizes={info.bagSizes}
                    value={s.bag}
                    onChange={(bag) => onChange(i, { bag })}
                    min={LIMITS.size.min}
                    max={LIMITS.size.max}
                    icon={<BagIcon kind="bag" material={i} className="h-7 w-6" />}
                  />
                  <NumberField
                    id={`rb-${i}-bag-price`}
                    label="Price per bag"
                    value={s.bagPrice}
                    onChange={(bagPrice) => onChange(i, { bagPrice })}
                    max={MONEY_RANGE.max}
                    prefix={currency}
                    decimals={2}
                  />
                </div>
                <div className="space-y-4">
                  <SizePicker
                    id={`rb-${i}-bulk`}
                    label="Bulk bag size"
                    unit="L"
                    sizes={info.bulkSizes}
                    value={s.bulk}
                    onChange={(bulk) => onChange(i, { bulk })}
                    min={LIMITS.size.min}
                    max={LIMITS.size.max}
                    icon={<BagIcon kind="bulk" material={i} className="h-7 w-6" />}
                  />
                  <NumberField
                    id={`rb-${i}-bulk-price`}
                    label="Price per bulk bag"
                    value={s.bulkPrice}
                    onChange={(bulkPrice) => onChange(i, { bulkPrice })}
                    max={MONEY_RANGE.max}
                    prefix={currency}
                    decimals={2}
                  />
                </div>
                <NumberField
                  id={`rb-${i}-delivery`}
                  label="Bulk bag delivery"
                  value={s.delivery}
                  onChange={(delivery) => onChange(i, { delivery })}
                  max={MONEY_RANGE.max}
                  prefix={currency}
                  decimals={2}
                  hint="Once per order with a bulk bag. Blank if it's in the price."
                />
                <NumberField
                  id={`rb-${i}-density`}
                  label="Density"
                  value={s.density}
                  onChange={(density) => onChange(i, { density: density || d.density })}
                  min={LIMITS.density.min}
                  max={LIMITS.density.max}
                  suffix="t/m³"
                  decimals={2}
                  hint={`For the weight only. Default ${d.density} for ${info.densityNote}.`}
                />
              </div>
            </Section>
          );
        })}
      </div>
      <p className="text-xs font-semibold text-muted-foreground">
        Prices start at rough 2026 UK figures: put in your supplier&apos;s. Leave a price blank to rule that way out.
      </p>
      <NumberField
        id="rb-other"
        label="Other bits per bed"
        value={other}
        onChange={setOther}
        max={MONEY_RANGE.max}
        prefix={currency}
        decimals={2}
        hint="Screws, brackets, a liner or weed membrane."
        className="sm:max-w-[50%]"
      />
    </section>
  );
}

/* ------------------------------------------------------------ Results -- */

const COST_COLORS = {
  topsoil: "oklch(0.55 0.07 55)",
  compost: "oklch(0.38 0.035 50)",
  manure: "oklch(0.72 0.1 90)",
  boards: "var(--sticker-yellow)",
  posts: "var(--sticker-pink)",
  other: "var(--sticker-lilac)",
};

function Results({
  bed,
  timber,
  result,
  extra,
  buying,
  units,
  money,
}: {
  bed: Bed;
  timber: Timber;
  result: RaisedBedResult;
  extra: number;
  buying: Record<Ingredient, Buying>;
  units: Units;
  money: Money;
}) {
  const { volume, parts, cost } = result;
  const t = result.timber;
  const empty = volume <= 0;
  const beds = bed.count > 1 ? ` for ${bed.count} beds` : "";
  const segments = [
    ...parts.map((p) => ({ name: INGREDIENT_INFO[p.ingredient].label, value: p.options.best?.cost ?? 0, color: COST_COLORS[p.ingredient] })),
    { name: "Boards", value: t?.boardCost ?? 0, color: COST_COLORS.boards },
    { name: "Posts", value: t?.postCost ?? 0, color: COST_COLORS.posts },
    { name: "Other bits", value: cost.other, color: COST_COLORS.other },
  ].filter((s) => s.value > 0);

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-yellow">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label="Soil mix to fill them"
            value={`${cubic(volume)} m³`}
            hint={empty ? "Add a bed size and a mix to see how much to buy." : `${formatNumber(volume * 1000, 0)} litres${beds}, with ${extra}% extra for settling`}
          />

          <div className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <p className="text-[15px] font-bold">Estimated cost{beds}</p>
            <p className="font-heading text-4xl font-black tracking-tight text-numeric">{price(cost.total, money)}</p>
            {segments.length > 0 && <SplitBar segments={segments} format={(v) => price(v, money)} />}
            {cost.unpriced.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground">
                Not counted: {cost.unpriced.map((i) => INGREDIENT_INFO[i].label.toLowerCase()).join(" and ")} has no price.
              </p>
            )}
          </div>

          {!empty && (
            <div className="space-y-2">
              <p className="text-[15px] font-bold">Shopping list</p>
              <ul className="space-y-2">
                {parts.map((p) => {
                  const plan = p.options.best ?? p.options.bulkOnly;
                  const s = buying[p.ingredient];
                  return (
                    <ShopRow
                      key={p.ingredient}
                      icon={<Swatch material={p.ingredient} className="size-8" />}
                      title={`${INGREDIENT_INFO[p.ingredient].label} · ${formatNumber(p.share * 100, 0)}%`}
                      detail={`${cubic(p.volume)} m³ · ${weightText(p.weight)}`}
                      buy={planText(plan)}
                      buyDetail={[plan.bulk ? `${plan.bulk} × ${formatNumber(s.bulk, 0)} L` : "", plan.bags ? `${plan.bags} × ${formatNumber(s.bag, 0)} L` : ""]
                        .filter(Boolean)
                        .join(" + ")}
                      cost={p.options.best?.cost ?? null}
                      money={money}
                    />
                  );
                })}
                {t && (
                  <ShopRow
                    icon={<BoardEnd className="size-8" />}
                    title={TIMBER_INFO[t.kind].label}
                    detail={`${timber.height} × ${timber.thickness} mm, ${plural(t.courses, "board")} high`}
                    buy={plural(t.boards.length, "board")}
                    buyDetail={`${metres(timber.length)} long`}
                    cost={t.boardCost}
                    money={money}
                  />
                )}
                {t && t.posts.count > 0 && (
                  <ShopRow
                    icon={<BoardEnd post className="size-8" />}
                    title="Posts"
                    detail={`${t.posts.count} × ${mm(t.posts.each)}`}
                    buy={plural(t.posts.stock.length, "length")}
                    buyDetail={`${formatNumber(POST_STOCK, 1)} m, 47 × 50 mm`}
                    cost={t.postCost}
                    money={money}
                  />
                )}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Per bed" value={`${cubic(result.perBedToBuy)} m³`} hint={`${formatNumber(result.perBedToBuy * 1000, 0)} L with the extra`} />
            <Stat label="Weight" value={weightText(result.weight)} hint="Damp, as delivered" />
            <Stat label="Barrow loads" value={String(result.barrowLoads)} hint={`${BARROW.litres} L barrow, up to ${BARROW.kg} kg`} />
            <Stat
              label="Outside size"
              value={t ? `${lengthText(t.outside.length, units)} × ${lengthText(t.outside.width, units)}` : "n/a"}
              hint={t ? "Footprint with the boards" : "No timber"}
            />
          </div>

          {t && <CutList result={result} timber={timber} />}
          <Notes bed={bed} result={result} units={units} />
        </CardContent>
      </Card>
    </div>
  );
}

/** The end grain of a board or post, as an icon. */
function BoardEnd({ post = false, className }: { post?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <rect x={post ? 7 : 3} y={post ? 7 : 11} width={post ? 18 : 26} height={post ? 18 : 10} rx={2} fill="oklch(0.87 0.07 78)" stroke="var(--foreground)" strokeWidth={2.5} />
      {post ? (
        <circle cx={16} cy={16} r={4} fill="none" stroke="oklch(0.6 0.07 60)" strokeWidth={1.5} />
      ) : (
        <path d="M7 16 q9 -4 18 0" fill="none" stroke="oklch(0.6 0.07 60)" strokeWidth={1.5} />
      )}
    </svg>
  );
}

function CutList({ result, timber }: { result: RaisedBedResult; timber: Timber }) {
  const t = result.timber;
  if (!t) return null;
  const groups = groupBoards(t.boards);
  const posts = groupBoards(t.posts.stock);
  const row = (g: { count: number; cuts: number[]; offcut: number }, what: string, key: string) => (
    <li key={key} className="flex flex-wrap items-baseline gap-x-2">
      <span className="font-bold">
        {g.count} × {what}:
      </span>
      <span className="font-mono text-xs font-bold">{g.cuts.map(mm).join(" + ")}</span>
      {g.offcut > 0.005 && <span className="text-xs text-muted-foreground">({mm(g.offcut)} spare)</span>}
    </li>
  );

  return (
    <details className="group rounded-2xl border-[2.5px] border-foreground bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        Cut list
        <span className="font-mono text-xs text-muted-foreground group-open:hidden">show</span>
        <span className="hidden font-mono text-xs text-muted-foreground group-open:inline">hide</span>
      </summary>
      <div className="space-y-3 px-4 pb-4 text-sm">
        <ul className="space-y-1.5">{groups.map((g, n) => row(g, `${metres(timber.length)} board`, `b${n}`))}</ul>
        {posts.length > 0 && <ul className="space-y-1.5">{posts.map((g, n) => row(g, `${metres(POST_STOCK)} post`, `p${n}`))}</ul>}
        <p className="text-xs font-semibold text-muted-foreground">
          One pair of sides runs past the ends of the other, so it&apos;s cut {formatNumber(timber.thickness * 2, 0)} mm longer. Each cut allows 3 mm for the saw.
        </p>
      </div>
    </details>
  );
}

/** At most two notes, most important first. */
function Notes({ bed, result, units }: { bed: Bed; result: RaisedBedResult; units: Units }) {
  const notes: { tone: "info" | "warn"; text: string }[] = [];
  const t = result.timber;

  if (result.parts.length === 0) notes.push({ tone: "warn", text: "Your mix is empty: give at least one ingredient a share." });
  if (t?.joins) {
    notes.push({ tone: "warn", text: "A side is longer than one board, so it's made of two or more pieces. Join them over a post, or buy longer boards." });
  }
  const gap = t ? t.height / 10 - bed.depth : 0;
  if (gap >= 3) {
    notes.push({
      tone: "info",
      text: `The boards stand ${depthText(gap, units)} above the soil. That's fine as a lip, or fill it to the top of the boards with the pills under the depth.`,
    });
  }
  if (result.weight > 0.5) {
    notes.push({ tone: "info", text: `${weightText(result.weight)} is more than most cars can carry in one go: get it delivered.` });
  }
  if (result.parts.some((p) => (p.options.best?.bulk ?? 0) > 0)) {
    notes.push({
      tone: "info",
      text: "Bulk bags are dropped by a lorry and can't be moved once full: check there's firm ground near the road, and a barrow route to the beds.",
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
