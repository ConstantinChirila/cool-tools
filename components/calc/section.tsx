"use client";

import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A collapsible group of optional inputs: tinted when it is contributing to the result. */
export function Section({
  icon: Icon,
  title,
  summary,
  active,
  open,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  summary: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className={cn("rounded-2xl border-[2.5px] border-foreground transition-colors", active ? "bg-lilac" : "bg-card")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            active ? "border-2 border-foreground bg-card" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span
            className={cn(
              "block truncate text-xs",
              active ? "text-foreground/80" : "text-muted-foreground/70",
            )}
          >
            {summary}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-foreground/15 px-3.5 pt-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
