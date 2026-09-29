"use client";

import * as React from "react";
import { createStorageStore } from "@/hooks/create-storage-store";
import { urlField } from "@/hooks/use-url-state";
import { DEFAULT_CURRENCY, currencies, formatMoney, getCurrency } from "@/lib/currency";

const store = createStorageStore<string>({
  key: "bitsbobs:currency",
  fallback: DEFAULT_CURRENCY,
  parse: (raw) => raw,
  serialize: (code) => code,
});

const CODES = currencies.map((c) => c.code);

/** The chosen currency, shared by every tool, plus formatters bound to it. */
export function useCurrency() {
  const code = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return React.useMemo(
    () => ({
      code,
      currency: getCurrency(code),
      setCurrency: store.set,
      /** Whole units by default; pass `decimals` for pence. */
      money: (v: number, decimals = 0) => formatMoney(v, code, { decimals }),
      /** Compact form for chart axes: £250k. */
      axis: (v: number) => formatMoney(v, code, { compact: true }),
      /** The `currency` URL field, for a tool's useUrlState. */
      currencyField: urlField(code, store.set, DEFAULT_CURRENCY, CODES),
    }),
    [code],
  );
}
