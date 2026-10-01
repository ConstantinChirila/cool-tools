"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Callout } from "@/components/calc/callout";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { PillButton, togglePillClass } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { SizePicker } from "@/components/calc/size-picker";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { price, type Money } from "@/components/tools/garden-format";
import { DRY, MonthBars, RoofScene, WATER, YearChart, dayLabel } from "@/components/tools/water-butt-visuals";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, inputFields, useUrlState, type FieldUpdate } from "@/hooks/use-url-state";
import { formatNumber, formatPercent, plural } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { WATER_PRICE } from "@/lib/water";
import {
  BUTT_SIZES,
  CURVE_MAX,
  CURVE_STEP,
  ENOUGH,
  LIMITS,
  PLACES,
  ROOFS,
  ROOF_INFO,
  USE_PRESETS,
  buttsFor,
  calculate,
  litresPerMm,
  placeOf,
  simulateRain,
  sizing,
  type ButtInput,
  type ButtResult,
  type PlaceId,
  type Roof,
} from "@/lib/water-butt";

const DEFAULT_PLACE = PLACES[0]!;

/** A semi-detached house roof, front half to one downpipe, with a 210 L butt on it. */
const DEFAULTS: ButtInput = {
  length: 10,
  width: 5,
  downpipes: 2,
  roof: "tiles",
  place: DEFAULT_PLACE.id,
  annual: DEFAULT_PLACE.annual,
  use: 80,
  size: 210,
  butts: 1,
  price: WATER_PRICE,
};

const PLACE_IDS = PLACES.map((p) => p.id);
/** A standard watering can, for making a week's water easy to picture. */
const CAN = 9;
/** Mid-June: the garden needs water and the butt is usually working. */
const START_DAY = 165;

const litres = (v: number) => `${formatNumber(v, 0)} L`;

export function WaterButtCalculator() {
  const { code, currency, setCurrency, money, currencyField } = useCurrency();
  const [input, setInput] = React.useState(DEFAULTS);
  const [day, setDay] = React.useState(START_DAY);
  const update: FieldUpdate<ButtInput> = (key, value) => setInput((prev) => ({ ...prev, [key]: value }));
  const field = inputFields(input, update, DEFAULTS);
  useUrlState({
    roof: field("roof", { allowed: ROOFS }),
    length: field("length", { range: LIMITS.side }),
    width: field("width", { range: LIMITS.side }),
    downpipes: field("downpipes", { range: LIMITS.downpipes }),
    place: field("place", { allowed: PLACE_IDS }),
    rain: field("annual", { range: LIMITS.annual }),
    use: field("use", { range: LIMITS.use }),
    size: field("size", { range: LIMITS.size }),
    butts: field("butts", { range: LIMITS.butts }),
    "water-price": field("price", { range: MONEY_RANGE }),
    currency: currencyField,
  });

  // Staged so the weather only rebuilds when the place or rainfall changes and
  // the sizing curve only when the roof or garden does: the compiler keeps each.
  const place = placeOf(input);
  const rain = simulateRain(place, input.annual);
  const perMm = litresPerMm(input);
  const sized = sizing(rain, perMm, input.use);
  const result = calculate(input, rain, sized);
  const setPlace = (id: PlaceId) => {
    const next = PLACES.find((p) => p.id === id);
    if (next) setInput((prev) => ({ ...prev, place: next.id, annual: next.annual }));
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Your roof and garden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <RoofPicker value={input.roof} onChange={(v) => update("roof", v)} />
            <RoofSize input={input} update={update} area={result.area} />
            <Rainfall input={input} update={update} placeName={place.name} placeAnnual={place.annual} onPlace={setPlace} />
            <GardenUse value={input.use} onChange={(v) => update("use", v)} />
            <ButtSize input={input} update={update} recommended={result.sizing.recommended} />
            <section className="space-y-3" aria-labelledby="wb-money">
              <div className="flex items-center justify-between gap-3">
                <h3 id="wb-money" className="text-[15px] font-bold">
                  Water bill
                </h3>
                <CurrencySelect value={code} onChange={setCurrency} />
              </div>
              <NumberField
                id="wb-price"
                label="Price per 1,000 L"
                value={input.price}
                onChange={(v) => update("price", v)}
                max={MONEY_RANGE.max}
                prefix={currency.symbol}
                decimals={2}
                hint="On a meter, water and sewerage together: about £4.20 (Thames) to £5.50 (United Utilities) in 2026/27. Leave blank if you're not on a meter."
                className="sm:max-w-[60%]"
              />
            </section>
          </CardContent>
        </Card>

        <Results input={input} result={result} money={money} onSize={(size, butts) => setInput((prev) => ({ ...prev, size, butts }))} />
      </div>

      <YearCard input={input} result={result} day={day} onDay={setDay} placeName={place.name} />

      <MobileResultBar label={`Get · ${litres(result.sizing.recommended)}`} value={input.price > 0 ? `${price(result.saving, money)}/yr` : litres(result.sim.average.supplied)} />
    </>
  );
}

/* --------------------------------------------------------------- Inputs -- */

const ROOF_OPTIONS = ROOFS.map((value) => ({ value, label: ROOF_INFO[value].label }));

function RoofPicker({ value, onChange }: { value: Roof; onChange: (r: Roof) => void }) {
  return (
    <section className="space-y-3" aria-labelledby="wb-roof">
      <h3 id="wb-roof" className="text-[15px] font-bold">
        What the rain falls on
      </h3>
      <ChoiceGroup
        label="Roof"
        value={value}
        onChange={onChange}
        options={ROOF_OPTIONS}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        itemClassName={(active) =>
          cn(
            "rounded-2xl px-3 py-2 text-left transition-transform",
            active ? "sticker-sm -translate-y-0.5 bg-sky" : "border-2 border-foreground bg-card hover:-translate-y-0.5",
          )
        }
        renderLabel={(o) => (
          <>
            <span className="block text-sm leading-tight font-bold">{o.label}</span>
            <span className="block font-mono text-xs font-bold text-muted-foreground">{formatPercent(ROOF_INFO[o.value].runoff, 0)} runs off</span>
          </>
        )}
      />
      <p className="text-xs font-semibold text-muted-foreground">{ROOF_INFO[value].hint}</p>
    </section>
  );
}

function RoofSize({ input, update, area }: { input: ButtInput; update: FieldUpdate<ButtInput>; area: number }) {
  return (
    <section className="space-y-4" aria-labelledby="wb-size">
      <h3 id="wb-size" className="text-[15px] font-bold">
        Roof size, seen from above
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id="wb-length" label="Length" value={input.length} onChange={(v) => update("length", v)} max={LIMITS.side.max} suffix="m" decimals={2} />
        <NumberField id="wb-width" label="Depth" value={input.width} onChange={(v) => update("width", v)} max={LIMITS.side.max} suffix="m" decimals={2} />
      </div>
      <p className="-mt-1 text-xs font-semibold text-muted-foreground">
        Measure the footprint, not the slope: rain falls straight down, so a steep roof catches no more than a flat one the same size.
      </p>
      <div className="space-y-2">
        <Label className="text-[15px] font-bold">Downpipes this roof drains into</Label>
        <Segmented
          label="Downpipes"
          value={String(Math.min(input.downpipes, 4))}
          onChange={(v) => update("downpipes", Number(v))}
          options={["1", "2", "3", "4"].map((v) => ({ value: v, label: v }))}
          className="sm:max-w-[60%]"
        />
        <p className="text-xs font-semibold text-muted-foreground">
          The butt only gets its downpipe&apos;s share: {formatNumber(area, area < 10 ? 1 : 0)} m² of roof.
        </p>
      </div>
    </section>
  );
}

function Rainfall({
  input,
  update,
  placeName,
  placeAnnual,
  onPlace,
}: {
  input: ButtInput;
  update: FieldUpdate<ButtInput>;
  placeName: string;
  placeAnnual: number;
  onPlace: (id: PlaceId) => void;
}) {
  const edited = input.annual !== placeAnnual;
  return (
    <section className="space-y-4" aria-labelledby="wb-rain">
      <h3 id="wb-rain" className="text-[15px] font-bold">
        Rainfall where you live
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wb-place" className="text-[15px] font-bold">
            Nearest place
          </Label>
          <Select value={input.place} onValueChange={(v) => onPlace(v as PlaceId)}>
            <SelectTrigger id="wb-place" className="w-full font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {formatNumber(p.annual, 0)} mm
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumberField
          id="wb-annual"
          label="Rain a year"
          value={input.annual}
          onChange={(v) => update("annual", v || placeAnnual)}
          min={LIMITS.annual.min}
          max={LIMITS.annual.max}
          suffix="mm"
          decimals={0}
        />
      </div>
      <p className="text-xs font-semibold text-muted-foreground">
        {edited
          ? `Your figure, spread over the year like ${placeName}'s rain.`
          : `Met Office average for ${placeName}, 1991–2020. Hills and coasts nearby can be much wetter: type your own figure if you know it.`}
      </p>
    </section>
  );
}

function GardenUse({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <section className="space-y-3" aria-labelledby="wb-use">
      <h3 id="wb-use" className="text-[15px] font-bold">
        Garden watering
      </h3>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Typical gardens">
        {USE_PRESETS.map((p) => (
          <button key={p.label} type="button" aria-pressed={value === p.litres} onClick={() => onChange(p.litres)} className={togglePillClass(value === p.litres, "h-8 px-3 text-sm")}>
            {p.label}
          </button>
        ))}
      </div>
      <SliderField
        id="wb-use-l"
        label="In a dry summer week"
        value={value}
        onChange={onChange}
        min={0}
        max={500}
        inputMax={LIMITS.use.max}
        step={5}
        sliderStep={5}
        suffix="L"
        decimals={0}
      />
      <p className="text-xs font-semibold text-muted-foreground">
        About {plural(Math.round(value / CAN), "watering can")} of {CAN} L. {USE_PRESETS.find((p) => p.litres === value)?.hint ?? ""} Spring and autumn need less, winter none, and a
        rainy day none at all.
      </p>
    </section>
  );
}

function ButtSize({ input, update, recommended }: { input: ButtInput; update: FieldUpdate<ButtInput>; recommended: number }) {
  const capacity = input.size * input.butts;
  return (
    <section className="space-y-4" aria-labelledby="wb-butt">
      <div className="flex items-center justify-between gap-3">
        <h3 id="wb-butt" className="text-[15px] font-bold">
          Your water butt
        </h3>
        {capacity !== recommended && (
          <PillButton
            className="h-8 px-3"
            onClick={() => {
              const { size, butts } = buttsFor(recommended);
              update("size", size);
              update("butts", butts);
            }}
          >
            Try {litres(recommended)}
          </PillButton>
        )}
      </div>
      <SizePicker
        id="wb-butt-size"
        label="Size of each"
        unit="L"
        sizes={BUTT_SIZES}
        value={input.size}
        onChange={(v) => update("size", v)}
        min={LIMITS.size.min}
        max={LIMITS.size.max}
        decimals={0}
        hint="Slimline butts start at about 100 L, the usual round one is 200–250 L, and an IBC tote holds 1,000 L."
      />
      <div className="space-y-2">
        <Label className="text-[15px] font-bold">Butts linked together</Label>
        <Segmented
          label="Butts linked together"
          value={String(Math.min(input.butts, 4))}
          onChange={(v) => update("butts", Number(v))}
          options={["1", "2", "3", "4"].map((v) => ({ value: v, label: v }))}
          className="sm:max-w-[60%]"
        />
        {input.butts > 1 && <p className="text-xs font-semibold text-muted-foreground">{litres(capacity)} in all, filling and emptying together through a link kit.</p>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Results -- */

function Results({ input, result, money, onSize }: { input: ButtInput; result: ButtResult; money: Money; onSize: (size: number, butts: number) => void }) {
  const { sim, sizing, capacity } = result;
  const avg = sim.average;
  const noRoof = result.area <= 0;
  const linked = buttsFor(sizing.recommended);
  const curve = sizing.curve;
  const markerIndex = Math.min(capacity, CURVE_MAX) / CURVE_STEP;

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-sky">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label="Water butt to get"
            value={noRoof ? "–" : litres(sizing.recommended)}
            hint={
              noRoof
                ? "Add your roof's size to see how much it catches."
                : input.use <= 0
                  ? "Add how much your garden uses to size the butt."
                  : `${linked.butts > 1 ? `${linked.butts} × ${litres(linked.size)} linked: the` : "The"} smallest common size that gets ${formatPercent(ENOUGH, 0)} of what ${litres(CURVE_MAX)} of butts would.`
            }
          />

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Rain off the roof" value={litres(result.yearly)} hint={`A year, from ${formatNumber(result.area, 1)} m² at ${formatNumber(input.annual, 0)} mm`} />
            <Stat label="Garden needs" value={litres(avg.need)} hint="A year, on dry days" />
            <Stat
              label={`From your ${litres(capacity)}`}
              value={litres(avg.supplied)}
              hint={avg.need > 0 ? `${formatPercent(result.covered, 0)} of the garden's water` : "Nothing to water"}
            />
            <Stat label="Saving a year" value={input.price > 0 ? price(result.saving, money) : "–"} hint={input.price > 0 ? "On a water meter" : "Not on a meter: no saving"} />
            <Stat label="Overflows" value={plural(Math.round(avg.overflowDays), "day")} hint={`A year: ${litres(avg.overflow)} goes down the drain`} />
            <Stat label="Runs dry" value={plural(Math.round(avg.dryDays), "day")} hint="A year, when the garden wanted water" />
          </div>

          {!noRoof && input.use > 0 && (
            <div className="space-y-2 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
              <p className="text-[15px] font-bold">Bigger butt, more water?</p>
              <GrowthChart
                series={[
                  { name: "Garden needs", color: "var(--chart-neutral)", values: curve.map(() => avg.need) },
                  { name: "From the butt", color: WATER, values: curve.map((c) => c.supplied), area: true },
                ]}
                xLabel={(i) => `${litres(curve[i]?.capacity ?? 0)} of butts`}
                xTick={(i) => `${formatNumber(curve[i]?.capacity ?? 0, 0)} L`}
                formatValue={(v) => `${litres(v)} a year`}
                formatAxis={(v) => (v >= 1000 ? `${formatNumber(v / 1000, v % 1000 ? 1 : 0)}k L` : `${formatNumber(v, 0)} L`)}
                marker={{ index: markerIndex, label: "Yours" }}
              />
              <p className="text-xs font-semibold text-muted-foreground">
                Water the garden gets from the butt each year, by size. The curve flattens once the butt holds enough to bridge a dry spell
                {sizing.roofLimited ? ", or when the roof can't catch more." : "."}
              </p>
              {capacity !== sizing.recommended && (
                <PillButton className="h-8 px-3" onClick={() => onSize(linked.size, linked.butts)}>
                  Use {litres(sizing.recommended)}
                </PillButton>
              )}
            </div>
          )}

          <Notes input={input} result={result} />
        </CardContent>
      </Card>
    </div>
  );
}

function YearCard({ input, result, day, onDay, placeName }: { input: ButtInput; result: ButtResult; day: number; onDay: (d: number) => void; placeName: string }) {
  const { year } = result.sim;
  const level = year.level[day] ?? 0;
  const rain = year.rain[day] ?? 0;
  const fill = result.capacity > 0 ? level / result.capacity : 0;
  const overflow = (year.overflow[day] ?? 0) > 0;
  const dry = (year.dry[day] ?? 0) > 0;

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">A year in your water butt</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-3">
          <RoofScene className="mx-auto max-w-md lg:max-w-none" shape={ROOF_INFO[input.roof].shape} size={input.size} butts={input.butts} fill={fill} rain={rain >= 1} overflow={overflow} />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-heading text-2xl font-extrabold tracking-tight">{dayLabel(day)}</p>
            <p className="font-mono text-sm font-bold">
              {litres(level)} of {litres(result.capacity)}
            </p>
          </div>
          <p className="text-sm font-semibold">
            {rain >= 0.2 ? `${formatNumber(rain, 1)} mm of rain: ${litres(rain * (result.yearly / Math.max(input.annual, 1)))} off the roof. ` : "A dry day. "}
            {overflow ? "The butt is full and overflowing." : dry ? <span style={{ color: DRY }}>Empty: the garden needs the tap today.</span> : level >= result.capacity - 0.5 ? "Full to the brim." : ""}
          </p>
        </div>
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <p className="text-[15px] font-bold">Water in the butt, day by day</p>
            <YearChart year={year} capacity={result.capacity} day={day} onDay={onDay} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-3 rounded-full" style={{ background: WATER }} /> Overflowing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-3 rounded-full" style={{ background: DRY }} /> Empty when needed
              </span>
              <span className="text-muted-foreground">Bars along the top: rain</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              A typical year of simulated weather for {placeName}, built from its monthly averages: real years bunch rain and dry spells differently. Drag across the chart to
              see any day.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[15px] font-bold">Month by month, on average</p>
            <MonthBars months={result.sim.months} format={litres} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** At most two notes, most important first. */
function Notes({ input, result }: { input: ButtInput; result: ButtResult }) {
  const notes: { tone: "info" | "warn"; text: string }[] = [];
  const { sim, sizing } = result;
  if (result.area > 0 && input.use > 0 && sizing.roofLimited) {
    const best = sizing.curve[sizing.curve.length - 1]?.supplied ?? 0;
    notes.push({
      tone: "warn",
      text: `This roof can't keep up with the garden: even ${litres(CURVE_MAX)} of butts would cover only ${formatPercent(best / Math.max(sim.average.need, 1), 0)}. A butt on another downpipe would help more than a bigger one here.`,
    });
  }
  if (sim.average.dryDays >= 10 && result.capacity < sizing.recommended) {
    notes.push({ tone: "info", text: `Runs dry about ${plural(Math.round(sim.average.dryDays), "day")} a year, mostly in summer: a bigger butt or a second one linked to it would bridge more dry spells.` });
  }
  if (sim.average.overflowDays >= 30) {
    notes.push({
      tone: "info",
      text: "Overflowing is normal, mostly in winter. A downpipe diverter stops taking water once the butt is full and sends the rest down the drain, so nothing spills over the lid.",
    });
  }
  if (input.price <= 0) {
    notes.push({ tone: "info", text: "Without a meter the butt saves water, not money: still handy in a hosepipe ban, and plants prefer rainwater." });
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
