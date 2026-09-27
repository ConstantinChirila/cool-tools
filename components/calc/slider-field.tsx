"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { NumericInput, type NumericInputProps } from "@/components/calc/numeric-input";
import { cn } from "@/lib/utils";

interface SliderFieldProps
  extends Omit<NumericInputProps, "min" | "max" | "blankZero" | "placeholder" | "className" | "inputClassName"> {
  label: string;
  min: number;
  max: number;
  step?: number;
  /** Step used by the slider when coarser than the input's precision. */
  sliderStep?: number;
  /** Highest value that can be typed, when above the slider's `max`. The slider then sits at its end. */
  inputMax?: number;
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
  inputMax,
  className,
  ...input
}: SliderFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[15px] font-bold">
          {label}
        </Label>
        <NumericInput
          id={id}
          value={value}
          onChange={onChange}
          min={min}
          max={inputMax ?? max}
          inputClassName="w-24 text-right sm:w-28"
          {...input}
        />
      </div>
      <Slider
        value={[Math.min(value, max)]}
        onValueChange={([v]) => {
          if (v !== undefined) onChange(v);
        }}
        min={min}
        max={max}
        step={sliderStep ?? step}
        aria-label={label}
      />
    </div>
  );
}
