"use client";

import * as React from "react";
import { CalendarClock, Gauge, KeyRound, Landmark, Receipt, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { PillButton, TogglePill } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, PERCENT_RANGE, useUrlState, urlField, type NumberRange } from "@/hooks/use-url-state";
import {
  FINANCE_INFO,
  FINANCE_KINDS,
  MAX_TERM_MONTHS,
  basisValue,
  breakdownLines,
  carValueAtEnd,
  compareFinance,
  defaultGmfvPct,
  defaultResalePct,
  excessMileageCharge,
  mileageValueLoss,
  type CarFinanceInput,
  type CompareBasis,
  type FinanceComparison,
  type FinanceKind,
  type FinanceResult,
  type Line,
  type PcpEnd,
} from "@/lib/car-finance";
import { DEFAULT_CURRENCY, currencies } from "@/lib/currency";
import { cn } from "@/lib/utils";

const DEFAULT_INPUT: CarFinanceInput = {
  price: 25_000,
  deposit: 2_500,
  dealerContribution: 0,
  termMonths: 36,
  apr: 9.9,
  loanApr: 6.5,
  // Replaced by the term's estimate while the auto flags are on.
  resalePct: defaultResalePct(36),
  gmfvPct: defaultGmfvPct(36),
  pcpEnd: "handBack",
  adminFee: 0,
  optionFee: 10,
  leaseMonthly: 349,
  leaseInitial: 6,
  leaseFee: 250,
  milesPerYear: 10_000,
  mileageAllowance: 10_000,
  excessPerMile: 0.1,
};

const TERM_RANGE: NumberRange = { min: 12, max: MAX_TERM_MONTHS };
const TERM_PRESETS = [24, 36, 48, 60];
const APR_RANGE: NumberRange = { min: 0, max: 50 };
const MILES_RANGE: NumberRange = { min: 0, max: 100_000 };
const INITIAL_OPTIONS = ["1", "3", "6", "9", "12"].map((value) => ({ value, label: `${value}×` }));
const BASIS_OPTIONS: { value: CompareBasis; label: string }[] = [
  { value: "net", label: "Real cost" },
  { value: "total", label: "Total paid" },
];
const PCP_END_OPTIONS: { value: PcpEnd; label: string }[] = [
  { value: "handBack", label: "Hand back or sell" },
  { value: "keep", label: "Pay the balloon" },
];
const VIEW_OPTIONS = FINANCE_KINDS.map((value) => ({ value, label: FINANCE_INFO[value].short }));

const COLORS: Record<FinanceKind, string> = {
  pcp: "var(--chart-1)",
  hp: "var(--chart-4)",
  loan: "var(--chart-2)",
  lease: "var(--chart-5)",
};

type Money = (v: number, decimals?: number) => string;
type Update = <K extends keyof CarFinanceInput>(key: K, value: CarFinanceInput[K]) => void;
/** The CarFinanceInput fields that hold numbers, so the URL binding needs no casts. */
type NumericKey = { [K in keyof CarFinanceInput]: CarFinanceInput[K] extends number ? K : never }[keyof CarFinanceInput];

const months = (n: number) => `${n} ${n === 1 ? "month" : "months"}`;

export function CarFinanceCalculator() {
  const { code, currency, setCurrency, money, axis } = useCurrency();
  const [input, setInput] = React.useState<CarFinanceInput>(DEFAULT_INPUT);
  const [basis, setBasis] = React.useState<CompareBasis>("net");
  const [view, setView] = React.useState<FinanceKind>("pcp");
  // Until you type your own figures, the car's value and the GMFV follow the term.
  const [autoResale, setAutoResale] = React.useState(true);
  const [autoGmfv, setAutoGmfv] = React.useState(true);

  const update: Update = (key, value) => setInput((prev) => ({ ...prev, [key]: value }));

  const num = (key: NumericKey, urlKey: string, range: NumberRange) => ({
    [urlKey]: urlField(input[key], (v: number) => update(key, v), DEFAULT_INPUT[key], undefined, range),
  });

  useUrlState({
    ...num("price", "price", MONEY_RANGE),
    ...num("deposit", "deposit", MONEY_RANGE),
    ...num("dealerContribution", "contribution", MONEY_RANGE),
    ...num("termMonths", "term", TERM_RANGE),
    ...num("apr", "apr", APR_RANGE),
    ...num("loanApr", "loanApr", APR_RANGE),
    ...num("resalePct", "resale", PERCENT_RANGE),
    ...num("gmfvPct", "gmfv", PERCENT_RANGE),
    ...num("adminFee", "admin", MONEY_RANGE),
    ...num("optionFee", "option", MONEY_RANGE),
    ...num("leaseMonthly", "lease", MONEY_RANGE),
    ...num("leaseInitial", "initial", { min: 1, max: 12 }),
    ...num("leaseFee", "leaseFee", MONEY_RANGE),
    ...num("milesPerYear", "miles", MILES_RANGE),
    ...num("mileageAllowance", "allowance", MILES_RANGE),
    ...num("excessPerMile", "excess", { min: 0, max: 10 }),
    end: urlField(input.pcpEnd, (v: string) => update("pcpEnd", v as PcpEnd), "handBack", ["handBack", "keep"]),
    compare: urlField(basis, (v: string) => setBasis(v as CompareBasis), "net", BASIS_OPTIONS.map((o) => o.value)),
    view: urlField(view, (v: string) => setView(v as FinanceKind), "pcp", FINANCE_KINDS),
    autoResale: urlField(autoResale, setAutoResale, true),
    autoGmfv: urlField(autoGmfv, setAutoGmfv, true),
    currency: urlField(code, setCurrency, DEFAULT_CURRENCY, currencies.map((c) => c.code)),
  });

  const effective: CarFinanceInput = {
    ...input,
    resalePct: autoResale ? defaultResalePct(input.termMonths) : input.resalePct,
    gmfvPct: autoGmfv ? defaultGmfvPct(input.termMonths) : input.gmfvPct,
  };
  const comparison = compareFinance(effective, basis);
  const best = comparison.results[comparison.best];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        <CarInputs
          input={effective}
          update={update}
          money={money}
          symbol={currency.symbol}
          code={code}
          onCurrencyChange={setCurrency}
          autoResale={autoResale}
          onAutoResaleChange={setAutoResale}
          autoGmfv={autoGmfv}
          onAutoGmfvChange={setAutoGmfv}
        />
        <CarResults
          input={effective}
          comparison={comparison}
          basis={basis}
          onBasisChange={setBasis}
          money={money}
        />
      </div>
      <Breakdown input={effective} results={comparison.results} view={view} onViewChange={setView} money={money} />
      <PaidChart input={effective} results={comparison.results} money={money} axis={axis} />
      <MobileResultBar
        label={`Cheapest: ${FINANCE_INFO[comparison.best].short}`}
        value={money(basisValue(best, basis))}
      />
    </>
  );
}

function CarInputs({
  input,
  update,
  money,
  symbol,
  code,
  onCurrencyChange,
  autoResale,
  onAutoResaleChange,
  autoGmfv,
  onAutoGmfvChange,
}: {
  input: CarFinanceInput;
  update: Update;
  money: Money;
  symbol: string;
  code: string;
  onCurrencyChange: (code: string) => void;
  autoResale: boolean;
  onAutoResaleChange: (auto: boolean) => void;
  autoGmfv: boolean;
  onAutoGmfvChange: (auto: boolean) => void;
}) {
  const sections = useSectionState([]);
  const loanBorrowed = Math.max(0, input.price - input.deposit);
  const dealerBorrowed = Math.max(0, loanBorrowed - input.dealerContribution);
  const baseValue = (input.price * input.resalePct) / 100;
  const carValue = carValueAtEnd(input);
  const mileageLoss = mileageValueLoss(input);
  const balloon = (input.price * input.gmfvPct) / 100;
  const excess = excessMileageCharge(input);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Your car</CardTitle>
        <CurrencySelect value={code} onChange={onCurrencyChange} />
      </CardHeader>
      <CardContent className="space-y-6">
        <SliderField
          id="car-price"
          label="Car price"
          value={input.price}
          onChange={(v) => update("price", v)}
          min={0}
          max={100_000}
          step={100}
          sliderStep={500}
          prefix={symbol}
          grouped
          decimals={0}
        />
        <SliderField
          id="car-deposit"
          label="Deposit or part-exchange"
          value={input.deposit}
          onChange={(v) => update("deposit", v)}
          min={0}
          max={Math.max(input.price, 1_000)}
          step={50}
          sliderStep={250}
          prefix={symbol}
          grouped
          decimals={0}
        />
        <div className="space-y-3">
          <SliderField
            id="car-term"
            label="Term"
            value={input.termMonths}
            onChange={(v) => update("termMonths", v)}
            min={TERM_RANGE.min}
            max={TERM_RANGE.max}
            step={1}
            suffix="months"
            decimals={0}
          />
          <div className="flex gap-2">
            {TERM_PRESETS.map((preset) => (
              <TogglePill
                key={preset}
                pressed={input.termMonths === preset}
                onPressedChange={() => update("termMonths", preset)}
                className="flex-1 justify-center"
              >
                {preset / 12} yrs
              </TogglePill>
            ))}
          </div>
        </div>
        <SliderField
          id="car-apr"
          label="Dealer finance APR (HP and PCP)"
          value={input.apr}
          onChange={(v) => update("apr", v)}
          min={0}
          max={25}
          step={0.1}
          sliderStep={0.1}
          suffix="%"
          decimals={1}
        />
        <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-semibold">
          Borrowing <span className="font-bold">{money(dealerBorrowed)}</span>
          {dealerBorrowed !== loanBorrowed && (
            <>
              {" "}
              on HP and PCP, <span className="font-bold">{money(loanBorrowed)}</span> on a loan
            </>
          )}
          <span className="text-muted-foreground">
            {" "}
            · worth about {money(carValue)} after {months(input.termMonths)}
          </span>
        </p>

        <div className="space-y-2.5">
          <Section
            icon={CalendarClock}
            title="PCP balloon"
            summary={`${money(balloon)} (${input.gmfvPct}%) · ${input.pcpEnd === "keep" ? "paid to keep the car" : "hand back or sell"}`}
            active={!autoGmfv || input.pcpEnd === "keep"}
            open={sections.isOpen("pcp")}
            onToggle={() => sections.toggle("pcp")}
          >
            <NumberField
              id="gmfv"
              label="Optional final payment (GMFV), % of price"
              value={input.gmfvPct}
              onChange={(v) => {
                // Blur commits even when nothing changed: only a new figure stops the estimate.
                if (v === input.gmfvPct) return;
                onAutoGmfvChange(false);
                update("gmfvPct", v);
              }}
              max={100}
              decimals={1}
              suffix="%"
              hint={autoGmfv ? "Estimated from the term" : `${money(balloon)} on this car`}
            />
            <PillButton onClick={() => onAutoGmfvChange(true)} disabled={autoGmfv}>
              Use the estimate
            </PillButton>
            <Segmented
              label="At the end of the PCP"
              value={input.pcpEnd}
              onChange={(v) => update("pcpEnd", v)}
              options={PCP_END_OPTIONS}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              The lender sets the GMFV. Copy it from your quote as a percentage of the cash price: a{" "}
              {money(balloon)} balloon on a {money(input.price)} car is {input.gmfvPct}%.
            </p>
          </Section>

          <Section
            icon={TrendingDown}
            title="Car's value at the end"
            summary={
              mileageLoss > 0
                ? `${money(carValue)} after extra miles`
                : `${money(carValue)} (${input.resalePct}%)${autoResale ? ", estimated" : ""}`
            }
            active={!autoResale}
            open={sections.isOpen("resale")}
            onToggle={() => sections.toggle("resale")}
          >
            <NumberField
              id="resale"
              label={`Worth after ${months(input.termMonths)}, % of price`}
              value={input.resalePct}
              onChange={(v) => {
                if (v === input.resalePct) return;
                onAutoResaleChange(false);
                update("resalePct", v);
              }}
              max={100}
              decimals={1}
              suffix="%"
              hint={autoResale ? "20% off a year, a rule of thumb" : `${money(baseValue)} on this car`}
            />
            <PillButton onClick={() => onAutoResaleChange(true)} disabled={autoResale}>
              Use the estimate
            </PillButton>
            <p className="text-xs font-semibold text-muted-foreground">
              What you could sell the car for when the finance ends. It is taken off the cost of the options
              that leave you owning the car, and decides whether a PCP has equity to hand back.
            </p>
          </Section>

          <Section
            icon={KeyRound}
            title="Lease quote"
            summary={`${money(input.leaseMonthly)} a month · ${input.leaseInitial}× up front`}
            active={false}
            open={sections.isOpen("lease")}
            onToggle={() => sections.toggle("lease")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="lease-monthly"
                label="Monthly rental"
                value={input.leaseMonthly}
                onChange={(v) => update("leaseMonthly", v)}
                max={MONEY_RANGE.max}
                prefix={symbol}
                grouped
              />
              <NumberField
                id="lease-fee"
                label="Processing fee"
                value={input.leaseFee}
                onChange={(v) => update("leaseFee", v)}
                max={MONEY_RANGE.max}
                prefix={symbol}
                grouped
              />
            </div>
            <Segmented
              label="Initial rental (months up front)"
              size="sm"
              value={String(input.leaseInitial)}
              onChange={(v) => update("leaseInitial", Number(v))}
              options={INITIAL_OPTIONS}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              A lease price comes from the leasing company, not from an interest rate, so enter a real quote
              for this car and term. &ldquo;{input.leaseInitial}+{input.termMonths - 1}&rdquo; means{" "}
              {input.leaseInitial} rentals up front, then {input.termMonths - 1} monthly.
            </p>
          </Section>

          <Section
            icon={Landmark}
            title="Personal loan"
            summary={`${input.loanApr}% APR`}
            active={false}
            open={sections.isOpen("loan")}
            onToggle={() => sections.toggle("loan")}
          >
            <NumberField
              id="loan-apr"
              label="Loan APR"
              value={input.loanApr}
              onChange={(v) => update("loanApr", v)}
              max={APR_RANGE.max}
              decimals={2}
              suffix="%"
              hint="Best buys are cheapest for £7,500 to £25,000"
            />
          </Section>

          <Section
            icon={Receipt}
            title="Dealer offers and fees"
            summary={
              input.dealerContribution > 0
                ? `${money(input.dealerContribution)} deposit contribution · ${money(input.adminFee)} admin`
                : `${money(input.adminFee)} admin · ${money(input.optionFee)} option to purchase`
            }
            active={input.adminFee > 0 || input.dealerContribution > 0}
            open={sections.isOpen("fees")}
            onToggle={() => sections.toggle("fees")}
          >
            <NumberField
              id="dealer-contribution"
              label="Dealer deposit contribution"
              value={input.dealerContribution}
              onChange={(v) => update("dealerContribution", v)}
              max={MONEY_RANGE.max}
              prefix={symbol}
              grouped
              hint="Only on the dealer's HP or PCP, often only on PCP"
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="admin-fee"
                label="Admin fee"
                value={input.adminFee}
                onChange={(v) => update("adminFee", v)}
                max={MONEY_RANGE.max}
                prefix={symbol}
                grouped
                hint="Up front, HP and PCP"
              />
              <NumberField
                id="option-fee"
                label="Option to purchase"
                value={input.optionFee}
                onChange={(v) => update("optionFee", v)}
                max={MONEY_RANGE.max}
                prefix={symbol}
                grouped
                hint="Paid to own the car"
              />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              A deposit contribution is money the dealer or manufacturer puts in, so you borrow less on
              their finance. If it is only offered on PCP, compare with it and then without it. Most quotes
              already include fees in the APR: only add them if yours lists them separately.
            </p>
          </Section>

          <Section
            icon={Gauge}
            title="Mileage"
            summary={
              excess > 0
                ? `${money(excess)} over the allowance`
                : `${input.milesPerYear.toLocaleString("en-GB")} miles a year, within the allowance`
            }
            active={excess > 0}
            open={sections.isOpen("miles")}
            onToggle={() => sections.toggle("miles")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="miles"
                label="You drive"
                value={input.milesPerYear}
                onChange={(v) => update("milesPerYear", v)}
                max={MILES_RANGE.max}
                grouped
                decimals={0}
                suffix="mi/yr"
              />
              <NumberField
                id="allowance"
                label="Allowance"
                value={input.mileageAllowance}
                onChange={(v) => update("mileageAllowance", v)}
                max={MILES_RANGE.max}
                grouped
                decimals={0}
                suffix="mi/yr"
              />
              <NumberField
                id="excess"
                label="Excess charge"
                value={input.excessPerMile}
                onChange={(v) => update("excessPerMile", v)}
                max={10}
                decimals={2}
                prefix={symbol}
                suffix="/mile"
              />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              The PCP and lease allowance, and the charge for each mile over it when the car goes back.
              Miles over it take the same amount per mile off the value of a car you own
              {mileageLoss > 0 ? `, ${money(mileageLoss)} here` : ""}, so buying and handing back are
              compared fairly.
            </p>
          </Section>
        </div>
      </CardContent>
    </Card>
  );
}

function CarResults({
  input,
  comparison: { results, best, carValue, balloonCapped },
  basis,
  onBasisChange,
  money,
}: {
  input: CarFinanceInput;
  comparison: FinanceComparison;
  basis: CompareBasis;
  onBasisChange: (b: CompareBasis) => void;
  money: Money;
}) {
  const bestResult = results[best];
  const ownerLooksDear = basis === "total" && !bestResult.owns && carValue > 0;

  return (
    <div className="order-first min-w-0 space-y-6 lg:order-none lg:sticky lg:top-20">
      <Card className="min-w-0 bg-pink">
        <CardContent className="space-y-6 pt-6">
          <Segmented label="Compare on" value={basis} onChange={onBasisChange} options={BASIS_OPTIONS} />

          <HeroStat
            label={`Cheapest: ${FINANCE_INFO[best].label}`}
            value={money(basisValue(bestResult, basis))}
            hint={
              basis === "net"
                ? `over ${months(input.termMonths)}, after what the car is worth at the end`
                : `paid over ${months(input.termMonths)}, up front and at the end included`
            }
          />

          <div className="grid gap-2.5 sm:grid-cols-2">
            {FINANCE_KINDS.map((kind) => (
              <OptionTile
                key={kind}
                result={results[kind]}
                basis={basis}
                best={kind === best}
                money={money}
                bestValue={basisValue(bestResult, basis)}
              />
            ))}
          </div>

          {ownerLooksDear && (
            <Callout>
              Total paid leaves out that HP and a loan end with a car worth about {money(carValue)}. Switch to
              real cost to count it.
            </Callout>
          )}
          {balloonCapped && (
            <Callout tone="warn">
              Your deposit leaves less to borrow than the GMFV, so the balloon is cut to{" "}
              {money(results.pcp.balloon)}. A lender would usually lower the deposit instead.
            </Callout>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OptionTile({
  result,
  basis,
  best,
  money,
  bestValue,
}: {
  result: FinanceResult;
  basis: CompareBasis;
  best: boolean;
  money: Money;
  bestValue: number;
}) {
  const value = basisValue(result, basis);
  const endLabel = result.owns ? "Car worth" : result.kind === "pcp" && result.endValue > 0 ? "Equity" : "You keep";
  return (
    <div className="rounded-2xl border-[2.5px] border-foreground bg-card px-3.5 py-3">
      <p className="flex items-center justify-between gap-2 text-[15px] font-bold">
        <span className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[result.kind] }} aria-hidden />
          {FINANCE_INFO[result.kind].short}
        </span>
        {best ? (
          <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-background">
            Cheapest
          </span>
        ) : (
          <span className="font-mono text-xs font-bold text-muted-foreground">+{money(value - bestValue)}</span>
        )}
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-numeric">{money(value)}</p>
      <dl className="mt-1 space-y-0.5 text-sm font-semibold">
        <TileRow label="Monthly" value={money(result.monthly, 2)} />
        <TileRow label="Up front" value={money(result.upfront)} />
        <TileRow label="At the end" value={result.final > 0 ? money(result.final) : "nothing"} />
        <TileRow label={endLabel} value={result.endValue > 0 ? money(result.endValue) : "nothing"} />
      </dl>
    </div>
  );
}

function TileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-bold text-numeric">{value}</dd>
    </div>
  );
}

function Breakdown({
  input,
  results,
  view,
  onViewChange,
  money,
}: {
  input: CarFinanceInput;
  results: Record<FinanceKind, FinanceResult>;
  view: FinanceKind;
  onViewChange: (k: FinanceKind) => void;
  money: Money;
}) {
  const result = results[view];
  const lines = breakdownLines(result, input, money);

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Where the money goes</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <Segmented label="Finance" size="sm" value={view} onChange={onViewChange} options={VIEW_OPTIONS} />
        <p className="text-sm font-semibold text-muted-foreground">{FINANCE_INFO[view].hint}.</p>
        <div className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground">
          <table className="w-full min-w-[420px] font-mono text-sm font-bold text-numeric">
            <tbody>
              {lines.map((line, i) => (
                <Row key={i} line={line} money={money} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          Real cost is everything you pay less what you are left with: the car&apos;s value if you own it, or
          any equity above the balloon when a PCP goes back. Insurance, tax, servicing and fuel cost the same
          whichever way you pay, so they are left out.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ line, money }: { line: Line; money: Money }) {
  if (line.kind === "heading") {
    return (
      <tr className="border-b border-foreground/10 bg-secondary/60">
        <td colSpan={2} className="px-4 pt-3 pb-1.5 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {line.label}
        </td>
      </tr>
    );
  }
  const strong = line.kind === "total" || line.kind === "subtotal";
  const value = line.value < 0 ? `−${money(-line.value, 2)}` : money(line.value, 2);
  return (
    <tr
      className={cn(
        "border-b border-foreground/10 last:border-0",
        line.kind === "total" && "bg-pink",
        line.kind === "subtotal" && "bg-secondary",
        line.kind === "note" && "text-muted-foreground",
      )}
    >
      <td className={cn("px-4 py-2.5 font-sans", strong ? "font-bold" : "font-semibold", line.kind === "note" && "pl-8")}>
        {line.label}
      </td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">{value}</td>
    </tr>
  );
}

function PaidChart({
  input,
  results,
  money,
  axis,
}: {
  input: CarFinanceInput;
  results: Record<FinanceKind, FinanceResult>;
  money: Money;
  axis: (v: number) => string;
}) {
  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Paid so far</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <GrowthChart
          series={FINANCE_KINDS.map((kind) => ({
            name: FINANCE_INFO[kind].short,
            color: COLORS[kind],
            values: results[kind].cumulative,
          }))}
          xLabel={(i) => (i === 0 ? "The day you sign" : `After ${months(i)}`)}
          xTick={(i) => (i === 0 ? "0" : `${i}m`)}
          formatValue={(v) => money(v)}
          formatAxis={axis}
        />
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          Cash out of your pocket each month, before counting what the car is worth.
          {input.pcpEnd === "keep" ? " The PCP jumps at the end when the balloon is paid." : ""}
        </p>
      </CardContent>
    </Card>
  );
}
