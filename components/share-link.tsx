"use client";

import { Check, Link2 } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";

/**
 * Copies the current URL (which carries the tool's inputs, see
 * hooks/use-url-state.ts). On touch devices with a native share sheet it
 * opens that instead.
 */
export function ShareLink() {
  const { state, copy } = useCopy();
  const copied = state === "copied";

  const share = async () => {
    const url = window.location.href;
    const canShare =
      typeof navigator.share === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (!canShare) return copy(url);
    try {
      await navigator.share({ title: document.title, url });
    } catch {
      // User dismissed the share sheet.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className="sticker-sm flex h-10 shrink-0 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      {copied ? (
        <Check className="size-4" strokeWidth={2.5} />
      ) : (
        <Link2 className="size-4" strokeWidth={2.5} />
      )}
      <span>{copied ? "Link copied" : state === "failed" ? "Couldn't copy" : "Share link"}</span>
    </button>
  );
}
