import type { Metadata } from "next";
import { PercentageCalculator } from "@/components/tools/percentage-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { getTool } from "@/lib/tools";

const tool = getTool("percentage-calculator")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function PercentageCalculatorPage() {
  return (
    <ToolPageShell tool={tool}>
      <PercentageCalculator />
    </ToolPageShell>
  );
}
