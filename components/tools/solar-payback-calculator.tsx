"use client";

import * as React from "react";
import { Pause, Play, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NoteList, type Note } from "@/components/calc/note-list";
import { NumberField } from "@/components/calc/number-field";
import { PillButton, togglePillClass } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SwitchField } from "@/components/calc/switch-field";
import { GrowthChart } from "@/components/charts/growth-chart";
import { Key } from "@/components/charts/legend";
import { BATTERY, DayChart, EXPORT, GRID, HomeScene, MonthBars, SOLAR, hourLabel, type HourFlows } from "@/components/tools/solar-visuals";
import { inputFields, useUrlState, type FieldUpdate } from "@/hooks/use-url-state";
import { formatGbp, formatGbpCompact, formatNumber, formatPercent, plural } from "@/lib/currency";
import {
  BATTERY_SIZES,
  DEFAULT_EXPORT,
  DEFAULT_IMPORT,
  DEFAULT_OFF_PEAK,
  DEFAULT_OFF_PEAK_HOURS,
  GRID_CO2,
  HORIZON,
  LIMITS,
  OFF_PEAK_DAY_RATE,
  ORIENTATIONS,
  ORIENTATION_INFO,
  PATTERNS,
  PATTERN_INFO,
  SHADINGS,
  SHADING_INFO,
  SOLAR_PLACES,
  USE_PRESETS,
  batteryCostFor,
  bestSweep,
  calculate,
  marginalPayback,
  roofGeneration,
  solarCostFor,
  typicalDay,
  type ScenarioResult,
  type SolarInput,
  type SolarPlaceId,
  type SolarResult,
} from "@/lib/solar";
import { cn } from "@/lib/utils";
import { MONTHS, MONTH_NAMES, dayLabel } from "@/lib/year";

/** A 4 kWp roof in London, a medium home that's out on weekdays, with a 5 kWh battery. */
const DEFAULTS: SolarInput = {
  kwp: 4,
  place: "london",
  orientation: "south",
  shading: "none",
  generation: 0,
  use: 2500,
  pattern: "weekdays",
  importPrice: DEFAULT_IMPORT,
  exportPrice: DEFAULT_EXPORT,
  offPeak: false,
  offPeakPrice: DEFAULT_OFF_PEAK,
  offPeakHours: DEFAULT_OFF_PEAK_HOURS,
  battery: 5,
  solarCost: 0,
  batteryCost: 0,
  priceRise: 3,
  degradation: 0.5,
  inverterYear: 12,
  inverterCost: 1000,
  batteryLife: 12,
};

const PLACE_IDS = SOLAR_PLACES.map((p) => p.id);
/** kWp a typical panel adds. */
const PANEL_KWP = 0.45;
/** The hour the day view starts on: mid-afternoon, when the battery is full and the sun still up. */
const START_HOUR = 15;
const START_MONTH = 5;
/** Export over this (kW) needs the network operator's say-so (G98/G99). */
const G98_LIMIT = 3.68;

const kwh = (v: number, decimals = 0) => `${formatNumber(v, decimals)} kWh`;
const pence = (v: number) => `${formatNumber(v, v % 1 ? 1 : 0)}p`;

function years(v: number | null): string {
  if (v === null) return `Over ${HORIZON}`;
  return `${formatNumber(v, v < 10 ? 1 : 0)} ${v === 1 ? "year" : "years"}`;
}

export function SolarPaybackCalculator() {
  const [input, setInput] = React.useState(DEFAULTS);
  const [month, setMonth] = React.useState(START_MONTH);
  const [hour, setHour] = React.useState(START_HOUR);
  const [playing, setPlaying] = React.useState(false);
  const update: FieldUpdate<SolarInput> = (key, value) => setInput((prev) => ({ ...prev, [key]: value }));
  const field = inputFields(input, update, DEFAULTS);
  useUrlState({
    kwp: field("kwp", { range: LIMITS.kwp }),
    place: field("place", { allowed: PLACE_IDS }),
    facing: field("orientation", { allowed: ORIENTATIONS }),
    shade: field("shading", { allowed: SHADINGS }),
    gen: field("generation", { range: LIMITS.generation }),
    use: field("use", { range: LIMITS.use }),
    pattern: field("pattern", { allowed: PATTERNS }),
    import: field("importPrice", { range: LIMITS.price }),
    export: field("exportPrice", { range: LIMITS.price }),
    offpeak: field("offPeak"),
    night: field("offPeakPrice", { range: LIMITS.price }),
    hours: field("offPeakHours", { range: LIMITS.offPeakHours }),
    battery: field("battery", { range: LIMITS.battery }),
    "solar-cost": field("solarCost", { range: LIMITS.cost }),
    "battery-cost": field("batteryCost", { range: LIMITS.cost }),
    rise: field("priceRise", { range: LIMITS.priceRise }),
    fade: field("degradation", { range: LIMITS.degradation }),
    "inverter-year": field("inverterYear", { range: LIMITS.year }),
    "inverter-cost": field("inverterCost", { range: LIMITS.cost }),
    "battery-life": field("batteryLife", { range: LIMITS.year }),
  });

  // The year-by-year simulation is heavy enough to lag a slider drag, so it follows the inputs a beat behind.
  const deferred = React.useDeferredValue(input);
  const result = calculate(deferred);
  const nothing = input.kwp <= 0 && input.battery <= 0;

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setHour((h) => (h + 1) % 24), 550);
    return () => window.clearInterval(id);
  }, [playing]);

  const pickHour = (h: number) => {
    setPlaying(false);
    setHour(h);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Your roof, home and tariff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <Roof input={input} update={update} generation={result.generation} />
            <Electricity input={input} update={update} />
            <Tariff input={input} update={update} />
            <Battery input={input} update={update} />
            <Costs input={input} update={update} />
            <Assumptions input={input} update={update} />
          </CardContent>
        </Card>

        <Results input={input} result={result} />
      </div>

      <DayCard input={input} result={result} month={month} onMonth={setMonth} hour={hour} onHour={pickHour} playing={playing} onPlay={() => setPlaying((p) => !p)} />

      <BatteryCard input={input} result={result} onBattery={(v) => update("battery", v)} />

      <MobileResultBar label="Pays back in" value={nothing ? "–" : years(result.system.payback)} />
    </>
  );
}

/* --------------------------------------------------------------- Inputs -- */

function Heading({ id, children, right }: { id: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 id={id} className="text-[15px] font-bold">
        {children}
      </h3>
      {right}
    </div>
  );
}

function Roof({ input, update, generation }: { input: SolarInput; update: FieldUpdate<SolarInput>; generation: number }) {
  const auto = roofGeneration(input);
  const typed = input.generation > 0;
  return (
    <section className="space-y-4" aria-labelledby="sp-roof">
      <Heading id="sp-roof">Panels on the roof</Heading>
      <SliderField id="sp-kwp" label="System size" value={input.kwp} onChange={(v) => update("kwp", v)} min={0} max={12} inputMax={LIMITS.kwp.max} step={0.1} sliderStep={0.5} suffix="kWp" decimals={1} />
      <p className="-mt-1 text-xs font-semibold text-muted-foreground">
        About {plural(Math.max(Math.round(input.kwp / PANEL_KWP), 0), "panel")} of {formatNumber(PANEL_KWP * 1000, 0)} W. A typical house takes 3–5 kWp; the quote says the size.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sp-place" className="text-[15px] font-bold">
            Nearest place
          </Label>
          <Select value={input.place} onValueChange={(v) => update("place", v as SolarPlaceId)}>
            <SelectTrigger id="sp-place" className="w-full font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOLAR_PLACES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {formatNumber(p.yield, 0)} kWh/kWp
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[15px] font-bold">Shade on the panels</Label>
          <Segmented label="Shade" value={input.shading} onChange={(v) => update("shading", v)} options={SHADINGS.map((value) => ({ value, label: SHADING_INFO[value].label }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-[15px] font-bold">Which way the roof faces</Label>
        <ChoiceGroup
          label="Roof facing"
          value={input.orientation}
          onChange={(v) => update("orientation", v)}
          options={ORIENTATIONS.map((value) => ({ value, label: ORIENTATION_INFO[value].label }))}
          className="grid grid-cols-2 gap-2 sm:grid-cols-5"
          itemClassName={(active) =>
            cn("rounded-2xl px-3 py-2 text-left transition-transform", active ? "sticker-sm -translate-y-0.5 bg-yellow" : "border-2 border-foreground bg-card hover:-translate-y-0.5")
          }
          renderLabel={(o) => (
            <>
              <span className="block text-sm leading-tight font-bold">{o.label}</span>
              <span className="block font-mono text-xs font-bold text-muted-foreground">{formatPercent(ORIENTATION_INFO[o.value].factor, 0)} of south</span>
            </>
          )}
        />
        <p className="text-xs font-semibold text-muted-foreground">{ORIENTATION_INFO[input.orientation].hint}</p>
      </div>
      <NumberField
        id="sp-gen"
        label="Generation a year"
        value={typed ? input.generation : Math.round(auto)}
        onChange={(v) => update("generation", Math.round(v) === Math.round(auto) ? 0 : v)}
        max={LIMITS.generation.max}
        suffix="kWh"
        decimals={0}
        placeholder={String(Math.round(auto))}
        className="sm:max-w-[60%]"
        hint={
          typed
            ? "Your figure, from the installer's estimate or your inverter. Clear it to go back to the roof's."
            : `PVGIS for ${SOLAR_PLACES.find((p) => p.id === input.place)?.name ?? "this place"}, south-facing at 35°, adjusted for facing and shade. Type the installer's estimate (the MCS certificate has one) if you have it.`
        }
      />
      {typed && (
        <p className="-mt-2 text-xs font-semibold text-muted-foreground">
          The roof above would make about {kwh(auto)}; this uses {kwh(generation)}.
        </p>
      )}
    </section>
  );
}

function Electricity({ input, update }: { input: SolarInput; update: FieldUpdate<SolarInput> }) {
  const preset = USE_PRESETS.find((p) => p.kwh === input.use);
  return (
    <section className="space-y-4" aria-labelledby="sp-use">
      <Heading id="sp-use">Electricity the home uses</Heading>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Typical homes">
        {USE_PRESETS.map((p) => (
          <button key={p.label} type="button" aria-pressed={input.use === p.kwh} onClick={() => update("use", p.kwh)} className={togglePillClass(input.use === p.kwh, "h-8 px-3 text-sm")}>
            {p.label}
          </button>
        ))}
      </div>
      <SliderField id="sp-use-kwh" label="In a year" value={input.use} onChange={(v) => update("use", v)} min={0} max={10000} inputMax={LIMITS.use.max} step={10} sliderStep={50} suffix="kWh" decimals={0} />
      <p className="-mt-1 text-xs font-semibold text-muted-foreground">
        {preset?.hint ?? "Your annual statement or the app shows this."} Winter uses about 1.4 times what summer does.
      </p>
      <div className="space-y-2">
        <Label className="text-[15px] font-bold">When the home uses it</Label>
        <ChoiceGroup
          label="Daily pattern"
          value={input.pattern}
          onChange={(v) => update("pattern", v)}
          options={PATTERNS.map((value) => ({ value, label: PATTERN_INFO[value].label }))}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          itemClassName={(active) =>
            cn("rounded-2xl px-3 py-2 text-left text-sm font-bold transition-transform", active ? "sticker-sm -translate-y-0.5 bg-yellow" : "border-2 border-foreground bg-card hover:-translate-y-0.5")
          }
        />
        <p className="text-xs font-semibold text-muted-foreground">{PATTERN_INFO[input.pattern].hint}</p>
      </div>
    </section>
  );
}

const OFF_PEAK_OPTIONS = ["4", "5", "6", "7"].map((v) => ({ value: v, label: `${v} h` }));

function Tariff({ input, update }: { input: SolarInput; update: FieldUpdate<SolarInput> }) {
  const toggleOffPeak = (on: boolean) => {
    update("offPeak", on);
    // EV tariffs charge more in the day than the cap: follow suit unless the price was typed.
    if (on && input.importPrice === DEFAULT_IMPORT) update("importPrice", OFF_PEAK_DAY_RATE);
    if (!on && input.importPrice === OFF_PEAK_DAY_RATE) update("importPrice", DEFAULT_IMPORT);
  };
  return (
    <section className="space-y-4" aria-labelledby="sp-tariff">
      <Heading id="sp-tariff">What electricity costs</Heading>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id="sp-import" label="Buying it" value={input.importPrice} onChange={(v) => update("importPrice", v)} max={LIMITS.price.max} suffix="p/kWh" decimals={2} hint={`Ofgem's cap is ${pence(DEFAULT_IMPORT)} from October 2026.`} />
        <NumberField
          id="sp-export"
          label="Selling it"
          value={input.exportPrice}
          onChange={(v) => update("exportPrice", v)}
          max={LIMITS.price.max}
          suffix="p/kWh"
          decimals={2}
          hint="Smart Export Guarantee: 12–16p from your own supplier, 3–6p from others."
        />
      </div>
      <SwitchField id="sp-offpeak" label="Cheap overnight rate" hint="An EV or battery tariff such as Octopus Go, E.ON Next Drive or EDF GoElectric: cheap at night, dearer by day." checked={input.offPeak} onCheckedChange={toggleOffPeak} />
      {input.offPeak && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="sp-night" label="Night rate" value={input.offPeakPrice} onChange={(v) => update("offPeakPrice", v)} max={LIMITS.price.max} suffix="p/kWh" decimals={2} hint="6.5–9.5p on most of them." />
          <div className="space-y-1.5">
            <Label className="text-[15px] font-bold">From midnight for</Label>
            <Segmented label="Cheap hours" value={String(Math.min(Math.max(input.offPeakHours, 4), 7))} onChange={(v) => update("offPeakHours", Number(v))} options={OFF_PEAK_OPTIONS} />
            <p className="text-xs font-semibold text-muted-foreground">Octopus Go gives 5, E.ON and EDF 6 or 7.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function Battery({ input, update }: { input: SolarInput; update: FieldUpdate<SolarInput> }) {
  const none = input.battery <= 0;
  return (
    <section className="space-y-3" aria-labelledby="sp-battery">
      <Heading id="sp-battery">Home battery</Heading>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Battery size">
        <button type="button" aria-pressed={none} onClick={() => update("battery", 0)} className={togglePillClass(none, "h-8 px-3 font-mono text-sm")}>
          None
        </button>
        {BATTERY_SIZES.map((s) => (
          <button key={s} type="button" aria-pressed={input.battery === s} onClick={() => update("battery", s)} className={togglePillClass(input.battery === s, "h-8 px-2.5 font-mono text-sm")}>
            {formatNumber(s, 1)} kWh
          </button>
        ))}
      </div>
      <NumberField id="sp-battery-kwh" label="Usable capacity" value={input.battery} onChange={(v) => update("battery", v)} max={LIMITS.battery.max} suffix="kWh" decimals={1} className="sm:max-w-[60%]" hint="The usable figure on the datasheet: a Powerwall 3 is 13.5 kWh, a GivEnergy All in One 13.5, most others 5–10." />
    </section>
  );
}

function Costs({ input, update }: { input: SolarInput; update: FieldUpdate<SolarInput> }) {
  const solarAuto = solarCostFor(input.kwp);
  const batteryAuto = batteryCostFor(input.battery);
  return (
    <section className="space-y-4" aria-labelledby="sp-costs">
      <Heading id="sp-costs">What it costs to install</Heading>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="sp-solar-cost"
          label="Panels, fitted"
          value={input.solarCost > 0 ? input.solarCost : solarAuto}
          onChange={(v) => update("solarCost", v === solarAuto ? 0 : v)}
          max={LIMITS.cost.max}
          prefix="£"
          grouped
          decimals={0}
          hint={input.solarCost > 0 ? `Your quote. Typical is about ${formatGbp(solarAuto)}.` : `MCS median, about ${formatGbp(input.kwp > 0 ? solarAuto / input.kwp : 0)} a kWp. Type your quote.`}
        />
        <NumberField
          id="sp-battery-cost"
          label="Battery, fitted"
          value={input.batteryCost > 0 ? input.batteryCost : batteryAuto}
          onChange={(v) => update("batteryCost", v === batteryAuto ? 0 : v)}
          max={LIMITS.cost.max}
          prefix="£"
          grouped
          decimals={0}
          hint={input.battery <= 0 ? "No battery." : input.batteryCost > 0 ? `Your quote. Typical is about ${formatGbp(batteryAuto)}.` : "Typical 2026 price, fitted. A Powerwall 3 is £8,000–10,500."}
        />
      </div>
      <p className="-mt-1 text-xs font-semibold text-muted-foreground">No VAT on solar panels or batteries until 31 March 2027, then 5%. The Warm Homes Loan (from autumn 2026) lends up to £15,000 each for panels and a battery at a low rate.</p>
    </section>
  );
}

function Assumptions({ input, update }: { input: SolarInput; update: FieldUpdate<SolarInput> }) {
  const { isOpen, toggle } = useSectionState();
  const changed = input.priceRise !== DEFAULTS.priceRise || input.degradation !== DEFAULTS.degradation || input.inverterYear !== DEFAULTS.inverterYear || input.inverterCost !== DEFAULTS.inverterCost || input.batteryLife !== DEFAULTS.batteryLife;
  return (
    <Section
      icon={SlidersHorizontal}
      title="Over the years"
      summary={`Prices up ${formatNumber(input.priceRise, 1)}% a year, panels lose ${formatNumber(input.degradation, 2)}%, inverter ${input.inverterYear > 0 ? `replaced in year ${input.inverterYear}` : "never replaced"}, battery lasts ${input.batteryLife > 0 ? plural(input.batteryLife, "year") : "forever"}`}
      active={changed}
      open={isOpen("years")}
      onToggle={() => toggle("years")}
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberField id="sp-rise" label="Prices rise by" value={input.priceRise} onChange={(v) => update("priceRise", v)} min={LIMITS.priceRise.min} max={LIMITS.priceRise.max} suffix="% a year" decimals={1} hint="Both buying and selling. 3% is a guess; the cap moved 50% in 2022 and has drifted since." />
        <NumberField id="sp-fade" label="Panels lose" value={input.degradation} onChange={(v) => update("degradation", v)} max={LIMITS.degradation.max} suffix="% a year" decimals={2} hint="Warranties promise 0.4–0.55% a year: about 87% left after 25 years." />
        <NumberField id="sp-inv-year" label="Inverter replaced in year" value={input.inverterYear} onChange={(v) => update("inverterYear", Math.round(v))} max={LIMITS.year.max} decimals={0} hint="Inverters last 10–15 years. 0 for never." />
        <NumberField id="sp-inv-cost" label="Costing" value={input.inverterCost} onChange={(v) => update("inverterCost", v)} max={LIMITS.cost.max} prefix="£" grouped decimals={0} hint="£500–1,500 for a string inverter, more for a hybrid." />
        <NumberField id="sp-batt-life" label="Battery lasts" value={input.batteryLife} onChange={(v) => update("batteryLife", Math.round(v))} max={LIMITS.year.max} suffix="years" decimals={0} hint="Warranties run 10–12 years to 70% capacity. It's replaced at today's price; 0 for never." />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- Results -- */

function Results({ input, result }: { input: SolarInput; result: SolarResult }) {
  const { system, panelsOnly, batteryOnly } = result;
  const first = system.first;
  const f = first.flows;
  const nothing = input.kwp <= 0 && input.battery <= 0;
  const hasBoth = input.kwp > 0 && input.battery > 0;
  const yearLabels = Array.from({ length: HORIZON + 1 }, (_, i) => i);
  let saved = 0;
  let spent = system.capex;
  const savedCurve = [0];
  const spentCurve = [system.capex];
  for (const y of system.years) {
    saved += y.saving;
    spent += y.spent;
    savedCurve.push(saved);
    spentCurve.push(spent);
  }
  let panelsSaved = 0;
  const panelsCurve = [0, ...panelsOnly.years.map((y) => (panelsSaved += y.saving))];

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-yellow">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label="Pays for itself in"
            value={nothing ? "–" : years(system.payback)}
            hint={
              nothing
                ? "Add some panels or a battery to see what they'd do."
                : `${formatGbp(system.capex)} of kit saving ${formatGbp(first.saving)} in the first year${system.payback === null ? `: not paid back within ${HORIZON} years` : ""}.`
            }
          />

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Panels make" value={kwh(f.generated)} hint={f.generated > 0 ? `A year. ${formatPercent(first.selfUse, 0)} used at home, the rest sold` : "No panels"} />
            <Stat label="Home runs on solar" value={formatPercent(first.selfSufficiency, 0)} hint={`Of ${kwh(f.load)} a year; the rest is bought`} />
            <Stat label="Cuts the bill by" value={formatGbp(first.billSaving)} hint={`A year, from ${formatGbp(first.baseline)} to ${formatGbp(first.baseline - first.billSaving)}`} />
            <Stat label="Earns from export" value={formatGbp(first.exportIncome)} hint={f.exported > 0 ? `${kwh(f.exported)} at ${pence(input.exportPrice)}` : "Nothing exported"} />
            <Stat label={`After ${HORIZON} years`} value={`${system.net >= 0 ? "+" : "−"}${formatGbp(Math.abs(system.net))}`} hint={`${formatGbp(system.lifetimeSaving)} saved, less the kit${input.inverterYear > 0 || (input.battery > 0 && input.batteryLife > 0) ? " and replacements" : ""}`} />
            <Stat label="CO₂ avoided" value={`${formatNumber(result.co2, 0)} kg`} hint={`A year, at ${formatNumber(GRID_CO2, 3)} kg per kWh of grid power`} />
          </div>

          {hasBoth && batteryOnly && (
            <div className="space-y-2 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
              <p className="text-[15px] font-bold">Panels, battery or both?</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-muted-foreground">
                    <th className="pb-1 font-bold">Buy</th>
                    <th className="pb-1 text-right font-bold">Cost</th>
                    <th className="pb-1 text-right font-bold">Saves a year</th>
                    <th className="pb-1 text-right font-bold">Pays back</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-numeric">
                  <CompareRow label="Panels only" r={panelsOnly} />
                  <CompareRow label="Battery only" r={batteryOnly} />
                  <CompareRow label="Both" r={system} strong />
                </tbody>
              </table>
              <p className="text-xs font-semibold text-muted-foreground">
                {batteryOnly.first.saving < 1
                  ? "On a flat tariff a battery alone saves nothing: it only earns with panels to fill it, or a cheap overnight rate to shift."
                  : `The battery adds ${formatGbp(system.first.saving - panelsOnly.first.saving)} a year to the panels for ${formatGbp(system.capex - panelsOnly.capex)}${marginalPayback(system, panelsOnly) === null ? ", which it never earns back on its own" : `: ${years(marginalPayback(system, panelsOnly))} to earn that back`}.`}
              </p>
            </div>
          )}

          {!nothing && (
            <div className="space-y-2 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
              <p className="text-[15px] font-bold">Savings against cost, year by year</p>
              <GrowthChart
                series={[
                  { name: "Spent", color: "var(--chart-neutral)", values: spentCurve },
                  ...(hasBoth ? [{ name: "Saved, panels only", color: EXPORT, values: panelsCurve }] : []),
                  { name: hasBoth ? "Saved, with battery" : "Saved", color: SOLAR, values: savedCurve, area: true },
                ]}
                xLabel={(i) => (i === 0 ? "Day one" : `After ${plural(i, "year")}`)}
                xTick={(i) => `${yearLabels[i]}y`}
                formatValue={(v) => formatGbp(v)}
                formatAxis={formatGbpCompact}
                marker={system.payback !== null ? { index: system.payback, label: "Paid back" } : undefined}
              />
              <p className="text-xs font-semibold text-muted-foreground">
                Savings pile up as prices rise and the panels slowly fade; the cost line steps up when the inverter or battery is replaced. Where they cross is payback.
              </p>
            </div>
          )}

          <Notes input={input} result={result} />
        </CardContent>
      </Card>
    </div>
  );
}

function CompareRow({ label, r, strong }: { label: string; r: ScenarioResult; strong?: boolean }) {
  return (
    <tr className={cn("border-t border-foreground/15", strong && "font-bold")}>
      <td className="py-1.5">{label}</td>
      <td className="py-1.5 text-right">{formatGbp(r.capex)}</td>
      <td className="py-1.5 text-right">{r.first.saving < 1 ? "–" : formatGbp(r.first.saving)}</td>
      <td className="py-1.5 text-right">{r.first.saving < 1 ? "Never" : years(r.payback)}</td>
    </tr>
  );
}

/* --------------------------------------------------------- Battery card -- */

function BatteryCard({ input, result, onBattery }: { input: SolarInput; result: SolarResult; onBattery: (kwh: number) => void }) {
  const { sweep } = result;
  if (input.kwp <= 0 || sweep.length < 2) return null;
  const yoursIndex = sweep.findIndex((p) => p.kwh >= input.battery);
  const best = bestSweep(sweep);
  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Is a bigger battery worth it?</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
        <GrowthChart
          series={[{ name: "Saving in the first year", color: BATTERY, values: sweep.map((p) => p.saving), area: true }]}
          xLabel={(i) => (i === 0 ? "No battery" : `${formatNumber(sweep[i]?.kwh ?? 0, 0)} kWh battery`)}
          xTick={(i) => `${formatNumber(sweep[i]?.kwh ?? 0, 0)} kWh`}
          formatValue={(v) => `${formatGbp(v)} a year`}
          formatAxis={formatGbpCompact}
          extraRow={(i) => {
            const p = sweep[i];
            return p ? { name: "Whole system pays back in", value: years(p.payback) } : null;
          }}
          marker={yoursIndex >= 0 ? { index: yoursIndex, label: "Yours" } : undefined}
        />
        <div className="space-y-3">
          <p className="text-sm font-semibold">
            Each extra kWh stores a little more of the day&apos;s surplus for the evening, until the battery holds more than a summer day&apos;s spare and the curve goes flat. Past that, every kWh is money that
            never earns its keep.
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Hover the curve to see the whole system&apos;s payback at each size, at typical battery prices{input.offPeak ? " and your overnight rate" : ". A cheap overnight rate lifts the whole curve: try it above"}.
          </p>
          {input.battery !== best && (
            <PillButton className="h-8 px-3" onClick={() => onBattery(best)}>
              {best === 0 ? "Try without a battery" : `Try ${formatNumber(best, 0)} kWh`}
            </PillButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** At most two notes, most useful first. */
function Notes({ input, result }: { input: SolarInput; result: SolarResult }) {
  const notes: Note[] = [];
  const { system, panelsOnly } = result;
  if (input.place === "belfast" && input.exportPrice > 0) {
    notes.push({ tone: "warn", text: "The Smart Export Guarantee covers Great Britain only. In Northern Ireland, export is paid (if at all) through your supplier's own scheme, often at a few pence: check before counting on it." });
  }
  if (input.battery > 0 && input.kwp > 0 && !input.offPeak && system.payback !== null && panelsOnly.payback !== null && system.payback > panelsOnly.payback + 2) {
    notes.push({
      tone: "info",
      text: `The battery stretches payback from ${years(panelsOnly.payback)} to ${years(system.payback)}. Batteries earn most on a cheap overnight rate, filling up at night for the next day: switch it on above to see the difference.`,
    });
  }
  if (input.kwp > G98_LIMIT) {
    notes.push({ tone: "info", text: `Over ${G98_LIMIT} kW the network operator must approve the connection first (G99), and may cap export at ${G98_LIMIT} kW. Installers handle it, but ask whether your export would be limited.` });
  }
  if (input.exportPrice > input.importPrice) {
    notes.push({ tone: "warn", text: "Selling for more than buying: on a real tariff export never beats the import price, so check the figures." });
  }
  if (input.kwp > 0 && input.battery <= 0 && input.exportPrice < 6) {
    notes.push({ tone: "info", text: "At a few pence a kWh, export earns little: suppliers pay 12–16p to their own customers, so switching may matter more than any kit." });
  }
  return <NoteList notes={notes} />;
}

/* ------------------------------------------------------------- Day card -- */

function DayCard({
  input,
  result,
  month,
  onMonth,
  hour,
  onHour,
  playing,
  onPlay,
}: {
  input: SolarInput;
  result: SolarResult;
  month: number;
  onMonth: (m: number) => void;
  hour: number;
  onHour: (h: number) => void;
  playing: boolean;
  onPlay: () => void;
}) {
  const { gen, load } = result.profiles;
  const hourly = result.system.hourly;
  const day = typicalDay(gen, month, input.pattern === "weekdays" ? false : null);
  const at = (a: Float64Array | undefined, h: number) => a?.[day * 24 + h] ?? 0;
  const data = {
    generated: Array.from({ length: 24 }, (_, h) => at(gen, h)),
    load: Array.from({ length: 24 }, (_, h) => at(load, h)),
    soc: Array.from({ length: 24 }, (_, h) => at(hourly?.soc, h)),
    imported: Array.from({ length: 24 }, (_, h) => at(hourly?.imported, h)),
    exported: Array.from({ length: 24 }, (_, h) => at(hourly?.exported, h)),
  };
  const flows: HourFlows = {
    generated: at(gen, hour),
    load: at(load, hour),
    direct: Math.min(at(gen, hour), at(load, hour)),
    solarToBattery: at(hourly?.solarToBattery, hour),
    gridToBattery: at(hourly?.gridToBattery, hour),
    fromBattery: at(hourly?.fromBattery, hour),
    exported: at(hourly?.exported, hour),
    imported: at(hourly?.imported, hour),
  };
  const soc = at(hourly?.soc, hour);
  const gridForHome = Math.max(flows.imported - flows.gridToBattery, 0);
  const dayTotals = data.generated.reduce((a, b) => a + b, 0);
  const dayLoad = data.load.reduce((a, b) => a + b, 0);

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">A day in your home</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-3">
          <HomeScene className="mx-auto max-w-md lg:max-w-none" hour={hour} day={day} kwp={input.kwp} battery={input.battery} soc={soc} flows={flows} />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="font-heading text-2xl font-extrabold tracking-tight">
              {dayLabel(day)}, {hourLabel(hour)}
            </p>
            <PillButton className="h-8 px-3" onClick={onPlay} aria-pressed={playing}>
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {playing ? "Pause" : "Play the day"}
            </PillButton>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold">
            <FlowRow color={SOLAR} label="Panels" value={`${formatNumber(flows.generated, 2)} kW`} />
            <FlowRow color="var(--foreground)" label="Home" value={`${formatNumber(flows.load, 2)} kW`} />
            {input.battery > 0 && <FlowRow color={BATTERY} {...batteryRow(flows, soc, input.battery)} />}
            <FlowRow color={flows.exported > 0.005 ? EXPORT : GRID} label={flows.exported > 0.005 ? "Selling" : "Buying"} value={`${formatNumber(flows.exported > 0.005 ? flows.exported : flows.imported, 2)} kW`} />
          </dl>
          <p className="text-sm font-semibold">{hourStory(flows, gridForHome, input.battery)}</p>
        </div>
        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            <ChoiceGroup
              label="Month"
              value={month}
              onChange={onMonth}
              options={MONTHS.map((m, i) => ({ value: i, label: m }))}
              className="flex gap-1 rounded-full border-[2.5px] border-foreground bg-card p-1"
              itemClassName={(active) => cn("h-8 min-w-0 flex-1 rounded-full font-mono text-[13px] font-bold transition-colors", active ? "bg-foreground text-background" : "text-foreground hover:bg-secondary")}
              renderLabel={(o) => (
                <>
                  {MONTHS[o.value]?.[0]}
                  <span className="hidden sm:inline">{MONTHS[o.value]?.slice(1)}</span>
                </>
              )}
            />
            <p className="text-[15px] font-bold">
              A typical {MONTH_NAMES[month]} {input.pattern === "weekdays" ? "weekday" : "day"}: {kwh(dayTotals, 1)} made, {kwh(dayLoad, 1)} used
            </p>
            <DayChart data={data} capacity={input.battery} day={day} hour={hour} onHour={onHour} offPeakHours={input.offPeak ? input.offPeakHours : 0} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
              <Key color={SOLAR} shape="block">
                Panels
              </Key>
              <Key color="var(--foreground)" shape="line">
                Home
              </Key>
              {input.battery > 0 && (
                <Key color={BATTERY} shape="line">
                  Battery level
                </Key>
              )}
              <Key color={GRID} shape="bar">
                Buying
              </Key>
              <Key color={EXPORT} shape="bar">
                Selling
              </Key>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              The day in the month whose sun is nearest its average, in a simulated year built from PVGIS monthly figures: real days swing from gloom to glare. Drag across the chart or press play.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[15px] font-bold">Month by month, in the first year</p>
            <MonthBars months={result.system.months} battery={input.battery > 0} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Flows under this (kWh in the hour) count as nothing moving. */
const FLOW_MIN = 0.005;

/** The battery's line in the hour's figures: what it is giving or taking, or how full it sits. */
function batteryRow(f: HourFlows, soc: number, battery: number): { label: string; value: string } {
  const taking = f.solarToBattery + f.gridToBattery;
  if (f.fromBattery > FLOW_MIN) return { label: "Battery giving", value: `${formatNumber(f.fromBattery, 2)} kW` };
  if (taking > FLOW_MIN) return { label: "Battery taking", value: `${formatNumber(taking, 2)} kW` };
  return { label: "Battery", value: `${formatPercent(soc / battery, 0)} full` };
}

/** One sentence on what the home is running on this hour. */
function hourStory(f: HourFlows, gridForHome: number, battery: number): string {
  if (f.generated > FLOW_MIN) {
    if (f.exported > FLOW_MIN) {
      const clause = battery > 0 ? (f.solarToBattery > FLOW_MIN ? ", the battery takes some" : ", the battery is full") : "";
      return `The panels make more than the home needs${clause}, and the rest is sold.`;
    }
    if (f.fromBattery > FLOW_MIN) return "Not enough sun for the home, so the battery tops it up.";
    if (gridForHome > FLOW_MIN) return "The sun covers some of it; the rest comes from the grid.";
    return "The panels cover the home exactly.";
  }
  if (f.fromBattery > FLOW_MIN) return `No sun: the home runs on the battery${gridForHome > FLOW_MIN ? " and the grid" : ""}.`;
  if (f.gridToBattery > FLOW_MIN) return "Cheap-rate hours: the home runs on the grid and the battery fills up for the day ahead.";
  return "No sun: the home runs on the grid.";
}

function FlowRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-foreground/15 pb-1">
      <dt className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border border-foreground" style={{ background: color }} />
        {label}
      </dt>
      <dd className="font-mono text-numeric">{value}</dd>
    </div>
  );
}
