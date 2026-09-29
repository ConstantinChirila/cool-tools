"use client";

import { Plus, X } from "lucide-react";
import { NumberField } from "@/components/calc/number-field";
import { PillButton } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { formatArea, lengthIn, type Units } from "@/components/tools/garden-format";
import { AreaThumb, type Texture } from "@/components/tools/garden-visuals";
import { MAX_AREAS, MAX_DIMENSION, areaOf, reshape, type Area, type Shape } from "@/lib/garden-materials";
import { cn } from "@/lib/utils";

export type AreaRow = Area & { id: number };

/** Ids only need to be unique within the list; index-based so server and client agree. */
export const withIds = (areas: Area[]): AreaRow[] => areas.map((area, id) => ({ ...area, id }));
const nextId = (rows: AreaRow[]) => rows.reduce((max, r) => Math.max(max, r.id), -1) + 1;

const SHAPE_OPTIONS: { value: Shape; label: string }[] = [
  { value: "rect", label: "Rectangle" },
  { value: "circle", label: "Circle" },
  { value: "known", label: "Know the area" },
];

/**
 * A list of areas to cover and cut-outs to take away, each a rectangle,
 * circle or known area, drawn in the material they'll be covered with.
 */
export function AreaList({
  id,
  title,
  cutLabel,
  rows,
  onChange,
  material,
  units,
}: {
  /** Prefix for element ids, unique on the page. */
  id: string;
  title: string;
  /** The add-a-cut-out button, e.g. "Cut out a pond or patio". */
  cutLabel: string;
  rows: AreaRow[];
  onChange: (rows: AreaRow[]) => void;
  material: Texture;
  units: Units;
}) {
  const set = (rowId: number, area: Area) => onChange(rows.map((r) => (r.id === rowId ? { ...area, id: rowId } : r)));
  const add = (cut: boolean) => {
    const side = cut ? 1 : 2;
    onChange([...rows, { shape: "rect", length: side, width: side, cut, id: nextId(rows) }]);
  };
  const full = rows.length >= MAX_AREAS;
  let areaNo = 0;
  let cutNo = 0;

  return (
    <section className="space-y-3" aria-labelledby={`${id}-areas`}>
      <h3 id={`${id}-areas`} className="text-[15px] font-bold">
        {title}
      </h3>
      <ul className="space-y-3">
        {rows.map((row) => (
          <AreaItem
            key={row.id}
            id={`${id}-area-${row.id}`}
            row={row}
            name={row.cut ? `Cut-out ${++cutNo}` : `Area ${++areaNo}`}
            material={material}
            units={units}
            onChange={(area) => set(row.id, area)}
            onRemove={rows.length > 1 ? () => onChange(rows.filter((r) => r.id !== row.id)) : undefined}
          />
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <PillButton onClick={() => add(false)} disabled={full}>
          <Plus className="size-4" /> Add an area
        </PillButton>
        <PillButton onClick={() => add(true)} disabled={full}>
          <Plus className="size-4" /> {cutLabel}
        </PillButton>
      </div>
    </section>
  );
}

function AreaItem({
  id,
  row,
  name,
  material,
  units,
  onChange,
  onRemove,
}: {
  id: string;
  row: AreaRow;
  name: string;
  material: Texture;
  units: Units;
  onChange: (area: Area) => void;
  onRemove?: () => void;
}) {
  const { factor, suffix, area } = lengthIn(units);
  const metres = (key: string, label: string, value: number, set: (m: number) => void) => (
    <NumberField
      id={`${id}-${key}`}
      label={label}
      value={Number((value / factor).toFixed(2))}
      onChange={(v) => set(v * factor)}
      max={MAX_DIMENSION / factor}
      suffix={suffix}
      decimals={2}
    />
  );

  return (
    <li className={cn("space-y-3 rounded-2xl border-[2.5px] border-foreground p-3", row.cut ? "border-dashed bg-secondary" : "bg-card")}>
      <div className="flex items-center gap-3">
        <AreaThumb area={row} material={material} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{name}</p>
          <p className="font-mono text-xs font-bold text-muted-foreground">
            {row.cut ? "−" : ""}
            {formatArea(areaOf(row), units)}
          </p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${name.toLowerCase()}`}
            className="flex size-9 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Segmented label={`${name} shape`} size="sm" value={row.shape} onChange={(shape) => onChange(reshape(row, shape))} options={SHAPE_OPTIONS} />
      <div className="grid grid-cols-2 gap-3">
        {row.shape === "rect" && (
          <>
            {metres("length", "Length", row.length, (length) => onChange({ ...row, length }))}
            {metres("width", "Width", row.width, (width) => onChange({ ...row, width }))}
          </>
        )}
        {row.shape === "circle" && metres("diameter", "Across (diameter)", row.diameter, (diameter) => onChange({ ...row, diameter }))}
        {row.shape === "known" && (
          <NumberField
            id={`${id}-m2`}
            label="Area"
            value={Number((row.m2 / (factor * factor)).toFixed(2))}
            onChange={(v) => onChange({ ...row, m2: v * factor * factor })}
            max={MAX_DIMENSION / (factor * factor)}
            suffix={area}
            decimals={2}
          />
        )}
      </div>
    </li>
  );
}
