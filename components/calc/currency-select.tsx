"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/lib/currency";

export function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label="Currency" className="w-fit gap-1.5 font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="text-muted-foreground">{c.symbol}</span> {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
