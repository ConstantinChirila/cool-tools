import type { Metadata } from "next";
import { StampDutyCalculator } from "@/components/tools/stamp-duty-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/stamp-duty-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("stamp-duty-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function StampDutyCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <StampDutyCalculator />
    </ToolPageShell>
  );
}
