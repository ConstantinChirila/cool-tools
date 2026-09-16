import type { Metadata } from "next";
import { ArrowSpineCalculator } from "@/components/tools/arrow-spine-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import content from "@/content/arrow-spine-calculator";
import { toolMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";

const tool = getTool("arrow-spine-calculator")!;

export const metadata: Metadata = toolMetadata(tool);

export default function ArrowSpineCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <ArrowSpineCalculator />
    </ToolPageShell>
  );
}
