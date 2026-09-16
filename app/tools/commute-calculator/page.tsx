import type { Metadata } from "next";
import { CommuteCalculator } from "@/components/tools/commute-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import content from "@/content/commute-calculator";
import { toolMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";

const tool = getTool("commute-calculator")!;

export const metadata: Metadata = toolMetadata(tool);

export default function CommuteCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <CommuteCalculator />
    </ToolPageShell>
  );
}
