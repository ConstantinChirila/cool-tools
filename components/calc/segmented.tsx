"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Compact single-choice control: a row of equal-width pills. Use for 2-6
 * short options where a select would hide the alternatives.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "default",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex gap-1 rounded-full border-[2.5px] border-foreground bg-card p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-full font-bold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
              active
                ? "bg-foreground text-background"
                : "text-foreground hover:bg-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
