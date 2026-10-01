"use client";

import * as React from "react";
import { Key } from "@/components/tools/water-butt-visuals";
import { formatNumber } from "@/lib/currency";
import { type Flows, sunTimes } from "@/lib/solar";
import { cn, clamp } from "@/lib/utils";
import { MONTHS } from "@/lib/year";

const INK = "var(--foreground)";
/** Energy by where it came from: deep enough to read on white and on the yellow card. */
export const SOLAR = "oklch(0.72 0.16 80)";
export const BATTERY = "oklch(0.62 0.16 300)";
export const GRID = "oklch(0.64 0.17 350)";
export const EXPORT = "oklch(0.62 0.13 235)";
const PANEL = "oklch(0.36 0.07 250)";
const PANEL_LINE = "oklch(0.6 0.08 250)";

/** What the home, panels, battery and grid did in one hour, kWh. */
export interface HourFlows {
  generated: number;
  load: number;
  direct: number;
  solarToBattery: number;
  gridToBattery: number;
  fromBattery: number;
  exported: number;
  imported: number;
}

/** CSS for the moving current in a live wire; still when the reader prefers less motion. */
const FLOW_CSS = `@keyframes solar-flow{to{stroke-dashoffset:-14}}@media (prefers-reduced-motion:no-preference){.solar-flow{animation:solar-flow var(--flow-speed,1s) linear infinite}}`;

/** How fast the dashes move for a flow of `kw`: a trickle crawls, a few kW races. */
function flowSpeed(kw: number): string {
  return `${clamp(1.6 / Math.max(kw, 0.05), 0.35, 2.4).toFixed(2)}s`;
}

/** A wire: ink underneath, the source's colour on top when current flows, and moving dashes along it. */
function Wire({ d, color, kw }: { d: string; color: string; kw: number }) {
  const live = kw > 0.005;
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={live ? color : "var(--card)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke .3s" }} />
      {live && <path d={d} fill="none" stroke="var(--card)" strokeWidth={2} strokeDasharray="3 11" strokeLinecap="round" className="solar-flow" style={{ "--flow-speed": flowSpeed(kw) } as React.CSSProperties} />}
    </>
  );
}

const GROUND = 176;
/** Where the wires meet: the inverter and meter, top right inside the house. */
const HUB = { x: 232, y: 124 };
const BATTERY_BOX = { x: 262, w: 28, y: 128 };
const PYLON_X = 332;
/** Sun path: a semicircle over the scene. */
const ARC = { cx: 180, cy: 180, r: 150 };

/** Up to this many panels are drawn, in two rows along the roof. */
const MAX_PANELS = 12;
/** kWp a drawn panel stands for. */
const PANEL_KWP = 0.45;

/** Roof slope the panels sit on: from the eaves up to the ridge. */
const EAVES = { x: 116, y: 110 };
const RIDGE = { x: 180, y: 62 };

/**
 * The home through one hour: sun or moon on its arc, panels on the roof,
 * windows lit by how much the home is using, the battery's level and the
 * pylon, with current moving along whichever wires are live.
 */
export function HomeScene({ hour, day, kwp, battery, soc, flows, className }: { hour: number; day: number; kwp: number; battery: number; soc: number; flows: HourFlows; className?: string }) {
  const { rise, set } = sunTimes(day);
  const t = hour + 0.5;
  const up = t > rise && t < set;
  const p = clamp((t - rise) / Math.max(set - rise, 1), 0, 1);
  const angle = Math.PI * (1 - p);
  const sun = { x: ARC.cx + ARC.r * Math.cos(angle), y: ARC.cy - ARC.r * Math.sin(angle) };
  // Night falls over the hour after sunset and lifts over the hour before sunrise.
  const daylight = clamp(Math.min(t - rise + 0.5, set - t + 0.5), 0, 1);
  const sky = `color-mix(in oklch, oklch(0.94 0.035 230) ${Math.round(daylight * 100)}%, oklch(0.34 0.06 285))`;
  const glow = clamp(flows.load / 0.6, 0.15, 1);

  const panels = kwp > 0 ? clamp(Math.round(kwp / PANEL_KWP), 1, MAX_PANELS) : 0;
  const cols = Math.ceil(panels / 2);
  // Unit vector up the slope and its normal into the roof.
  const slope = { x: RIDGE.x - EAVES.x, y: RIDGE.y - EAVES.y };
  const len = Math.hypot(slope.x, slope.y);
  const u = { x: slope.x / len, y: slope.y / len };
  const n = { x: -u.y, y: u.x };
  const cell = 10;
  const thick = 7;
  const start = 8;
  const panelAt = (i: number) => {
    const col = Math.floor(i / 2);
    const row = i % 2;
    const ox = EAVES.x + u.x * (start + col * cell) - n.x * (3 + row * thick);
    const oy = EAVES.y + u.y * (start + col * cell) - n.y * (3 + row * thick);
    const ax = u.x * (cell - 1);
    const ay = u.y * (cell - 1);
    const bx = -n.x * (thick - 1);
    const by = -n.y * (thick - 1);
    return `M${ox.toFixed(1)} ${oy.toFixed(1)} l${ax.toFixed(1)} ${ay.toFixed(1)} l${bx.toFixed(1)} ${by.toFixed(1)} l${(-ax).toFixed(1)} ${(-ay).toFixed(1)} Z`;
  };
  const arrayMid = { x: EAVES.x + u.x * (start + (cols * cell) / 2) - n.x * 7, y: EAVES.y + u.y * (start + (cols * cell) / 2) - n.y * 7 };

  const level = battery > 0 ? clamp(soc / battery, 0, 1) : 0;
  const boxH = 46;
  const batteryTop = BATTERY_BOX.y;
  const toBattery = flows.solarToBattery + flows.gridToBattery;
  const home = flows.direct + flows.fromBattery + Math.max(flows.imported - flows.gridToBattery, 0);

  return (
    <svg viewBox="0 0 360 200" className={cn("block w-full", className)} role="img" aria-label={sceneLabel(hour, flows, battery, soc)}>
      <style>{FLOW_CSS}</style>
      <rect x={0} y={0} width={360} height={GROUND} style={{ fill: sky, transition: "fill .4s" }} />
      {/* Stars come out as the sky darkens. */}
      <g fill="var(--card)" style={{ opacity: 1 - daylight, transition: "opacity .4s" }}>
        {[
          [20, 30],
          [60, 18],
          [95, 44],
          [250, 22],
          [300, 40],
          [340, 20],
          [130, 14],
          [210, 36],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} />
        ))}
      </g>
      {/* The moon sits at the top right all night. */}
      <g style={{ opacity: up ? 0 : 1, transition: "opacity .4s" }}>
        <circle cx={318} cy={34} r={11} fill="oklch(0.96 0.03 95)" stroke={INK} strokeWidth={2.5} />
        <circle cx={323} cy={30} r={9} fill={sky} style={{ transition: "fill .4s" }} />
      </g>
      {/* The sun, moving along its arc through the day. */}
      <g style={{ transform: `translate(${sun.x.toFixed(1)}px, ${sun.y.toFixed(1)}px)`, transition: "transform .4s, opacity .4s", opacity: up ? 1 : 0 }}>
        {flows.generated > 0.005 && (
          <g stroke={SOLAR} strokeWidth={2.5} strokeLinecap="round" className="motion-safe:animate-pulse">
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              return <line key={i} x1={Math.cos(a) * 19} y1={Math.sin(a) * 19} x2={Math.cos(a) * 25} y2={Math.sin(a) * 25} />;
            })}
          </g>
        )}
        <circle r={14} fill="var(--sticker-yellow)" stroke={INK} strokeWidth={2.5} />
      </g>

      {/* Pylon and its cable to the house. */}
      <path d={`M${PYLON_X - 12} ${GROUND} L${PYLON_X - 4} 84 H${PYLON_X + 4} L${PYLON_X + 12} ${GROUND} M${PYLON_X - 9} 150 H${PYLON_X + 9} M${PYLON_X - 7} 118 H${PYLON_X + 7} M${PYLON_X - 16} 98 H${PYLON_X + 16}`} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M${PYLON_X - 8} 150 L${PYLON_X + 7} 118 M${PYLON_X + 8} 150 L${PYLON_X - 7} 118`} stroke={INK} strokeWidth={1.5} />

      {/* House: walls, roof, door and windows. */}
      <rect x={120} y={110} width={120} height={GROUND - 110} fill="var(--card)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M${EAVES.x - 6} 112 L${RIDGE.x} ${RIDGE.y} L246 112 Z`} fill="oklch(0.62 0.12 35)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={160} y={140} width={20} height={GROUND - 140} fill="var(--sticker-pink)" stroke={INK} strokeWidth={2} />
      <circle cx={176} cy={158} r={1.5} fill={INK} />
      {[128, 200].map((x) => (
        <g key={x}>
          <rect x={x} y={124} width={22} height={20} fill="var(--sticker-sky)" stroke={INK} strokeWidth={2} />
          <rect x={x} y={124} width={22} height={20} fill="var(--sticker-yellow)" style={{ opacity: glow, transition: "opacity .4s" }} />
          <path d={`M${x + 11} 124 V144 M${x} 134 H${x + 22}`} stroke={INK} strokeWidth={1.5} />
        </g>
      ))}
      {/* Panels on the roof. */}
      {Array.from({ length: panels }, (_, i) => (
        <path key={i} d={panelAt(i)} fill={PANEL} stroke={PANEL_LINE} strokeWidth={1} strokeLinejoin="round" />
      ))}
      {panels > 0 && flows.generated > 0.005 && <path d={panelAt(0)} fill="var(--card)" style={{ opacity: 0.25 }} />}
      {/* Inverter and meter. */}
      <rect x={HUB.x - 8} y={HUB.y - 7} width={16} height={14} rx={2} fill="oklch(0.9 0.01 90)" stroke={INK} strokeWidth={2} />
      <path d={`M${HUB.x - 3} ${HUB.y + 3} l3 -6 l2 3 l3 -5`} fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Wires, drawn with their current. */}
      {panels > 0 && <Wire d={`M${arrayMid.x.toFixed(1)} ${arrayMid.y.toFixed(1)} L${(arrayMid.x + 10).toFixed(1)} ${HUB.y - 2} H${HUB.x - 8}`} color={SOLAR} kw={flows.generated} />}
      <Wire d={`M${HUB.x} ${HUB.y - 7} V96 H${PYLON_X - 4}`} color={EXPORT} kw={flows.exported} />
      {flows.imported > 0.005 && <Wire d={`M${PYLON_X - 4} 96 H${HUB.x} V${HUB.y - 7}`} color={GRID} kw={flows.imported} />}
      {battery > 0 && (
        <>
          {flows.fromBattery > 0.005 ? (
            <Wire d={`M${BATTERY_BOX.x + BATTERY_BOX.w / 2} ${batteryTop} V${HUB.y} H${HUB.x + 8}`} color={BATTERY} kw={flows.fromBattery} />
          ) : (
            <Wire d={`M${HUB.x + 8} ${HUB.y} H${BATTERY_BOX.x + BATTERY_BOX.w / 2} V${batteryTop}`} color={flows.gridToBattery > flows.solarToBattery ? GRID : SOLAR} kw={toBattery} />
          )}
          {/* The battery, filled to its level. */}
          <rect x={BATTERY_BOX.x} y={batteryTop} width={BATTERY_BOX.w} height={boxH} rx={4} fill="var(--card)" stroke={INK} strokeWidth={2.5} />
          <rect x={BATTERY_BOX.x + 3} y={batteryTop + 3 + (boxH - 6) * (1 - level)} width={BATTERY_BOX.w - 6} height={(boxH - 6) * level} rx={2} fill={BATTERY} style={{ transition: "y .4s, height .4s" }} />
          <path d={`M${BATTERY_BOX.x + 16} ${batteryTop + 12} l-6 12 h6 l-3 10 l9 -14 h-6 l4 -8 Z`} fill="var(--card)" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <rect x={BATTERY_BOX.x} y={batteryTop} width={BATTERY_BOX.w} height={boxH} rx={4} fill="none" stroke={INK} strokeWidth={2.5} />
        </>
      )}
      <rect x={0} y={GROUND} width={360} height={200 - GROUND} fill="oklch(0.83 0.08 145)" />
      <path d={`M0 ${GROUND} H360`} stroke={INK} strokeWidth={2.5} />
      <text x={6} y={GROUND - 6} fontSize={11} fontWeight={800} fontFamily="var(--font-mono)" fill={daylight > 0.5 ? INK : "var(--card)"} style={{ transition: "fill .4s" }}>
        {hourLabel(hour)}
      </text>
      <title>{`Home at ${hourLabel(hour)}: ${formatNumber(home, 1)} kWh used`}</title>
    </svg>
  );
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function sceneLabel(hour: number, f: HourFlows, battery: number, soc: number): string {
  const parts = [`${hourLabel(hour)}: panels ${formatNumber(f.generated, 1)} kWh`, `home ${formatNumber(f.load, 1)} kWh`];
  if (f.exported > 0.005) parts.push(`exported ${formatNumber(f.exported, 1)}`);
  if (f.imported > 0.005) parts.push(`imported ${formatNumber(f.imported, 1)}`);
  if (battery > 0) parts.push(`battery ${formatNumber(soc, 1)} of ${formatNumber(battery, 1)} kWh`);
  return parts.join(", ");
}

/* ----------------------------------------------------------- Day chart -- */

export interface DayData {
  generated: number[];
  load: number[];
  soc: number[];
  imported: number[];
  exported: number[];
}

/**
 * One day hour by hour: generation as yellow bars, the home's use as an ink
 * line, the battery's level as a lilac line, and a row of marks for hours
 * that imported (pink) or exported (blue). Pointer or arrow keys pick an hour.
 */
export function DayChart({ data, capacity, day, hour, onHour, offPeakHours }: { data: DayData; capacity: number; day: number; hour: number; onHour: (h: number) => void; offPeakHours: number }) {
  const W = 240;
  const H = 110;
  const MARKS = 12;
  const max = Math.max(...data.generated, ...data.load, 0.5);
  const y = (v: number) => H - (H - 6) * clamp(v / max, 0, 1);
  const ySoc = (v: number) => H - (H - 6) * clamp(capacity > 0 ? v / capacity : 0, 0, 1);
  const { rise, set } = sunTimes(day);
  const x = (h: number) => h * (W / 24);
  const loadPath = data.load.map((v, h) => `${h === 0 ? "M" : "L"}${x(h).toFixed(1)} ${y(v).toFixed(1)} H${x(h + 1).toFixed(1)}`).join(" ");
  const socPath = data.soc.map((v, h) => `${h === 0 ? `M${x(0)} ${ySoc(v).toFixed(1)} ` : ""}L${x(h + 1).toFixed(1)} ${ySoc(v).toFixed(1)}`).join(" ");

  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onHour(clamp(Math.floor(((e.clientX - rect.left) / Math.max(rect.width, 1)) * 24), 0, 23));
  };

  return (
    <div className="space-y-1.5">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Hour of the day"
        aria-valuemin={0}
        aria-valuemax={23}
        aria-valuenow={hour}
        aria-valuetext={`${hourLabel(hour)}: ${formatNumber(data.generated[hour] ?? 0, 1)} kWh generated, ${formatNumber(data.load[hour] ?? 0, 1)} kWh used`}
        className="relative touch-none rounded-xl border-[2.5px] border-foreground bg-card focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) pick(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onHour((hour + 1) % 24);
          else if (e.key === "ArrowLeft") onHour((hour + 23) % 24);
          else if (e.key === "Home") onHour(0);
          else if (e.key === "End") onHour(23);
          else return;
          e.preventDefault();
        }}
      >
        <svg viewBox={`0 0 ${W} ${H + MARKS}`} preserveAspectRatio="none" className="block h-40 w-full overflow-hidden rounded-[10px]">
          {/* Night, and the cheap window. */}
          <rect x={0} y={0} width={x(rise)} height={H} fill="var(--secondary)" opacity={0.7} />
          <rect x={x(set)} y={0} width={W - x(set)} height={H} fill="var(--secondary)" opacity={0.7} />
          {offPeakHours > 0 && <rect x={0} y={0} width={x(offPeakHours)} height={H} fill={GRID} opacity={0.12} />}
          {data.generated.map((v, h) => (v > 0.005 ? <rect key={h} x={x(h) + 0.6} y={y(v)} width={W / 24 - 1.2} height={H - y(v)} fill={SOLAR} opacity={0.8} /> : null))}
          <path d={loadPath} fill="none" stroke={INK} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {capacity > 0 && <path d={socPath} fill="none" stroke={BATTERY} strokeWidth={2.5} strokeDasharray="5 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
          {data.imported.map((v, h) => (v > 0.005 ? <rect key={`i${h}`} x={x(h) + 0.6} y={H + 2} width={W / 24 - 1.2} height={4} fill={GRID} /> : null))}
          {data.exported.map((v, h) => (v > 0.005 ? <rect key={`e${h}`} x={x(h) + 0.6} y={H + 7} width={W / 24 - 1.2} height={4} fill={EXPORT} /> : null))}
          <rect x={x(hour)} y={0} width={W / 24} height={H + MARKS} fill={INK} opacity={0.12} />
          <path d={`M${x(hour + 0.5)} 0 V${H + MARKS}`} stroke={INK} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between font-mono text-[11px] font-bold text-muted-foreground">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{h === 24 ? "24:00" : hourLabel(h)}</span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Month bars -- */

/**
 * Month by month, two bars: what the panels made (used at once, stored,
 * exported) and what the home used (own solar, from the battery, from the grid).
 */
export function MonthBars({ months, battery }: { months: Flows[]; battery: boolean }) {
  const max = Math.max(...months.map((m) => Math.max(m.generated, m.load)), 1);
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="space-y-2">
      <div
        className="flex h-40 items-end gap-1 sm:gap-1.5"
        role="img"
        aria-label={months.map((m, i) => `${MONTHS[i]}: made ${formatNumber(m.generated, 0)} kWh, used ${formatNumber(m.load, 0)} kWh, imported ${formatNumber(m.imported, 0)} kWh`).join("; ")}
      >
        {months.map((m, i) => {
          const gridHome = Math.max(m.imported - m.gridToBattery, 0);
          return (
            <div key={i} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px">
              <Stack
                parts={[
                  { v: m.direct, color: "var(--sticker-yellow)" },
                  { v: m.solarToBattery, color: "var(--sticker-lilac)" },
                  { v: m.exported, color: "var(--sticker-sky)" },
                ]}
                height={pct(m.generated)}
                total={m.generated}
              />
              <Stack
                parts={[
                  { v: m.direct, color: "var(--sticker-yellow)" },
                  { v: m.fromBattery, color: "var(--sticker-lilac)" },
                  { v: gridHome, color: "var(--sticker-pink)" },
                ]}
                height={pct(m.load)}
                total={m.load}
              />
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
        <Key color="var(--sticker-yellow)">Solar used at home</Key>
        {battery && <Key color="var(--sticker-lilac)">Through the battery</Key>}
        <Key color="var(--sticker-sky)">Exported</Key>
        <Key color="var(--sticker-pink)">From the grid</Key>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">Left bar: what the panels made. Right bar: what the home used.</p>
    </div>
  );
}

function Stack({ parts, height, total }: { parts: { v: number; color: string }[]; height: string; total: number }) {
  const shown = parts.filter((p) => p.v > 0.5);
  return (
    <div className="flex w-1/2 max-w-3.5 flex-col-reverse justify-start" style={{ height }}>
      {shown.map((p, i) => (
        <div
          key={i}
          className={cn("border-2 border-b-0 border-foreground", i === shown.length - 1 && "rounded-t-[3px]")}
          style={{ height: `${(p.v / Math.max(total, 1)) * 100}%`, background: p.color }}
        />
      ))}
    </div>
  );
}
