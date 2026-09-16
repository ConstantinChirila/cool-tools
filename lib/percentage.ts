import { formatNumber } from "@/lib/currency";

export type PercentMode = "of" | "what" | "change" | "adjust";
export type PercentDirection = "increase" | "decrease";

export interface PercentResult {
  /** The answer, or null when the inputs make it undefined (see `error`). */
  value: number | null;
  /** Plain-English restatement of the question, e.g. "15% of 200". */
  explanation: string;
  /** The arithmetic with the numbers filled in, without the "= result" part. */
  formula: string;
  /** "%" when the answer is a percentage, otherwise "". */
  suffix: string;
  /** Why there is no answer, when `value` is null. */
  error: string | null;
}

/**
 * The four everyday percentage questions. `x` is the first number the user
 * types and `y` the second; what they mean depends on the mode:
 * - of:     x% of y
 * - what:   x is what % of y
 * - change: percentage change from x to y (divides by |x|)
 * - adjust: y increased or decreased by x%
 */
export function calculatePercentage(
  mode: PercentMode,
  x: number,
  y: number,
  direction: PercentDirection = "increase",
  decimals = 4,
): PercentResult {
  const fx = formatNumber(x, decimals);
  const fy = formatNumber(y, decimals);
  let value: number | null = null;
  let explanation = "";
  let formula = "";
  let suffix = "";
  let error: string | null = null;

  switch (mode) {
    case "of":
      value = (x / 100) * y;
      explanation = `${fx}% of ${fy}`;
      formula = `${fx} ÷ 100 × ${fy}`;
      break;
    case "what":
      value = y === 0 ? null : (x / y) * 100;
      explanation = `${fx} out of ${fy}`;
      formula = `${fx} ÷ ${fy} × 100`;
      suffix = "%";
      if (y === 0) error = "Can't divide by zero: the second number needs to be non-zero";
      break;
    case "change":
      value = x === 0 ? null : ((y - x) / Math.abs(x)) * 100;
      explanation = `from ${fx} to ${fy}`;
      formula = `(${fy} - ${fx}) ÷ ${formatNumber(Math.abs(x), decimals)} × 100`;
      suffix = "%";
      if (x === 0) error = "Percentage change from zero is undefined";
      break;
    case "adjust":
      value = direction === "increase" ? y * (1 + x / 100) : y * (1 - x / 100);
      explanation = `${fy} ${direction}d by ${fx}%`;
      formula = `${fy} × (1 ${direction === "increase" ? "+" : "-"} ${fx} ÷ 100)`;
      break;
  }

  if (value !== null && Object.is(value, -0)) value = 0;

  return { value, explanation, formula, suffix, error };
}
