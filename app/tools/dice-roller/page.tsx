import type { Metadata } from "next";
import { DiceRoller } from "@/components/tools/dice-roller";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/dice-roller";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("dice-roller");

export const metadata: Metadata = toolMetadata(tool);

export default function DiceRollerPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <DiceRoller />
    </ToolPageShell>
  );
}
