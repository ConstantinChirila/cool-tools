import type { Metadata } from "next";
import { TvDistanceCalculator } from "@/components/tools/tv-distance-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/tv-distance-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("tv-distance-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function TvDistanceCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <TvDistanceCalculator />
    </ToolPageShell>
  );
}
