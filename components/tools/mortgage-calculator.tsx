"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { CurrencySelect } from "@/components/calc/currency-select";
import { LOAN_DEFAULTS, LOAN_RANGES, LoanFields } from "@/components/calc/loan-fields";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { PillLink } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { HeroStat, Stat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { SplitBar } from "@/components/charts/split-bar";
import { YearlyTable } from "@/components/charts/yearly-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import { calculateMortgage } from "@/lib/finance";
import { DEFAULT_CURRENCY, currencies } from "@/lib/currency";

type MortgageType = "repayment" | "interestOnly";

const MORTGAGE_TYPE_OPTIONS = [
  { value: "repayment" as const, label: "Repayment" },
  { value: "interestOnly" as const, label: "Interest-only" },
];

export function MortgageCalculator() {
  const { code, currency, setCurrency, money, axis } = useCurrency();
  const [amount, setAmount] = React.useState(LOAN_DEFAULTS.amount);
  const [rate, setRate] = React.useState(LOAN_DEFAULTS.rate);
  const [term, setTerm] = React.useState(LOAN_DEFAULTS.term);
  const [mortgageType, setMortgageType] = React.useState<MortgageType>("repayment");

  useUrlState({
    amount: urlField(amount, setAmount, LOAN_DEFAULTS.amount, undefined, LOAN_RANGES.amount),
    rate: urlField(rate, setRate, LOAN_DEFAULTS.rate, undefined, LOAN_RANGES.rate),
    term: urlField(term, setTerm, LOAN_DEFAULTS.term, undefined, LOAN_RANGES.term),
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
            <LoanFields
              idPrefix="mortgage"
              amount={amount}
              rate={rate}
              term={term}
              onAmount={setAmount}
              onRate={setRate}
              onTerm={setTerm}
              currencySymbol={currency.symbol}
            />
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
                <Callout tone="warn">You&apos;ll still owe {money(result.endingBalance)} at the end of the term.</Callout>
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
          <PillLink href="/tools/mortgage-overpayment-calculator">
            Thinking of overpaying? Try the Mortgage Overpayment Calculator
          </PillLink>
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
              <YearlyTable
                rows={result.years}
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

      <MobileResultBar label="Monthly repayment" value={money(result.monthlyPayment, 2)} />
    </>
  );
}
