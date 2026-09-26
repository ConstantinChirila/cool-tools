"use client";

import { Label } from "@/components/ui/label";
import { NumericInput, type NumericInputProps } from "@/components/calc/numeric-input";
import { cn } from "@/lib/utils";

interface NumberFieldProps extends Omit<NumericInputProps, "blankZero" | "className" | "inputClassName"> {
  label: string;
  hint?: string;
  className?: string;
}

/**
 * Labelled numeric input without a slider, for secondary amounts that are
 * typed rather than explored. Shows 0 as an empty box and commits 0 when cleared.
 */
export function NumberField({ id, label, hint, placeholder, className, ...input }: NumberFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </Label>
      <NumericInput id={id} placeholder={placeholder ?? "0"} blankZero inputClassName="w-full" {...input} />
      {hint && <p className="text-xs font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}
