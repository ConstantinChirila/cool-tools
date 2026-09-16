"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { useRecentTools } from "@/hooks/use-recent-tools";

/** Pill row of recently opened tools, one click away above the grid. */
export function RecentTools() {
  const recent = useRecentTools();
  if (recent.length === 0) return null;

  return (
    <nav
      aria-label="Recently used tools"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <span className="mr-1 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-muted-foreground">
        <History className="size-3.5" strokeWidth={2.5} />
        Recent
      </span>
      {recent.map((tool) => (
        <Link
          key={tool.slug}
          href={`/tools/${tool.slug}`}
          className="sticker-sm flex h-9 items-center gap-2 rounded-full pl-2.5 pr-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          style={{ background: tool.tint }}
        >
          <tool.icon className="size-4" strokeWidth={2.5} />
          {tool.shortName ?? tool.name}
        </Link>
      ))}
    </nav>
  );
}
