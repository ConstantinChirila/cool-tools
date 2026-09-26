"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwitchField } from "@/components/calc/switch-field";
import { formatGbp as money, formatPercent as pct } from "@/lib/currency";
import { STUDENT_PLANS, TAX_YEARS, type StudentPlan, type TaxYear } from "@/lib/uk-tax";


/** Repayment plan and postgraduate loan: the same two questions in every UK pay tool. */
export function StudentLoanFields({
  taxYear,
  studentPlan,
  postgradLoan,
  onPlanChange,
  onPostgradChange,
}: {
  taxYear: TaxYear;
  studentPlan: StudentPlan;
  postgradLoan: boolean;
  onPlanChange: (plan: StudentPlan) => void;
  onPostgradChange: (on: boolean) => void;
}) {
  const year = TAX_YEARS[taxYear];
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-bold text-muted-foreground">Repayment plan</Label>
        <Select value={studentPlan} onValueChange={(v) => onPlanChange(v as StudentPlan)}>
          <SelectTrigger aria-label="Student loan plan" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STUDENT_PLANS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
                {p.hint && <span className="text-xs font-bold text-muted-foreground">{p.hint}</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {studentPlan !== "none" && (
          <p className="text-xs font-bold text-muted-foreground/70">
            {pct(year.studentLoanRate)} of earnings above {money(year.studentLoan[studentPlan])} a year
          </p>
        )}
      </div>
      <SwitchField
        id="postgrad"
        label="Postgraduate loan"
        hint={`${pct(year.postgradRate)} of earnings above ${money(year.postgradThreshold)}, on top of any plan`}
        checked={postgradLoan}
        onCheckedChange={onPostgradChange}
      />
    </>
  );
}
