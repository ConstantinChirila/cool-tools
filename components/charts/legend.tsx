import { cn } from "@/lib/utils";

const SHAPES = {
  /** A filled square with an ink outline: areas and bars in the sticker fills. */
  swatch: "size-3 rounded-[3px] border-2 border-foreground",
  /** A thin line: series drawn as lines. */
  line: "h-0.5 w-3 rounded-full",
  /** A short thick bar: marks and ticks. */
  bar: "h-1 w-3 rounded-full",
  /** A small filled block without an outline: bars in a chart colour. */
  block: "h-2.5 w-3 rounded-[2px]",
} as const;

/** One legend entry: a coloured mark and its label, for the key under a chart. */
export function Key({ color, shape = "swatch", children }: { color: string; shape?: keyof typeof SHAPES; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn(SHAPES[shape])} style={{ background: color }} />
      {children}
    </span>
  );
}
