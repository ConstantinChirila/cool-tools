"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NoteList, type Note } from "@/components/calc/note-list";
import { NumberField } from "@/components/calc/number-field";
import { Segmented } from "@/components/calc/segmented";
import { SizePicker } from "@/components/calc/size-picker";
import { SliderField } from "@/components/calc/slider-field";
import { SwitchField } from "@/components/calc/switch-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SplitBar } from "@/components/charts/split-bar";
import { BagFields } from "@/components/tools/bag-fields";
import { AreaList, withIds, type AreaRow } from "@/components/tools/garden-areas";
import {
  CM_PER_INCH,
  UNITS,
  UNIT_OPTIONS,
  bagDetail,
  cubic,
  depthText,
  formatArea,
  planText,
  price,
  weightText,
  type Money,
  type Units,
} from "@/components/tools/garden-format";
import { BagIcon, Swatch, TextureDefs } from "@/components/tools/garden-visuals";
import { Pack, TurfRoll, WateringCan } from "@/components/tools/lawn-visuals";
import { ShopRow } from "@/components/tools/shop-row";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, inputFields, useUrlState, urlField, type FieldUpdate, type NumberRange } from "@/hooks/use-url-state";
import { formatNumber, plural } from "@/lib/currency";
import { BARROW, MATERIAL_INFO, encodeAreas, parseAreas, planOrFallback, type Area, type Buying, type Plan } from "@/lib/garden-materials";
import {
  BIRD_EXTRA,
  DRESSING_DEFAULTS,
  DRESSING_SIZES,
  FEED_DEFAULTS,
  FEED_PACKS,
  LIMITS,
  PROJECTS,
  PROJECT_INFO,
  SEED_DEFAULTS,
  SEED_PACKS,
  TOPSOIL_DEFAULTS,
  TURF_DEFAULTS,
  WATER_DEFAULTS,
  calculate,
  type Dressing,
  type Feed,
  type LawnInput,
  type LawnResult,
  type Project,
  type Seed,
  type Topsoil,
  type Turf,
  type Water,
} from "@/lib/lawn";
import { cn } from "@/lib/utils";
import { WATER_PRICE_HINT } from "@/lib/water";

type Include = LawnInput["include"];

/** An 8 × 5 m garden with the shed taken out, so the cut-outs are there to see. */
const DEFAULT_AREAS: Area[] = [
  { shape: "rect", length: 8, width: 5, cut: false },
  { shape: "rect", length: 2, width: 1.5, cut: true },
];
const DEFAULT_AREAS_CODE = encodeAreas(DEFAULT_AREAS);
/**
 * Topsoil starts off: most lawns are sown or laid on the soil that's there,
 * and 10 cm of bought-in topsoil would be most of the cost.
 */
const DEFAULT_INCLUDE: Include = { topsoil: false, dressing: true, feed: true, water: true };

/** Bag settings mirrored into the URL for topsoil and top dressing, e.g. `soil-bulkprice=90`. */
const BUYING_FIELDS: [keyof Buying, string, NumberRange][] = [
  ["bag", "bag", LIMITS.size],
  ["bagPrice", "bagprice", MONEY_RANGE],
  ["bulk", "bulk", LIMITS.size],
  ["bulkPrice", "bulkprice", MONEY_RANGE],
  ["delivery", "delivery", MONEY_RANGE],
  ["density", "density", LIMITS.density],
];

const PROJECT_OPTIONS = PROJECTS.map((value) => ({
  value,
  label: PROJECT_INFO[value].label,
  detail: value === "turf" ? "1 m² rolls" : `${value === "seed" ? SEED_DEFAULTS.newRate : SEED_DEFAULTS.overRate} g/m² of seed`,
}));

export function LawnCalculator() {
  const { code, currency, setCurrency, money, currencyField } = useCurrency();
  const [project, setProject] = React.useState<Project>("seed");
  const [rows, setRows] = React.useState<AreaRow[]>(() => withIds(DEFAULT_AREAS));
  const [seed, setSeed] = React.useState(SEED_DEFAULTS);
  const [turf, setTurf] = React.useState(TURF_DEFAULTS);
  const [topsoil, setTopsoil] = React.useState(TOPSOIL_DEFAULTS);
  const [dressing, setDressing] = React.useState(DRESSING_DEFAULTS);
  const [feed, setFeed] = React.useState(FEED_DEFAULTS);
  const [water, setWater] = React.useState(WATER_DEFAULTS);
  const [include, setInclude] = React.useState(DEFAULT_INCLUDE);
  const [units, setUnits] = React.useState<Units>("metric");

  const updateSeed: FieldUpdate<Seed> = (key, value) => setSeed((prev) => ({ ...prev, [key]: value }));
  const updateTurf: FieldUpdate<Turf> = (key, value) => setTurf((prev) => ({ ...prev, [key]: value }));
  const updateTopsoil: FieldUpdate<Topsoil> = (key, value) => setTopsoil((prev) => ({ ...prev, [key]: value }));
  const updateDressing: FieldUpdate<Dressing> = (key, value) => setDressing((prev) => ({ ...prev, [key]: value }));
  const updateFeed: FieldUpdate<Feed> = (key, value) => setFeed((prev) => ({ ...prev, [key]: value }));
  const updateWater: FieldUpdate<Water> = (key, value) => setWater((prev) => ({ ...prev, [key]: value }));
  const updateInclude: FieldUpdate<Include> = (key, value) => setInclude((prev) => ({ ...prev, [key]: value }));

  const seedField = inputFields(seed, updateSeed, SEED_DEFAULTS);
  const turfField = inputFields(turf, updateTurf, TURF_DEFAULTS);
  const topsoilField = inputFields(topsoil, updateTopsoil, TOPSOIL_DEFAULTS);
  const dressingField = inputFields(dressing, updateDressing, DRESSING_DEFAULTS);
  const feedField = inputFields(feed, updateFeed, FEED_DEFAULTS);
  const includeField = inputFields(include, updateInclude, DEFAULT_INCLUDE);
  useUrlState({
    project: urlField(project, (v: string) => setProject(v as Project), "seed", PROJECTS),
    areas: urlField(encodeAreas(rows), (v: string) => {
      const parsed = parseAreas(v);
      if (parsed.ok) setRows(withIds(parsed.value));
    }, DEFAULT_AREAS_CODE),
    units: urlField(units, (v: string) => setUnits(v as Units), "metric", UNITS),
    currency: currencyField,
    "seed-rate": seedField("newRate", { range: LIMITS.seedRate }),
    "overseed-rate": seedField("overRate", { range: LIMITS.seedRate }),
    birds: seedField("birds"),
    "seed-small": seedField("small", { range: LIMITS.seedPack }),
    "seed-small-price": seedField("smallPrice", { range: MONEY_RANGE }),
    "seed-big": seedField("big", { range: LIMITS.seedPack }),
    "seed-big-price": seedField("bigPrice", { range: MONEY_RANGE }),
    roll: turfField("roll", { range: LIMITS.roll }),
    "roll-price": turfField("price", { range: MONEY_RANGE }),
    "turf-extra": turfField("extra", { range: LIMITS.extra }),
    "turf-delivery": turfField("delivery", { range: MONEY_RANGE }),
    "with-topsoil": includeField("topsoil"),
    "with-dressing": includeField("dressing"),
    "with-feed": includeField("feed"),
    "with-water": includeField("water"),
    "soil-depth": topsoilField("depth", { range: LIMITS.depth }),
    "soil-extra": topsoilField("extra", { range: LIMITS.extra }),
    ...Object.fromEntries(BUYING_FIELDS.map(([key, name, range]) => [`soil-${name}`, topsoilField(key, { range })])),
    "dressing-rate": dressingField("rate", { range: LIMITS.dressingRate }),
    ...Object.fromEntries(BUYING_FIELDS.map(([key, name, range]) => [`dressing-${name}`, dressingField(key, { range })])),
    "feed-rate": feedField("rate", { range: LIMITS.feedRate }),
    "feed-pack": feedField("pack", { range: LIMITS.feedPack }),
    "feed-price": feedField("price", { range: MONEY_RANGE }),
    "water-price": urlField(water.price, (v: number) => updateWater("price", v), WATER_DEFAULTS.price, undefined, MONEY_RANGE),
  });

  const result = calculate({ areas: rows, project, seed, turf, topsoil, dressing, feed, water, include });

  return (
    <>
      <TextureDefs />
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Your lawn</CardTitle>
            <Segmented label="Measure in" size="sm" value={units} onChange={setUnits} options={UNIT_OPTIONS} className="w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <ProjectPicker value={project} onChange={setProject} />
            <AreaList id="lw" title="Lawn area" cutLabel="Cut out a path, bed or shed" rows={rows} onChange={setRows} material="grass" units={units} />
            {project === "turf" ? (
              <TurfSection turf={turf} update={updateTurf} currency={currency.symbol} code={code} onCurrency={setCurrency} />
            ) : (
              <SeedSection project={project} seed={seed} update={updateSeed} currency={currency.symbol} code={code} onCurrency={setCurrency} />
            )}
            <section className="space-y-3" aria-labelledby="lw-extras">
              <h3 id="lw-extras" className="text-[15px] font-bold">
                What else to buy
              </h3>
              {project === "overseed" ? (
                <DressingExtra on={include.dressing} setOn={(v) => updateInclude("dressing", v)} dressing={dressing} update={updateDressing} currency={currency.symbol} />
              ) : (
                <TopsoilExtra
                  on={include.topsoil}
                  setOn={(v) => updateInclude("topsoil", v)}
                  topsoil={topsoil}
                  update={updateTopsoil}
                  units={units}
                  currency={currency.symbol}
                />
              )}
              <FeedExtra on={include.feed} setOn={(v) => updateInclude("feed", v)} feed={feed} update={updateFeed} currency={currency.symbol} />
              <WaterExtra on={include.water} setOn={(v) => updateInclude("water", v)} water={water} update={updateWater} currency={currency.symbol} />
              <p className="text-xs font-semibold text-muted-foreground">
                Prices start at rough 2026 UK figures: put in your supplier&apos;s. Leave a price blank to rule that way out.
              </p>
            </section>
          </CardContent>
        </Card>

        <Results project={project} result={result} seed={seed} turf={turf} topsoil={topsoil} dressing={dressing} feed={feed} units={units} money={money} />
      </div>
      <MobileResultBar label={`${project === "turf" ? "Turf" : "Seed"} · ${price(result.cost.total, money)}`} value={heroValue(result)} />
    </>
  );
}

/* ------------------------------------------------------------ Formats -- */

/** Grams under a kilogram, kilograms from there. */
function kgText(kg: number): string {
  return kg < 1 ? `${formatNumber(kg * 1000, 0)} g` : `${formatNumber(kg, kg < 10 ? 2 : 1)} kg`;
}

function heroValue(result: LawnResult): string {
  if (result.turf) return plural(result.turf.rolls, "roll");
  return kgText(result.seed?.kg ?? 0);
}

/** "1 × 10 kg + 2 × 1.5 kg". */
function packText(plan: Plan, seed: Seed): string {
  const parts = [];
  if (plan.bulk) parts.push(`${plan.bulk} × ${kgText(seed.big)}`);
  if (plan.bags) parts.push(`${plan.bags} × ${kgText(seed.small)}`);
  return parts.join(" + ") || "Nothing";
}

/* ------------------------------------------------------------ Project -- */

function ProjectPicker({ value, onChange }: { value: Project; onChange: (p: Project) => void }) {
  return (
    <section className="space-y-3" aria-labelledby="lw-project">
      <h3 id="lw-project" className="text-[15px] font-bold">
        What are you doing?
      </h3>
      <ChoiceGroup
        label="Project"
        value={value}
        onChange={onChange}
        options={PROJECT_OPTIONS}
        className="grid gap-2 sm:grid-cols-3"
        itemClassName={(active) =>
          cn(
            "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-transform",
            active ? "sticker-sm -translate-y-0.5 bg-mint" : "border-2 border-foreground bg-card hover:-translate-y-0.5",
          )
        }
        renderLabel={(o) => (
          <>
            {o.value === "turf" ? <TurfRoll className="h-7 w-9" /> : <Pack kind="seed" className="h-8 w-7" />}
            <span className="min-w-0">
              <span className="block text-[15px] leading-tight font-bold">{o.label}</span>
              <span className="block font-mono text-xs font-bold text-muted-foreground">{o.detail}</span>
            </span>
          </>
        )}
      />
      <p className="text-xs font-semibold text-muted-foreground">{PROJECT_INFO[value].hint}</p>
    </section>
  );
}

/* --------------------------------------------------------------- Seed -- */

function SeedSection({
  project,
  seed,
  update,
  currency,
  code,
  onCurrency,
}: {
  project: Project;
  seed: Seed;
  update: FieldUpdate<Seed>;
  currency: string;
  code: string;
  onCurrency: (code: string) => void;
}) {
  const key = project === "overseed" ? "overRate" : "newRate";
  const usual = project === "overseed" ? "Johnsons overseeds at 25 g/m²; the RHS patches at 15–25 g/m²." : "Johnsons sows new lawns at 35 g/m²; brands range from 30 to 50.";

  return (
    <section className="space-y-4" aria-labelledby="lw-seed">
      <div className="flex items-center justify-between gap-3">
        <h3 id="lw-seed" className="text-[15px] font-bold">
          Grass seed
        </h3>
        <CurrencySelect value={code} onChange={onCurrency} />
      </div>
      <div className="space-y-2">
        <SliderField
          id="lw-seed-rate"
          label="Sowing rate"
          value={seed[key]}
          onChange={(v) => update(key, v || SEED_DEFAULTS[key])}
          min={10}
          max={70}
          inputMax={LIMITS.seedRate.max}
          step={5}
          sliderStep={5}
          suffix="g/m²"
          decimals={0}
        />
        <p className="text-xs font-semibold text-muted-foreground">{usual} Use the rate on your packet.</p>
      </div>
      <SwitchField
        id="lw-birds"
        label="Birds about"
        hint={`The RHS suggests ${formatNumber(BIRD_EXTRA * 100, 0)}% more seed where birds take it.`}
        checked={seed.birds}
        onCheckedChange={(v) => update("birds", v)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-4 rounded-2xl border-2 border-foreground/15 p-3.5">
          <SizePicker
            id="lw-seed-small"
            label="Small pack"
            unit="kg"
            sizes={SEED_PACKS.small}
            value={seed.small}
            onChange={(v) => update("small", v)}
            min={LIMITS.seedPack.min}
            max={LIMITS.seedPack.max}
            decimals={2}
            icon={<Pack kind="seed" className="h-7 w-6" />}
          />
          <NumberField id="lw-seed-small-price" label="Price per pack" value={seed.smallPrice} onChange={(v) => update("smallPrice", v)} max={MONEY_RANGE.max} prefix={currency} decimals={2} />
        </div>
        <div className="space-y-4 rounded-2xl border-2 border-foreground/15 p-3.5">
          <SizePicker
            id="lw-seed-big"
            label="Big pack"
            unit="kg"
            sizes={SEED_PACKS.big}
            value={seed.big}
            onChange={(v) => update("big", v)}
            min={LIMITS.seedPack.min}
            max={LIMITS.seedPack.max}
            decimals={2}
            icon={<Pack kind="seed" big className="h-7 w-6" />}
          />
          <NumberField id="lw-seed-big-price" label="Price per pack" value={seed.bigPrice} onChange={(v) => update("bigPrice", v)} max={MONEY_RANGE.max} prefix={currency} decimals={2} />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Turf -- */

function TurfSection({
  turf,
  update,
  currency,
  code,
  onCurrency,
}: {
  turf: Turf;
  update: FieldUpdate<Turf>;
  currency: string;
  code: string;
  onCurrency: (code: string) => void;
}) {
  return (
    <section className="space-y-4" aria-labelledby="lw-turf">
      <div className="flex items-center justify-between gap-3">
        <h3 id="lw-turf" className="text-[15px] font-bold">
          Turf
        </h3>
        <CurrencySelect value={code} onChange={onCurrency} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="lw-roll"
          label="Each roll covers"
          value={turf.roll}
          onChange={(v) => update("roll", v || TURF_DEFAULTS.roll)}
          min={LIMITS.roll.min}
          max={LIMITS.roll.max}
          suffix="m²"
          decimals={2}
          hint="A standard UK roll is 1.64 × 0.61 m: 1 m²."
        />
        <NumberField
          id="lw-roll-price"
          label="Price per roll"
          value={turf.price}
          onChange={(v) => update("price", v)}
          max={MONEY_RANGE.max}
          prefix={currency}
          decimals={2}
          hint="About £5 delivered on 40 m² or more."
        />
      </div>
      <div className="space-y-2">
        <SliderField
          id="lw-turf-extra"
          label="Extra for cutting"
          value={turf.extra}
          onChange={(v) => update("extra", v)}
          min={0}
          max={20}
          inputMax={LIMITS.extra.max}
          step={1}
          suffix="%"
          decimals={0}
        />
        <p className="text-xs font-semibold text-muted-foreground">Rolawn adds 5% for cutting and shaping, and up to 10% for curves and awkward corners.</p>
      </div>
      <NumberField
        id="lw-turf-delivery"
        label="Delivery"
        value={turf.delivery}
        onChange={(v) => update("delivery", v)}
        max={MONEY_RANGE.max}
        prefix={currency}
        decimals={2}
        hint="Once per order. Most growers include it: leave blank if so."
        className="sm:max-w-[50%]"
      />
    </section>
  );
}

/* ------------------------------------------------------------- Extras -- */

/** A switchable extra: the toggle, and its settings underneath while it's on. */
function Extra({
  id,
  icon,
  label,
  hint,
  on,
  setOn,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  on: boolean;
  setOn: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border-[2.5px] border-foreground transition-colors", on ? "bg-card" : "bg-secondary")}>
      <div className="flex items-center gap-3 px-3.5 py-3">
        {icon}
        <SwitchField id={id} label={label} hint={hint} checked={on} onCheckedChange={setOn} className="min-w-0 flex-1" />
      </div>
      {on && <div className="space-y-4 border-t border-foreground/15 px-3.5 pt-4 pb-4">{children}</div>}
    </div>
  );
}

function TopsoilExtra({
  on,
  setOn,
  topsoil,
  update,
  units,
  currency,
}: {
  on: boolean;
  setOn: (v: boolean) => void;
  topsoil: Topsoil;
  update: FieldUpdate<Topsoil>;
  units: Units;
  currency: string;
}) {
  const imperial = units === "imperial";
  return (
    <Extra
      id="lw-with-soil"
      icon={<Swatch material="topsoil" className="size-8" />}
      label="Topsoil underneath"
      hint="Only if your soil is poor, stony or needs building up: Rolawn wants at least 10 cm of good soil under a new lawn."
      on={on}
      setOn={setOn}
    >
      {imperial ? (
        <SliderField
          id="lw-soil-depth-in"
          label="Depth"
          value={Number((topsoil.depth / CM_PER_INCH).toFixed(1))}
          onChange={(v) => update("depth", Number((v * CM_PER_INCH).toFixed(2)))}
          min={0.5}
          max={8}
          inputMax={LIMITS.depth.max / CM_PER_INCH}
          step={0.5}
          suffix="in"
          decimals={1}
        />
      ) : (
        <SliderField
          id="lw-soil-depth"
          label="Depth"
          value={topsoil.depth}
          onChange={(v) => update("depth", v)}
          min={1}
          max={20}
          inputMax={LIMITS.depth.max}
          step={0.5}
          suffix="cm"
          decimals={1}
        />
      )}
      <SliderField
        id="lw-soil-extra"
        label="Extra for settling"
        value={topsoil.extra}
        onChange={(v) => update("extra", v)}
        min={0}
        max={30}
        inputMax={LIMITS.extra.max}
        step={1}
        suffix="%"
        decimals={0}
      />
      <BagFields
        id="lw-soil"
        unit="L"
        sizes={{ bag: MATERIAL_INFO.topsoil.bagSizes, bulk: MATERIAL_INFO.topsoil.bulkSizes }}
        s={topsoil}
        update={(key, v) => update(key, v)}
        material="topsoil"
        currency={currency}
      />
    </Extra>
  );
}

function DressingExtra({
  on,
  setOn,
  dressing,
  update,
  currency,
}: {
  on: boolean;
  setOn: (v: boolean) => void;
  dressing: Dressing;
  update: FieldUpdate<Dressing>;
  currency: string;
}) {
  return (
    <Extra
      id="lw-with-dressing"
      icon={<Swatch material="sand" className="size-8" />}
      label="Top dressing"
      hint="Brushed in over the seed: sandy loam, sharp sand and a little compost."
      on={on}
      setOn={setOn}
    >
      <div className="space-y-2">
        <SliderField
          id="lw-dressing-rate"
          label="Spread"
          value={dressing.rate}
          onChange={(v) => update("rate", v)}
          min={0.5}
          max={5}
          inputMax={LIMITS.dressingRate.max}
          step={0.5}
          suffix="kg/m²"
          decimals={1}
        />
        <p className="text-xs font-semibold text-muted-foreground">The RHS uses 2–3 kg/m², about a shovelful: only 2 mm or so deep, so the grass pokes through.</p>
      </div>
      <BagFields id="lw-dressing" unit="kg" sizes={DRESSING_SIZES} s={dressing} update={(key, v) => update(key, v)} material="sand" currency={currency} />
    </Extra>
  );
}

function FeedExtra({ on, setOn, feed, update, currency }: { on: boolean; setOn: (v: boolean) => void; feed: Feed; update: FieldUpdate<Feed>; currency: string }) {
  return (
    <Extra
      id="lw-with-feed"
      icon={<Pack kind="feed" className="h-8 w-7" />}
      label="Starter feed"
      hint="A pre-seed or pre-turf fertiliser, raked in before you sow or lay."
      on={on}
      setOn={setOn}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="lw-feed-rate"
          label="Rate"
          value={feed.rate}
          onChange={(v) => update("rate", v)}
          max={LIMITS.feedRate.max}
          suffix="g/m²"
          decimals={0}
          hint="Rolawn's starter feed is 40 g/m². Check your box."
        />
        <SizePicker
          id="lw-feed-pack"
          label="Pack size"
          unit="kg"
          sizes={FEED_PACKS}
          value={feed.pack}
          onChange={(v) => update("pack", v)}
          min={LIMITS.feedPack.min}
          max={LIMITS.feedPack.max}
          decimals={1}
        />
        <NumberField id="lw-feed-price" label="Price per pack" value={feed.price} onChange={(v) => update("price", v)} max={MONEY_RANGE.max} prefix={currency} decimals={2} />
      </div>
    </Extra>
  );
}

function WaterExtra({ on, setOn, water, update, currency }: { on: boolean; setOn: (v: boolean) => void; water: Water; update: FieldUpdate<Water>; currency: string }) {
  return (
    <Extra
      id="lw-with-water"
      icon={<WateringCan className="h-7 w-9" />}
      label="Water to get it going"
      hint="What it takes in dry weather until the grass roots. Less if it rains."
      on={on}
      setOn={setOn}
    >
      <NumberField
        id="lw-water-price"
        label="Water price per 1,000 L"
        value={water.price}
        onChange={(v) => update("price", v)}
        max={MONEY_RANGE.max}
        prefix={currency}
        decimals={2}
        hint={WATER_PRICE_HINT}
        className="sm:max-w-[50%]"
      />
    </Extra>
  );
}

/* ------------------------------------------------------------ Results -- */

const COST_COLORS = {
  grass: "oklch(0.66 0.15 140)",
  soil: "oklch(0.55 0.07 55)",
  feed: "var(--sticker-sky)",
  water: "var(--sticker-lilac)",
};

/** What happens after sowing or laying, from the RHS, Johnsons and turf growers. */
const TIMELINE: Record<Project, string[]> = {
  seed: [
    "Comes up in 7–14 days, longer when it's cold.",
    "First cut when it's 5–8 cm tall, taking off no more than a third.",
    "Use it as little as you can for about 8 months.",
  ],
  turf: ["Lay it the day it arrives, and water it the same day.", "Keep off it for about 2 weeks.", "First cut after about 3 weeks, on a high setting."],
  overseed: ["Scarify and mow short first, so the seed reaches the soil.", "New grass comes up in 7–14 days.", "Hold off mowing until it's 5–8 cm tall."],
};

function Results({
  project,
  result,
  seed,
  turf,
  topsoil,
  dressing,
  feed,
  units,
  money,
}: {
  project: Project;
  result: LawnResult;
  seed: Seed;
  turf: Turf;
  topsoil: Topsoil;
  dressing: Dressing;
  feed: Feed;
  units: Units;
  money: Money;
}) {
  const { area, cost, soil, water } = result;
  const empty = area.net <= 0;
  const soilName = soil?.kind === "dressing" ? "Top dressing" : "Topsoil";
  const segments = [
    { name: project === "turf" ? "Turf" : "Seed", value: cost.grass, color: COST_COLORS.grass },
    { name: soilName, value: cost.soil, color: COST_COLORS.soil },
    { name: "Feed", value: cost.feed, color: COST_COLORS.feed },
    { name: "Water", value: cost.water, color: COST_COLORS.water },
  ].filter((s) => s.value > 0);

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-mint">
        <CardContent className="space-y-6 pt-6">
          {result.turf ? (
            <HeroStat
              label="Turf to order"
              value={plural(result.turf.rolls, "roll")}
              hint={empty ? "Add your lawn's size to see how much to order." : `${formatNumber(result.turf.m2, 1)} m², with extra for cutting`}
            />
          ) : (
            <HeroStat
              label="Grass seed you need"
              value={kgText(result.seed?.kg ?? 0)}
              hint={empty ? "Add your lawn's size to see how much to buy." : `${formatArea(area.net, units)} at ${formatNumber(result.seed?.rate ?? 0, 1)} g/m²`}
            />
          )}

          {!empty && <Arrival result={result} seed={seed} />}

          <div className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <p className="text-[15px] font-bold">Estimated cost</p>
            <p className="font-heading text-4xl font-black tracking-tight text-numeric">{price(cost.total, money)}</p>
            {segments.length > 0 && <SplitBar segments={segments} format={(v) => price(v, money)} />}
            {cost.unpriced.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground">
                Not counted: {cost.unpriced.map((u) => (u === "seed" ? "seed" : soilName.toLowerCase())).join(" and ")} has no price.
              </p>
            )}
          </div>

          {!empty && <ShoppingList project={project} result={result} seed={seed} turf={turf} topsoil={topsoil} dressing={dressing} feed={feed} units={units} money={money} />}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Lawn area" value={formatArea(area.net, units)} hint={area.cut > 0 ? `${formatArea(area.cut, units)} cut out` : "No cut-outs"} />
            <Stat label="Cost per m²" value={area.net > 0 ? price(cost.total / area.net, money) : "n/a"} hint="Everything included" />
            {soil && soil.volume > 0 && (
              <>
                <Stat label={`${soilName} weight`} value={weightText(soil.weight)} hint={soil.kind === "dressing" ? "Dry, bagged" : "Damp, as delivered"} />
                <Stat label="Barrow loads" value={String(soil.barrowLoads)} hint={`${BARROW.litres} L barrow, up to ${BARROW.kg} kg`} />
              </>
            )}
          </div>

          {water && !empty && <WateringPlan result={result} />}

          <div className="space-y-2 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <p className="text-[15px] font-bold">What happens next</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm font-semibold">
              {TIMELINE[project].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>

          <Notes project={project} result={result} />
        </CardContent>
      </Card>
    </div>
  );
}

/** What turns up: a pack or roll per item, or one with a count once there are too many to draw. */
function Arrival({ result, seed }: { result: LawnResult; seed: Seed }) {
  const MAX_ICONS = 20;
  const items: { key: string; count: number; icon: React.ReactNode; label: string }[] = [];
  if (result.turf) {
    items.push({ key: "roll", count: result.turf.rolls, icon: <TurfRoll className="h-8 w-11" />, label: "roll" });
  } else if (result.seed) {
    const plan = planOrFallback(result.seed.options);
    items.push({ key: "big", count: plan.bulk, icon: <Pack kind="seed" big className="h-10 w-8" />, label: `${kgText(seed.big)} pack` });
    items.push({ key: "small", count: plan.bags, icon: <Pack kind="seed" className="h-8 w-6" />, label: `${kgText(seed.small)} pack` });
  }
  const shown = items.filter((i) => i.count > 0);
  if (shown.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-end gap-1" aria-label={shown.map((i) => plural(i.count, i.label)).join(" and ")}>
      {shown.map((i) =>
        i.count > MAX_ICONS ? (
          <li key={i.key} className="flex items-center gap-1.5">
            {i.icon}
            <span className="font-mono text-sm font-bold">× {i.count}</span>
          </li>
        ) : (
          Array.from({ length: i.count }, (_, n) => <li key={`${i.key}${n}`}>{i.icon}</li>)
        ),
      )}
    </ul>
  );
}

function ShoppingList({
  project,
  result,
  seed,
  turf,
  topsoil,
  dressing,
  feed,
  units,
  money,
}: {
  project: Project;
  result: LawnResult;
  seed: Seed;
  turf: Turf;
  topsoil: Topsoil;
  dressing: Dressing;
  feed: Feed;
  units: Units;
  money: Money;
}) {
  const { soil, water } = result;
  const f = result.feed;
  return (
    <div className="space-y-2">
      <p className="text-[15px] font-bold">Shopping list</p>
      <ul className="space-y-2">
        {result.turf && (
          <ShopRow
            icon={<TurfRoll className="h-8 w-11" />}
            title="Turf"
            detail={`${formatNumber(result.turf.m2, 1)} m², ${turf.extra}% extra for cutting`}
            buy={plural(result.turf.rolls, "roll")}
            buyDetail="1.64 × 0.61 m each"
            cost={result.turf.cost}
            money={money}
          />
        )}
        {result.seed && (
          <ShopRow
            icon={<Pack kind="seed" className="h-9 w-8" />}
            title={project === "overseed" ? "Overseed" : "Grass seed"}
            detail={`${kgText(result.seed.kg)} at ${formatNumber(result.seed.rate, 1)} g/m²`}
            buy={packText(planOrFallback(result.seed.options), seed)}
            buyDetail={seed.birds ? "Includes extra for birds" : "Hard-wearing mix"}
            cost={result.seed.options.best?.cost ?? null}
            money={money}
          />
        )}
        {soil && soil.volume > 0 && (
          <ShopRow
            icon={<BagIcon kind="bag" material={soil.kind === "dressing" ? "sand" : "topsoil"} className="h-9 w-8" />}
            title={soil.kind === "dressing" ? "Top dressing" : "Topsoil"}
            detail={
              soil.kind === "dressing"
                ? `${weightText(soil.weight)} at ${formatNumber(dressing.rate, 1)} kg/m²`
                : `${cubic(soil.volume)} m³ at ${depthText(topsoil.depth, units)}`
            }
            buy={planText(planOrFallback(soil.options))}
            buyDetail={bagDetail(planOrFallback(soil.options), soil.kind === "dressing" ? dressing : topsoil, soil.kind === "dressing" ? "kg" : "L")}
            cost={soil.options.best?.cost ?? null}
            money={money}
          />
        )}
        {f && f.packs > 0 && (
          <ShopRow
            icon={<Pack kind="feed" className="h-9 w-8" />}
            title="Starter feed"
            detail={`${kgText(f.kg)} at ${formatNumber(feed.rate, 0)} g/m²`}
            buy={plural(f.packs, "pack")}
            buyDetail={`${kgText(feed.pack)} each`}
            cost={f.cost}
            money={money}
          />
        )}
        {water && water.litres > 0 && (
          <ShopRow
            icon={<WateringCan className="h-8 w-10" />}
            title="Water"
            detail={`${plural(water.waterings, "watering")} over ${water.weeks} weeks`}
            buy={`${formatNumber(water.litres, 0)} L`}
            buyDetail="On a water meter"
            cost={water.cost}
            money={money}
          />
        )}
      </ul>
    </div>
  );
}


function WateringPlan({ result }: { result: LawnResult }) {
  const water = result.water;
  if (!water) return null;
  const often = (perWeek: number) => (perWeek === 7 ? "every day" : `${perWeek} times a week`);
  return (
    <div className="space-y-2 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
      <p className="text-[15px] font-bold">Watering plan</p>
      <ul className="space-y-1.5 text-sm">
        {water.spells.map((s) => (
          <li key={s.from} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-bold">
              Weeks {s.from}–{s.to}: {often(s.perWeek)}
            </span>
            <span className="font-mono text-xs font-bold">
              {formatNumber(s.litres * result.area.net, 0)} L a time ({s.litres} L/m²)
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs font-semibold text-muted-foreground">
        Growers say how often, not how much: the litres are a rule of thumb for dry weather. Skip a watering when it rains, and water early or late in the day.
      </p>
    </div>
  );
}

/** At most two notes, most important first. */
function Notes({ project, result }: { project: Project; result: LawnResult }) {
  const notes: Note[] = [];
  const { area, turf, soil } = result;

  if (area.cut > 0 && area.cut >= area.added) {
    notes.push({ tone: "warn", text: "Your cut-outs are as big as your lawn, so there's nothing left to cover." });
  }
  if (turf && turf.rolls > 0 && turf.m2 < 40) {
    notes.push({
      tone: "info",
      text: "Small turf orders cost more per m² because delivery is built into the price, and many growers have a 10-roll minimum. Check the price for your size.",
    });
  }
  if (project === "seed") {
    notes.push({ tone: "info", text: "The RHS says seed comes up best sown in early autumn or mid-spring, when the soil is warm and moist." });
  }
  if (soil && soil.weight > 0.5) {
    notes.push({ tone: "info", text: `${weightText(soil.weight)} of soil is more than most cars can carry in one go: get it delivered.` });
  }

  return <NoteList notes={notes} />;
}
