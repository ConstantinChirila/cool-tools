"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        "h-14 w-32 rounded-2xl border-[2.5px] border-foreground bg-card px-3 text-center font-heading text-2xl font-extrabold text-numeric outline-none transition-shadow focus:ring-[3px] focus:ring-ring/60",
        className,
      )}
    />
  );
}

function parse(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ""));
}

type Mode = "of" | "what" | "change" | "adjust";

const MODES: {
  value: Mode;
  title: string;
  example: string;
  bg: string;
  tilt: string;
}[] = [
  { value: "of", title: "% of a number", example: "15% of 200", bg: "bg-yellow", tilt: "tilt-3" },
  { value: "what", title: "What % is it", example: "40 out of 250", bg: "bg-pink", tilt: "tilt-2" },
  { value: "change", title: "% change", example: "from 50 to 65", bg: "bg-mint", tilt: "tilt-5" },
  { value: "adjust", title: "Add or take off %", example: "80 up 25%", bg: "bg-sky", tilt: "tilt-4" },
];

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
  const fx = formatNumber(x, decimals);
  const fy = formatNumber(y, decimals);
  let result: number | null = null;
  let explanation = "";
  let formula = "";
  let resultSuffix = "";
  let zeroMessage: string | null = null;

  if (valid) {
    switch (mode) {
      case "of":
        result = (x / 100) * y;
        explanation = `${fx}% of ${fy}`;
        formula = `${fx} ÷ 100 × ${fy}`;
        break;
      case "what":
        result = y === 0 ? null : (x / y) * 100;
        explanation = `${fx} out of ${fy}`;
        formula = `${fx} ÷ ${fy} × 100`;
        resultSuffix = "%";
        if (y === 0) {
          zeroMessage = "Can't divide by zero: the second number needs to be non-zero";
        }
        break;
      case "change":
        result = x === 0 ? null : ((y - x) / Math.abs(x)) * 100;
        explanation = `from ${fx} to ${fy}`;
        formula = `(${fy} - ${fx}) ÷ ${formatNumber(Math.abs(x), decimals)} × 100`;
        resultSuffix = "%";
        if (x === 0) {
          zeroMessage = "Percentage change from zero is undefined";
        }
        break;
      case "adjust":
        result = direction === "increase" ? y * (1 + x / 100) : y * (1 - x / 100);
        explanation = `${fy} ${direction}d by ${fx}%`;
        formula = `${fy} × (1 ${direction === "increase" ? "+" : "-"} ${fx} ÷ 100)`;
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
          onClick={() => setDirection((d) => (d === "increase" ? "decrease" : "increase"))}
          className="inline-flex h-14 items-center gap-1.5 rounded-2xl border-[2.5px] border-foreground bg-foreground px-4 font-heading text-xl font-extrabold text-background transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
          aria-label={`Switch to ${direction === "increase" ? "decrease" : "increase"}`}
        >
          {direction === "increase" ? (
            <ArrowUp className="size-5" strokeWidth={3} />
          ) : (
            <ArrowDown className="size-5" strokeWidth={3} />
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

  const active = MODES.find((m) => m.value === mode)!;
  const showChangeBadge = mode === "change" && result !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div role="radiogroup" aria-label="What do you want to work out" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MODES.map((m) => {
          const selected = m.value === mode;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-2xl border-[2.5px] border-foreground px-3 py-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
                selected ? cn("sticker", m.bg, m.tilt) : "bg-card",
              )}
            >
              <p className="font-heading text-[15px] font-extrabold leading-tight">{m.title}</p>
              <p className={cn("mt-1 font-mono text-xs font-bold", selected ? "text-foreground/70" : "text-muted-foreground")}>
                e.g. {m.example}
              </p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-6 py-7">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 font-heading text-2xl font-extrabold">
            {sentence[mode]}
          </div>

          <div className={cn("rounded-2xl border-[2.5px] border-foreground p-6 text-center", active.bg)}>
            {result !== null && valid ? (
              <>
                <p className="text-[15px] font-bold text-foreground/70">{explanation}</p>
                <p className="mt-1 font-heading text-6xl font-black tracking-tighter text-numeric sm:text-7xl">
                  {formatNumber(result, decimals)}
                  {resultSuffix && (
                    <span className="ml-1 text-4xl font-extrabold text-foreground/60">{resultSuffix}</span>
                  )}
                </p>
                {showChangeBadge && (
                  <p
                    className={cn(
                      "mx-auto mt-3 flex w-fit items-center gap-1 rounded-full border-2 border-foreground px-3 py-1 text-sm font-bold",
                      result === 0 ? "bg-card" : result > 0 ? "bg-card" : "bg-pink",
                    )}
                  >
                    {result > 0 && <ArrowUp className="size-3.5" strokeWidth={3} />}
                    {result < 0 && <ArrowDown className="size-3.5" strokeWidth={3} />}
                    {result === 0 ? "No change" : result > 0 ? "Increase" : "Decrease"}
                  </p>
                )}
                <p className="mx-auto mt-4 w-fit rounded-full border-2 border-foreground/20 bg-card/60 px-3 py-1 font-mono text-sm font-bold text-numeric">
                  {formula} = {formatNumber(result, decimals)}
                  {resultSuffix}
                </p>
              </>
            ) : (
              <p className="py-6 text-[15px] font-bold text-foreground/70">
                {valid && zeroMessage ? zeroMessage : "Fill in both numbers to see the answer."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
