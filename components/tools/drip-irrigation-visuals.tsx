"use client";

import * as React from "react";
import { formatNumber, plural } from "@/lib/currency";
import { KIND_INFO, clockText, type Kind, type Zone, type ZoneResult } from "@/lib/irrigation";
import { cn } from "@/lib/utils";

const INK = "var(--foreground)";
const WATER = "oklch(0.62 0.13 235)";
export const OVER = "var(--sticker-pink)";

/** One colour per zone, deep enough to read on white and on the lilac card. */
export const ZONE_COLORS = ["var(--chart-4)", "var(--chart-2)", "var(--chart-3)", "var(--chart-1)", "var(--chart-5)", "oklch(0.55 0.08 60)"] as const;
export const zoneColor = (i: number) => ZONE_COLORS[i % ZONE_COLORS.length] ?? INK;

/** "22 min", "1 h 5 min", "40 s". */
export function durationText(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 1) return `${Math.max(Math.round(minutes * 60), 1)} s`;
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  return m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`;
}

/* -------------------------------------------------------------- Plants -- */

/** A plant of each kind, drawn in a 32 × 32 box with its base at y = 30. */
function PlantGlyph({ kind }: { kind: Kind }) {
  const leaf = "oklch(0.66 0.15 140)";
  switch (kind) {
    case "tomato":
      return (
        <>
          <rect x={4} y={22} width={24} height={8} rx={2} fill="oklch(0.92 0.02 90)" stroke={INK} strokeWidth={2} />
          <path d="M16 22 V4 M16 10 l-6 -3 M16 15 l6 -4" stroke={leaf} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={10} cy={13} r={3.2} fill="oklch(0.62 0.2 28)" stroke={INK} strokeWidth={1.5} />
          <circle cx={22} cy={17} r={3.2} fill="oklch(0.62 0.2 28)" stroke={INK} strokeWidth={1.5} />
        </>
      );
    case "pot":
      return (
        <>
          <path d="M9 9 q-3 -6 3 -7 q2 4 -1 7 M16 8 q0 -7 4 -7 q1 5 -2 8 M22 10 q4 -5 7 -2 q-2 3 -6 3" fill={leaf} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M6 12 H26 L23 30 H9 Z" fill="oklch(0.66 0.12 45)" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <path d="M5 12 H27 V16 H5 Z" fill="oklch(0.6 0.12 45)" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </>
      );
    case "basket":
      return (
        <>
          <path d="M16 0 L6 14 M16 0 L26 14" stroke={INK} strokeWidth={1.5} />
          <path d="M4 14 H28 Q28 26 16 26 Q4 26 4 14 Z" fill="oklch(0.55 0.06 70)" stroke={INK} strokeWidth={2} />
          <circle cx={9} cy={13} r={3} fill="var(--sticker-pink)" stroke={INK} strokeWidth={1.2} />
          <circle cx={16} cy={11} r={3} fill="oklch(0.85 0.14 95)" stroke={INK} strokeWidth={1.2} />
          <circle cx={23} cy={13} r={3} fill="var(--sticker-lilac)" stroke={INK} strokeWidth={1.2} />
          <path d="M8 24 q-1 4 1 6 M24 24 q1 4 -1 6" fill="none" stroke={leaf} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "bed":
      return (
        <>
          <rect x={1} y={20} width={30} height={10} rx={1.5} fill="oklch(0.47 0.06 55)" stroke={INK} strokeWidth={2} />
          <path d="M7 20 q-3 -6 0 -9 q3 3 0 9 M16 20 q-3 -7 0 -11 q3 4 0 11 M25 20 q-3 -6 0 -9 q3 3 0 9" fill={leaf} stroke={INK} strokeWidth={1.3} />
        </>
      );
    case "shrub":
      return (
        <>
          <path d="M16 30 V20" stroke="oklch(0.45 0.06 55)" strokeWidth={3} />
          <path d="M5 20 q-3 -9 5 -11 q2 -8 10 -6 q8 -1 8 7 q5 5 -1 10 Z" fill={leaf} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </>
      );
    case "custom":
      return (
        <>
          <path d="M16 30 V14" stroke={leaf} strokeWidth={2.5} />
          <path d="M16 18 q-10 -2 -9 -11 q9 0 9 11 M16 15 q8 -2 9 -10 q-9 0 -9 10" fill={leaf} stroke={INK} strokeWidth={1.5} />
          <rect x={9} y={27} width={14} height={4} rx={1} fill="oklch(0.47 0.06 55)" />
        </>
      );
  }
}

/** A plant icon on its own, for pickers and lists. */
export function PlantIcon({ kind, className }: { kind: Kind; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <PlantGlyph kind={kind} />
    </svg>
  );
}

/* ----------------------------------------------------------- Schematic -- */

/** Plants drawn on a lane before the rest become a count. */
const MAX_PLANTS = 10;
const LANE_H = 66;
const PIPE_Y = 12;
const STEP = 42;

/** CSS for the moving water in the running zone's pipe; still when the reader prefers less motion. */
const FLOW_CSS = `@keyframes drip-flow{to{stroke-dashoffset:-16}}@media (prefers-reduced-motion:no-preference){.drip-flow{animation:drip-flow .8s linear infinite}}`;

function Lane({ zone, result, color, active, last }: { zone: Zone; result: ZoneResult; color: string; active: boolean; last: boolean }) {
  const shown = Math.min(Math.round(zone.plants), MAX_PLANTS);
  const extra = Math.round(zone.plants) - shown;
  const dots = Math.min(Math.round(zone.drippersPerPlant), 4);
  const first = 44;
  const end = Math.max(first + (shown - 1) * STEP + 26, 70);
  const width = end + (extra > 0 ? 50 : 30);
  return (
    <svg viewBox={`0 0 ${width} ${LANE_H}`} preserveAspectRatio="xMinYMin meet" className="-ml-[3.5px] block h-16 w-auto max-w-full" aria-hidden>
      {/* The supply pipe passing down to the next zone, and the tee into this one. */}
      <path d={`M3.5 0 V${last ? PIPE_Y : LANE_H}`} stroke={INK} strokeWidth={7} />
      <path d={`M3.5 ${PIPE_Y} H${end}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d={`M7 ${PIPE_Y} H${end}`} stroke={active ? WATER : "var(--card)"} strokeWidth={3} strokeLinecap="round" />
      {active && <path d={`M7 ${PIPE_Y} H${end}`} stroke="var(--card)" strokeWidth={3} strokeDasharray="4 12" className="drip-flow" />}
      <circle cx={end + 2} cy={PIPE_Y} r={4.5} fill={color} stroke={INK} strokeWidth={2} />
      {Array.from({ length: shown }, (_, i) => {
        const x = first + i * STEP;
        return (
          <g key={i}>
            <path d={`M${x} ${PIPE_Y + 3} V${PIPE_Y + 14} H${x - 4}`} fill="none" stroke={INK} strokeWidth={1.5} />
            {Array.from({ length: dots }, (_, d) => (
              <circle key={d} cx={x - 6 + d * 5} cy={PIPE_Y + 17} r={2.4} fill={active ? WATER : color} stroke={INK} strokeWidth={1} />
            ))}
            <g transform={`translate(${x - 16} ${LANE_H - 34})`}>
              <PlantGlyph kind={zone.kind} />
            </g>
          </g>
        );
      })}
      {extra > 0 && (
        <text x={end + 6} y={LANE_H - 12} fontSize={16} fontWeight={800} fontFamily="var(--font-mono)" fill={INK}>
          +{extra}
        </text>
      )}
      {result.over && <path d={`M${end + 12} ${PIPE_Y - 8} l7 13 h-14 Z`} fill={OVER} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />}
    </svg>
  );
}

/** The tap end of the system: wall tap, timer, filter and pressure reducer. */
function Headworks() {
  return (
    <svg viewBox="0 0 150 56" className="block h-10 w-[107px] shrink-0 sm:h-14 sm:w-[150px]" aria-hidden>
      <rect x={0} y={0} width={14} height={56} fill="oklch(0.78 0.07 40)" stroke={INK} strokeWidth={2} />
      <path d="M2 10 H12 M2 22 H12 M2 34 H12 M2 46 H12" stroke={INK} strokeOpacity={0.3} strokeWidth={1.5} />
      <path d="M14 24 H30 V30" fill="none" stroke={INK} strokeWidth={6} />
      <rect x={20} y={14} width={10} height={6} rx={2} fill="var(--sticker-yellow)" stroke={INK} strokeWidth={2} />
      <rect x={34} y={26} width={30} height={24} rx={5} fill="var(--sticker-lilac)" stroke={INK} strokeWidth={2.5} />
      <circle cx={49} cy={38} r={6.5} fill="var(--card)" stroke={INK} strokeWidth={2} />
      <path d="M49 38 V34 M49 38 h3" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M30 30 V38 H34 M64 38 H76" stroke={INK} strokeWidth={4} />
      <rect x={76} y={30} width={24} height={16} rx={3} fill="var(--card)" stroke={INK} strokeWidth={2.5} />
      <path d="M81 34 V42 M86 34 V42 M91 34 V42 M96 34 V42" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} />
      <path d="M100 38 H108" stroke={INK} strokeWidth={4} />
      <path d="M108 32 H126 L132 38 L126 44 H108 Z" fill="var(--sticker-yellow)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M132 38 H140 V56" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M132 38 H140 V56" fill="none" stroke={WATER} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The whole system from the tap: timer, filter and reducer, then one lane
 * per zone with every plant on its drip line. The running zone's pipe has
 * water moving through it; a zone the tap can't run at once is pink.
 */
export function SystemSchematic({
  zones,
  results,
  active,
  onActive,
}: {
  zones: readonly Zone[];
  results: readonly ZoneResult[];
  active: number;
  onActive: (i: number) => void;
}) {
  return (
    <div className="min-w-0">
      <style>{FLOW_CSS}</style>
      <div className="flex items-end gap-3">
        <Headworks />
        <p className="pb-1 text-xs font-bold text-muted-foreground">Tap · timer · filter · pressure reducer</p>
      </div>
      <ol className="relative ml-[100px] sm:ml-[140px]">
        {zones.map((z, i) => {
          const r = results[i];
          if (!r) return null;
          const last = i === zones.length - 1;
          const color = zoneColor(i);
          return (
            <li key={i} className="relative">
              {/* The supply pipe between lanes; each lane draws its own tee. */}
              <span aria-hidden className={cn("absolute left-0 w-[7px] -translate-x-1/2 bg-foreground", last ? "top-0 h-2" : "inset-y-0")} />
              <button
                type="button"
                onClick={() => onActive(i)}
                onPointerEnter={() => onActive(i)}
                onFocus={() => onActive(i)}
                aria-pressed={active === i}
                className={cn(
                  "block w-full rounded-r-xl pt-1.5 pr-2 pb-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  r.over ? "bg-pink/60" : active === i ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <Lane zone={z} result={r} color={color} active={active === i} last={last} />
                <span className="flex flex-wrap items-baseline gap-x-2 pl-3 text-sm font-bold">
                  <span className="inline-block size-3 rounded-full border-2 border-foreground" style={{ background: color }} />
                  Zone {i + 1}: {KIND_INFO[z.kind].label}
                  <span className="font-mono text-xs text-muted-foreground">
                    {plural(r.drippers, "dripper")} · {formatNumber(r.flow, 0)} L/h{r.over ? ` · too much for the tap: split into ${r.split}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* --------------------------------------------------------------- Gauge -- */

/**
 * A zone's flow against the tap: the track is the tap's full flow, hatched
 * past the design margin; the bar is what the zone's drippers draw, pink
 * once it runs past the margin.
 */
export function FlowGauge({ flow, usable, tap, color, label }: { flow: number; usable: number; tap: number; color: string; label: string }) {
  const scale = Math.max(tap, flow, 1);
  const over = flow > usable + 1e-9;
  return (
    <div className="relative h-4 w-full overflow-hidden rounded-full border-2 border-foreground bg-card" role="img" aria-label={label}>
      <div
        className="absolute inset-y-0 right-0"
        style={{
          left: `${(usable / scale) * 100}%`,
          background: "repeating-linear-gradient(135deg, var(--secondary) 0 4px, oklch(0.8 0.01 60) 4px 6px)",
        }}
      />
      <div className="absolute inset-y-0 left-0 border-r-2 border-foreground" style={{ width: `${Math.min(flow / scale, 1) * 100}%`, background: over ? OVER : color, minWidth: flow > 0 ? 4 : 0 }} />
      <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${(usable / scale) * 100}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------ Timeline -- */

export interface Run {
  zone: number;
  minutes: number;
}

/**
 * One watering, zone after zone: a bar split by run time in zone colours,
 * with the clock time each zone starts underneath.
 */
export function RunSequence({ runs, start, active, onActive }: { runs: readonly Run[]; start: number; active: number; onActive: (i: number) => void }) {
  const total = runs.reduce((s, r) => s + r.minutes, 0);
  if (total <= 0) return null;
  const marks = runs.map((_, i) => start + runs.slice(0, i).reduce((s, r) => s + r.minutes, 0));
  return (
    <div className="space-y-1">
      <div className="flex h-9 w-full overflow-hidden rounded-xl border-[2.5px] border-foreground bg-card">
        {runs.map((r, i) =>
          r.minutes > 0 ? (
            <button
              key={r.zone}
              type="button"
              onClick={() => onActive(r.zone)}
              onPointerEnter={() => onActive(r.zone)}
              aria-label={`Zone ${r.zone + 1}: ${durationText(r.minutes)} from ${clockText(marks[i] ?? start)}`}
              className={cn(
                "flex h-full min-w-2 items-center justify-center border-r-[2.5px] border-foreground font-mono text-xs font-bold last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                active === r.zone && "underline decoration-2 underline-offset-2",
              )}
              style={{ width: `${(r.minutes / total) * 100}%`, background: zoneColor(r.zone) }}
            >
              <span className="truncate px-1 text-white">{r.minutes / total > 0.12 ? durationText(r.minutes) : ""}</span>
            </button>
          ) : null,
        )}
      </div>
      <div className="flex justify-between font-mono text-xs font-bold text-muted-foreground">
        <span>{clockText(start)}</span>
        <span>done {clockText(start + total)}</span>
      </div>
    </div>
  );
}

/** The day from midnight to midnight, with each watering marked where it falls. */
export function DayStrip({ waterings }: { waterings: readonly { start: number; minutes: number }[] }) {
  return (
    <div className="space-y-1">
      <div className="relative h-7 w-full overflow-hidden rounded-full border-[2.5px] border-foreground" style={{ background: "linear-gradient(90deg, oklch(0.42 0.06 270) 0%, oklch(0.42 0.06 270) 20%, var(--sticker-yellow) 30%, var(--sticker-yellow) 72%, oklch(0.42 0.06 270) 85%)" }}>
        {waterings.map((w, i) => (
          <div
            key={i}
            className="absolute inset-y-0 border-x-2 border-foreground"
            style={{ left: `${(w.start / 1440) * 100}%`, width: `max(6px, ${(Math.min(w.minutes, 1440) / 1440) * 100}%)`, background: WATER }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[11px] font-bold text-muted-foreground">
        {["00:00", "06:00", "12:00", "18:00", "24:00"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Pipe -- */

/** Pipe ends side by side to scale: the supply pipe and a micro tube, full of water. */
export function PipeEnds({ supplyId, microId, className }: { supplyId: number; microId: number; className?: string }) {
  const k = 2.6;
  const R = supplyId / 2 + 1.5;
  const r = microId / 2 + 1;
  return (
    <svg viewBox={`0 0 ${(R * 2 + r * 2) * k + 20} ${R * 2 * k + 6}`} className={cn("shrink-0", className)} aria-hidden>
      <circle cx={R * k + 3} cy={R * k + 3} r={R * k} fill="oklch(0.3 0.01 60)" stroke={INK} strokeWidth={2} />
      <circle cx={R * k + 3} cy={R * k + 3} r={(supplyId / 2) * k} fill={WATER} />
      <circle cx={R * 2 * k + 14 + r * k} cy={R * k + 3} r={r * k} fill="oklch(0.3 0.01 60)" stroke={INK} strokeWidth={2} />
      <circle cx={R * 2 * k + 14 + r * k} cy={R * k + 3} r={(microId / 2) * k} fill={WATER} />
    </svg>
  );
}
