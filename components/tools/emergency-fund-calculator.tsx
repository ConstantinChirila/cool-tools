"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { NumericInput } from "@/components/calc/numeric-input";
import { PillButton } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { GrowthChart } from "@/components/charts/growth-chart";
import { useCurrency } from "@/hooks/use-currency";
import { useToday } from "@/hooks/use-today";
import { MONEY_RANGE, useUrlState, urlField, type UrlField } from "@/hooks/use-url-state";
import {
  DEFAULT_EXPENSES,
  EXPENSE_INFO,
  EXPENSE_KEYS,
  INCOME_INFO,
  JSA,
  MAX_INCOME_LINES,
  MAX_MONTHS_INPUT,
  UC_CAPITAL,
  durationParts,
  encodeIncome,
  formatDuration,
  incomeIn,
  parseIncome,
  runOutDate,
  runway,
  spendingTotals,
  target,
  ucCapitalDeduction,
  type Expense,
  type ExpenseKey,
  type Expenses,
  type IncomeKind,
  type IncomeLine,
  type Runway,
  type SpendingTotals,
  type Target,
} from "@/lib/emergency-fund";
import { clamp, cn } from "@/lib/utils";

const DEFAULT_SAVINGS = 5_000;
const DEFAULT_TARGET = 6;
const DEFAULT_SAVING = 200;
const TARGET_OPTIONS = [3, 6, 9, 12].map((n) => ({ value: String(n), label: `${n} months` }));
const STRIP_MONTHS = 12;

/** Where a new line starts: a round figure to type over. */
const NEW_LINE: Record<IncomeKind, IncomeLine> = {
  redundancy: { kind: "redundancy", amount: 3_000, months: 0 },
  partner: { kind: "partner", amount: 800, months: 0 },
  side: { kind: "side", amount: 300, months: 0 },
  jsa: { kind: "jsa", amount: JSA.over25, months: 0 },
  lump: { kind: "lump", amount: 1_000, months: 0 },
  monthly: { kind: "monthly", amount: 300, months: 0 },
};
const ADD_LABELS: Record<IncomeKind, string> = {
  redundancy: "Redundancy or notice pay",
  partner: "Partner",
  side: "Side income",
  jsa: "New Style JSA",
  lump: "Other one-off",
  monthly: "Other monthly",
};

const COLORS = { essential: "var(--chart-4)", everything: "var(--chart-5)" };

type Money = (v: number, decimals?: number) => string;
type IncomeRow = IncomeLine & { id: number };

/** Ids only need to be unique within the list; index-based so server and client agree. */
const withIds = (lines: IncomeLine[]): IncomeRow[] => lines.map((line, id) => ({ ...line, id }));
const stripIds = (rows: IncomeRow[]): IncomeLine[] => rows.map(({ kind, amount, months }) => ({ kind, amount, months }));
const nextId = (rows: IncomeRow[]) => rows.reduce((max, r) => Math.max(max, r.id), -1) + 1;

const dateText = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const monthText = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

export function EmergencyFundCalculator() {
  const { code, currency, setCurrency, money, axis, currencyField } = useCurrency();
  const [savings, setSavings] = React.useState(DEFAULT_SAVINGS);
  const [expenses, setExpenses] = React.useState<Expenses>(DEFAULT_EXPENSES);
  const [rows, setRows] = React.useState<IncomeRow[]>([]);
  const [targetMonths, setTargetMonths] = React.useState(DEFAULT_TARGET);
  const [saving, setSaving] = React.useState(DEFAULT_SAVING);
  const today = useToday();

  const setExpense = (key: ExpenseKey, patch: Partial<Expense>) =>
    setExpenses((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const expenseFields: Record<string, UrlField> = {};
  for (const key of EXPENSE_KEYS) {
    const { amount, essential } = expenses[key];
    expenseFields[key] = urlField(amount, (v: number) => setExpense(key, { amount: v }), DEFAULT_EXPENSES[key].amount, undefined, MONEY_RANGE);
    expenseFields[`${key}-essential`] = urlField(essential, (v: boolean) => setExpense(key, { essential: v }), DEFAULT_EXPENSES[key].essential);
  }

  const income = stripIds(rows);
  useUrlState({
    savings: urlField(savings, setSavings, DEFAULT_SAVINGS, undefined, MONEY_RANGE),
    ...expenseFields,
    income: urlField(encodeIncome(income), (v: string) => {
      const parsed = parseIncome(v);
      if (parsed.ok) setRows(withIds(parsed.value));
    }, ""),
    goal: urlField(targetMonths, setTargetMonths, DEFAULT_TARGET, undefined, { min: 1, max: 24 }),
    save: urlField(saving, setSaving, DEFAULT_SAVING, undefined, MONEY_RANGE),
    currency: currencyField,
  });

  const totals = spendingTotals(expenses);
  const bare = runway(savings, totals.essential, income, 0);
  const normal = runway(savings, totals.total, income, 0);
  const horizon = clamp(Math.ceil(Math.max(bare.months ?? 0, normal.months ?? 0, targetMonths)) + 2, 12, 60);
  const chart = {
    bare: runway(savings, totals.essential, income, horizon),
    normal: runway(savings, totals.total, income, horizon),
  };
  const goal = target(targetMonths, totals.essential, savings, saving, income);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[6fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your money</CardTitle>
            <CurrencySelect value={code} onChange={setCurrency} />
          </CardHeader>
          <CardContent className="space-y-8">
            <SliderField
              id="ef-savings"
              label="Emergency savings"
              value={savings}
              onChange={setSavings}
              min={0}
              max={50_000}
              inputMax={MONEY_RANGE.max}
              step={50}
              sliderStep={250}
              prefix={currency.symbol}
              grouped
              decimals={0}
            />
            <SpendingList expenses={expenses} setExpense={setExpense} totals={totals} money={money} symbol={currency.symbol} />
            <IncomeList rows={rows} onChange={setRows} symbol={currency.symbol} money={money} gbp={code === "GBP"} />
            <section className="space-y-4" aria-labelledby="ef-goal">
              <h3 id="ef-goal" className="text-[15px] font-bold">
                Your safety net goal
              </h3>
              <Segmented
                label="Months of essential spending to aim for"
                size="sm"
                value={String(targetMonths)}
                onChange={(v) => setTargetMonths(Number(v))}
                options={TARGET_OPTIONS}
              />
              <SliderField
                id="ef-saving"
                label="You can put away each month"
                value={saving}
                onChange={setSaving}
                min={0}
                max={2_000}
                inputMax={MONEY_RANGE.max}
                step={5}
                sliderStep={25}
                prefix={currency.symbol}
                grouped
                decimals={0}
              />
            </section>
          </CardContent>
        </Card>

        <Results
          bare={bare}
          normal={normal}
          totals={totals}
          goal={goal}
          targetMonths={targetMonths}
          savings={savings}
          saving={saving}
          hasIncome={income.length > 0}
          gbp={code === "GBP"}
          today={today}
          money={money}
        />
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Savings left, month by month</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <GrowthChart
            series={[
              ...(totals.cuttable > 0 ? [{ name: "Normal spending", color: COLORS.everything, values: chart.normal.balances }] : []),
              { name: totals.cuttable > 0 ? "Essentials only" : "Your spending", color: COLORS.essential, values: chart.bare.balances, area: true },
            ]}
            xLabel={(i) => (i === 0 ? "Today" : today ? monthText(runOutDate(today, i)) : `After ${i} months`)}
            xTick={(i) => (i === 0 ? "0" : `${i}m`)}
            formatValue={(v) => money(v)}
            formatAxis={axis}
            extraRow={income.length > 0 ? (i) => (i === 0 ? null : { name: "Coming in", value: money(incomeIn(income, i)) }) : undefined}
          />
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Savings plus any one-off money on day one, less each month&apos;s spending and whatever is still coming in.
            Interest and price rises are left out.
          </p>
        </CardContent>
      </Card>

      <MobileResultBar
        label="Money lasts"
        value={bare.months === null ? "For good" : formatDuration(bare.months)}
      />
    </>
  );
}

/* ----------------------------------------------------------- Spending -- */

function SpendingList({
  expenses,
  setExpense,
  totals,
  money,
  symbol,
}: {
  expenses: Expenses;
  setExpense: (key: ExpenseKey, patch: Partial<Expense>) => void;
  totals: SpendingTotals;
  money: Money;
  symbol: string;
}) {
  return (
    <section className="space-y-3" aria-labelledby="ef-spending">
      <div>
        <h3 id="ef-spending" className="text-[15px] font-bold">
          Monthly spending
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Mark what you could stop paying for if money got tight.
        </p>
      </div>
      <ul className="divide-y divide-foreground/15 rounded-2xl border-[2.5px] border-foreground bg-card px-3.5">
        {EXPENSE_KEYS.map((key) => {
          const { label, hint } = EXPENSE_INFO[key];
          const { amount, essential } = expenses[key];
          const id = `ef-exp-${key}`;
          return (
            <li key={key} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={id} className="block text-[15px] leading-tight font-bold">
                  {label}
                </label>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button
                    type="button"
                    onClick={() => setExpense(key, { essential: !essential })}
                    aria-label={`${label}: ${essential ? "essential" : "can cut"}`}
                    className={cn(
                      "h-6 rounded-full border-2 border-foreground px-2 text-xs font-bold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                      essential ? "bg-foreground text-background" : "border-dashed bg-card text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {essential ? "Essential" : "Can cut"}
                  </button>
                  {hint && <span className="text-xs font-semibold text-muted-foreground">{hint}</span>}
                </div>
              </div>
              <NumericInput
                id={id}
                value={amount}
                onChange={(v) => setExpense(key, { amount: v })}
                max={MONEY_RANGE.max}
                prefix={symbol}
                grouped
                decimals={0}
                blankZero
                placeholder="0"
                className="w-28 shrink-0 sm:w-32"
                inputClassName="w-full"
              />
            </li>
          );
        })}
      </ul>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Total label="Essentials" value={money(totals.essential)} tone="bg-foreground text-background" />
        <Total label="Can cut" value={money(totals.cuttable)} tone="border-2 border-dashed border-foreground" />
        <Total label="Total" value={money(totals.total)} tone="bg-secondary" />
      </dl>
    </section>
  );
}

function Total({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-xl px-2 py-2", tone)}>
      <dt className="text-xs font-bold">{label}</dt>
      <dd className="font-mono text-sm font-bold text-numeric">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------- Income -- */

function IncomeList({
  rows,
  onChange,
  symbol,
  money,
  gbp,
}: {
  rows: IncomeRow[];
  onChange: (rows: IncomeRow[]) => void;
  symbol: string;
  money: Money;
  gbp: boolean;
}) {
  const set = (id: number, line: IncomeLine) => onChange(rows.map((r) => (r.id === id ? { ...line, id } : r)));
  const full = rows.length >= MAX_INCOME_LINES;
  const hasJsa = rows.some((r) => r.kind === "jsa");
  const kinds = (Object.keys(ADD_LABELS) as IncomeKind[]).filter((k) => k !== "jsa" || (gbp && !hasJsa));

  return (
    <section className="space-y-3" aria-labelledby="ef-income">
      <div>
        <h3 id="ef-income" className="text-[15px] font-bold">
          Money still coming in if your pay stops
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Only what would carry on without your job, after tax. Leave it empty to see savings alone.
        </p>
      </div>
      {rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((row) => (
            <IncomeItem
              key={row.id}
              row={row}
              symbol={symbol}
              money={money}
              onChange={(line) => set(row.id, line)}
              onRemove={() => onChange(rows.filter((r) => r.id !== row.id))}
            />
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {kinds.map((kind) => (
          <PillButton key={kind} onClick={() => onChange([...rows, { ...NEW_LINE[kind], id: nextId(rows) }])} disabled={full}>
            <Plus className="size-4" /> {ADD_LABELS[kind]}
          </PillButton>
        ))}
      </div>
    </section>
  );
}

function IncomeItem({
  row,
  symbol,
  money,
  onChange,
  onRemove,
}: {
  row: IncomeRow;
  symbol: string;
  money: Money;
  onChange: (line: IncomeLine) => void;
  onRemove: () => void;
}) {
  const { label, type } = INCOME_INFO[row.kind];
  const id = `ef-inc-${row.id}`;

  return (
    <li className="space-y-3 rounded-2xl border-[2.5px] border-foreground bg-card p-3">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[15px] font-bold">{label}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="flex size-9 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </div>
      {type === "lump" && (
        <NumberField
          id={`${id}-amount`}
          label="Amount"
          value={row.amount}
          onChange={(amount) => onChange({ ...row, amount })}
          max={MONEY_RANGE.max}
          prefix={symbol}
          grouped
          decimals={0}
          hint="Arrives on day one"
        />
      )}
      {type === "monthly" && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id={`${id}-amount`}
            label="A month"
            value={row.amount}
            onChange={(amount) => onChange({ ...row, amount })}
            max={MONEY_RANGE.max}
            prefix={symbol}
            grouped
            decimals={0}
          />
          <NumberField
            id={`${id}-months`}
            label="For"
            value={row.months}
            onChange={(months) => onChange({ ...row, months })}
            max={MAX_MONTHS_INPUT}
            decimals={0}
            suffix="months"
            placeholder="Ongoing"
            hint="Blank if it carries on"
          />
        </div>
      )}
      {type === "weekly" && (
        <>
          <Segmented
            label="Your age"
            size="sm"
            value={row.amount === JSA.under25 ? "under25" : "over25"}
            onChange={(age) => onChange({ ...row, amount: JSA[age] })}
            options={[
              { value: "under25", label: "Under 25" },
              { value: "over25", label: "25 or over" },
            ]}
          />
          <p className="text-xs font-semibold text-muted-foreground">
            {money(row.amount, 2)} a week (about {money((row.amount * 52) / 12)} a month) for up to {JSA.months} months,{" "}
            {JSA.taxYear} rates. Savings and a partner&apos;s income don&apos;t affect it, but you need enough Class 1
            National Insurance from recent years, and pension income can reduce it.
          </p>
        </>
      )}
    </li>
  );
}

/* ------------------------------------------------------------ Results -- */

function Results({
  bare,
  normal,
  totals,
  goal,
  targetMonths,
  savings,
  saving,
  hasIncome,
  gbp,
  today,
  money,
}: {
  bare: Runway;
  normal: Runway;
  totals: SpendingTotals;
  goal: Target;
  targetMonths: number;
  savings: number;
  saving: number;
  hasIncome: boolean;
  gbp: boolean;
  today: Date | null;
  money: Money;
}) {
  const canCut = totals.cuttable > 0;
  const until = (r: Runway) => (r.months !== null && today ? `, until about ${dateText(runOutDate(today, r.months))}` : "");
  const extra = bare.months === null || normal.months === null ? null : bare.months - normal.months;
  const uc = ucCapitalDeduction(savings);

  return (
    <div className="order-first min-w-0 lg:order-none lg:sticky lg:top-20">
      <Card className="min-w-0 bg-mint">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-1.5">
            <p className="text-base font-bold">{canCut ? "Cutting back to essentials, your money lasts" : "Your money lasts"}</p>
            <DurationHero months={bare.months} />
            <p className="text-sm font-semibold text-muted-foreground">
              {bare.months === null
                ? hasIncome
                  ? "The money still coming in covers your essentials."
                  : "More than 50 years at this spending."
                : `if your pay stopped today${until(bare)}.`}
            </p>
          </div>

          {canCut && (
            <p className="rounded-xl border-2 border-foreground bg-card px-3.5 py-2.5 text-sm font-semibold">
              At your normal spending:{" "}
              <span className="font-bold">{normal.months === null ? "for good" : formatDuration(normal.months)}</span>
              <span className="text-muted-foreground">{until(normal)}</span>
              {extra !== null && extra > 0 && (
                <>
                  . Cutting {money(totals.cuttable)} a month buys you{" "}
                  <span className="font-bold">{formatDuration(extra)}</span> more.
                </>
              )}
            </p>
          )}

          <RunwayStrip bare={bare} normal={canCut ? normal : null} targetMonths={targetMonths} today={today} />

          <GoalProgress goal={goal} targetMonths={targetMonths} savings={savings} saving={saving} hasIncome={hasIncome} today={today} money={money} />

          {gbp && savings > UC_CAPITAL.lower && (
            <Callout>
              {uc === null
                ? `Universal Credit isn't paid while you have more than ${money(UC_CAPITAL.upper)} in savings, so you'd live on them until they dropped below that.`
                : `Universal Credit ignores the first ${money(UC_CAPITAL.lower)} of savings. With ${money(savings)} it would be about ${money(uc, 2)} a month lower, less as the savings go down.`}{" "}
              New Style JSA ignores savings altogether.
            </Callout>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DurationHero({ months }: { months: number | null }) {
  if (months === null) {
    return <p className="font-heading text-5xl font-black tracking-tighter sm:text-6xl">For good</p>;
  }
  return (
    <p className="flex flex-wrap items-baseline gap-x-4 font-heading font-black tracking-tighter">
      {durationParts(months).map((part) => (
        <span key={part.unit}>
          <span className="text-6xl sm:text-7xl">{part.value}</span>{" "}
          <span className="text-2xl tracking-tight sm:text-3xl">{part.unit}</span>
        </span>
      ))}
    </p>
  );
}

/** Twelve month boxes per spending level, filled for the part of each month the money covers. */
function RunwayStrip({
  bare,
  normal,
  targetMonths,
  today,
}: {
  bare: Runway;
  normal: Runway | null;
  targetMonths: number;
  today: Date | null;
}) {
  const rows = [
    ...(normal ? [{ name: "Normal", runway: normal, color: COLORS.everything }] : []),
    { name: normal ? "Essentials" : "Spending", runway: bare, color: COLORS.essential },
  ];
  const months = Array.from({ length: STRIP_MONTHS }, (_, i) => i);
  const goalInStrip = targetMonths <= STRIP_MONTHS;

  return (
    <figure className="space-y-2" aria-label="Months covered over the next year">
      <div className="grid grid-cols-[4.5rem_1fr] items-end gap-x-2">
        <span />
        <div className="grid grid-cols-12 gap-0.5 pb-0.5" aria-hidden>
          {months.map((i) => (
            <span key={i} className="text-center font-mono text-[10px] font-bold text-muted-foreground">
              {today ? runOutDate(today, i).toLocaleDateString("en-GB", { month: "narrow" }) : i + 1}
            </span>
          ))}
        </div>
      </div>
      {rows.map(({ name, runway: r, color }) => (
          <div key={name} className="grid grid-cols-[4.5rem_1fr] items-center gap-x-2">
            <span className="text-xs font-bold">{name}</span>
            <div className="relative">
              <div className="grid grid-cols-12 gap-0.5" aria-hidden>
                {months.map((i) => {
                  const fill = r.months === null ? 1 : clamp(r.months - i, 0, 1);
                  return (
                    <span key={i} className="relative h-6 overflow-hidden rounded-[5px] border-2 border-foreground bg-card">
                      <span className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, background: color }} />
                    </span>
                  );
                })}
              </div>
              {goalInStrip && (
                <span
                  className="absolute -inset-y-1 w-0 border-l-2 border-dashed border-foreground"
                  style={{ left: `calc(${(targetMonths / STRIP_MONTHS) * 100}% - 1px)` }}
                  aria-hidden
                />
              )}
            </div>
            <span className="sr-only">
              {r.months === null ? "Covered for good" : `Covered for ${formatDuration(r.months)}`}
            </span>
          </div>
      ))}
      <figcaption className="flex flex-wrap justify-between gap-x-3 gap-y-1 pl-[5rem] text-xs font-semibold text-muted-foreground">
        {goalInStrip && <span>┊ Goal: {targetMonths} months</span>}
        {bare.months === null ? (
          <span>Covered beyond the year</span>
        ) : (
          bare.months > STRIP_MONTHS && <span>+ {formatDuration(bare.months - STRIP_MONTHS)} beyond the year</span>
        )}
      </figcaption>
    </figure>
  );
}

function GoalProgress({
  goal,
  targetMonths,
  savings,
  saving,
  hasIncome,
  today,
  money,
}: {
  goal: Target;
  targetMonths: number;
  savings: number;
  saving: number;
  hasIncome: boolean;
  today: Date | null;
  money: Money;
}) {
  const pct = Math.round(goal.progress * 100);
  return (
    <div className="space-y-2.5 rounded-2xl border-[2.5px] border-foreground bg-card p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-bold">Goal: {targetMonths} months of essentials</p>
        <p className="font-mono text-sm font-bold text-numeric">{money(goal.amount)}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Savings towards your goal"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-4 overflow-hidden rounded-full border-2 border-foreground bg-secondary"
      >
        <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm font-semibold">
        {money(savings)} saved, {pct}%.{" "}
        {goal.gap === 0 ? (
          goal.over > 0 ? (
            <>You&apos;re {money(goal.over)} past your goal.</>
          ) : (
            <>Goal reached.</>
          )
        ) : goal.monthsToGo === null ? (
          <>{money(goal.gap)} to go: add what you can put away each month to see when you&apos;d get there.</>
        ) : (
          <>
            {money(goal.gap)} to go. At {money(saving)} a month that&apos;s{" "}
            <span className="font-bold">{formatDuration(goal.monthsToGo)}</span>
            {today ? ` (${monthText(runOutDate(today, goal.monthsToGo))})` : ""}.
          </>
        )}
      </p>
      {hasIncome && goal.withIncome !== goal.amount && (
        <p className="text-xs font-semibold text-muted-foreground">
          Counting the money still coming in, {money(goal.withIncome)} would cover {targetMonths} months of essentials.
        </p>
      )}
    </div>
  );
}
