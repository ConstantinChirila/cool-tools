import type { Metadata } from "next";
import { WaterButtCalculator } from "@/components/tools/water-butt-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/water-butt-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("water-butt-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function WaterButtCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <WaterButtCalculator />
    </ToolPageShell>
  );
}
