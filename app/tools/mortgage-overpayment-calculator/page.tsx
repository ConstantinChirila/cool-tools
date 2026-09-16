import type { Metadata } from "next";
import { MortgageOverpaymentCalculator } from "@/components/tools/mortgage-overpayment-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { getTool } from "@/lib/tools";

const tool = getTool("mortgage-overpayment-calculator")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function MortgageOverpaymentCalculatorPage() {
  return (
    <ToolPageShell tool={tool}>
      <MortgageOverpaymentCalculator />
    </ToolPageShell>
  );
}
