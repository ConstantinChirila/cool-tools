import type { Metadata } from "next";
import { MortgageOverpaymentCalculator } from "@/components/tools/mortgage-overpayment-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/mortgage-overpayment-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("mortgage-overpayment-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function MortgageOverpaymentCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <MortgageOverpaymentCalculator />
    </ToolPageShell>
  );
}
