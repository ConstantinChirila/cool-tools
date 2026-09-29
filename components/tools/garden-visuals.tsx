"use client";

import * as React from "react";
import { LIMITS, MATERIALS, type Area, type Job, type Material } from "@/lib/garden-materials";
import { clamp, cn } from "@/lib/utils";

/* ------------------------------------------------------------ Textures -- */

const INK = "var(--foreground)";

/** Id of a material's fill pattern; `TextureDefs` must be on the page. */
const texture = (m: Material) => `url(#garden-tex-${m})`;

/** Hand-placed marks in a 40-unit tile, kept clear of the edges so tiles meet without seams. */
const SPECKS: [number, number, number][] = [
  [6, 7, 1.6], [17, 4, 1.1], [29, 9, 1.8], [35, 20, 1.2], [23, 17, 1.4], [9, 21, 1.1],
  [14, 31, 1.7], [27, 29, 1.2], [36, 34, 1.5], [4, 35, 1.2], [20, 36, 1], [31, 2.5, 1],
];
const CHIPS: [number, number, number][] = [
  [9, 8, 20], [27, 7, -30], [18, 19, 70], [33, 22, 10], [7, 28, -50], [24, 33, 35],
];
const PEBBLES: [number, number, number, number][] = [
  [8, 8, 6, 4.5], [22, 7, 5, 4], [33, 11, 4.5, 4], [14, 19, 5.5, 4.5], [29, 23, 6, 5],
  [7, 30, 5, 4], [19, 32, 5.5, 4.2], [33, 34, 4.5, 3.8],
];
const PEBBLE_FILLS = ["oklch(0.93 0.01 80)", "oklch(0.74 0.02 70)", "oklch(0.64 0.025 250)", "oklch(0.83 0.03 60)"];

function Tile({ material }: { material: Material }) {
  switch (material) {
    case "topsoil":
      return (
        <>
          <rect width={40} height={40} fill="oklch(0.47 0.06 55)" />
          {SPECKS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? "oklch(0.34 0.04 50)" : "oklch(0.62 0.06 65)"} />
          ))}
        </>
      );
    case "compost":
      return (
        <>
          <rect width={40} height={40} fill="oklch(0.33 0.035 50)" />
          {SPECKS.map(([x, y, r], i) => (
            <rect key={i} x={x - r} y={y - r * 0.7} width={r * 2.2} height={r * 1.4} rx={r * 0.6} fill={i % 4 ? "oklch(0.44 0.05 55)" : "oklch(0.25 0.02 50)"} />
          ))}
          <path d="M5 14 l6 -2 M24 25 l5 3 M30 15 l4 -3" stroke="oklch(0.6 0.08 75)" strokeWidth={1.2} strokeLinecap="round" />
        </>
      );
    case "mulch":
      return (
        <>
          <rect width={40} height={40} fill="oklch(0.4 0.05 50)" />
          {SPECKS.map(([x, y], i) => (
            <line
              key={i}
              x1={x - 3}
              y1={y}
              x2={x + 3}
              y2={y}
              transform={`rotate(${(i * 47) % 180} ${x} ${y})`}
              stroke={i % 2 ? "oklch(0.58 0.08 65)" : "oklch(0.3 0.03 50)"}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          ))}
        </>
      );
    case "bark":
      return (
        <>
          <rect width={40} height={40} fill="oklch(0.36 0.05 45)" />
          {CHIPS.map(([x, y, rot], i) => (
            <rect
              key={i}
              x={x - 6}
              y={y - 3}
              width={12}
              height={6}
              rx={1.8}
              transform={`rotate(${rot} ${x} ${y})`}
              fill={i % 2 ? "oklch(0.6 0.1 55)" : "oklch(0.5 0.09 45)"}
              stroke={INK}
              strokeWidth={0.8}
            />
          ))}
        </>
      );
    case "gravel":
      return (
        <>
          <rect width={40} height={40} fill="oklch(0.78 0.012 80)" />
          {PEBBLES.map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={PEBBLE_FILLS[i % PEBBLE_FILLS.length]} stroke={INK} strokeWidth={0.8} />
          ))}
        </>
      );
    case "sand":
      return (
        <>
          <rect width={40} height={40} fill="oklch(0.88 0.07 88)" />
          {SPECKS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={0.8} fill={i % 2 ? "oklch(0.7 0.08 75)" : "oklch(0.96 0.03 90)"} />
          ))}
          {SPECKS.map(([x, y], i) => (
            <circle key={`b${i}`} cx={(x + 11) % 38 + 1} cy={(y + 17) % 38 + 1} r={0.7} fill="oklch(0.7 0.08 75)" />
          ))}
        </>
      );
  }
}

/** Every material's fill pattern, once per page, for the SVGs below to reference. */
export function TextureDefs() {
  return (
    <svg width={0} height={0} className="absolute" aria-hidden focusable="false">
      <defs>
        {MATERIALS.map((m) => (
          <pattern key={m} id={`garden-tex-${m}`} patternUnits="userSpaceOnUse" width={40} height={40}>
            <Tile material={m} />
          </pattern>
        ))}
        <pattern id="garden-hatch" patternUnits="userSpaceOnUse" width={10} height={10} patternTransform="rotate(45)">
          <rect width={10} height={10} fill="oklch(0.74 0.035 65)" />
          <line x1={0} y1={0} x2={0} y2={10} stroke="oklch(0.62 0.04 60)" strokeWidth={3} />
        </pattern>
      </defs>
    </svg>
  );
}

/** A round sample of the material, for tabs. */
export function Swatch({ material, className }: { material: Material; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("shrink-0 rounded-full border-2 border-foreground", className)} aria-hidden>
      <rect width={40} height={40} fill={texture(material)} />
    </svg>
  );
}

/* -------------------------------------------------------- Cross-section -- */

const W = 600;
const H = 250;
const RULER = 64;
const GROUND = H - 46;
const TOP = 40;
const PX = GROUND - TOP;
const SCALES = [15, 20, 30, 40, 50, 60, 80, 100, 150];
/** A brick seen end-on: 102.5 mm wide, 65 mm tall. */
const BRICK = { w: 10.25, h: 6.5 };

export type DepthUnit = "cm" | "in";

function scaleFor(depth: number, job: Job): number {
  const need = Math.max(depth, job.max) * 1.3;
  return SCALES.find((s) => s >= need) ?? Math.ceil(need / 50) * 50;
}

function rulerTicks(scale: number, unit: DepthUnit): { at: number; label: string | null }[] {
  const per = unit === "in" ? 2.54 : 1;
  const span = scale / per;
  const step = [0.5, 1, 2, 5, 10, 20].find((s) => span / s <= 8) ?? 20;
  const ticks = [];
  for (let v = 0; v <= span + 1e-9; v += step / 2) {
    const major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
    ticks.push({ at: v * per, label: major ? String(Number(v.toFixed(1))) : null });
  }
  return ticks;
}

/**
 * The layer seen from the side: existing ground below, the material on top,
 * a ruler and a brick for scale. The top surface drags up and down to set
 * the depth; the job's usual range is marked with dashed lines.
 */
export function CrossSection({
  material,
  depth,
  job,
  unit,
  label,
  onDepth,
}: {
  material: Material;
  /** cm */
  depth: number;
  job: Job;
  unit: DepthUnit;
  /** Depth as shown to the reader, e.g. "25 cm". */
  label: string;
  onDepth: (cm: number) => void;
}) {
  const [frozen, setFrozen] = React.useState<number | null>(null);
  const scale = frozen ?? scaleFor(depth, job);
  const y = (cm: number) => GROUND - (Math.min(cm, scale) / scale) * PX;
  const surface = y(depth);
  const step = unit === "in" ? 0.635 : 0.5;
  const snap = (cm: number) => Math.round(cm / step) * step;

  const toPlan = (e: React.PointerEvent) => {
    const svg = e.currentTarget instanceof SVGSVGElement ? e.currentTarget : (e.currentTarget as SVGElement).ownerSVGElement;
    const ctm = svg?.getScreenCTM();
    return ctm ? new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()) : null;
  };

  const start = (e: React.PointerEvent<SVGGElement>) => {
    e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
    setFrozen(scale);
    move(e, scale);
  };

  const move = (e: React.PointerEvent, s = frozen) => {
    if (s === null) return;
    const p = toPlan(e);
    if (!p) return;
    onDepth(clamp(snap(((GROUND - p.y) / PX) * s), step, s));
  };

  const end = () => setFrozen(null);

  const keys = (e: React.KeyboardEvent) => {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    onDepth(clamp(snap(depth + delta * step * (e.shiftKey ? 10 : 1)), step, LIMITS.depth.max));
  };

  const pct = (x: number) => `${(x / W) * 100}%`;
  const pctY = (v: number) => `${(v / H) * 100}%`;
  const pxPerCm = PX / scale;
  const brick = { w: BRICK.w * pxPerCm, h: BRICK.h * pxPerCm };
  const brickX = W - 40 - brick.w;
  const handleX = RULER + (brickX - RULER) / 2;
  const edges = job.min === job.max ? [job.min] : [job.min, job.max];

  return (
    <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-sky/40 select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="group"
        aria-label={`Side view: ${label} of ${material} on the ground`}
        onPointerMove={(e) => move(e)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* Existing ground */}
        <rect x={RULER} y={GROUND} width={W - RULER} height={H - GROUND} fill="url(#garden-hatch)" />
        <line x1={RULER} x2={W} y1={GROUND} y2={GROUND} stroke={INK} strokeWidth={2} strokeDasharray="6 5" />

        {/* The layer */}
        <rect x={RULER} y={surface} width={W - RULER} height={GROUND - surface} fill={texture(material)} />

        {/* Usual depth for the job */}
        {edges.map((d) => (
          <line key={d} x1={RULER} x2={W} y1={y(d)} y2={y(d)} stroke={INK} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="3 5" />
        ))}

        {/* Brick for scale, standing on the old ground */}
        <rect x={brickX} y={GROUND - brick.h} width={brick.w} height={brick.h} rx={Math.min(3, brick.h / 6)} fill="oklch(0.62 0.13 35)" stroke={INK} strokeWidth={2} />

        {/* Ruler */}
        <rect x={0} y={0} width={RULER} height={H} fill="var(--card)" />
        <line x1={RULER} x2={RULER} y1={0} y2={H} stroke={INK} strokeWidth={2.5} />
        {edges.length === 2 && (
          <rect x={RULER - 14} y={y(job.max)} width={14} height={y(job.min) - y(job.max)} fill="var(--sticker-mint)" stroke={INK} strokeWidth={1.5} />
        )}
        {rulerTicks(scale, unit).map(({ at, label: l }) => (
          <line key={at} x1={RULER - (l ? 16 : 9)} x2={RULER} y1={y(at)} y2={y(at)} stroke={INK} strokeWidth={l ? 2 : 1.2} />
        ))}

        {/* The surface: drag it to set the depth */}
        <g
          role="slider"
          tabIndex={0}
          aria-label="Depth"
          aria-valuemin={step}
          aria-valuemax={LIMITS.depth.max}
          aria-valuenow={depth}
          aria-valuetext={label}
          onPointerDown={start}
          onKeyDown={keys}
          className="group cursor-ns-resize outline-none"
          style={{ touchAction: "none" }}
        >
          <rect x={RULER} y={surface - 16} width={W - RULER} height={32} fill="transparent" />
          <line x1={RULER} x2={W} y1={surface} y2={surface} stroke={INK} strokeWidth={3} />
          <rect
            x={handleX - 34}
            y={surface - 13}
            width={68}
            height={26}
            rx={13}
            fill="none"
            stroke="var(--ring)"
            strokeWidth={4}
            className="opacity-0 group-focus-visible:opacity-100"
          />
          <rect x={handleX - 28} y={surface - 9} width={56} height={18} rx={9} fill="var(--sticker-yellow)" stroke={INK} strokeWidth={2.5} />
          {[-8, 0, 8].map((dx) => (
            <line key={dx} x1={handleX + dx} x2={handleX + dx} y1={surface - 4} y2={surface + 4} stroke={INK} strokeWidth={2} strokeLinecap="round" />
          ))}
        </g>
      </svg>

      {/* Labels as HTML so they stay readable at any width */}
      {rulerTicks(scale, unit)
        .filter((t) => t.label !== null)
        .map((t) => (
          <span
            key={t.at}
            className="pointer-events-none absolute -translate-y-1/2 font-mono text-[10px] font-bold text-muted-foreground sm:text-[11px]"
            style={{ left: "4px", top: pctY(y(t.at)) }}
          >
            {t.label}
          </span>
        ))}
      <span className="pointer-events-none absolute font-mono text-[10px] font-bold text-muted-foreground sm:text-[11px]" style={{ left: "6px", top: "4px" }}>
        {unit}
      </span>
      <CrossLabel left={pct(handleX + 36)} top={pctY(surface)} className="-translate-y-1/2 bg-foreground text-background">
        {label}
      </CrossLabel>
      <CrossLabel left={pct(brickX - 8)} top={pctY(y(job.max))} className="-translate-x-full -translate-y-[calc(100%+4px)] border-dashed">
        {job.label}
      </CrossLabel>
      <span
        className="pointer-events-none absolute -translate-y-1/2 text-[10px] font-bold text-foreground/70 sm:text-xs"
        style={{ left: pct(RULER + 10), top: pctY((GROUND + H) / 2) }}
      >
        Existing ground
      </span>
    </div>
  );
}

function CrossLabel({ left, top, className, children }: { left: string; top: string; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute rounded-full border-2 border-foreground bg-card px-2 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap sm:text-xs",
        className,
      )}
      style={{ left, top }}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Areas -- */

/** One area drawn to its own proportions, so a 50 typed for 5 shows at a glance. */
export function AreaThumb({ area, material }: { area: Area; material: Material }) {
  const box = 32;
  const fill = area.cut ? "var(--card)" : texture(material);
  const common = {
    fill,
    stroke: INK,
    strokeWidth: 2,
    strokeDasharray: area.cut ? "4 3" : undefined,
    vectorEffect: "non-scaling-stroke" as const,
  };
  let shape: React.ReactNode;
  if (area.shape === "circle") {
    shape = <circle cx={24} cy={24} r={box / 2} {...common} />;
  } else if (area.shape === "rect" && area.length > 0 && area.width > 0) {
    const long = Math.max(area.length, area.width);
    // Keep very thin strips visible.
    const w = Math.max(3, (area.length / long) * box);
    const h = Math.max(3, (area.width / long) * box);
    shape = <rect x={24 - w / 2} y={24 - h / 2} width={w} height={h} rx={2} {...common} />;
  } else {
    shape = <rect x={24 - box / 2 + 3} y={24 - box / 2 + 3} width={box - 6} height={box - 6} rx={8} {...common} />;
  }
  return (
    <svg viewBox="0 0 48 48" className="size-12 shrink-0 rounded-xl border-2 border-foreground/15 bg-secondary" aria-hidden>
      {shape}
    </svg>
  );
}

/* ---------------------------------------------------------------- Bags -- */

const SACK = "M14 14 L10 8 Q18 4 28 7 Q38 4 46 8 L42 14 Q52 22 52 44 Q52 64 28 64 Q4 64 4 44 Q4 22 14 14 Z";
const BULK = "M6 18 L54 18 L56 62 L4 62 Z";

/**
 * A bag or bulk bag, filled with the material up to `fill` (0 to 1), so the
 * last one can show how much of it you'll use.
 */
export function BagIcon({ kind, material, fill = 1, className }: { kind: "bag" | "bulk"; material: Material; fill?: number; className?: string }) {
  const id = React.useId();
  const d = kind === "bag" ? SACK : BULK;
  const top = kind === "bag" ? 10 : 18;
  const level = 64 - (64 - top) * clamp(fill, 0, 1);
  return (
    <svg viewBox="0 0 60 68" className={cn("shrink-0", className)} aria-hidden>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill="var(--card)" />
      <rect x={0} y={level} width={60} height={68} fill={texture(material)} clipPath={`url(#${id})`} />
      {kind === "bulk" && (
        <path d="M12 18 Q12 4 20 6 Q24 8 22 18 M38 18 Q36 8 40 6 Q48 4 48 18" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      )}
      <path d={d} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}
