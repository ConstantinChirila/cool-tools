import type { Metadata } from "next";
import { MortgageCalculator } from "@/components/tools/mortgage-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { getTool } from "@/lib/tools";

const tool = getTool("mortgage-calculator")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function MortgageCalculatorPage() {
  return (
    <ToolPageShell tool={tool}>
      <MortgageCalculator />
    </ToolPageShell>
  );
}
