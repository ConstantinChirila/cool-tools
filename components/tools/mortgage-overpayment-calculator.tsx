"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { SplitBar } from "@/components/charts/split-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { calculateMortgage } from "@/lib/finance";
import { formatMoney } from "@/lib/currency";

const TERM_PRESETS = [15, 20, 25, 30];

function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (months > 0 || years === 0) {
    parts.push(`${months} ${months === 1 ? "mo" : "mos"}`);
  }
  return parts.join(" ");
}

function padSeries(values: number[], length: number): number[] {
  if (values.length >= length) return values;
  return [...values, ...Array(length - values.length).fill(0)];
}

export function MortgageOverpaymentCalculator() {
  const { code, currency, setCurrency } = useCurrency();
  const [amount, setAmount] = React.useState(250_000);
  const [rate, setRate] = React.useState(4.5);
  const [term, setTerm] = React.useState(25);
  const [monthlyOverpayment, setMonthlyOverpayment] = React.useState(200);
  const [lumpSum, setLumpSum] = React.useState(0);

  const base = React.useMemo(
    () => calculateMortgage(amount, rate, term),
    [amount, rate, term],
  );
  const over = React.useMemo(
    () => calculateMortgage(amount, rate, term, { monthlyOverpayment, lumpSum }),
    [amount, rate, term, monthlyOverpayment, lumpSum],
  );

  const money = React.useCallback(
    (v: number, decimals = 0) => formatMoney(v, code, { decimals }),
    [code],
  );
  const axis = React.useCallback(
    (v: number) => formatMoney(v, code, { compact: true }),
    [code],
  );

  const interestSaved = Math.max(base.totalInterest - over.totalInterest, 0);
  const timeSavedMonths = Math.max(base.monthsToPayoff - over.monthsToPayoff, 0);
  const monthlyTotal = over.monthlyPayment + monthlyOverpayment;

  // Check every year of the overpaid schedule against that year's opening
  // balance, not just year 1 against the original loan amount.
  const capWarningYear = React.useMemo(() => {
    for (let i = 1; i <= over.years.length; i++) {
      const openingBalance = over.balanceSeries[i - 1];
      if (openingBalance <= 0) continue;
      const monthsElapsedBefore = (i - 1) * 12;
      const monthsPaidThisYear = Math.min(
        12,
        Math.max(over.monthsToPayoff - monthsElapsedBefore, 0),
      );
      const yearOverpayment =
        monthlyOverpayment * monthsPaidThisYear + (i === 1 ? lumpSum : 0);
      if (yearOverpayment > openingBalance * 0.1) {
        return i;
      }
    }
    return null;
  }, [over, monthlyOverpayment, lumpSum]);
  const showCapWarning = capWarningYear !== null;

  const pointCount = Math.max(base.balanceSeries.length, over.balanceSeries.length);
  const balanceWithout = padSeries(base.balanceSeries, pointCount);
  const balanceWith = padSeries(over.balanceSeries, pointCount);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        {/* Inputs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Loan details</CardTitle>
            <CurrencySelect value={code} onChange={setCurrency} />
          </CardHeader>
          <CardContent className="space-y-7">
            <SliderField
              id="overpayment-amount"
              label="Loan amount"
              value={amount}
              onChange={setAmount}
              min={10_000}
              max={1_500_000}
              step={1000}
              sliderStep={5000}
              prefix={currency.symbol}
              grouped
              decimals={0}
            />
            <SliderField
              id="overpayment-rate"
              label="Interest rate"
              value={rate}
              onChange={setRate}
              min={0.1}
              max={15}
              step={0.01}
              sliderStep={0.05}
              suffix="%"
            />
            <div className="space-y-3">
              <SliderField
                id="overpayment-term"
                label="Term"
                value={term}
                onChange={setTerm}
                min={1}
                max={40}
                step={1}
                suffix="yrs"
                decimals={0}
              />
              <div className="flex gap-2">
                {TERM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTerm(preset)}
                    className={`h-9 flex-1 rounded-full border-2 text-xs font-bold transition-colors ${
                      term === preset
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {preset} yrs
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 border-t border-foreground/15 pt-6">
              <p className="text-sm font-bold">Overpayments</p>
              <SliderField
                id="overpayment-monthly"
                label="Monthly overpayment"
                value={monthlyOverpayment}
                onChange={setMonthlyOverpayment}
                min={0}
                max={3000}
                step={10}
                sliderStep={25}
                prefix={currency.symbol}
                grouped
                decimals={0}
              />
              <NumberField
                id="overpayment-lump-sum"
                label="One-off lump sum"
                value={lumpSum}
                onChange={setLumpSum}
                prefix={currency.symbol}
                grouped
                decimals={0}
                hint="Paid alongside month 1"
              />
              {showCapWarning && (
                <p className="sticker-sm rounded-xl border-[2.5px] border-foreground bg-yellow px-3 py-2 text-xs font-semibold">
                  From year {capWarningYear} your overpayments exceed 10% of the
                  remaining balance. Many UK fixed-rate deals charge an early
                  repayment fee above that. Check your lender&apos;s terms.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <HeroStat
                label="Interest saved"
                value={money(interestSaved)}
                hint={`vs no overpayments over ${term} ${term === 1 ? "year" : "years"}`}
              />
              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
                <Stat label="Paid off in" value={formatDuration(over.monthsToPayoff)} />
                <Stat label="Time saved" value={formatDuration(timeSavedMonths)} />
                <Stat label="New total interest" value={money(over.totalInterest)} />
                <Stat label="Monthly total" value={money(monthlyTotal, 2)} />
              </div>
              <SplitBar
                segments={[
                  { name: "Interest saved", value: interestSaved, color: "var(--chart-2)" },
                  {
                    name: "Interest still paid",
                    value: over.totalInterest,
                    color: "var(--chart-3)",
                  },
                ]}
                format={(v) => money(v)}
              />
            </CardContent>
          </Card>
          <Link
            href="/tools/mortgage-calculator"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
          >
            Just want the monthly payment? Mortgage Calculator
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Over the life of the loan</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Yearly breakdown</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <GrowthChart
                series={[
                  {
                    name: "Balance without overpaying",
                    color: "var(--chart-3)",
                    values: balanceWithout,
                  },
                  {
                    name: "Balance with overpaying",
                    color: "var(--chart-2)",
                    values: balanceWith,
                    area: true,
                  },
                ]}
                xLabel={(i) => (i === 0 ? "Start" : `Year ${i}`)}
                xTick={(i) => (i === 0 ? "0" : `${i}y`)}
                formatValue={(v) => money(v)}
                formatAxis={axis}
              />
            </TabsContent>
            <TabsContent value="table">
              <div className="max-h-96 overflow-y-auto rounded-2xl border-2 border-foreground">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-foreground/15 text-left text-xs font-bold text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Year</th>
                      <th className="px-4 py-2.5 text-right font-medium">Interest</th>
                      <th className="px-4 py-2.5 text-right font-medium">Principal</th>
                      <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="text-numeric">
                    {over.years.map((row) => (
                      <tr
                        key={row.year}
                        className="border-b border-foreground/10 last:border-0 hover:bg-secondary"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground">{row.year}</td>
                        <td className="px-4 py-2.5 text-right">{money(row.interestPaid)}</td>
                        <td className="px-4 py-2.5 text-right">{money(row.principalPaid)}</td>
                        <td className="px-4 py-2.5 text-right">{money(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MobileResultBar label="Interest saved" value={money(interestSaved)} />
    </>
  );
}
