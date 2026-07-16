import type { Metadata } from "next";
import { CompoundInterestCalculator } from "@/components/tools/compound-interest-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { getTool } from "@/lib/tools";

const tool = getTool("compound-interest-calculator")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function CompoundInterestCalculatorPage() {
  return (
    <ToolPageShell tool={tool}>
      <CompoundInterestCalculator />
    </ToolPageShell>
  );
}
