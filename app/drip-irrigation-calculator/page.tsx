import type { Metadata } from "next";
import { DripIrrigationCalculator } from "@/components/tools/drip-irrigation-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/drip-irrigation-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("drip-irrigation-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function DripIrrigationCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <DripIrrigationCalculator />
    </ToolPageShell>
  );
}
