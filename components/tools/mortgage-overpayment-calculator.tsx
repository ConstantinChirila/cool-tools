"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { CurrencySelect } from "@/components/calc/currency-select";
import { LOAN_DEFAULTS, LOAN_RANGES, LoanFields } from "@/components/calc/loan-fields";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { PillLink } from "@/components/calc/pill-button";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { SplitBar } from "@/components/charts/split-bar";
import { YearlyTable } from "@/components/charts/yearly-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import { calculateMortgage } from "@/lib/finance";
import { DEFAULT_CURRENCY, currencies } from "@/lib/currency";

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
  const { code, currency, setCurrency, money, axis } = useCurrency();
  const [amount, setAmount] = React.useState(LOAN_DEFAULTS.amount);
  const [rate, setRate] = React.useState(LOAN_DEFAULTS.rate);
  const [term, setTerm] = React.useState(LOAN_DEFAULTS.term);
  const [monthlyOverpayment, setMonthlyOverpayment] = React.useState(200);
  const [lumpSum, setLumpSum] = React.useState(0);

  useUrlState({
    amount: urlField(amount, setAmount, LOAN_DEFAULTS.amount, undefined, LOAN_RANGES.amount),
    rate: urlField(rate, setRate, LOAN_DEFAULTS.rate, undefined, LOAN_RANGES.rate),
    term: urlField(term, setTerm, LOAN_DEFAULTS.term, undefined, LOAN_RANGES.term),
    overpay: urlField(monthlyOverpayment, setMonthlyOverpayment, 200, undefined, { min: 0, max: 3000 }),
    lump: urlField(lumpSum, setLumpSum, 0, undefined, { min: 0, max: 10_000_000 }),
    currency: urlField(
      code,
      setCurrency,
      DEFAULT_CURRENCY,
      currencies.map((c) => c.code),
    ),
  });

  const base = React.useMemo(
    () => calculateMortgage(amount, rate, term),
    [amount, rate, term],
  );
  const over = React.useMemo(
    () => calculateMortgage(amount, rate, term, { monthlyOverpayment, lumpSum }),
    [amount, rate, term, monthlyOverpayment, lumpSum],
  );

  const interestSaved = Math.max(base.totalInterest - over.totalInterest, 0);
  const timeSavedMonths = Math.max(base.monthsToPayoff - over.monthsToPayoff, 0);
  const monthlyTotal = over.monthlyPayment + monthlyOverpayment;

  // Check every year of the overpaid schedule against that year's opening
  // balance, not just year 1 against the original loan amount.
  const capWarningYear = React.useMemo(() => {
    for (let i = 1; i <= over.years.length; i++) {
      const openingBalance = over.balanceSeries[i - 1] ?? 0;
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
            <LoanFields
              idPrefix="overpayment"
              amount={amount}
              rate={rate}
              term={term}
              onAmount={setAmount}
              onRate={setRate}
              onTerm={setTerm}
              currencySymbol={currency.symbol}
            />

            <div className="space-y-5 border-t border-foreground/15 pt-6">
              <p className="text-[15px] font-bold">Overpayments</p>
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
                <Callout tone="warn">
                  From year {capWarningYear}{" "}your overpayments exceed 10% of the remaining balance. Many UK
                  fixed-rate deals charge an early repayment fee above that. Check your lender&apos;s terms.
                </Callout>
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
          <PillLink href="/tools/mortgage-calculator">Just want the monthly payment? Mortgage Calculator</PillLink>
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
              <YearlyTable
                rows={over.years}
                columns={[
                  { label: "Interest", value: (r) => money(r.interestPaid) },
                  { label: "Principal", value: (r) => money(r.principalPaid) },
                  { label: "Balance", value: (r) => money(r.balance) },
                ]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MobileResultBar label="Interest saved" value={money(interestSaved)} />
    </>
  );
}
