export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

const GBP: Currency = { code: "GBP", symbol: "£", label: "British Pound" };

export const currencies: Currency[] = [
  GBP,
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "RON", symbol: "lei", label: "Romanian Leu" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "CAD", symbol: "$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "$", label: "Australian Dollar" },
];

export const DEFAULT_CURRENCY = "GBP";

export function getCurrency(code: string): Currency {
  return currencies.find((c) => c.code === code) ?? GBP;
}

/**
 * Intl.NumberFormat construction is the expensive half of formatting and the
 * calculators format dozens of values per slider frame, so formatters are
 * cached by their options. The key space (7 currencies x compact x a couple
 * of decimal settings) is bounded.
 */
const formatters = new Map<string, Intl.NumberFormat>();

export function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", options);
    formatters.set(key, formatter);
  }
  return formatter;
}

export function formatMoney(
  value: number,
  code: string,
  options?: { compact?: boolean; decimals?: number },
): string {
  if (!Number.isFinite(value)) return "—";
  return numberFormat({
    style: "currency",
    currency: code,
    notation: options?.compact ? "compact" : "standard",
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 0,
  }).format(value);
}

/** Pounds for the UK tax tools, which never switch currency. */
export function formatGbp(value: number, decimals = 0): string {
  return formatMoney(value, "GBP", { decimals });
}

/** A fraction (0.2) as a percentage string ("20%"). Fixed decimals, or up to `decimals` with `trim`. */
export function formatPercent(fraction: number, decimals = 0, options?: { trim?: boolean }): string {
  if (!Number.isFinite(fraction)) return "—";
  const fixed = (fraction * 100).toFixed(decimals);
  return `${options?.trim ? Number(fixed) : fixed}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return numberFormat({
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}
