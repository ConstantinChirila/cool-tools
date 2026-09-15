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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { GrowthChart } from "@/components/charts/growth-chart";
import { SplitBar } from "@/components/charts/split-bar";
import { useCurrency } from "@/hooks/use-currency";
import { calculateCompound } from "@/lib/finance";
import { formatMoney } from "@/lib/currency";

const FREQUENCIES = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "2", label: "Half-yearly" },
  { value: "1", label: "Yearly" },
];

export function CompoundInterestCalculator() {
  const { code, currency, setCurrency } = useCurrency();
  const [initial, setInitial] = React.useState(10_000);
  const [monthly, setMonthly] = React.useState(250);
  const [rate, setRate] = React.useState(7);
  const [frequency, setFrequency] = React.useState("12");
  const [years, setYears] = React.useState(20);

  const result = React.useMemo(
    () => calculateCompound(initial, monthly, rate, Number(frequency), years),
    [initial, monthly, rate, frequency, years],
  );

  const money = React.useCallback(
    (v: number, decimals = 0) => formatMoney(v, code, { decimals }),
    [code],
  );
  const axis = React.useCallback(
    (v: number) => formatMoney(v, code, { compact: true }),
    [code],
  );

  const contributionsOnly = result.totalContributed - initial;

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
              step={10}
              sliderStep={25}
              prefix={currency.symbol}
              grouped
              decimals={0}
            />
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
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <HeroStat
                label={`Balance after ${years} years`}
                value={money(result.finalBalance)}
                hint={`earning ${rate}% compounded ${FREQUENCIES.find((f) => f.value === frequency)?.label.toLowerCase()}`}
              />
              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
                <Stat
                  label="Total contributed"
                  value={money(result.totalContributed)}
                />
                <Stat
                  label="Interest earned"
                  value={money(result.totalInterest)}
                />
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
                    name: "Interest",
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Growth over time</CardTitle>
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
                    name: "Balance",
                    color: "var(--chart-1)",
                    values: result.balanceSeries,
                    area: true,
                  },
                  {
                    name: "Contributed",
                    color: "oklch(0.8 0.01 60)",
                    values: result.contributedSeries,
                  },
                ]}
                xLabel={(i) => (i === 0 ? "Start" : `Year ${i}`)}
                xTick={(i) => (i === 0 ? "0" : `${i}y`)}
                formatValue={(v) => money(v)}
                formatAxis={axis}
                extraRow={(i) => ({
                  name: "Interest",
                  value: money(
                    result.balanceSeries[i] - result.contributedSeries[i],
                  ),
                })}
              />
            </TabsContent>
            <TabsContent value="table">
              <div className="max-h-96 overflow-y-auto rounded-2xl border-2 border-foreground">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-foreground/15 text-left text-xs font-bold text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Year</th>
                      <th className="px-4 py-2.5 text-right font-medium">Contributed</th>
                      <th className="px-4 py-2.5 text-right font-medium">Interest</th>
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
                        <td className="px-4 py-2.5 text-right">{money(row.contributed)}</td>
                        <td className="px-4 py-2.5 text-right">{money(row.interestEarned)}</td>
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

      <MobileResultBar
        label={`Balance after ${years}y`}
        value={money(result.finalBalance)}
      />
    </>
  );
}
