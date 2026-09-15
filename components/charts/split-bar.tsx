"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SplitSegment {
  name: string;
  value: number;
  color: string;
}

/**
 * Part-to-whole as a single horizontal stacked bar with 2px surface gaps
 * between segments. The legend below carries exact values, so nothing is
 * gated behind hover; hovering a segment lifts it slightly.
 */
export function SplitBar({
  segments,
  format,
  className,
}: {
  segments: SplitSegment[];
  format: (value: number) => string;
  className?: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-6 w-full overflow-hidden rounded-full border-[2.5px] border-foreground bg-card" role="img"
        aria-label={segments.map((s) => `${s.name}: ${format(s.value)}`).join(", ")}
      >
        {segments.map((s, i) => (
          <div
            key={s.name}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            className="h-full min-w-1 border-r-[2.5px] border-foreground transition-opacity duration-150 last:border-r-0"
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
              opacity: active === null || active === i ? 1 : 0.45,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {segments.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center gap-2 text-sm font-semibold transition-opacity duration-150"
            style={{ opacity: active === null || active === i ? 1 : 0.5 }}
          >
            <span
              className="size-3 rounded-full border-2 border-foreground"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="font-bold text-numeric">{format(s.value)}</span>
            <span className="text-xs text-muted-foreground/70 text-numeric">
              {((s.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
