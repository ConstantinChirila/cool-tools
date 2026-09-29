"use client";

import * as React from "react";
import { TogglePill } from "@/components/calc/pill-button";
import { SliderField } from "@/components/calc/slider-field";
import type { YearlyColumn } from "@/components/charts/yearly-table";
import { urlField, type NumberRange } from "@/hooks/use-url-state";
import type { AmortizationYear } from "@/lib/finance";

/** Bounds shared by the mortgage tools' inputs and their URL fields. */
const LOAN_RANGES = {
  amount: { min: 10_000, max: 10_000_000 },
  rate: { min: 0.1, max: 15 },
  term: { min: 1, max: 40 },
} satisfies Record<string, NumberRange>;

const LOAN_DEFAULTS = { amount: 250_000, rate: 4.5, term: 25 };

/** The amount slider covers typical loans; bigger ones are typed. */
const AMOUNT_SLIDER_MAX = 1_500_000;

const TERM_PRESETS = [15, 20, 25, 30];

/** Loan amount, rate and term state for a mortgage tool, with their URL fields to spread into useUrlState. */
export function useLoanState() {
  const [amount, setAmount] = React.useState(LOAN_DEFAULTS.amount);
  const [rate, setRate] = React.useState(LOAN_DEFAULTS.rate);
  const [term, setTerm] = React.useState(LOAN_DEFAULTS.term);
  return {
    amount,
    rate,
    term,
    setAmount,
    setRate,
    setTerm,
    urlFields: {
      amount: urlField(amount, setAmount, LOAN_DEFAULTS.amount, undefined, LOAN_RANGES.amount),
      rate: urlField(rate, setRate, LOAN_DEFAULTS.rate, undefined, LOAN_RANGES.rate),
      term: urlField(term, setTerm, LOAN_DEFAULTS.term, undefined, LOAN_RANGES.term),
    },
  };
}

/** The mortgage tools' yearly table: what each year's payments went on. */
export function loanYearColumns(money: (v: number) => string): YearlyColumn<AmortizationYear>[] {
  return [
    { label: "Interest", value: (r) => money(r.interestPaid) },
    { label: "Principal", value: (r) => money(r.principalPaid) },
    { label: "Balance", value: (r) => money(r.balance) },
  ];
}

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
        max={AMOUNT_SLIDER_MAX}
        inputMax={LOAN_RANGES.amount.max}
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
