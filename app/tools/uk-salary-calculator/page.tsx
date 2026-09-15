import type { Metadata } from "next";
import { UkSalaryCalculator } from "@/components/tools/uk-salary-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { getTool } from "@/lib/tools";

const tool = getTool("uk-salary-calculator")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function UkSalaryCalculatorPage() {
  return (
    <ToolPageShell tool={tool}>
      <UkSalaryCalculator />
    </ToolPageShell>
  );
}
