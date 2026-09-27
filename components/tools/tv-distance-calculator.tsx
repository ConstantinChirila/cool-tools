"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { PillButton } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  COMMON_SIZES,
  FOOT,
  INCH,
  RESOLUTIONS,
  RESOLUTION_INFO,
  SWEET_SPOT,
  TOO_CLOSE_ANGLE,
  TOO_FAR_ANGLE,
  detailDistance,
  detailVerdict,
  distanceForAngle,
  screenSize,
  sizeForAngle,
  viewingAngle,
  zoneBands,
  zoneFor,
  type Resolution,
  type ZoneId,
} from "@/lib/tv-distance";
import { clamp, cn } from "@/lib/utils";

type Unit = "m" | "ft";
const UNITS = ["m", "ft"] as const;

const DEFAULT_SIZE = 55;
const DEFAULT_DISTANCE = 2.5;
/** Sizes the plan can be dragged between; typed sizes can go further. */
const DRAG_SIZE = { min: 24, max: 100 };
const DISTANCE_RANGE = { min: 0.3, max: 15 };

const UNIT_OPTIONS = [
  { value: "m" as const, label: "Metres" },
  { value: "ft" as const, label: "Feet" },
];
const RESOLUTION_OPTIONS = RESOLUTIONS.map((value) => ({ value, label: RESOLUTION_INFO[value].label }));

const ZONE_FILL: Record<ZoneId, string> = {
  tooClose: "var(--sticker-pink)",
  immersive: "var(--sticker-lilac)",
  sweetSpot: "var(--sticker-mint)",
  bitFar: "var(--sticker-yellow)",
  tooFar: "var(--secondary)",
};

function feet(m: number): string {
  const total = Math.round(m / INCH);
  const ft = Math.floor(total / 12);
  const inches = total % 12;
  return inches ? `${ft}′${inches}″` : `${ft}′`;
}

function length(m: number, unit: Unit, decimals = 1): string {
  return unit === "ft" ? feet(m) : `${m.toFixed(decimals)} m`;
}

function lengthRange(a: number, b: number, unit: Unit): string {
  return unit === "ft" ? `${feet(a)}–${feet(b)}` : `${a.toFixed(1)}–${b.toFixed(1)} m`;
}

const degrees = (angle: number) => `${Math.round(angle)}°`;

export function TvDistanceCalculator() {
  const [size, setSize] = React.useState(DEFAULT_SIZE);
  const [distance, setDistance] = React.useState(DEFAULT_DISTANCE);
  const [resolution, setResolution] = React.useState<Resolution>("4k");
  const [unit, setUnit] = React.useState<Unit>("m");

  useUrlState({
    size: urlField(size, setSize, DEFAULT_SIZE, undefined, { min: 10, max: 300 }),
    dist: urlField(distance, setDistance, DEFAULT_DISTANCE, undefined, DISTANCE_RANGE),
    res: urlField(resolution, (v: string) => setResolution(v as Resolution), "4k", RESOLUTIONS),
    unit: urlField(unit, (v: string) => setUnit(v as Unit), "m", UNITS),
  });

  const moveTo = (m: number) => setDistance(Math.round(clamp(m, DISTANCE_RANGE.min, DISTANCE_RANGE.max) * 1000) / 1000);
  const angle = viewingAngle(size, distance);
  const zone = zoneFor(angle);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Your room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RoomPlan size={size} distance={distance} resolution={resolution} unit={unit} onSize={setSize} onDistance={moveTo} />
            <div className="grid gap-6 sm:grid-cols-2">
              <SliderField
                id="tv-size"
                label="TV size"
                value={size}
                onChange={setSize}
                min={DRAG_SIZE.min}
                max={DRAG_SIZE.max}
                inputMax={150}
                step={1}
                suffix="in"
                decimals={0}
              />
              {unit === "m" ? (
                <SliderField
                  id="tv-distance"
                  label="Eyes to screen"
                  value={Math.round(distance * 100) / 100}
                  onChange={moveTo}
                  min={0.5}
                  max={6}
                  inputMax={DISTANCE_RANGE.max}
                  step={0.01}
                  sliderStep={0.05}
                  suffix="m"
                  decimals={2}
                />
              ) : (
                <SliderField
                  id="tv-distance"
                  label="Eyes to screen"
                  value={Math.round((distance / FOOT) * 10) / 10}
                  onChange={(v) => moveTo(v * FOOT)}
                  min={2}
                  max={20}
                  inputMax={DISTANCE_RANGE.max / FOOT}
                  step={0.1}
                  suffix="ft"
                  decimals={1}
                />
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2.5">
                <p className="text-[15px] font-bold">Resolution</p>
                <Segmented label="Resolution" size="sm" value={resolution} onChange={setResolution} options={RESOLUTION_OPTIONS} />
              </div>
              <div className="space-y-2.5">
                <p className="text-[15px] font-bold">Show distances in</p>
                <Segmented label="Show distances in" size="sm" value={unit} onChange={setUnit} options={UNIT_OPTIONS} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Results size={size} distance={distance} resolution={resolution} unit={unit} onSize={setSize} onDistance={moveTo} />
      </div>
      <SizeGuide size={size} distance={distance} resolution={resolution} unit={unit} onSize={setSize} />
      <MobileResultBar label={zone.label} value={degrees(angle)} />
    </>
  );
}

interface ViewProps {
  size: number;
  distance: number;
  resolution: Resolution;
  unit: Unit;
}

/* ---------------------------------------------------------------- Plan -- */

/** Plan dimensions, in metres. The wall sits left of the screen at x = 0. */
const WALL = 0.35;
const SOFA = { front: 0.4, back: 0.5, halfWidth: 1.05, arm: 0.2 };

type Drag = { kind: "sofa"; offset: number; room: number } | { kind: "tv" };

/**
 * Top-down floor plan: the TV on the left wall, the sofa facing it. The floor
 * is striped by viewing zone for this screen size, so dragging the sofa walks
 * it through them and resizing the TV moves the stripes.
 */
function RoomPlan({
  size,
  distance,
  resolution,
  unit,
  onSize,
  onDistance,
}: ViewProps & { onSize: (v: number) => void; onDistance: (v: number) => void }) {
  const [drag, setDrag] = React.useState<Drag | null>(null);

  const tvWidth = screenSize(size).width;
  const room = drag?.kind === "sofa" ? drag.room : Math.max(6, Math.ceil(distance + 1));
  // Headroom above the sofa for its zone tag and the detail label.
  const depth = Math.max(3.6, tvWidth + 1.2);
  const cy = depth / 2 + 0.2;
  const span = room + WALL;
  const angle = viewingAngle(size, distance);
  const zone = zoneFor(angle);
  const bands = zoneBands(size);
  const detail = detailVerdict(size, distance, resolution);

  const pct = (x: number) => `${((x + WALL) / span) * 100}%`;
  const pctY = (y: number) => `${(y / depth) * 100}%`;

  const planOf = (e: React.PointerEvent) => {
    const el = e.currentTarget;
    return el instanceof SVGSVGElement ? el : el instanceof SVGElement ? el.ownerSVGElement : null;
  };

  const toPlan = (e: React.PointerEvent) => {
    const ctm = planOf(e)?.getScreenCTM();
    if (!ctm) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  };

  const start = (e: React.PointerEvent, kind: Drag["kind"]) => {
    const p = toPlan(e);
    if (!p) return;
    planOf(e)?.setPointerCapture(e.pointerId);
    setDrag(kind === "sofa" ? { kind, offset: p.x - distance, room } : { kind });
  };

  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toPlan(e);
    if (!p) return;
    if (drag.kind === "sofa") {
      onDistance(Math.round(clamp(p.x - drag.offset, 0.5, drag.room - 1) * 100) / 100);
    } else {
      const inches = (2 * Math.abs(p.y - cy)) / screenSize(1).width;
      onSize(Math.round(clamp(inches, DRAG_SIZE.min, DRAG_SIZE.max)));
    }
  };

  const end = () => setDrag(null);

  const sofaKeys = (e: React.KeyboardEvent) => {
    const step = (e.shiftKey ? 5 : 1) * (unit === "ft" ? FOOT / 4 : 0.05);
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? step : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -step : 0;
    if (!delta) return;
    e.preventDefault();
    onDistance(clamp(distance + delta, 0.5, DISTANCE_RANGE.max));
  };

  const tvKeys = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    const delta = e.key === "ArrowUp" || e.key === "ArrowRight" ? step : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -step : 0;
    if (!delta) return;
    e.preventDefault();
    onSize(clamp(size + delta, DRAG_SIZE.min, 150));
  };

  const sofaTop = cy - SOFA.halfWidth;
  const showDetail = detail.distance < room - 0.1;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-card select-none">
        <svg
          viewBox={`${-WALL} 0 ${span} ${depth}`}
          className="block h-auto w-full"
          role="group"
          aria-label={`Floor plan: a ${size} inch TV and a sofa ${length(distance, unit, 2)} away`}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {bands.map(({ zone: z, from, to }) =>
            from < room ? (
              <rect key={z.id} x={from} y={0} width={Math.min(to, room) - from} height={depth} fill={ZONE_FILL[z.id]} opacity={0.5} />
            ) : null,
          )}
          {bands.slice(1).map(({ zone: z, from }) =>
            from < room ? (
              <line
                key={z.id}
                x1={from}
                x2={from}
                y1={0}
                y2={depth}
                stroke="var(--foreground)"
                strokeOpacity={0.25}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ) : null,
          )}
          {showDetail && (
            <line
              x1={detail.distance}
              x2={detail.distance}
              y1={0}
              y2={depth}
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeDasharray="2 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Wall */}
          <rect x={-WALL} y={0} width={WALL - 0.14} height={depth} fill="var(--foreground)" opacity={0.12} />
          <line x1={-0.14} x2={-0.14} y1={0} y2={depth} stroke="var(--foreground)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />

          {/* What the screen fills from your seat */}
          <polygon
            points={`${distance},${cy} 0,${cy - tvWidth / 2} 0,${cy + tvWidth / 2}`}
            fill="var(--card)"
            fillOpacity={0.7}
            stroke="var(--foreground)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* TV: drag its ends to resize */}
          <g
            role="slider"
            tabIndex={0}
            aria-label="TV size"
            aria-valuemin={DRAG_SIZE.min}
            aria-valuemax={150}
            aria-valuenow={size}
            aria-valuetext={`${size} inches`}
            onPointerDown={(e) => start(e, "tv")}
            onKeyDown={tvKeys}
            className="group cursor-ns-resize outline-none"
            style={{ touchAction: "none" }}
          >
            <rect x={-0.3} y={cy - tvWidth / 2 - 0.3} width={0.6} height={tvWidth + 0.6} fill="transparent" />
            <rect
              x={-0.2}
              y={cy - tvWidth / 2 - 0.12}
              width={0.34}
              height={tvWidth + 0.24}
              rx={0.08}
              fill="none"
              stroke="var(--ring)"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              className="opacity-0 group-focus-visible:opacity-100"
            />
            <rect x={-0.12} y={cy - tvWidth / 2} width={0.1} height={tvWidth} rx={0.03} fill="var(--foreground)" />
            {[-1, 1].map((s) => (
              <circle
                key={s}
                cx={-0.07}
                cy={cy + (s * tvWidth) / 2}
                r={0.09}
                fill="var(--sticker-yellow)"
                stroke="var(--foreground)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          {/* Sofa: drag it to move your seat */}
          <g
            role="slider"
            tabIndex={0}
            aria-label="Distance from the screen"
            aria-valuemin={0.5}
            aria-valuemax={DISTANCE_RANGE.max}
            aria-valuenow={Math.round(distance * 100) / 100}
            aria-valuetext={`${length(distance, unit, 2)}, ${zone.label.toLowerCase()}, ${degrees(angle)}`}
            onPointerDown={(e) => start(e, "sofa")}
            onKeyDown={sofaKeys}
            className={cn("group outline-none", drag?.kind === "sofa" ? "cursor-grabbing" : "cursor-grab")}
            style={{ touchAction: "none" }}
          >
            <Sofa x={distance} cy={cy} />
            <rect
              x={distance - SOFA.front - 0.08}
              y={sofaTop - 0.08}
              width={SOFA.front + SOFA.back + 0.16}
              height={SOFA.halfWidth * 2 + 0.16}
              rx={0.18}
              fill="none"
              stroke="var(--ring)"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              className="opacity-0 group-focus-visible:opacity-100"
            />
          </g>

          {/* Distance dimension along the bottom */}
          <g stroke="var(--foreground)" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
            <line x1={0} x2={distance} y1={depth - 0.22} y2={depth - 0.22} vectorEffect="non-scaling-stroke" />
            <line x1={0} x2={0} y1={depth - 0.32} y2={depth - 0.12} vectorEffect="non-scaling-stroke" />
            <line x1={distance} x2={distance} y1={depth - 0.32} y2={depth - 0.12} vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        {/* Labels as HTML so they stay readable at any width */}
        <PlanLabel left={pct(distance / 2)} top={pctY(depth - 0.22)} className="-translate-x-1/2 -translate-y-1/2">
          {length(distance, unit, 2)}
        </PlanLabel>
        <PlanLabel left={pct(distance)} top={pctY(sofaTop)} className="-translate-x-1/2 -translate-y-[calc(100%+6px)] bg-foreground text-background">
          {zone.label} · {degrees(angle)}
        </PlanLabel>
        <PlanLabel left={pct(0)} top={pctY(cy - tvWidth / 2)} className="translate-x-2 -translate-y-[calc(100%+4px)]">
          {size} in
        </PlanLabel>
        {showDetail && (
          <PlanLabel left={pct(detail.distance)} top="6px" className="-translate-x-[calc(100%+4px)] border-dashed">
            ← {resolution === "hd" ? "pixels show" : `${RESOLUTION_INFO[resolution].label} detail`}
          </PlanLabel>
        )}
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="Viewing zones for this TV">
        {bands.map(({ zone: z, from, to }) => (
          <li
            key={z.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border-2 border-foreground px-2.5 py-1 text-xs font-bold",
              z.id === zone.id ? "bg-foreground text-background" : "bg-card",
            )}
          >
            <span className="size-2.5 shrink-0 rounded-full border border-foreground" style={{ background: ZONE_FILL[z.id] }} aria-hidden />
            {z.label}
            <span className={cn("font-mono", z.id === zone.id ? "text-background/70" : "text-muted-foreground")}>
              {from === 0 ? `under ${length(to, unit)}` : Number.isFinite(to) ? lengthRange(from, to, unit) : `over ${length(from, unit)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs font-semibold text-muted-foreground">
        Drag the sofa to move your seat, or the yellow ends of the TV to resize it. Distance is from your eyes to the screen.
      </p>
    </div>
  );
}

function PlanLabel({ left, top, className, children }: { left: string; top: string; className?: string; children: React.ReactNode }) {
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

/** A three-seat sofa from above, with you in the middle seat, eyes at `x`. */
function Sofa({ x, cy }: { x: number; cy: number }) {
  const { front, back, halfWidth, arm } = SOFA;
  const left = x - front;
  const top = cy - halfWidth;
  const width = front + back;
  const stroke = { stroke: "var(--foreground)", strokeWidth: 2, vectorEffect: "non-scaling-stroke" as const };
  const seatTop = top + arm;
  const seatWidth = (halfWidth * 2 - arm * 2) / 3;
  return (
    <>
      <rect x={left} y={top} width={width} height={halfWidth * 2} rx={0.12} fill="var(--sticker-sky)" {...stroke} />
      <rect x={x + back - 0.26} y={top} width={0.26} height={halfWidth * 2} rx={0.1} fill="var(--sticker-sky)" {...stroke} />
      <rect x={left} y={top} width={width} height={arm} rx={0.1} fill="var(--sticker-sky)" {...stroke} />
      <rect x={left} y={cy + halfWidth - arm} width={width} height={arm} rx={0.1} fill="var(--sticker-sky)" {...stroke} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={left + 0.03} y={seatTop + i * seatWidth} width={width - 0.3} height={seatWidth} rx={0.06} fill="var(--card)" {...stroke} />
      ))}
      {/* You: shoulders, then a head with a nose pointing at the screen */}
      <ellipse cx={x + 0.12} cy={cy} rx={0.13} ry={0.25} fill="var(--sticker-pink)" {...stroke} />
      <polygon points={`${x - 0.02},${cy - 0.035} ${x - 0.07},${cy} ${x - 0.02},${cy + 0.035}`} fill="var(--foreground)" />
      <circle cx={x + 0.08} cy={cy} r={0.1} fill="var(--sticker-yellow)" {...stroke} />
    </>
  );
}

/* ------------------------------------------------------------- Results -- */

function Results({
  size,
  distance,
  resolution,
  unit,
  onSize,
  onDistance,
}: ViewProps & { onSize: (v: number) => void; onDistance: (v: number) => void }) {
  const angle = viewingAngle(size, distance);
  const zone = zoneFor(angle);
  const near = distanceForAngle(size, SWEET_SPOT.max);
  const far = distanceForAngle(size, SWEET_SPOT.min);
  const ideal = distanceForAngle(size, SWEET_SPOT.ideal);
  const minSize = sizeForAngle(distance, SWEET_SPOT.min);
  const maxSize = sizeForAngle(distance, SWEET_SPOT.max);
  const idealSize = sizeForAngle(distance, SWEET_SPOT.ideal);
  const fits = COMMON_SIZES.filter((s) => s >= minSize && s <= maxSize);
  const pick = COMMON_SIZES.reduce((best, s) => (Math.abs(s - idealSize) < Math.abs(best - idealSize) ? s : best));
  const detail = detailVerdict(size, distance, resolution);
  const inSweetSpot = zone.id === "sweetSpot";

  return (
    <div className="min-w-0 lg:sticky lg:top-20">
      <Card className="min-w-0 bg-lilac">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label="From your seat"
            value={zone.label}
            hint={`The screen fills ${degrees(angle)} of your view: a ${size} in TV at ${length(distance, unit, 2)}.`}
          />
          <p className="text-sm font-semibold">{zone.blurb}</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-4">
            <Stat label={`Best seat for ${size} in`} value={lengthRange(near, far, unit)} hint={`${length(ideal, unit)} for ${SWEET_SPOT.ideal}°`} />
            <Stat
              label="Best size from here"
              value={maxSize > 150 ? `${Math.round(minSize)} in+` : `${Math.round(minSize)}–${Math.round(maxSize)} in`}
              hint={fits.length ? `Common sizes: ${fits.join(", ")} in` : minSize > 100 ? "Projector territory" : `Nearest: ${pick} in`}
            />
            <Stat label="Viewing angle" value={degrees(angle)} hint="SMPTE 30° minimum, THX 40° ideal" />
            <Stat label={RESOLUTION_INFO[resolution].detailLabel} value={length(detail.distance, unit)} hint={`${RESOLUTION_INFO[resolution].label} on ${size} in, 20/20 vision`} />
          </div>

          <Callout tone={detail.within === (resolution === "hd") ? "warn" : "info"}>{detail.message}</Callout>

          {!inSweetSpot && (
            <div className="flex flex-wrap gap-2">
              <PillButton onClick={() => onDistance(ideal)}>Move to {length(ideal, unit)}</PillButton>
              {pick !== size && fits.includes(pick) && <PillButton onClick={() => onSize(pick)}>Try a {pick} in TV</PillButton>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------- Size guide -- */

function SizeGuide({ size, distance, resolution, unit, onSize }: ViewProps & { onSize: (v: number) => void }) {
  const sizes: readonly number[] = COMMON_SIZES;
  const rows = sizes.includes(size) ? [...sizes] : [...sizes, size].sort((a, b) => a - b);

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Size guide</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground">
          <table className="w-full min-w-[560px] font-mono text-sm font-bold text-numeric">
            <thead>
              <tr className="border-b border-foreground/15 text-left font-sans text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-bold">TV size</th>
                <th className="px-4 py-2.5 text-right font-bold">Sweet spot (30–40°)</th>
                <th className="px-4 py-2.5 text-right font-bold">{RESOLUTION_INFO[resolution].detailLabel}</th>
                <th className="px-4 py-2.5 text-right font-bold">From your seat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const angle = viewingAngle(s, distance);
                const zone = zoneFor(angle);
                const current = s === size;
                return (
                  <tr key={s} className={cn("border-b border-foreground/10 last:border-0", current && "bg-lilac")}>
                    <td className="px-4 py-1.5 font-sans">
                      <button
                        type="button"
                        onClick={() => onSize(s)}
                        aria-pressed={current}
                        className="rounded-full px-2 py-1 -mx-2 font-bold hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {s} in
                      </button>
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      {lengthRange(distanceForAngle(s, SWEET_SPOT.max), distanceForAngle(s, SWEET_SPOT.min), unit)}
                    </td>
                    <td className="px-4 py-1.5 text-right">{length(detailDistance(s, resolution), unit)}</td>
                    <td className="px-4 py-1.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full border border-foreground" style={{ background: ZONE_FILL[zone.id] }} aria-hidden />
                        {zone.label} · {degrees(angle)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          Distances assume a flat 16:9 screen, measured from your eyes. The sweet spot runs from THX&apos;s 40° to
          SMPTE&apos;s 30°; the {TOO_CLOSE_ANGLE}° and {TOO_FAR_ANGLE}° edges of the other zones are a rule of
          thumb. Detail distances use 20/20 vision (one arcminute); sharper eyes see detail from a little further back.
        </p>
      </CardContent>
    </Card>
  );
}
