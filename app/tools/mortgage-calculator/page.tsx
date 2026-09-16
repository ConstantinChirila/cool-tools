import type { Metadata } from "next";
import { MortgageCalculator } from "@/components/tools/mortgage-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import content from "@/content/mortgage-calculator";
import { toolMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";

const tool = getTool("mortgage-calculator")!;

export const metadata: Metadata = toolMetadata(tool);

export default function MortgageCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <MortgageCalculator />
    </ToolPageShell>
  );
}
