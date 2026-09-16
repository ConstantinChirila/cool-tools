import type { Metadata } from "next";
import { CompoundInterestCalculator } from "@/components/tools/compound-interest-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import content from "@/content/compound-interest-calculator";
import { toolMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";

const tool = getTool("compound-interest-calculator")!;

export const metadata: Metadata = toolMetadata(tool);

export default function CompoundInterestCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <CompoundInterestCalculator />
    </ToolPageShell>
  );
}
