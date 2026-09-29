"use client";

import * as React from "react";
import { Swatch, texture } from "@/components/tools/garden-visuals";
import { INGREDIENTS, INGREDIENT_INFO, shares, type Ingredient, type Mix } from "@/lib/raised-bed";
import { clamp, cn } from "@/lib/utils";

const INK = "var(--foreground)";
const WOOD = {
  rim: "oklch(0.87 0.07 78)",
  left: "oklch(0.8 0.08 70)",
  right: "oklch(0.72 0.08 65)",
  inside: "oklch(0.6 0.07 60)",
};

/* ----------------------------------------------------------- The bed -- */

const VW = 600;
const VH = 320;
const PAD = 36;
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

/**
 * One bed drawn in isometric: the boards in rows on the two near sides, the
 * soil inside at its fill depth, and the far walls showing above it. All
 * sizes in metres; the drawing is to scale.
 */
export function BedDrawing({
  length,
  width,
  height,
  depth,
  thickness,
  boardHeight,
  soil,
  labels,
  count,
}: {
  /** Internal length and width. */
  length: number;
  width: number;
  /** Height of the boards. */
  height: number;
  /** Fill depth. */
  depth: number;
  thickness: number;
  /** Board face height, for the rows; 0 draws one smooth side. */
  boardHeight: number;
  soil: Ingredient;
  labels: { length: string; width: string; height: string };
  count: number;
}) {
  const t = thickness;
  const L = Math.max(0.05, length) + 2 * t;
  const W = Math.max(0.05, width) + 2 * t;
  const H = Math.max(0.01, height);
  const d = clamp(depth, 0, H);

  const s = Math.min((VW - 2 * PAD) / ((L + W) * COS), (VH - 2 * PAD) / ((L + W) * SIN + H));
  const drawnW = (L + W) * COS * s;
  const drawnH = ((L + W) * SIN + H) * s;
  const ox = (VW - drawnW) / 2 + W * COS * s;
  const oy = (VH - drawnH) / 2 + H * s;

  const p = (x: number, y: number, z: number): [number, number] => [ox + (x - y) * COS * s, oy + (x + y) * SIN * s - z * s];
  const poly = (...pts: [number, number, number][]) =>
    pts
      .map((pt) => p(...pt))
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");

  const rows = boardHeight > 0 ? Math.round(H / boardHeight) : 1;
  const seams = Array.from({ length: Math.max(0, rows - 1) }, (_, i) => (i + 1) * (H / rows));
  const line = (a: [number, number, number], b: [number, number, number], key: React.Key, props: React.SVGProps<SVGLineElement> = {}) => {
    const [x1, y1] = p(...a);
    const [x2, y2] = p(...b);
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={1.5} {...props} />;
  };

  const pct = ([x, y]: [number, number]) => ({ left: `${(x / VW) * 100}%`, top: `${(y / VH) * 100}%` });

  return (
    <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-sky/40 select-none">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="block h-auto w-full" role="img" aria-label={`Raised bed ${labels.length} by ${labels.width}, ${labels.height} high`}>
        {/* Hard sticker shadow on the ground */}
        <polygon points={poly([0, 0, 0], [L, 0, 0], [L, W, 0], [0, W, 0])} fill={INK} transform="translate(7 7)" />

        {/* Far walls, inside, above the soil */}
        <polygon points={poly([t, t, d], [t, W - t, d], [t, W - t, H], [t, t, H])} fill={WOOD.inside} />
        <polygon points={poly([t, t, d], [L - t, t, d], [L - t, t, H], [t, t, H])} fill={WOOD.inside} />
        {seams.filter((z) => z > d).flatMap((z, i) => [
          line([t, t, z], [t, W - t, z], `iy${i}`, { strokeOpacity: 0.5 }),
          line([t, t, z], [L - t, t, z], `ix${i}`, { strokeOpacity: 0.5 }),
        ])}
        {line([t, t, d], [t, t, H], "corner")}

        {/* The soil */}
        <polygon points={poly([t, t, d], [L - t, t, d], [L - t, W - t, d], [t, W - t, d])} fill={texture(soil)} stroke={INK} strokeWidth={1.5} />

        {/* Near sides, in rows of boards */}
        <polygon points={poly([0, W, 0], [L, W, 0], [L, W, H], [0, W, H])} fill={WOOD.left} />
        <polygon points={poly([L, 0, 0], [L, W, 0], [L, W, H], [L, 0, H])} fill={WOOD.right} />
        {seams.flatMap((z, i) => [line([0, W, z], [L, W, z], `sy${i}`), line([L, 0, z], [L, W, z], `sx${i}`)])}

        {/* Top of the boards */}
        <path
          d={`M${poly([0, 0, H], [L, 0, H], [L, W, H], [0, W, H])}Z M${poly([t, t, H], [t, W - t, H], [L - t, W - t, H], [L - t, t, H])}Z`}
          fill={WOOD.rim}
          fillRule="evenodd"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polyline
          points={poly([0, W, H], [0, W, 0], [L, W, 0], [L, 0, 0], [L, 0, H])}
          fill="none"
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {line([L, W, 0], [L, W, H], "front", { strokeWidth: 2.5 })}
      </svg>

      {/* Labels as HTML so they stay readable at any width */}
      <Tag style={pct(p(L / 2, W, 0))} className="translate-x-[-110%] translate-y-1">
        {labels.length}
      </Tag>
      <Tag style={pct(p(L, W / 2, 0))} className="translate-x-[10%] translate-y-1">
        {labels.width}
      </Tag>
      <Tag style={{ left: "10px", top: "10px" }} className="bg-foreground text-background">
        {labels.height}
      </Tag>
      {count > 1 && (
        <span className="sticker-sm absolute top-2.5 right-2.5 rotate-3 rounded-full bg-yellow px-2.5 py-0.5 font-heading text-sm font-black">
          × {count} beds
        </span>
      )}
      <span className="pointer-events-none absolute bottom-2 left-3 text-[10px] font-bold text-foreground/60 sm:text-xs">Inside sizes, drawn to scale</span>
    </div>
  );
}

function Tag({ style, className, children }: { style: React.CSSProperties; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute rounded-full border-2 border-foreground bg-card px-2 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap sm:text-xs",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------- The mix -- */

const SNAP = 5;

/**
 * The mix as one bar split into ingredients, with two handles to drag the
 * splits. Dragging always leaves whole percentages that add up to 100.
 */
export function MixBar({ mix, onChange }: { mix: Mix; onChange: (mix: Mix) => void }) {
  const bar = React.useRef<HTMLDivElement>(null);
  const split = shares(mix);
  const empty = INGREDIENTS.every((i) => split[i] === 0);
  const a = Math.round(split.topsoil * 100);
  const b = Math.round((split.topsoil + split.compost) * 100);

  const set = (first: number, second: number) => onChange({ topsoil: first, compost: second - first, manure: 100 - second });
  const moveTo = (handle: 0 | 1, value: number) => {
    const v = clamp(value, 0, 100);
    if (handle === 0) set(Math.min(v, b), b);
    else set(a, Math.max(v, a));
  };

  const drag = (handle: 0 | 1) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const rect = bar.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    moveTo(handle, Math.round((((e.clientX - rect.left) / rect.width) * 100) / SNAP) * SNAP);
  };

  const keys = (handle: 0 | 1) => (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    moveTo(handle, (handle === 0 ? a : b) + step * (e.shiftKey ? 10 : 1));
  };

  const segments = INGREDIENTS.map((i, n) => ({
    i,
    pct: split[i] * 100,
    start: INGREDIENTS.slice(0, n).reduce((sum, j) => sum + split[j] * 100, 0),
  }));
  // When the handles meet, the one that can still move goes on top.
  const onTop: 0 | 1 = a === b && a >= 50 ? 0 : 1;

  return (
    <div className="space-y-2">
      <div ref={bar} className="relative h-14 rounded-2xl border-[2.5px] border-foreground bg-secondary">
        <svg className="absolute inset-0 size-full overflow-hidden rounded-[13px]" aria-hidden>
          {segments.map(({ i, pct, start }) =>
            pct > 0 ? <rect key={i} x={`${start}%`} y={0} width={`${pct}%`} height="100%" fill={texture(i)} /> : null,
          )}
        </svg>
        {segments.map(({ i, pct, start }) =>
          pct < 14 ? null : (
            <span
              key={i}
              className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-card px-2 py-0.5 text-xs font-bold whitespace-nowrap"
              style={{ left: `${start + pct / 2}%` }}
            >
              {INGREDIENT_INFO[i].label} <span className="font-mono">{Math.round(pct)}%</span>
            </span>
          ),
        )}
        {!empty &&
          ([0, 1] as const).map((handle) => {
            const value = handle === 0 ? a : b;
            const [left, right] = handle === 0 ? ["topsoil", "compost"] : ["compost", "manure"];
            return (
              <button
                key={handle}
                type="button"
                role="slider"
                aria-label={`Split between ${left} and ${right}`}
                aria-valuemin={handle === 0 ? 0 : a}
                aria-valuemax={handle === 0 ? b : 100}
                aria-valuenow={value}
                aria-valuetext={`${value}%`}
                onPointerDown={drag(handle)}
                onPointerMove={drag(handle)}
                onKeyDown={keys(handle)}
                className={cn(
                  "group absolute top-1/2 flex h-[calc(100%+14px)] w-7 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center outline-none",
                  handle === onTop ? "z-20" : "z-10",
                )}
                style={{ left: `${value}%`, touchAction: "none" }}
              >
                <span className="h-full w-3.5 rounded-full border-[2.5px] border-foreground bg-yellow group-focus-visible:ring-4 group-focus-visible:ring-ring/60" />
              </button>
            );
          })}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {INGREDIENTS.map((i) => (
          <li key={i} className="flex items-center gap-1.5 text-sm font-semibold">
            <Swatch material={i} className="size-4" />
            {INGREDIENT_INFO[i].label}
            <span className="font-mono text-xs font-bold text-muted-foreground">{Math.round(split[i] * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
