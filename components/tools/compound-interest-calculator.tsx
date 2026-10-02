"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Percent, ShoppingBasket, TrendingUp } from "lucide-react";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { Section, useSectionState } from "@/components/calc/section";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SplitBar } from "@/components/charts/split-bar";
import { YearlyChartCard } from "@/components/charts/yearly-chart-card";
import type { YearlyColumn } from "@/components/charts/yearly-table";
import { useCurrency } from "@/hooks/use-currency";
import { MONEY_RANGE, useUrlState, urlField } from "@/hooks/use-url-state";
import { calculateCompound, type CompoundResult } from "@/lib/finance";

const FREQUENCIES = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "2", label: "Half-yearly" },
  { value: "1", label: "Yearly" },
];

const PCT_RANGE = { min: 0, max: 20 };

type YearRow = CompoundResult["years"][number];

export function CompoundInterestCalculator() {
  const { code, currency, setCurrency, money, axis, currencyField } = useCurrency();
  const [initial, setInitial] = React.useState(10_000);
  const [monthly, setMonthly] = React.useState(250);
  const [rate, setRate] = React.useState(7);
  const [frequency, setFrequency] = React.useState("12");
  const [years, setYears] = React.useState(20);
  const [increase, setIncrease] = React.useState(0);
  const [fee, setFee] = React.useState(0);
  const [inflation, setInflation] = React.useState(0);
  const sections = useSectionState();

  useUrlState({
    initial: urlField(initial, setInitial, 10_000, undefined, MONEY_RANGE),
    monthly: urlField(monthly, setMonthly, 250, undefined, MONEY_RANGE),
    rate: urlField(rate, setRate, 7, undefined, PCT_RANGE),
    freq: urlField(
      frequency,
      setFrequency,
      "12",
      FREQUENCIES.map((f) => f.value),
    ),
    years: urlField(years, setYears, 20, undefined, { min: 1, max: 50 }),
    increase: urlField(increase, setIncrease, 0, undefined, PCT_RANGE),
    fee: urlField(fee, setFee, 0, undefined, { min: 0, max: 5 }),
    inflation: urlField(inflation, setInflation, 0, undefined, { min: 0, max: 15 }),
    currency: currencyField,
  });

  const result = React.useMemo(
    () =>
      calculateCompound(initial, monthly, rate, Number(frequency), years, {
        contributionIncreasePct: increase,
        annualFeePct: fee,
        inflationPct: inflation,
      }),
    [initial, monthly, rate, frequency, years, increase, fee, inflation],
  );
  // The same plan with no charges, so the fee can be shown as what it cost you.
  const feeFree = React.useMemo(
    () =>
      fee > 0
        ? calculateCompound(initial, monthly, rate, Number(frequency), years, {
            contributionIncreasePct: increase,
          })
        : null,
    [initial, monthly, rate, frequency, years, increase, fee],
  );

  const contributionsOnly = result.totalContributed - initial;
  const growthLabel = fee > 0 ? "Growth after fees" : "Interest earned";
  const lastContribution = result.years.at(-1)?.monthlyContribution ?? monthly;

  const columns: YearlyColumn<YearRow>[] = [
    ...(increase > 0
      ? [{ label: "Monthly paid in", value: (r: YearRow) => money(r.monthlyContribution) }]
      : []),
    { label: "Contributed", value: (r) => money(r.contributed) },
    ...(fee > 0 ? [{ label: "Fees this year", value: (r: YearRow) => money(r.feesThisYear) }] : []),
    { label: fee > 0 ? "Growth this year" : "Interest this year", value: (r) => money(r.interestThisYear) },
    { label: "Balance", value: (r) => money(r.balance) },
    ...(inflation > 0 ? [{ label: "In today's money", value: (r: YearRow) => money(r.realBalance) }] : []),
  ];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        {/* Inputs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your plan</CardTitle>
            <CurrencySelect value={code} onChange={setCurrency} />
          </CardHeader>
          <CardContent className="space-y-7">
            <SliderField
              id="ci-initial"
              label="Initial deposit"
              value={initial}
              onChange={setInitial}
              min={0}
              max={500_000}
              inputMax={MONEY_RANGE.max}
              step={100}
              sliderStep={1000}
              prefix={currency.symbol}
              grouped
              decimals={0}
            />
            <SliderField
              id="ci-monthly"
              label="Monthly contribution"
              value={monthly}
              onChange={setMonthly}
              min={0}
              max={5000}
              inputMax={MONEY_RANGE.max}
              step={10}
              sliderStep={25}
              prefix={currency.symbol}
              grouped
              decimals={0}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              Contributions are added at the start of each month and start
              earning interest straight away.
            </p>
            <SliderField
              id="ci-rate"
              label="Annual interest rate"
              value={rate}
              onChange={setRate}
              min={0}
              max={20}
              step={0.01}
              sliderStep={0.1}
              suffix="%"
            />
            <SliderField
              id="ci-years"
              label="Time to grow"
              value={years}
              onChange={setYears}
              min={1}
              max={50}
              step={1}
              suffix="yrs"
              decimals={0}
            />
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="ci-frequency" className="text-sm text-muted-foreground">
                Compounding
              </Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="ci-frequency" size="sm" className="w-fit font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t border-foreground/15 pt-6">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Investing extras
              </p>
              <Section
                icon={TrendingUp}
                title="Raise contributions each year"
                summary={
                  increase > 0
                    ? `+${increase}% a year: ${money(lastContribution)} a month by year ${years}`
                    : `Fixed at ${money(monthly)} a month`
                }
                active={increase > 0}
                open={sections.isOpen("increase")}
                onToggle={() => sections.toggle("increase")}
              >
                <SliderField
                  id="ci-increase"
                  label="Yearly increase"
                  value={increase}
                  onChange={setIncrease}
                  min={0}
                  max={20}
                  step={0.1}
                  sliderStep={0.5}
                  suffix="%"
                />
                <p className="text-xs font-semibold text-muted-foreground">
                  Applied at the start of each year after the first, like a pay rise feeding
                  through to what you invest.
                </p>
              </Section>
              <Section
                icon={Percent}
                title="Fees"
                summary={
                  fee > 0
                    ? `${fee}% a year: ${money(result.totalFees)} over ${years} years`
                    : "No charges"
                }
                active={fee > 0}
                open={sections.isOpen("fee")}
                onToggle={() => sections.toggle("fee")}
              >
                <SliderField
                  id="ci-fee"
                  label="Annual charge"
                  value={fee}
                  onChange={setFee}
                  min={0}
                  max={5}
                  step={0.01}
                  sliderStep={0.05}
                  suffix="%"
                />
                <p className="text-xs font-semibold text-muted-foreground">
                  Platform fee plus the fund&apos;s ongoing charge (OCF), taken monthly from the
                  balance. A cheap index tracker on a flat-fee platform is around 0.2%; an
                  actively managed fund can be 1% or more.
                </p>
              </Section>
              <Section
                icon={ShoppingBasket}
                title="Inflation"
                summary={
                  inflation > 0
                    ? `${inflation}% a year: ${money(result.realFinalBalance)} in today's money`
                    : "Not adjusted"
                }
                active={inflation > 0}
                open={sections.isOpen("inflation")}
                onToggle={() => sections.toggle("inflation")}
              >
                <SliderField
                  id="ci-inflation"
                  label="Assumed inflation"
                  value={inflation}
                  onChange={setInflation}
                  min={0}
                  max={15}
                  step={0.1}
                  sliderStep={0.5}
                  suffix="%"
                />
                <p className="text-xs font-semibold text-muted-foreground">
                  Doesn&apos;t change what the pot is worth on paper, only what it would buy.
                  The Bank of England targets 2%.
                </p>
              </Section>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <HeroStat
                label={`Balance after ${years} years`}
                value={money(result.finalBalance)}
                hint={`earning ${rate}% compounded ${FREQUENCIES.find((f) => f.value === frequency)?.label.toLowerCase()}${fee > 0 ? `, after ${fee}% fees` : ""}`}
              />
              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
                <Stat
                  label="Total contributed"
                  value={money(result.totalContributed)}
                  hint={increase > 0 ? `rising to ${money(lastContribution)} a month` : undefined}
                />
                <Stat label={growthLabel} value={money(result.totalInterest)} />
                {feeFree && (
                  <Stat
                    label="Fees paid"
                    value={money(result.totalFees)}
                    hint={`cost you ${money(feeFree.finalBalance - result.finalBalance)} including lost growth`}
                  />
                )}
                {inflation > 0 && (
                  <Stat
                    label="In today's money"
                    value={money(result.realFinalBalance)}
                    hint={`what the pot would buy at ${inflation}% inflation`}
                  />
                )}
              </div>
              <SplitBar
                segments={[
                  { name: "Initial deposit", value: initial, color: "var(--chart-1)" },
                  {
                    name: "Contributions",
                    value: contributionsOnly,
                    color: "var(--chart-2)",
                  },
                  {
                    name: fee > 0 ? "Growth" : "Interest",
                    value: result.totalInterest,
                    color: "var(--chart-3)",
                  },
                ].filter((s) => s.value > 0)}
                format={(v) => money(v)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <YearlyChartCard
        title="Growth over time"
        series={[
          {
            name: "Balance",
            color: "var(--chart-1)",
            values: result.balanceSeries,
            area: true,
          },
          ...(inflation > 0
            ? [
                {
                  name: "In today's money",
                  color: "var(--chart-4)",
                  values: result.realBalanceSeries,
                },
              ]
            : []),
          {
            name: "Contributed",
            color: "var(--chart-neutral)",
            values: result.contributedSeries,
          },
        ]}
        formatValue={(v) => money(v)}
        formatAxis={axis}
        extraRow={(i) => ({
          name: fee > 0 ? "Growth" : "Interest",
          value: money((result.balanceSeries[i] ?? 0) - (result.contributedSeries[i] ?? 0)),
        })}
        rows={result.years}
        columns={columns}
      />

      <MobileResultBar
        label={`Balance after ${years}y`}
        value={money(result.finalBalance)}
      />
    </>
  );
}
