"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Choice<T extends string | number> {
  value: T;
  label?: React.ReactNode;
}

/**
 * A single-choice group of buttons with radio semantics: one tab stop, arrow
 * keys (and Home/End) move the choice. Layout, styling and labels are up to
 * the caller, so every pill row and tile picker shares the same behaviour.
 */
export function ChoiceGroup<T extends string | number, O extends Choice<T>>({
  label,
  value,
  options,
  onChange,
  className,
  itemClassName,
  renderLabel = (o) => o.label ?? o.value,
}: {
  /** Accessible name for the group. */
  label: string;
  value: T;
  options: readonly O[];
  onChange: (value: T) => void;
  className?: string;
  itemClassName: (active: boolean, option: O) => string;
  renderLabel?: (option: O, active: boolean) => React.ReactNode;
}) {
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
  const current = options.findIndex((o) => o.value === value);
  // With nothing chosen, the first option takes the tab stop so the group stays reachable.
  const tabStop = current === -1 ? 0 : current;

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = options.length - 1;
    let next: number;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    const option = options[next];
    if (!option) return;
    e.preventDefault();
    onChange(option.value);
    buttons.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((opt, i) => {
        const active = i === current;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn("focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none", itemClassName(active, opt))}
          >
            {renderLabel(opt, active)}
          </button>
        );
      })}
    </div>
  );
}
