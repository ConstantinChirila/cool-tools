"use client";

import { TogglePill } from "@/components/calc/pill-button";
import { SliderField } from "@/components/calc/slider-field";
import type { NumberRange } from "@/hooks/use-url-state";

/** Bounds shared by the mortgage tools' sliders and their URL fields. */
export const LOAN_RANGES = {
  amount: { min: 10_000, max: 1_500_000 },
  rate: { min: 0.1, max: 15 },
  term: { min: 1, max: 40 },
} satisfies Record<string, NumberRange>;

export const LOAN_DEFAULTS = { amount: 250_000, rate: 4.5, term: 25 };

const TERM_PRESETS = [15, 20, 25, 30];

interface LoanFieldsProps {
  /** Prefix for the input ids, so two tools on one page never collide. */
  idPrefix: string;
  amount: number;
  rate: number;
  term: number;
  onAmount: (value: number) => void;
  onRate: (value: number) => void;
  onTerm: (value: number) => void;
  currencySymbol: string;
}

/** Loan amount, interest rate and term, with the common term presets. */
export function LoanFields({ idPrefix, amount, rate, term, onAmount, onRate, onTerm, currencySymbol }: LoanFieldsProps) {
  return (
    <>
      <SliderField
        id={`${idPrefix}-amount`}
        label="Loan amount"
        value={amount}
        onChange={onAmount}
        min={LOAN_RANGES.amount.min}
        max={LOAN_RANGES.amount.max}
        step={1000}
        sliderStep={5000}
        prefix={currencySymbol}
        grouped
        decimals={0}
      />
      <SliderField
        id={`${idPrefix}-rate`}
        label="Interest rate"
        value={rate}
        onChange={onRate}
        min={LOAN_RANGES.rate.min}
        max={LOAN_RANGES.rate.max}
        step={0.01}
        sliderStep={0.05}
        suffix="%"
      />
      <div className="space-y-3">
        <SliderField
          id={`${idPrefix}-term`}
          label="Term"
          value={term}
          onChange={onTerm}
          min={LOAN_RANGES.term.min}
          max={LOAN_RANGES.term.max}
          step={1}
          suffix="yrs"
          decimals={0}
        />
        <div className="flex gap-2">
          {TERM_PRESETS.map((preset) => (
            <TogglePill key={preset} pressed={term === preset} onPressedChange={() => onTerm(preset)} className="flex-1 justify-center">
              {preset} yrs
            </TogglePill>
          ))}
        </div>
      </div>
    </>
  );
}
