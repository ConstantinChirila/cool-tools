"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex h-9 items-center gap-1.5 rounded-full border-[2.5px] border-foreground px-3.5 text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

/** Small outlined action button for tool toolbars (swap, clear, copy…). */
export function PillButton({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" className={cn(PILL, "bg-card hover:bg-secondary", className)} {...props} />;
}

/** The same pill as a link: back links and "try the other calculator" nudges. */
export function PillLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn(PILL, "h-10 px-4 whitespace-normal bg-card hover:bg-secondary", className)} {...props} />;
}

/** An on/off option in the same shape: inked in when on. */
export function TogglePill({
  pressed,
  onPressedChange,
  children,
  className,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(PILL, pressed ? "bg-foreground text-background" : "bg-card hover:bg-secondary", className)}
    >
      {children}
    </button>
  );
}
