import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[15px] font-bold">{label}</p>
      <p className="font-heading text-2xl font-extrabold tracking-tight text-numeric">{value}</p>
      {hint && <p className="text-xs font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function HeroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-base font-bold">{label}</p>
      <p className="font-heading text-5xl font-black tracking-tighter sm:text-7xl">{value}</p>
      {hint && <p className="text-sm font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}
