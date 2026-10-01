"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoiceGroup } from "@/components/calc/choice-group";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NoteList, type Note } from "@/components/calc/note-list";
import { NumberField } from "@/components/calc/number-field";
import { PillButton } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { SizePicker } from "@/components/calc/size-picker";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import {
  DayStrip,
  FlowGauge,
  PipeEnds,
  PlantIcon,
  RunSequence,
  SystemSchematic,
  durationText,
  zoneColor,
  type Run,
} from "@/components/tools/drip-irrigation-visuals";
import { price, type Money } from "@/components/tools/garden-format";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, PERCENT_RANGE, inputFields, useUrlState, urlField, type FieldUpdate } from "@/hooks/use-url-state";
import { formatNumber, plural } from "@/lib/currency";
import {
  DRIPPER_FLOWS,
  FLUSH_SPEED,
  KINDS,
  KIND_INFO,
  LIMITS,
  LOW_FLOW_LPM,
  MAX_ZONES,
  PIPE_DEFAULTS,
  PIPE_ID,
  SCHEDULE_DEFAULTS,
  SUPPLY_PIPES,
  TAP_DEFAULTS,
  calculate,
  clockText,
  encodeZones,
  parseClock,
  parseZones,
  zoneFromKind,
  type IrrigationResult,
  type Kind,
  type Pipes,
  type Schedule,
  type SupplyPipe,
  type Tap,
  type Zone,
} from "@/lib/irrigation";
import { cn } from "@/lib/utils";
import { WATER_PRICE, WATER_PRICE_HINT } from "@/lib/water";

type ZoneRow = Zone & { id: number };

/** A small greenhouse and patio: tomatoes, pots and hanging baskets, each on its own zone. */
const DEFAULT_ZONES: Zone[] = [zoneFromKind("tomato", 6), zoneFromKind("pot", 10), zoneFromKind("basket", 4)];
const DEFAULT_ZONES_CODE = encodeZones(DEFAULT_ZONES);
const withIds = (zones: Zone[]): ZoneRow[] => zones.map((z, id) => ({ ...z, id }));
const nextId = (rows: ZoneRow[]) => rows.reduce((max, r) => Math.max(max, r.id), -1) + 1;
const stripId = ({ kind, plants, drippersPerPlant, lph, litres }: ZoneRow): Zone => ({ kind, plants, drippersPerPlant, lph, litres });

const litres = (v: number) => `${formatNumber(v, v < 1 ? 2 : v < 100 ? 1 : 0)} L`;

export function DripIrrigationCalculator() {
  const { code, currency, setCurrency, money, currencyField } = useCurrency();
  const [tap, setTap] = React.useState(TAP_DEFAULTS);
  const [rows, setRows] = React.useState<ZoneRow[]>(() => withIds(DEFAULT_ZONES));
  const [schedule, setSchedule] = React.useState(SCHEDULE_DEFAULTS);
  const [pipes, setPipes] = React.useState(PIPE_DEFAULTS);
  const [waterPrice, setWaterPrice] = React.useState(WATER_PRICE);
  const [active, setActive] = React.useState(0);

  const updateTap: FieldUpdate<Tap> = (key, value) => setTap((prev) => ({ ...prev, [key]: value }));
  const updateSchedule: FieldUpdate<Schedule> = (key, value) => setSchedule((prev) => ({ ...prev, [key]: value }));
  const updatePipes: FieldUpdate<Pipes> = (key, value) => setPipes((prev) => ({ ...prev, [key]: value }));
  const tapField = inputFields(tap, updateTap, TAP_DEFAULTS);
  const scheduleField = inputFields(schedule, updateSchedule, SCHEDULE_DEFAULTS);
  const pipeField = inputFields(pipes, updatePipes, PIPE_DEFAULTS);
  useUrlState({
    bucket: tapField("litres", { range: LIMITS.litres }),
    seconds: tapField("seconds", { range: LIMITS.seconds }),
    "kit-limit": tapField("limit", { range: LIMITS.limit }),
    margin: tapField("margin", { range: PERCENT_RANGE }),
    zones: urlField(encodeZones(rows.map(stripId)), (v: string) => {
      const parsed = parseZones(v);
      if (parsed.ok) setRows(withIds(parsed.value));
    }, DEFAULT_ZONES_CODE),
    waterings: scheduleField("waterings", { range: { min: 1, max: 2 } }),
    start: scheduleField("start", { range: LIMITS.start }),
    second: scheduleField("second", { range: LIMITS.start }),
    days: scheduleField("days", { range: LIMITS.days }),
    pipe: pipeField("supply", { allowed: SUPPLY_PIPES }),
    "supply-length": pipeField("supplyLength", { range: LIMITS.length }),
    "micro-length": pipeField("microLength", { range: LIMITS.length }),
    "water-price": urlField(waterPrice, setWaterPrice, WATER_PRICE, undefined, MONEY_RANGE),
    currency: currencyField,
  });

  const zones = rows.map(stripId);
  const result = calculate({ tap, zones, schedule, pipes, price: waterPrice });
  const activeZone = Math.min(active, rows.length - 1);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Your tap and plants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <TapSection tap={tap} update={updateTap} result={result} />
            <ZoneList rows={rows} setRows={setRows} result={result} />
            <ScheduleSection schedule={schedule} update={updateSchedule} />
            <PipeSection pipes={pipes} update={updatePipes} />
            <section className="space-y-3" aria-labelledby="dr-money">
              <div className="flex items-center justify-between gap-3">
                <h3 id="dr-money" className="text-[15px] font-bold">
                  Water bill
                </h3>
                <CurrencySelect value={code} onChange={setCurrency} />
              </div>
              <NumberField
                id="dr-price"
                label="Price per 1,000 L"
                value={waterPrice}
                onChange={setWaterPrice}
                max={MONEY_RANGE.max}
                prefix={currency.symbol}
                decimals={2}
                hint={`${WATER_PRICE_HINT} Leave blank if you're not on a meter.`}
                className="sm:max-w-[60%]"
              />
            </section>
          </CardContent>
        </Card>

        <Results zones={zones} result={result} schedule={schedule} pipes={pipes} price={waterPrice} money={money} active={activeZone} onActive={setActive} />
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Your watering system</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
          <SystemSchematic zones={zones} results={result.zones} active={activeZone} onActive={setActive} />
          <div className="space-y-2">
            <p className="text-[15px] font-bold">When it runs</p>
            <DayStrip
              waterings={(schedule.waterings === 2 ? [schedule.start, schedule.second] : [schedule.start]).map((start) => ({ start, minutes: result.minutes }))}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              Water early in the morning, or in the evening as well in a heatwave: less is lost to the sun, and leaves dry before night.
            </p>
          </div>
        </CardContent>
      </Card>

      <MobileResultBar label={schedule.waterings === 2 ? "Each watering" : "Run time"} value={durationText(result.minutes)} />
    </>
  );
}

/* --------------------------------------------------------------- Tap -- */

function TapSection({ tap, update, result }: { tap: Tap; update: FieldUpdate<Tap>; result: IrrigationResult }) {
  return (
    <section className="space-y-4" aria-labelledby="dr-tap">
      <div className="space-y-1">
        <h3 id="dr-tap" className="text-[15px] font-bold">
          Your tap: the bucket test
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Fit the kit&apos;s pressure reducer, open the tap fully and time how long a bucket takes to fill.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id="dr-bucket" label="Bucket holds" value={tap.litres} onChange={(v) => update("litres", v || TAP_DEFAULTS.litres)} min={LIMITS.litres.min} max={LIMITS.litres.max} suffix="L" decimals={1} />
        <NumberField id="dr-seconds" label="Filled in" value={tap.seconds} onChange={(v) => update("seconds", v || TAP_DEFAULTS.seconds)} min={LIMITS.seconds.min} max={LIMITS.seconds.max} suffix="s" decimals={0} />
      </div>
      <p className="rounded-xl border-2 border-foreground/15 px-3 py-2 font-mono text-sm font-bold">
        {formatNumber(result.tap / 60, 1)} L/min = {formatNumber(result.tap, 0)} L/h
      </p>
      <div className="space-y-2">
        <SliderField id="dr-margin" label="Design to" value={tap.margin} onChange={(v) => update("margin", v)} min={50} max={100} inputMax={LIMITS.margin.max} step={5} suffix="%" decimals={0} />
        <p className="text-xs font-semibold text-muted-foreground">
          Leave some flow spare so the far drippers still get their pressure. Irrigation designers use about 75% of what the supply gives.
        </p>
      </div>
      <NumberField
        id="dr-limit"
        label="Kit's flow limit"
        value={tap.limit}
        onChange={(v) => update("limit", v)}
        max={LIMITS.limit.max}
        suffix="L/h"
        decimals={0}
        placeholder="None"
        hint="If your kit gives one: a Gardena Master Unit 1000 passes about 1,000 L/h, the 2000 about 2,000 L/h. Hozelock gives none: the bucket test is its method."
        className="sm:max-w-[60%]"
      />
    </section>
  );
}

/* ------------------------------------------------------------- Zones -- */

const KIND_OPTIONS = KINDS.map((value) => ({ value, label: KIND_INFO[value].label }));

function ZoneList({ rows, setRows, result }: { rows: ZoneRow[]; setRows: React.Dispatch<React.SetStateAction<ZoneRow[]>>; result: IrrigationResult }) {
  const updateZone = (id: number, patch: Partial<Zone>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <section className="space-y-3" aria-labelledby="dr-zones">
      <div className="space-y-1">
        <h3 id="dr-zones" className="text-[15px] font-bold">
          Zones
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Group plants that need the same water, like a greenhouse or a row of pots. Zones run one after another, so each gets the tap&apos;s full flow.
        </p>
      </div>
      <ol className="space-y-3">
        {rows.map((row, i) => (
          <ZoneEditor
            key={row.id}
            index={i}
            row={row}
            over={result.zones[i]?.over ?? false}
            onChange={(patch) => updateZone(row.id, patch)}
            onRemove={rows.length > 1 ? () => setRows((prev) => prev.filter((r) => r.id !== row.id)) : undefined}
          />
        ))}
      </ol>
      {rows.length < MAX_ZONES && (
        <PillButton onClick={() => setRows((prev) => [...prev, { ...zoneFromKind("bed", 4), id: nextId(prev) }])}>
          <Plus className="size-4" /> Add a zone
        </PillButton>
      )}
    </section>
  );
}

function ZoneEditor({ index, row, over, onChange, onRemove }: { index: number; row: ZoneRow; over: boolean; onChange: (patch: Partial<Zone>) => void; onRemove?: () => void }) {
  const info = KIND_INFO[row.kind];
  const id = `dr-z${row.id}`;
  return (
    <li className={cn("space-y-4 rounded-2xl border-[2.5px] border-foreground p-3.5", over ? "bg-pink/40" : "bg-card")}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <span className="inline-block size-3.5 rounded-full border-2 border-foreground" style={{ background: zoneColor(index) }} />
          Zone {index + 1}
        </p>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove zone ${index + 1}`} className="rounded-full p-1 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">
            <X className="size-4" />
          </button>
        )}
      </div>
      <ChoiceGroup
        label={`Zone ${index + 1} plants`}
        value={row.kind}
        onChange={(kind: Kind) => onChange({ ...zoneFromKind(kind, row.plants) })}
        options={KIND_OPTIONS}
        className="grid grid-cols-3 gap-1.5 sm:grid-cols-6"
        itemClassName={(active) =>
          cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-xs leading-tight font-bold transition-transform",
            active ? "sticker-sm -translate-y-0.5 bg-lilac" : "border-2 border-foreground bg-card hover:-translate-y-0.5",
          )
        }
        renderLabel={(o) => (
          <>
            <PlantIcon kind={o.value} className="size-7" />
            {o.label}
          </>
        )}
      />
      <p className="-mt-1 text-xs font-semibold text-muted-foreground">{info.hint}</p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id={`${id}-plants`}
          label={row.kind === "bed" ? "Bed size" : `How many ${row.kind === "custom" ? "plants" : info.label.toLowerCase()}`}
          value={row.plants}
          onChange={(v) => onChange({ plants: v })}
          max={LIMITS.plants.max}
          suffix={row.kind === "bed" ? "m²" : undefined}
          decimals={0}
        />
        <NumberField
          id={`${id}-litres`}
          label={`Water per ${info.unit}`}
          value={row.litres}
          onChange={(v) => onChange({ litres: v })}
          max={LIMITS.perPlant.max}
          suffix="L/day"
          decimals={2}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <NumberField
          id={`${id}-drippers`}
          label={`Drippers per ${info.unit}`}
          value={row.drippersPerPlant}
          onChange={(v) => onChange({ drippersPerPlant: v || 1 })}
          min={LIMITS.drippers.min}
          max={LIMITS.drippers.max}
          decimals={0}
        />
        <SizePicker
          id={`${id}-lph`}
          label="Each dripper gives"
          unit="L/h"
          sizes={DRIPPER_FLOWS}
          value={row.lph}
          onChange={(v) => onChange({ lph: v })}
          min={LIMITS.lph.min}
          max={LIMITS.lph.max}
          decimals={1}
        />
      </div>
    </li>
  );
}

/* ----------------------------------------------------------- Schedule -- */

function TimeField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </Label>
      <Input
        id={id}
        type="time"
        value={clockText(value)}
        onChange={(e) => {
          const v = parseClock(e.target.value);
          if (v !== null) onChange(v);
        }}
        className="font-mono"
      />
    </div>
  );
}

function ScheduleSection({ schedule, update }: { schedule: Schedule; update: FieldUpdate<Schedule> }) {
  return (
    <section className="space-y-4" aria-labelledby="dr-schedule">
      <h3 id="dr-schedule" className="text-[15px] font-bold">
        Timer
      </h3>
      <Segmented
        label="Waterings a day"
        value={String(schedule.waterings)}
        onChange={(v) => update("waterings", Number(v))}
        options={[
          { value: "1", label: "Once a day" },
          { value: "2", label: "Twice a day" },
        ]}
        className="sm:max-w-[60%]"
      />
      <div className="grid grid-cols-2 gap-3">
        <TimeField id="dr-start" label={schedule.waterings === 2 ? "Morning start" : "Starts at"} value={schedule.start} onChange={(v) => update("start", v)} />
        {schedule.waterings === 2 && <TimeField id="dr-second" label="Evening start" value={schedule.second} onChange={(v) => update("second", v)} />}
      </div>
      <div className="space-y-2">
        <Label className="text-[15px] font-bold">Days a week</Label>
        <Segmented
          label="Days a week"
          size="sm"
          value={String(schedule.days)}
          onChange={(v) => update("days", Number(v))}
          options={["1", "2", "3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))}
        />
        <p className="text-xs font-semibold text-muted-foreground">
          {schedule.waterings === 2 ? "The day's water is split between the two runs. " : ""}Pots and grow bags need water every day in summer; beds in the ground can go longer between waterings.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Pipes -- */

function PipeSection({ pipes, update }: { pipes: Pipes; update: FieldUpdate<Pipes> }) {
  return (
    <section className="space-y-4" aria-labelledby="dr-pipes">
      <h3 id="dr-pipes" className="text-[15px] font-bold">
        Pipes
      </h3>
      <div className="space-y-2">
        <Label className="text-[15px] font-bold">Supply pipe</Label>
        <Segmented
          label="Supply pipe"
          value={pipes.supply}
          onChange={(v: SupplyPipe) => update("supply", v)}
          options={[
            { value: "13", label: "13 mm (½″)" },
            { value: "16", label: "16 mm" },
          ]}
          className="sm:max-w-[60%]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id="dr-supply-length" label="Supply pipe length" value={pipes.supplyLength} onChange={(v) => update("supplyLength", v)} max={LIMITS.length.max} suffix="m" decimals={1} />
        <NumberField
          id="dr-micro-length"
          label="Micro tube length"
          value={pipes.microLength}
          onChange={(v) => update("microLength", v)}
          max={LIMITS.length.max}
          suffix="m"
          decimals={1}
          hint="The 4 mm tube: all the drops to the drippers, added up."
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Results -- */

function Results({
  zones,
  result,
  schedule,
  pipes,
  price: waterPrice,
  money,
  active,
  onActive,
}: {
  zones: readonly Zone[];
  result: IrrigationResult;
  schedule: Schedule;
  pipes: Pipes;
  price: number;
  money: Money;
  active: number;
  onActive: (i: number) => void;
}) {
  const twice = schedule.waterings === 2;
  const runs: Run[] = result.zones.map((z, zone) => ({ zone, minutes: z.minutes * z.split }));
  const counted = runs.filter((r) => r.minutes > 0).length;
  const flows = [...new Set(zones.map((z) => z.lph))].sort((a, b) => b - a);
  const mainFlow = flows[0] ?? 4;
  const max = (lph: number) => (lph > 0 ? Math.floor(result.usable / lph + 1e-9) : 0);
  const other = mainFlow === 2 ? 4 : 2;

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-lilac">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label={twice ? "Run time each watering" : "Run time each morning"}
            value={durationText(result.minutes)}
            hint={
              counted === 0
                ? "Add some plants to see how long to water."
                : `${plural(counted, "zone")} one after another, ${clockText(schedule.start)} to ${clockText(schedule.start + result.minutes)}${twice ? `, again from ${clockText(schedule.second)}` : ""}`
            }
          />

          {counted > 0 && <RunSequence runs={runs} start={schedule.start} active={active} onActive={onActive} />}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label="Max drippers per zone" value={formatNumber(max(mainFlow), 0)} hint={`At ${formatNumber(mainFlow, 1)} L/h${other ? `, or ${formatNumber(max(other), 0)} at ${formatNumber(other, 1)} L/h` : ""}`} />
            <Stat label="Flow to design to" value={`${formatNumber(result.usable, 0)} L/h`} hint={`Of ${formatNumber(result.tap, 0)} L/h from the tap`} />
            <Stat label="Water a day" value={litres(result.daily)} hint={`${formatNumber(result.daily / 9, 1)} watering cans of 9 L`} />
            <Stat label="Water a week" value={litres(result.weekly)} hint={`${plural(schedule.days, "day")} a week`} />
            <Stat label="Cost a week" value={waterPrice > 0 ? price(result.weeklyCost, money) : "–"} hint={waterPrice > 0 ? `${price(result.weeklyCost * 13, money)} over a 13-week summer` : "Not on a meter"} />
            <Stat label="Pipes hold" value={litres(result.pipes.litres)} hint={`Flushed through in ${durationText(result.pipes.flushMinutes)}`} />
          </div>

          <ZoneTable zones={zones} result={result} active={active} onActive={onActive} />

          <FlushBox pipes={pipes} result={result} />

          <Notes zones={zones} result={result} />
        </CardContent>
      </Card>
    </div>
  );
}

function ZoneTable({ zones, result, active, onActive }: { zones: readonly Zone[]; result: IrrigationResult; active: number; onActive: (i: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[15px] font-bold">Zone by zone</p>
      <ul className="space-y-2">
        {zones.map((z, i) => {
          const r = result.zones[i];
          if (!r) return null;
          return (
            <li
              key={i}
              onPointerEnter={() => onActive(i)}
              className={cn("space-y-2 rounded-2xl border-[2.5px] border-foreground px-3 py-2.5", r.over ? "bg-pink" : "bg-card", active === i && !r.over && "ring-2 ring-foreground/40")}
            >
              <div className="flex items-center gap-2.5">
                <PlantIcon kind={z.kind} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">
                    Zone {i + 1}: {KIND_INFO[z.kind].label}
                  </p>
                  <p className="font-mono text-xs font-bold text-muted-foreground">
                    {r.drippers} of max {r.maxDrippers} drippers · {formatNumber(r.flow, 0)} L/h
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-lg font-extrabold text-numeric">{durationText(r.minutes)}</p>
                  <p className="font-mono text-xs font-bold text-muted-foreground">{litres(r.litres)}/day</p>
                </div>
              </div>
              <FlowGauge
                flow={r.flow}
                usable={result.usable}
                tap={result.tap}
                color={zoneColor(i)}
                label={`Zone ${i + 1} draws ${formatNumber(r.flow, 0)} of ${formatNumber(result.usable, 0)} L/h`}
              />
              {r.over && <p className="text-xs font-bold">More than the tap can run at once: split it into {r.split} zones.</p>}
            </li>
          );
        })}
      </ul>
      <p className="text-xs font-semibold text-muted-foreground">Bars show each zone&apos;s flow against the tap&apos;s; the hatched end is the spare you leave.</p>
    </div>
  );
}

function FlushBox({ pipes, result }: { pipes: Pipes; result: IrrigationResult }) {
  const p = result.pipes;
  return (
    <div className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
      <div className="flex items-center gap-3">
        <PipeEnds supplyId={PIPE_ID[pipes.supply]} microId={PIPE_ID.micro} className="h-10 w-auto" />
        <div className="min-w-0">
          <p className="text-[15px] font-bold">Flushing the pipes</p>
          <p className="font-mono text-xs font-bold text-muted-foreground">
            {litres(p.supplyLitres)} in the supply pipe + {litres(p.microLitres)} in micro tube
          </p>
        </div>
      </div>
      <p className="text-sm font-semibold">
        With the end caps off, your tap pushes the pipes&apos; {litres(p.litres)} through in {durationText(p.flushMinutes)}. Keep it running until the water comes out clear: a minute or two.
      </p>
      <p className="text-xs font-semibold text-muted-foreground">
        Flushing needs water moving at {FLUSH_SPEED} m/s or more to lift grit;{" "}
        {p.flushRatio >= 1 ? `your tap gives ${formatNumber(p.flushRatio, 1)} times the flow that takes in this pipe.` : "your tap is too slow to manage that in this pipe: flush one line at a time."} Do it at the start of
        the season and every 2–3 weeks while it runs.
      </p>
    </div>
  );
}

/** At most two notes, most important first. */
function Notes({ zones, result }: { zones: readonly Zone[]; result: IrrigationResult }) {
  const notes: Note[] = [];
  const over = result.zones.map((z, i) => ({ z, i })).filter(({ z }) => z.over);
  if (over.length > 0) {
    notes.push({
      tone: "warn",
      text: `${over.map(({ i }) => `Zone ${i + 1}`).join(" and ")} ${over.length > 1 ? "draw" : "draws"} more than ${formatNumber(result.usable, 0)} L/h: the far drippers would starve. Split into smaller zones, or use lower-flow drippers and run longer.`,
    });
  }
  if (result.tap > 0 && result.tap / 60 < LOW_FLOW_LPM) {
    notes.push({
      tone: "warn",
      text: `${formatNumber(result.tap / 60, 1)} L/min is slow: water companies aim for at least ${LOW_FLOW_LPM} L/min. Check the tap is fully open and the reducer's filter is clean, or ask your water company to test the pressure.`,
    });
  }
  const longest = result.zones.findIndex((z) => z.minutes > 60);
  const long = result.zones[longest];
  const longZone = zones[longest];
  if (long && longZone) {
    notes.push({
      tone: "info",
      text: `Zone ${longest + 1} runs for ${durationText(long.minutes)}: add a dripper per ${KIND_INFO[longZone.kind].unit} or use bigger ones to shorten it.`,
    });
  }
  if (result.minutes > 0 && notes.length === 0) {
    notes.push({ tone: "info", text: "These are summer amounts. Cut the run time in spring and autumn, and skip a day after heavy rain (pots under cover still need watering)." });
  }
  return <NoteList notes={notes} />;
}
