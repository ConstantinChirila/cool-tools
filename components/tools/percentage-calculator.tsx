"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

function InlineNumber({
  value,
  onChange,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (raw: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))}
      className={cn(
        "h-12 w-28 rounded-xl border-[2.5px] border-foreground bg-card px-3 text-center font-mono text-lg font-bold text-numeric outline-none transition-colors focus:border-ring/50 focus:ring-2 focus:ring-ring/30",
        className,
      )}
    />
  );
}

function parse(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ""));
}

type Mode = "of" | "what" | "change" | "adjust";

export function PercentageCalculator() {
  const [mode, setMode] = React.useState<Mode>("of");
  const [a, setA] = React.useState("15");
  const [b, setB] = React.useState("200");
  const [direction, setDirection] = React.useState<"increase" | "decrease">("increase");

  useUrlState({
    mode: urlField(mode, setMode, "of" as Mode, ["of", "what", "change", "adjust"]),
    a: urlField(a, setA, "15"),
    b: urlField(b, setB, "200"),
    dir: urlField(direction, setDirection, "increase", ["increase", "decrease"]),
  });

  const x = parse(a);
  const y = parse(b);
  const valid = Number.isFinite(x) && Number.isFinite(y);

  const decimals = 4;
  let result: number | null = null;
  let explanation = "";
  let resultSuffix = "";
  let zeroMessage: string | null = null;

  if (valid) {
    switch (mode) {
      case "of":
        result = (x / 100) * y;
        explanation = `${formatNumber(x, decimals)}% of ${formatNumber(y, decimals)}`;
        break;
      case "what":
        result = y === 0 ? null : (x / y) * 100;
        explanation = `${formatNumber(x, decimals)} out of ${formatNumber(y, decimals)}`;
        resultSuffix = "%";
        if (y === 0) {
          zeroMessage = "Can't divide by zero: the second number needs to be non-zero";
        }
        break;
      case "change":
        result = x === 0 ? null : ((y - x) / Math.abs(x)) * 100;
        explanation = `from ${formatNumber(x, decimals)} to ${formatNumber(y, decimals)}`;
        resultSuffix = "%";
        if (x === 0) {
          zeroMessage = "Percentage change from zero is undefined";
        }
        break;
      case "adjust":
        result =
          direction === "increase" ? y * (1 + x / 100) : y * (1 - x / 100);
        explanation = `${formatNumber(y, decimals)} ${direction}d by ${formatNumber(x, decimals)}%`;
        break;
    }
  }

  if (result !== null && Object.is(result, -0)) {
    result = 0;
  }

  const sentence: Record<Mode, React.ReactNode> = {
    of: (
      <>
        <span>What is</span>
        <InlineNumber value={a} onChange={setA} ariaLabel="Percentage" className="w-24" />
        <span>% of</span>
        <InlineNumber value={b} onChange={setB} ariaLabel="Value" />
        <span>?</span>
      </>
    ),
    what: (
      <>
        <InlineNumber value={a} onChange={setA} ariaLabel="Part" />
        <span>is what % of</span>
        <InlineNumber value={b} onChange={setB} ariaLabel="Whole" />
        <span>?</span>
      </>
    ),
    change: (
      <>
        <span>From</span>
        <InlineNumber value={a} onChange={setA} ariaLabel="Starting value" />
        <span>to</span>
        <InlineNumber value={b} onChange={setB} ariaLabel="Ending value" />
        <span>is a change of?</span>
      </>
    ),
    adjust: (
      <>
        <button
          type="button"
          onClick={() =>
            setDirection((d) => (d === "increase" ? "decrease" : "increase"))
          }
          className="inline-flex h-12 items-center gap-1 rounded-xl border-[2.5px] border-foreground bg-yellow px-3 text-base font-medium text-primary transition-colors hover:bg-primary/25"
          aria-label={`Switch to ${direction === "increase" ? "decrease" : "increase"}`}
        >
          {direction === "increase" ? (
            <ArrowUp className="size-4" />
          ) : (
            <ArrowDown className="size-4" />
          )}
          {direction === "increase" ? "Increase" : "Decrease"}
        </button>
        <InlineNumber value={b} onChange={setB} ariaLabel="Value" />
        <span>by</span>
        <InlineNumber value={a} onChange={setA} ariaLabel="Percentage" className="w-24" />
        <span>%</span>
      </>
    ),
  };

  const showChangeBadge = mode === "change" && result !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid h-auto! w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="of" className="h-7">
            % of a number
          </TabsTrigger>
          <TabsTrigger value="what" className="h-7">
            What %
          </TabsTrigger>
          <TabsTrigger value="change" className="h-7">
            % change
          </TabsTrigger>
          <TabsTrigger value="adjust" className="h-7">
            Increase / decrease
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="space-y-8 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-3 text-lg text-muted-foreground">
            {sentence[mode]}
          </div>

          <div className="border-t border-foreground/15 pt-7 text-center">
            {result !== null && valid ? (
              <>
                <p className="text-sm text-muted-foreground">{explanation}</p>
                <p className="mt-1.5 text-5xl font-bold tracking-tight sm:text-6xl">
                  {formatNumber(result, decimals)}
                  {resultSuffix && (
                    <span className="ml-1 text-3xl text-muted-foreground">
                      {resultSuffix}
                    </span>
                  )}
                </p>
                {showChangeBadge && (
                  <p
                    className={cn(
                      "mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                      result === 0
                        ? "border-2 border-foreground bg-card text-foreground"
                        : result > 0
                          ? "bg-mint text-foreground"
                          : "bg-pink text-foreground",
                    )}
                  >
                    {result > 0 && <ArrowUp className="size-3.5" />}
                    {result < 0 && <ArrowDown className="size-3.5" />}
                    {result === 0 ? "No change" : result > 0 ? "Increase" : "Decrease"}
                  </p>
                )}
              </>
            ) : (
              <p className="py-4 text-muted-foreground">
                {valid && zeroMessage
                  ? zeroMessage
                  : "Fill in both numbers to see the answer."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
