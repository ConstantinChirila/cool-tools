"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { SplitBar } from "@/components/charts/split-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import { calculateMortgage } from "@/lib/finance";
import { DEFAULT_CURRENCY, currencies, formatMoney } from "@/lib/currency";

const TERM_PRESETS = [15, 20, 25, 30];

type MortgageType = "repayment" | "interestOnly";

const MORTGAGE_TYPE_OPTIONS = [
  { value: "repayment" as const, label: "Repayment" },
  { value: "interestOnly" as const, label: "Interest-only" },
];

export function MortgageCalculator() {
  const { code, currency, setCurrency } = useCurrency();
  const [amount, setAmount] = React.useState(250_000);
  const [rate, setRate] = React.useState(4.5);
  const [term, setTerm] = React.useState(25);
  const [mortgageType, setMortgageType] = React.useState<MortgageType>("repayment");

  useUrlState({
    amount: urlField(amount, setAmount, 250_000, undefined, { min: 10_000, max: 1_500_000 }),
    rate: urlField(rate, setRate, 4.5, undefined, { min: 0.1, max: 15 }),
    term: urlField(term, setTerm, 25, undefined, { min: 1, max: 40 }),
    type: urlField(mortgageType, setMortgageType, "repayment" as MortgageType, [
      "repayment",
      "interestOnly",
    ]),
    currency: urlField(
      code,
      setCurrency,
      DEFAULT_CURRENCY,
      currencies.map((c) => c.code),
    ),
  });

  const interestOnly = mortgageType === "interestOnly";

  const result = React.useMemo(
    () => calculateMortgage(amount, rate, term, { interestOnly }),
    [amount, rate, term, interestOnly],
  );

  const money = React.useCallback(
    (v: number, decimals = 0) => formatMoney(v, code, { decimals }),
    [code],
  );
  const axis = React.useCallback(
    (v: number) => formatMoney(v, code, { compact: true }),
    [code],
  );

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
            <Segmented
              label="Mortgage type"
              value={mortgageType}
              onChange={setMortgageType}
              options={MORTGAGE_TYPE_OPTIONS}
            />
            <SliderField
              id="mortgage-amount"
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
              id="mortgage-rate"
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
                id="mortgage-term"
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
                    className={`h-9 flex-1 rounded-full border-2 text-sm font-bold transition-colors ${
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
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <HeroStat
                label="Monthly repayment"
                value={money(result.monthlyPayment, 2)}
                hint={
                  interestOnly
                    ? `interest only, for ${term} ${term === 1 ? "year" : "years"} at ${rate}%`
                    : `for ${term} ${term === 1 ? "year" : "years"} at ${rate}%`
                }
              />
              {interestOnly && (
                <p className="sticker-sm rounded-xl border-[2.5px] border-foreground bg-yellow px-3 py-2 text-xs font-semibold">
                  You&apos;ll still owe {money(result.endingBalance)} at the end of the term.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
                <Stat label="Total repaid" value={money(result.totalPaid)} />
                <Stat label="Total interest" value={money(result.totalInterest)} />
              </div>
              <SplitBar
                segments={[
                  {
                    name: interestOnly ? "Loan (still owed)" : "Principal",
                    value: amount,
                    color: "var(--chart-2)",
                  },
                  {
                    name: "Interest",
                    value: result.totalInterest,
                    color: "var(--chart-3)",
                  },
                ]}
                format={(v) => money(v)}
              />
            </CardContent>
          </Card>
          <Link
            href="/tools/mortgage-overpayment-calculator"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
          >
            Thinking of overpaying? Try the Mortgage Overpayment Calculator
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
                    name: "Remaining balance",
                    color: "var(--chart-2)",
                    values: result.balanceSeries,
                    area: true,
                  },
                  {
                    name: "Interest paid",
                    color: "var(--chart-3)",
                    values: result.interestSeries,
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
                    {result.years.map((row) => (
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

      <MobileResultBar label="Monthly repayment" value={money(result.monthlyPayment, 2)} />
    </>
  );
}
