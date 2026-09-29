import type { Metadata } from "next";
import { GardenMaterialsCalculator } from "@/components/tools/garden-materials-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/garden-materials-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("garden-materials-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function GardenMaterialsCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <GardenMaterialsCalculator />
    </ToolPageShell>
  );
}
