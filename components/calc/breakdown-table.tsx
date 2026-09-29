import type { Line } from "@/lib/breakdown";
import { cn } from "@/lib/utils";

/**
 * A "where the money goes" table: section headings, lines, subtotals and a
 * highlighted total. Each tool formats its own values, since engines differ on
 * what a negative number means.
 */
export function BreakdownTable({
  lines,
  format,
  totalClassName = "bg-yellow",
}: {
  lines: readonly Line[];
  format: (line: Line) => string;
  totalClassName?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground">
      <table className="w-full min-w-[420px] font-mono text-sm font-bold text-numeric">
        <tbody>
          {lines.map((line, i) =>
            line.kind === "heading" ? (
              <tr key={i} className="border-b border-foreground/10 bg-secondary/60">
                <td colSpan={2} className="px-4 pt-3 pb-1.5 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {line.label}
                </td>
              </tr>
            ) : (
              <tr
                key={i}
                className={cn(
                  "border-b border-foreground/10 last:border-0",
                  line.kind === "total" && totalClassName,
                  line.kind === "subtotal" && "bg-secondary",
                  line.kind === "note" && "text-muted-foreground",
                )}
              >
                <td
                  className={cn(
                    "px-4 py-2.5 font-sans",
                    line.kind === "total" || line.kind === "subtotal" ? "font-bold" : "font-semibold",
                    line.kind === "note" && "pl-8",
                  )}
                >
                  {line.label}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">{format(line)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
