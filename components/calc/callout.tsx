import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** A short note inside a results card: `warn` for things that cost the user money. */
export function Callout({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold leading-relaxed",
        tone === "warn"
          ? "border-2 border-foreground bg-pink text-foreground"
          : "border-2 border-foreground bg-card text-foreground",
      )}
    >
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", tone === "warn" ? "text-foreground" : "text-muted-foreground")} />
      <p>{children}</p>
    </div>
  );
}
