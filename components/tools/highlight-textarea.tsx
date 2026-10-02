"use client";

import { cn } from "@/lib/utils";

/** Shared by both layers so the text in the textarea and the marks behind it line up exactly. */
const LAYER =
  "block w-full px-3.5 py-3 font-mono text-base leading-6 whitespace-pre-wrap [overflow-wrap:anywhere] md:pointer-fine:text-[13px]";

/**
 * A textarea with coloured marks behind its text: the visible text is drawn
 * by a backdrop (which also sets the height, so the box grows with its
 * content), and the real textarea sits on top with transparent text, so the
 * caret, selection, typing and paste all stay native.
 */
export function HighlightTextarea({
  backdrop,
  className,
  layerClassName,
  singleLine = false,
  onChange,
  ...props
}: Omit<React.ComponentProps<"textarea">, "onChange"> & {
  /** The value again, with marks: plain text plus spans that change only colours, never widths. */
  backdrop: React.ReactNode;
  className?: string;
  /** For min-height: applied to the backdrop, which decides the box height. */
  layerClassName?: string;
  /** Enter does nothing, and pasted line breaks become \n. */
  singleLine?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-[2.5px] border-foreground bg-card focus-within:ring-[3px] focus-within:ring-ring/60",
        className,
      )}
    >
      <div aria-hidden="true" className={cn(LAYER, "pointer-events-none", layerClassName)}>
        {backdrop}
        {/* Gives a trailing line break a line of its own, as the textarea does. */}
        {"\u200b"}
      </div>
      <textarea
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        rows={1}
        {...props}
        onChange={(e) => onChange(singleLine ? e.target.value.replace(/\r\n?|\n/g, "\\n") : e.target.value)}
        onKeyDown={(e) => {
          if (singleLine && e.key === "Enter") e.preventDefault();
          props.onKeyDown?.(e);
        }}
        className={cn(
          LAYER,
          "absolute inset-0 h-full resize-none overflow-hidden rounded-2xl bg-transparent text-transparent caret-foreground outline-none selection:bg-foreground/25 placeholder:text-muted-foreground",
        )}
      />
    </div>
  );
}
