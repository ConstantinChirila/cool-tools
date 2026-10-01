"use client";

import * as React from "react";
import { formatNumber } from "@/lib/currency";
import { cn, clamp } from "@/lib/utils";
import { type RoofInfo, type Simulation } from "@/lib/water-butt";
import { DAYS, MONTH_START, MONTHS, dayLabel } from "@/lib/year";

const INK = "var(--foreground)";
/** Water in the drawings and charts: deep enough to read on white and on the sky card. */
export const WATER = "oklch(0.62 0.13 235)";
const WATER_LIGHT = "oklch(0.8 0.08 235)";
export const DRY = "oklch(0.6 0.19 25)";
const GREEN = "oklch(0.66 0.15 140)";

export { MONTHS, dayLabel };

/* --------------------------------------------------------------- Scene -- */

const GROUND = 186;
/** Where the downpipe comes down, for every building shape. */
const PIPE_X = 178;

function Building({ shape }: { shape: RoofInfo["shape"] }) {
  const wall = { fill: "var(--card)", stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const };
  switch (shape) {
    case "pitched":
      return (
        <>
          <rect x={30} y={96} width={148} height={GROUND - 96} {...wall} />
          <path d={`M18 98 L104 38 L190 98 Z`} fill="oklch(0.62 0.12 35)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M40 90 L104 46 L168 90 M58 78 L150 78 M76 66 L132 66 M92 55 L116 55" fill="none" stroke={INK} strokeOpacity={0.35} strokeWidth={1.5} />
          <rect x={52} y={118} width={30} height={28} fill="var(--sticker-sky)" stroke={INK} strokeWidth={2} />
          <rect x={120} y={140} width={26} height={GROUND - 140} fill="var(--sticker-yellow)" stroke={INK} strokeWidth={2} />
        </>
      );
    case "flat":
      return (
        <>
          <rect x={30} y={88} width={148} height={GROUND - 88} {...wall} />
          <rect x={24} y={80} width={160} height={10} fill="oklch(0.45 0.02 60)" stroke={INK} strokeWidth={2.5} />
          <rect x={52} y={112} width={34} height={30} fill="var(--sticker-sky)" stroke={INK} strokeWidth={2} />
          <rect x={112} y={112} width={34} height={30} fill="var(--sticker-sky)" stroke={INK} strokeWidth={2} />
        </>
      );
    case "shed":
      return (
        <>
          <rect x={70} y={112} width={108} height={GROUND - 112} {...wall} fill="oklch(0.78 0.07 65)" />
          <path d="M74 120 H174 M74 132 H174 M74 144 H174 M74 156 H174 M74 168 H174" stroke={INK} strokeOpacity={0.25} strokeWidth={1.5} />
          <path d="M62 100 L188 112 L188 118 L62 106 Z" fill="oklch(0.35 0.02 60)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <rect x={92} y={130} width={30} height={GROUND - 130} fill="oklch(0.7 0.07 65)" stroke={INK} strokeWidth={2} />
        </>
      );
    case "greenhouse":
      return (
        <>
          <path d={`M60 ${GROUND} V122 L119 86 L178 122 V${GROUND} Z`} fill="oklch(0.93 0.04 200 / 0.8)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M90 ${GROUND} V104 M119 ${GROUND} V86 M148 ${GROUND} V104 M60 150 H178`} stroke={INK} strokeWidth={1.5} />
          <path d="M70 176 q6 -14 12 0 M128 176 q6 -16 12 0" fill="none" stroke={GREEN} strokeWidth={3} strokeLinecap="round" />
        </>
      );
  }
}

/** Gutter height for each shape: where the downpipe starts. */
const EAVE: Record<RoofInfo["shape"], number> = { pitched: 98, flat: 86, shed: 116, greenhouse: 122 };

/** Up to this many butts are drawn; more show as a count. */
const MAX_BUTTS = 3;

/**
 * The roof, its gutter and downpipe and the butt beside it, filled to `fill`
 * (0–1). Butts grow with their size, from a slimline 100 L to an IBC tote
 * at 1,000 L and over. Rain falls on a wet day and water spills from the lid
 * on a day it overflows.
 */
export function RoofScene({
  shape,
  size,
  butts,
  fill,
  rain,
  overflow,
  className,
}: {
  shape: RoofInfo["shape"];
  /** Litres per butt. */
  size: number;
  butts: number;
  fill: number;
  rain: boolean;
  overflow: boolean;
  className?: string;
}) {
  const ibc = size >= 900;
  const scale = Math.sqrt(clamp(size, 50, 1000) / 210);
  const h = ibc ? 70 : clamp(60 * scale, 38, 92);
  const w = ibc ? 70 : clamp(34 * Math.sqrt(scale), 26, 46);
  const drawn = Math.min(Math.max(butts, 1), MAX_BUTTS);
  const gap = 8;
  const x0 = PIPE_X + 14;
  const top = GROUND - h;
  const level = clamp(fill, 0, 1);
  const eave = EAVE[shape];
  const width = Math.max(x0 + drawn * (w + gap) + (butts > MAX_BUTTS ? 34 : 6), 300);

  return (
    <svg viewBox={`0 0 ${width} 200`} className={cn("block w-full", className)} aria-hidden>
      {rain && (
        <g stroke={WATER} strokeWidth={2} strokeLinecap="round" className="motion-safe:animate-pulse">
          {Array.from({ length: 16 }, (_, i) => {
            const x = 18 + i * 13 + (i % 3) * 4;
            const y = 8 + (i % 4) * 9;
            return <line key={i} x1={x} y1={y} x2={x - 3} y2={y + 9} />;
          })}
        </g>
      )}
      <Building shape={shape} />
      {/* Gutter and downpipe, down to the diverter at the butt's lid. */}
      <rect x={PIPE_X - 10} y={eave - 4} width={16} height={7} rx={2} fill="var(--card)" stroke={INK} strokeWidth={2} />
      <path d={`M${PIPE_X} ${eave + 2} V${GROUND}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${PIPE_X} ${eave + 2} V${GROUND}`} stroke="var(--card)" strokeWidth={3.5} strokeLinecap="round" />
      <path d={`M${PIPE_X} ${top + 12} H${x0 + w / 2}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d={`M${PIPE_X} ${top + 12} H${x0 + w / 2}`} stroke={WATER_LIGHT} strokeWidth={1.5} strokeLinecap="round" />

      {Array.from({ length: drawn }, (_, i) => {
        const x = x0 + i * (w + gap);
        const waterTop = top + 6 + (h - 8) * (1 - level);
        const id = `butt-clip-${i}`;
        return (
          <g key={i}>
            <defs>
              <clipPath id={id}>
                <rect x={x} y={top + 4} width={w} height={h - 4} rx={ibc ? 3 : 8} />
              </clipPath>
            </defs>
            <rect x={x} y={top + 4} width={w} height={h - 4} rx={ibc ? 3 : 8} fill={ibc ? "oklch(0.97 0.01 90)" : "oklch(0.42 0.05 150)"} />
            <rect x={x} y={waterTop} width={w} height={GROUND - waterTop} fill={WATER} opacity={ibc ? 0.85 : 0.95} clipPath={`url(#${id})`} />
            {level > 0.02 && <path d={`M${x + 3} ${waterTop + 2} q${w / 4} -3 ${w / 2} 0 t${w / 2 - 6} 0`} fill="none" stroke={WATER_LIGHT} strokeWidth={1.5} clipPath={`url(#${id})`} />}
            {ibc ? (
              <path
                d={`M${x + w / 3} ${top + 4} V${GROUND} M${(x + (2 * w) / 3).toFixed(1)} ${top + 4} V${GROUND} M${x} ${top + 4 + (h - 4) / 3} H${x + w} M${x} ${top + 4 + (2 * (h - 4)) / 3} H${x + w}`}
                stroke="oklch(0.6 0.01 80)"
                strokeWidth={2}
              />
            ) : (
              <path d={`M${x} ${top + 4 + (h - 4) / 3} H${x + w} M${x} ${top + 4 + (2 * (h - 4)) / 3} H${x + w}`} stroke={INK} strokeOpacity={0.3} strokeWidth={1.5} />
            )}
            <rect x={x} y={top + 4} width={w} height={h - 4} rx={ibc ? 3 : 8} fill="none" stroke={INK} strokeWidth={2.5} />
            <rect x={x - 3} y={top} width={w + 6} height={7} rx={3} fill={ibc ? "oklch(0.9 0.01 90)" : "oklch(0.32 0.04 150)"} stroke={INK} strokeWidth={2.5} />
            {/* The tap near the bottom. */}
            <path d={`M${x + w} ${GROUND - 14} h6 v5`} fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            {i > 0 && <path d={`M${x - gap - 1} ${GROUND - 8} H${x + 1}`} stroke={INK} strokeWidth={3} />}
            {overflow && (
              <path
                d={`M${x + w + 3} ${top + 3} q4 6 1 14 M${x - 3} ${top + 3} q-4 6 -1 14`}
                fill="none"
                stroke={WATER}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
      {butts > MAX_BUTTS && (
        <text x={x0 + drawn * (w + gap) + 2} y={GROUND - h / 2} fontSize={13} fontWeight={800} fontFamily="var(--font-mono)" fill={INK}>
          +{butts - MAX_BUTTS}
        </text>
      )}
      <path d={`M0 ${GROUND} H${width}`} stroke={INK} strokeWidth={2.5} />
      <rect x={0} y={GROUND + 1} width={width} height={200 - GROUND} fill="oklch(0.83 0.08 145)" />
    </svg>
  );
}

/* ---------------------------------------------------------- Year chart -- */

/**
 * The typical year, day by day: litres in the butt as a filled line, the
 * day's rain hanging from the top, and a row of marks underneath for days it
 * overflowed (blue) and days the garden wanted water it didn't have (red).
 * Pointer or arrow keys pick a day.
 */
export function YearChart({
  year,
  capacity,
  day,
  onDay,
}: {
  year: Simulation["year"];
  capacity: number;
  day: number;
  onDay: (day: number) => void;
}) {
  const W = DAYS;
  const H = 120;
  const RAIN_H = 26;
  const top = RAIN_H + 4;
  const cap = Math.max(capacity, 1);
  const y = (litres: number) => top + (H - top) * (1 - clamp(litres / cap, 0, 1));
  let path = `M0 ${H}`;
  for (let d = 0; d < W; d++) path += ` L${d + 0.5} ${y(year.level[d] ?? 0).toFixed(1)}`;
  path += ` L${W} ${H} Z`;
  const maxRain = Math.max(...year.rain, 10);

  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onDay(clamp(Math.floor(((e.clientX - rect.left) / Math.max(rect.width, 1)) * W), 0, W - 1));
  };

  return (
    <div className="space-y-1.5">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Day of the typical year"
        aria-valuemin={1}
        aria-valuemax={W}
        aria-valuenow={day + 1}
        aria-valuetext={`${dayLabel(day)}: ${formatNumber(year.level[day] ?? 0, 0)} litres in the butt`}
        className="relative touch-none rounded-xl border-[2.5px] border-foreground bg-card focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === "mouse") pick(e);
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 7 : 1;
          if (e.key === "ArrowRight") onDay(Math.min(W - 1, day + step));
          else if (e.key === "ArrowLeft") onDay(Math.max(0, day - step));
          else if (e.key === "Home") onDay(0);
          else if (e.key === "End") onDay(W - 1);
          else return;
          e.preventDefault();
        }}
      >
        <svg viewBox={`0 0 ${W} ${H + 10}`} preserveAspectRatio="none" className="block h-44 w-full overflow-hidden rounded-[10px]">
          {MONTH_START.map((d, m) => m % 2 === 1 && <rect key={m} x={d} y={0} width={(MONTH_START[m + 1] ?? W) - d} height={H + 10} fill="var(--secondary)" opacity={0.6} />)}
          <path d={`M0 ${top} H${W}`} stroke={INK} strokeOpacity={0.25} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          {Array.from(year.rain, (mm, d) => (mm > 0.2 ? <rect key={d} x={d + 0.15} y={0} width={0.7} height={((RAIN_H * Math.min(mm, maxRain)) / maxRain).toFixed(2)} fill={WATER_LIGHT} /> : null))}
          <path d={path} fill={WATER} fillOpacity={0.35} stroke={WATER} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {Array.from(year.overflow, (o, d) => (o ? <rect key={`o${d}`} x={d} y={H + 2} width={1} height={4} fill={WATER} /> : null))}
          {Array.from(year.dry, (o, d) => (o ? <rect key={`d${d}`} x={d} y={H + 6} width={1} height={4} fill={DRY} /> : null))}
          <path d={`M${day + 0.5} 0 V${H + 10}`} stroke={INK} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex font-mono text-[11px] font-bold text-muted-foreground">
        {MONTHS.map((m, i) => (
          <span key={m} className="text-center" style={{ width: `${(((MONTH_START[i + 1] ?? W) - (MONTH_START[i] ?? 0)) / W) * 100}%` }}>
            {m[0]}
            <span className="hidden sm:inline">{m.slice(1)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Month bars -- */

/**
 * Rain in against garden need, month by month: the sky bar is what the roof
 * sends into the butt, the green bar what the garden asks for, solid where
 * the butt covered it and red where it fell short.
 */
export function MonthBars({ months, format }: { months: Simulation["months"]; format: (litres: number) => string }) {
  // A house roof catches many times what a garden uses, which would flatten
  // the garden bars to nothing: rain bars are cut off at three times the
  // thirstiest month, with a torn top to show it.
  const maxNeed = Math.max(...months.map((m) => m.need));
  const maxCaught = Math.max(...months.map((m) => m.caught));
  const max = Math.max(maxNeed, maxNeed > 0 ? Math.min(maxCaught, maxNeed * 3) : maxCaught, 1);
  const clipped = maxCaught > max;
  return (
    <div className="space-y-2">
      <div
        className="flex h-36 items-end gap-1 sm:gap-1.5"
        role="img"
        aria-label={months.map((m, i) => `${MONTHS[i]}: ${format(m.caught)} in, ${format(m.need)} needed, ${format(m.supplied)} from the butt`).join("; ")}
      >
        {months.map((m, i) => {
          const short = Math.max(m.need - m.supplied, 0);
          return (
            <div key={i} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px">
              <div
                className={cn("w-1/2 max-w-3.5 border-2 border-b-0 border-foreground bg-sky", m.caught > max ? "border-t-0" : "rounded-t-[3px]")}
                style={{
                  height: `${Math.min(m.caught / max, 1) * 100}%`,
                  ...(m.caught > max && { maskImage: "linear-gradient(to bottom, transparent, black 14px)" }),
                }}
              />
              <div className="flex w-1/2 max-w-3.5 flex-col justify-end" style={{ height: `${(m.need / max) * 100}%` }}>
                {short > 0.5 && <div className="rounded-t-[3px] border-2 border-b-0 border-foreground" style={{ height: `${(short / Math.max(m.need, 1)) * 100}%`, background: DRY }} />}
                {m.supplied > 0.5 && (
                  <div className={cn("border-2 border-b-0 border-foreground bg-mint", short <= 0.5 && "rounded-t-[3px]")} style={{ height: `${(m.supplied / Math.max(m.need, 1)) * 100}%` }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 border-t-[2.5px] border-foreground pt-1 font-mono text-[11px] font-bold text-muted-foreground sm:gap-1.5">
        {MONTHS.map((m) => (
          <span key={m} className="min-w-0 flex-1 text-center">
            {m[0]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
        <Key color="var(--sticker-sky)">Rain into the butt</Key>
        <Key color="var(--sticker-mint)">Garden water from the butt</Key>
        <Key color={DRY}>Short: from the tap</Key>
      </div>
      {clipped && <p className="text-xs font-semibold text-muted-foreground">The roof catches far more than the garden uses, so the rain bars are cut off at the top.</p>}
    </div>
  );
}

export function Key({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-3 rounded-[3px] border-2 border-foreground" style={{ background: color }} />
      {children}
    </span>
  );
}
