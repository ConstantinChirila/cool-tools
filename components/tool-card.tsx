import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

const TILTS = ["tilt-1", "tilt-2", "tilt-3", "tilt-4", "tilt-5", "tilt-6"];

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "sticker group flex flex-col gap-3.5 rounded-3xl p-5 transition-[transform,box-shadow] duration-200 ease-out hover:rotate-0 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none",
        TILTS[index % TILTS.length],
      )}
      style={{ background: tool.tint }}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-full border-[2.5px] border-foreground bg-card">
          <tool.icon className="size-5" strokeWidth={2.25} />
        </span>
        <span className="rotate-3 rounded-full border-2 border-foreground bg-card px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
          {tool.category}
        </span>
      </div>

      <div className="flex-1 space-y-1">
        <h3 className="font-heading text-[22px] leading-tight font-extrabold tracking-tight">
          {tool.name}
        </h3>
        <p className="text-sm font-semibold leading-relaxed">{tool.description}</p>
      </div>

      <div className="flex justify-end">
        <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="size-4.5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
