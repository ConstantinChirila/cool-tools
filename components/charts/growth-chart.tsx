"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
  /** Draw a ~10% opacity area wash under this series. */
  area?: boolean;
}

interface GrowthChartProps {
  series: ChartSeries[];
  /** Label for x position i (e.g. "Year 5"). */
  xLabel: (index: number) => string;
  /** Short x axis tick label (e.g. "5y"). */
  xTick: (index: number) => string;
  formatValue: (value: number) => string;
  /** Compact axis tick format (e.g. "£250K"). */
  formatAxis: (value: number) => string;
  /** Optional extra tooltip row derived from the hovered index. */
  extraRow?: (index: number) => { name: string; value: string } | null;
  className?: string;
}

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * mag);
  const step = candidates.find((c) => c >= rough) ?? candidates[4];
  const ticks: number[] = [0];
  while (ticks[ticks.length - 1] < max) {
    ticks.push(ticks[ticks.length - 1] + step);
  }
  return ticks;
}

const HEIGHT = 280;
const M = { top: 14, right: 16, bottom: 26, left: 8 };

export function GrowthChart({
  series,
  xLabel,
  xTick,
  formatValue,
  formatAxis,
  extraRow,
  className,
}: GrowthChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [hover, setHover] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = series[0]?.values.length ?? 0;
  const maxValue = Math.max(...series.flatMap((s) => s.values), 1);
  const ticks = niceTicks(maxValue);
  const yMax = ticks[ticks.length - 1];

  const axisWidth = 12 + formatAxis(yMax).length * 7.5;
  const left = M.left + axisWidth;
  const plotW = Math.max(width - left - M.right, 0);
  const plotH = HEIGHT - M.top - M.bottom;

  const x = (i: number) => left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH;

  const path = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

  const setHoverFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - left) / Math.max(plotW, 1)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHover((h) => Math.max(0, (h ?? n - 1) - 1));
    } else if (e.key === "Escape") {
      setHover(null);
    }
  };

  // Tooltip placement: flip side when close to the right edge.
  const tooltipLeft = hover !== null && width > 0 ? x(hover) : 0;
  const flip = tooltipLeft > width - 180;

  if (n < 2) return null;

  const xTickIndices = [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1]
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Chart of ${series.map((s) => s.name).join(" and ")} over time. Use arrow keys to inspect values.`}
          tabIndex={0}
          className="block touch-none outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/40"
          onPointerMove={setHoverFromEvent}
          onPointerDown={setHoverFromEvent}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKeyDown}
          onFocus={() => setHover((h) => h ?? n - 1)}
          onBlur={() => setHover(null)}
        >
          {/* gridlines + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={left}
                x2={left + plotW}
                y1={y(t)}
                y2={y(t)}
                stroke="oklch(0.2 0.01 60 / 10%)"
                strokeWidth={1}
              />
              <text
                x={left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground font-semibold text-numeric"
                fontSize={11}
              >
                {formatAxis(t)}
              </text>
            </g>
          ))}

          {/* x ticks */}
          {xTickIndices.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="fill-muted-foreground font-semibold text-numeric"
              fontSize={11}
            >
              {xTick(i)}
            </text>
          ))}

          {/* area washes */}
          {series.map(
            (s) =>
              s.area && (
                <path
                  key={`${s.name}-area`}
                  d={`${path(s.values)}L${(left + plotW).toFixed(1)},${y(0).toFixed(1)}L${left.toFixed(1)},${y(0).toFixed(1)}Z`}
                  fill={s.color}
                  opacity={0.1}
                />
              ),
          )}

          {/* crosshair */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={M.top}
              y2={M.top + plotH}
              stroke="oklch(0.2 0.01 60 / 30%)"
              strokeWidth={1}
            />
          )}

          {/* lines */}
          {series.map((s) => (
            <path
              key={s.name}
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* hover markers with surface ring */}
          {hover !== null &&
            series.map((s) => (
              <circle
                key={`${s.name}-dot`}
                cx={x(hover)}
                cy={y(s.values[hover])}
                r={4.5}
                fill={s.color}
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}
        </svg>
      )}

      {/* legend (identity channel; values live in the tooltip and table) */}
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.name}
          </div>
        ))}
      </div>

      {/* tooltip */}
      {hover !== null && width > 0 && (
        <div
          className="sticker-sm pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl bg-card p-2.5 text-xs"
          style={flip ? { right: width - tooltipLeft + 10 } : { left: tooltipLeft + 10 }}
        >
          <p className="mb-1.5 font-medium text-muted-foreground">{xLabel(hover)}</p>
          <div className="space-y-1">
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
                  {s.name}
                </span>
                <span className="font-semibold text-foreground text-numeric">
                  {formatValue(s.values[hover])}
                </span>
              </div>
            ))}
            {extraRow?.(hover) && (
              <div className="flex items-center justify-between gap-4 border-t border-foreground/15 pt-1">
                <span className="pl-4.5 text-muted-foreground">{extraRow(hover)!.name}</span>
                <span className="font-semibold text-foreground text-numeric">
                  {extraRow(hover)!.value}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
