export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const currencies: Currency[] = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "RON", symbol: "lei", label: "Romanian Leu" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "CAD", symbol: "$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "$", label: "Australian Dollar" },
];

export const DEFAULT_CURRENCY = "GBP";

export function getCurrency(code: string): Currency {
  return currencies.find((c) => c.code === code) ?? currencies[0];
}

export function formatMoney(
  value: number,
  code: string,
  options?: { compact?: boolean; decimals?: number },
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: code,
    notation: options?.compact ? "compact" : "standard",
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}
