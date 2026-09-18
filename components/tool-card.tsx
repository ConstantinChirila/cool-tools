import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

const TILTS = ["tilt-1", "tilt-2", "tilt-3", "tilt-4", "tilt-5", "tilt-6"];

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  // Keep the arrow glued to the last word so it never wraps onto a line of its own.
  const words = tool.name.split(" ");
  const last = words.pop() ?? tool.name;
  const head = words.join(" ");

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "sticker group flex flex-col gap-2.5 rounded-3xl p-4 transition-[transform,box-shadow] duration-200 ease-out hover:rotate-0 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none",
        TILTS[index % TILTS.length],
      )}
      style={{ background: tool.tint }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-full border-[2.5px] border-foreground bg-card">
          <tool.icon className="size-4.5" strokeWidth={2.25} />
        </span>
        <span className="rotate-3 rounded-full border-2 border-foreground bg-card px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
          {tool.category}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-[19px] leading-tight font-extrabold tracking-tight">
          {head ? `${head} ` : null}
          <span className="whitespace-nowrap">
            {last}
            <ArrowUpRight
              aria-hidden
              className="ml-1.5 inline-block size-4 align-[-1px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
              strokeWidth={3}
            />
          </span>
        </h3>
        <p className="text-[13px] font-semibold leading-snug">{tool.description}</p>
      </div>
    </Link>
  );
}
