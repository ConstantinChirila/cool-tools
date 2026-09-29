"use client";

import * as React from "react";
import { NumericInput } from "@/components/calc/numeric-input";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** A bag or board size: common sizes as pills, and a box for anything else. */
export function SizePicker({
  id,
  label,
  unit,
  sizes,
  value,
  onChange,
  min,
  max,
  decimals = 1,
  hint,
  icon,
}: {
  id: string;
  label: string;
  unit: string;
  sizes: readonly number[];
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  decimals?: number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-[15px] font-bold">
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === value}
            onClick={() => onChange(s)}
            className={cn(
              "h-8 rounded-full border-2 border-foreground px-2.5 font-mono text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              s === value ? "bg-foreground text-background" : "bg-card hover:bg-secondary",
            )}
          >
            {formatNumber(s, decimals)} {unit}
          </button>
        ))}
      </div>
      <NumericInput id={id} value={value} onChange={onChange} min={min} max={max} suffix={unit} decimals={decimals} inputClassName="w-full" />
      {hint && <p className="text-xs font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}
