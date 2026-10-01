"use client";

import * as React from "react";
import { texture } from "@/components/tools/garden-visuals";
import { formatNumber } from "@/lib/currency";
import type { CutOut, Layout, Patio, SlabKind } from "@/lib/patio";
import { svgPoint } from "@/lib/svg";
import { clamp, cn } from "@/lib/utils";

/** Slab faces, one per material, light enough for ink outlines to read. */
export const SLAB_FILL: Record<SlabKind, string> = {
  porcelain: "oklch(0.9 0.008 250)",
  sandstone: "oklch(0.85 0.05 75)",
  concrete: "oklch(0.82 0.01 80)",
};
export const CUT_FILL = "var(--sticker-yellow)";
export const NOTCH_FILL = "var(--sticker-pink)";
const JOINT_FILL = "oklch(0.55 0.01 80)";

/** Tallest a plan is drawn, in rem, so a long thin patio doesn't fill the screen. */
const PLAN_MAX_HEIGHT = 26;

/**
 * CSS widths that put every patio on one scale: the longest fills the
 * column, unless the deepest would then be taller than the cap.
 */
export function planWidths(patios: readonly Patio[]): string[] {
  const maxL = Math.max(...patios.map((p) => p.length), 0.01);
  const maxW = Math.max(...patios.map((p) => p.width), 0.01);
  return patios.map((p) => `min(${(p.length / maxL) * 100}%, ${((PLAN_MAX_HEIGHT * p.length) / maxW).toFixed(2)}rem)`);
}

/**
 * A patio from above, to scale: the house along the top, every slab drawn
 * where it goes, cut pieces in yellow and notched ones in pink. Cut-outs drag
 * around the patio; their sizes are typed in the list.
 */
export function PatioPlan({
  patio,
  layout,
  kind,
  label,
  width,
  onMoveCutOut,
}: {
  patio: Patio;
  layout: Layout;
  kind: SlabKind;
  label: string;
  /** CSS width, so several plans share one scale. */
  width: string;
  onMoveCutOut: (index: number, cut: CutOut) => void;
}) {
  const L = Math.max(patio.length * 1000, 1);
  const W = Math.max(patio.width * 1000, 1);
  const drag = React.useRef<{ index: number; dx: number; dy: number } | null>(null);

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    const p = svgPoint(e);
    if (!d || !p) return;
    const cut = patio.cutOuts[d.index];
    if (!cut) return;
    // Snap to the centimetre so the typed position stays tidy.
    const x = clamp(Math.round((p.x - d.dx) / 10) / 100, 0, Math.max(patio.length - cut.w, 0));
    const y = clamp(Math.round((p.y - d.dy) / 10) / 100, 0, Math.max(patio.width - cut.h, 0));
    if (x !== cut.x || y !== cut.y) onMoveCutOut(d.index, { ...cut, x, y });
  };

  return (
    <figure className="space-y-1.5" style={{ width }}>
      <div
        className="flex h-6 items-center justify-center rounded-t-lg border-[2.5px] border-b-0 border-foreground text-[11px] font-bold tracking-wide uppercase"
        style={{ background: "repeating-linear-gradient(135deg, var(--secondary) 0 7px, oklch(0.86 0.02 70) 7px 10px)" }}
      >
        House
      </div>
      <svg
        viewBox={`0 0 ${L} ${W}`}
        className="block w-full touch-none border-[2.5px] border-foreground bg-card"
        role="img"
        aria-label={`${label}: ${layout.pieces.length} pieces, plan to scale`}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <rect width={L} height={W} fill={JOINT_FILL} />
        {layout.pieces.map((p, i) => (
          <rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            fill={p.kind === "full" ? SLAB_FILL[kind] : p.kind === "cut" ? CUT_FILL : NOTCH_FILL}
            stroke="var(--foreground)"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {patio.cutOuts.map((c, i) => (
          <rect
            key={`cut${i}`}
            x={c.x * 1000}
            y={c.y * 1000}
            width={Math.max(c.w * 1000, 1)}
            height={Math.max(c.h * 1000, 1)}
            fill={texture("topsoil")}
            stroke="var(--foreground)"
            strokeWidth={2}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
            className="cursor-move"
            onPointerDown={(e) => {
              const p = svgPoint(e);
              if (!p) return;
              e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
              drag.current = { index: i, dx: p.x - c.x * 1000, dy: p.y - c.y * 1000 };
            }}
          />
        ))}
      </svg>
      <figcaption className="flex justify-between font-mono text-xs font-bold text-muted-foreground">
        <span>{label}</span>
        <span>
          {formatNumber(patio.length, 2)} × {formatNumber(patio.width, 2)} m
        </span>
      </figcaption>
    </figure>
  );
}

/** The legend under the plans: what each colour means and how many there are. */
export function PlanLegend({ kind, full, cut, notched, cutOuts }: { kind: SlabKind; full: number; cut: number; notched: number; cutOuts: number }) {
  const items = [
    { fill: SLAB_FILL[kind], label: `${full} whole` },
    { fill: CUT_FILL, label: `${cut} cut` },
    ...(notched ? [{ fill: NOTCH_FILL, label: `${notched} notched` }] : []),
    ...(cutOuts ? [{ fill: texture("topsoil"), label: `${cutOuts} cut-out${cutOuts === 1 ? "" : "s"} (drag to move)` }] : []),
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <svg viewBox="0 0 14 14" className="size-3.5 shrink-0" aria-hidden>
            <rect x={1} y={1} width={12} height={12} rx={2} fill={item.fill} stroke="var(--foreground)" strokeWidth={1.5} />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The patio cut through from the side: slab, mortar bed and sub-base on the
 * ground, drawn in proportion, with each layer's depth.
 */
export function BuildUp({ kind, slab, bed, subBase, className }: { kind: SlabKind; slab: number; bed: number; subBase: number; className?: string }) {
  const layers = [
    { name: "Slab", mm: slab, fill: SLAB_FILL[kind] },
    { name: "Mortar bed", mm: bed, fill: texture("sand") },
    { name: "MOT Type 1", mm: subBase, fill: texture("gravel") },
  ].filter((l) => l.mm > 0);
  const total = layers.reduce((s, l) => s + l.mm, 0);
  // Thin layers get a minimum height so their label has room.
  const heights = layers.map((l) => Math.max((l.mm / Math.max(total, 1)) * 150, 18));
  const soil = 34;
  const H = heights.reduce((s, h) => s + h, 0) + soil;
  let y = 0;

  return (
    <div className={cn("grid grid-cols-[1fr_auto] items-stretch gap-3", className)}>
      <svg viewBox={`0 0 200 ${H}`} className="h-auto w-full rounded-lg border-[2.5px] border-foreground" preserveAspectRatio="none" aria-hidden>
        {layers.map((l, i) => {
          const top = y;
          y += heights[i] ?? 0;
          return <rect key={l.name} x={0} y={top} width={200} height={heights[i]} fill={l.fill} stroke="var(--foreground)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
        })}
        <rect x={0} y={y} width={200} height={soil} fill={texture("topsoil")} />
      </svg>
      <ul className="flex flex-col text-xs font-bold">
        {layers.map((l, i) => (
          <li key={l.name} className="flex items-center" style={{ flexGrow: heights[i] }}>
            {l.name} <span className="ml-1.5 font-mono text-muted-foreground">{formatNumber(l.mm, 0)} mm</span>
          </li>
        ))}
        <li className="flex items-center text-muted-foreground" style={{ flexGrow: soil }}>
          Firm ground
        </li>
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- Icons -- */

/** A slab tilted to show its edge. */
export function SlabIcon({ kind, className }: { kind: SlabKind; className?: string }) {
  return (
    <svg viewBox="0 0 36 30" className={cn("shrink-0", className)} aria-hidden>
      <path d="M3 13 L18 5 L33 13 L18 21 Z" fill={SLAB_FILL[kind]} stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
      <path d="M3 13 V17 L18 25 V21 M18 25 L33 17 V13" fill="oklch(0.7 0.02 70)" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

/** A paper sack of cement. */
export function CementBag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 34" className={cn("shrink-0", className)} aria-hidden>
      <path d="M5 6 Q15 3 25 6 L27 30 Q15 33 3 30 Z" fill="oklch(0.86 0.03 85)" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
      <rect x={8} y={13} width={14} height={8} rx={1.5} fill="var(--sticker-sky)" stroke="var(--foreground)" strokeWidth={1.5} />
    </svg>
  );
}

/** A tub of brush-in jointing compound. */
export function Tub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <path d="M5 9 H27 L25 29 H7 Z" fill="oklch(0.62 0.02 250)" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
      <rect x={3} y={5} width={26} height={5} rx={1.5} fill="var(--sticker-lilac)" stroke="var(--foreground)" strokeWidth={2} />
      <path d="M11 17 H21" stroke="var(--foreground)" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
