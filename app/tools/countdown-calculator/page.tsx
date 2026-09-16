import type { Metadata } from "next";
import { CountdownCalculator } from "@/components/tools/countdown-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/countdown-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("countdown-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function CountdownCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <CountdownCalculator />
    </ToolPageShell>
  );
}
