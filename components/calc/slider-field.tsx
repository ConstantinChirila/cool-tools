"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function group(raw: string): string {
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Step used by the slider when coarser than the input's precision. */
  sliderStep?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas in the text input (for money amounts). */
  grouped?: boolean;
  decimals?: number;
  className?: string;
}

export function SliderField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  sliderStep,
  prefix,
  suffix,
  grouped = false,
  decimals = 2,
  className,
}: SliderFieldProps) {
  const [text, setText] = React.useState(() =>
    grouped ? group(String(value)) : String(value),
  );
  const [focused, setFocused] = React.useState(false);

  // Reflect external changes (slider drags, presets) while not typing,
  // using the previous-render-value pattern instead of an effect.
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!focused) setText(grouped ? group(String(value)) : String(value));
  }

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw.replace(/,/g, ""));
    if (Number.isNaN(parsed)) {
      setText(grouped ? group(String(value)) : String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    const rounded = Number(clamped.toFixed(decimals));
    onChange(rounded);
    setText(grouped ? group(String(rounded)) : String(rounded));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[15px] font-bold">
          {label}
        </Label>
        <div className="flex h-10 items-center rounded-xl border-[2.5px] border-foreground bg-card px-3 transition-shadow focus-within:ring-[3px] focus-within:ring-ring/60">
          {prefix && (
            <span className="pr-1 text-sm text-muted-foreground">{prefix}</span>
          )}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.,-]/g, "");
              setText(grouped ? group(raw.replace(/,/g, "")) : raw);
            }}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false);
              commit(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
            }}
            className="w-24 bg-transparent text-right font-mono text-sm font-bold text-numeric outline-none sm:w-28"
          />
          {suffix && (
            <span className="pl-1 text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={sliderStep ?? step}
        aria-label={label}
      />
    </div>
  );
}
