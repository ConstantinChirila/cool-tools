import type { Metadata } from "next";
import { LawnCalculator } from "@/components/tools/lawn-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/lawn-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("lawn-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function LawnCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <LawnCalculator />
    </ToolPageShell>
  );
}
