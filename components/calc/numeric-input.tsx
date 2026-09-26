"use client";

import * as React from "react";
import { clamp, cn } from "@/lib/utils";

function group(raw: string): string {
  const [int = "", dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

export interface NumericInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas (for money amounts). */
  grouped?: boolean;
  decimals?: number;
  placeholder?: string;
  /**
   * Show 0 as an empty box and commit 0 when the box is cleared: for optional
   * amounts that are typed. Otherwise a cleared box restores the last value.
   */
  blankZero?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * The bordered text box shared by SliderField and NumberField. Keeps its own
 * text while focused, commits on blur or Enter, clamps to min/max and rounds
 * to `decimals`. A minus sign is accepted only when `min` is negative.
 */
export function NumericInput({
  id,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  prefix,
  suffix,
  grouped = false,
  decimals = 2,
  placeholder,
  blankZero = false,
  className,
  inputClassName,
}: NumericInputProps) {
  const fmt = React.useCallback(
    (v: number) => (blankZero && v === 0 ? "" : grouped ? group(String(v)) : String(v)),
    [blankZero, grouped],
  );
  const [text, setText] = React.useState(() => fmt(value));
  const [focused, setFocused] = React.useState(false);

  // Reflect external changes (slider drags, presets) while not typing,
  // using the previous-render-value pattern instead of an effect.
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!focused) setText(fmt(value));
  }

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw.replace(/,/g, ""));
    if (Number.isNaN(parsed)) {
      if (blankZero) {
        onChange(0);
        setText("");
      } else {
        setText(fmt(value));
      }
      return;
    }
    const rounded = Number(clamp(parsed, min, max).toFixed(decimals));
    onChange(rounded);
    setText(fmt(rounded));
  };

  const allowed = min < 0 ? /[^\d.,-]/g : /[^\d.,]/g;

  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-xl border-[2.5px] border-foreground bg-card px-3 transition-shadow focus-within:ring-[3px] focus-within:ring-ring/60",
        className,
      )}
    >
      {prefix && <span className="pr-1 text-sm text-muted-foreground">{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(allowed, "");
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
        className={cn(
          "min-w-0 bg-transparent font-mono text-sm font-bold text-numeric outline-none placeholder:text-muted-foreground/50",
          inputClassName,
        )}
      />
      {suffix && <span className="pl-1 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}
