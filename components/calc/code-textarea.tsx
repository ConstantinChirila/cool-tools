import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Monospace box for pasted text, code and tokens: sticker outline, fixed
 * height (pass one in `className`) with a resize handle, and the browser's
 * spelling and capitalisation help switched off.
 */
export function CodeTextarea({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="off"
      className={cn(
        "resize-y field-sizing-fixed rounded-2xl border-[2.5px] border-foreground bg-card px-3.5 py-3 font-mono text-base leading-6 focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 md:text-[13px]",
        className,
      )}
      {...props}
    />
  );
}
