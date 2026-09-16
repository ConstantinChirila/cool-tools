"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function group(raw: string): string {
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas (for money amounts). */
  grouped?: boolean;
  decimals?: number;
  hint?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Labelled numeric input without a slider, for secondary amounts that are
 * typed rather than explored. Commits on blur or Enter, clamps to min/max.
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  prefix,
  suffix,
  grouped = false,
  decimals = 2,
  hint,
  placeholder,
  className,
}: NumberFieldProps) {
  const fmt = React.useCallback(
    (v: number) => (v === 0 ? "" : grouped ? group(String(v)) : String(v)),
    [grouped],
  );
  const [text, setText] = React.useState(() => fmt(value));
  const [focused, setFocused] = React.useState(false);
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!focused) setText(fmt(value));
  }

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw.replace(/,/g, ""));
    if (Number.isNaN(parsed)) {
      onChange(0);
      setText("");
      return;
    }
    const rounded = Number(Math.min(max, Math.max(min, parsed)).toFixed(decimals));
    onChange(rounded);
    setText(fmt(rounded));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </Label>
      <div className="flex h-10 items-center rounded-xl border-[2.5px] border-foreground bg-card px-3 transition-shadow focus-within:ring-[3px] focus-within:ring-ring/60">
        {prefix && <span className="pr-1 text-sm text-muted-foreground">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder ?? "0"}
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.,]/g, "");
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
          className="w-full min-w-0 bg-transparent font-mono text-sm font-bold text-numeric outline-none placeholder:text-muted-foreground/50"
        />
        {suffix && <span className="pl-1 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="text-xs font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}
