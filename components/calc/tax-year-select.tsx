"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAX_YEARS, type TaxYear } from "@/lib/uk-tax";

/** Compact tax-year picker for a card header, shared by the UK tax tools. */
export function TaxYearSelect({ value, onChange }: { value: TaxYear; onChange: (value: TaxYear) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaxYear)}>
      <SelectTrigger size="sm" aria-label="Tax year" className="w-fit font-medium">
        <span className="text-muted-foreground">Tax year</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {(Object.keys(TAX_YEARS) as TaxYear[]).map((ty) => (
          <SelectItem key={ty} value={ty}>
            {TAX_YEARS[ty].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
