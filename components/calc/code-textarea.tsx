import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CodeTextareaProps extends React.ComponentProps<typeof Textarea> {
  /**
   * Called instead of a normal paste while the box still shows its sample, so
   * pasted text replaces the sample rather than landing inside it. The sample
   * is also selected on focus, so typing replaces it too.
   */
  onReplaceSample?: (text: string) => void;
}

/**
 * Monospace box for pasted text, code and tokens: sticker outline, fixed
 * height (pass one in `className`) with a resize handle, and the browser's
 * spelling and capitalisation help switched off.
 */
export function CodeTextarea({ className, onReplaceSample, onFocus, onPaste, ...props }: CodeTextareaProps) {
  return (
    <Textarea
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="off"
      className={cn(
        "resize-y field-sizing-fixed rounded-2xl border-[2.5px] border-foreground bg-card px-3.5 py-3 font-mono text-base leading-6 focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 md:pointer-fine:text-[13px]",
        className,
      )}
      onFocus={(e) => {
        onFocus?.(e);
        if (!onReplaceSample) return;
        const el = e.currentTarget;
        // After the click that focused the box has placed its caret.
        setTimeout(() => el.setSelectionRange(0, el.value.length), 0);
      }}
      onPaste={(e) => {
        onPaste?.(e);
        if (!onReplaceSample || e.defaultPrevented) return;
        e.preventDefault();
        onReplaceSample(e.clipboardData.getData("text/plain"));
      }}
      {...props}
    />
  );
}
