import type { Metadata } from "next";
import { PercentageCalculator } from "@/components/tools/percentage-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/percentage-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("percentage-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function PercentageCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <PercentageCalculator />
    </ToolPageShell>
  );
}
