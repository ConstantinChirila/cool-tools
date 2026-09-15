import { cn } from "@/lib/utils";

/**
 * The Bits & Bobs mark: a wobbly die-cut sticker with "B&B" inside.
 * `fill` is any CSS colour; defaults to the yellow sticker.
 */
export function LogoMark({
  size = 40,
  fill = "var(--sticker-yellow)",
  className,
}: {
  size?: number;
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M12 8 C26 2 44 4 55 12 C63 20 61 40 54 51 C46 62 22 62 12 54 C2 46 2 18 12 8 Z"
        fill={fill}
        stroke="var(--foreground)"
        strokeWidth="3"
      />
      <text
        x="32"
        y="38.5"
        textAnchor="middle"
        fontFamily="var(--font-heading), sans-serif"
        fontWeight="900"
        fontSize="17"
        fill="var(--foreground)"
      >
        B&amp;B
      </text>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading text-2xl font-extrabold tracking-tight",
        className,
      )}
    >
      Bits &amp; Bobs
    </span>
  );
}
