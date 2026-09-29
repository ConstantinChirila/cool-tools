"use client";

import * as React from "react";

export type Primitive = string | number | boolean;

export interface UrlField {
  value: Primitive;
  set: (v: never) => void;
  def: Primitive;
  /** For string fields: the only values accepted from the URL. */
  allowed?: readonly string[];
  /** For number fields: values from the URL are clamped into this range. */
  range?: NumberRange;
}

export interface NumberRange {
  min: number;
  max: number;
}

/** Clamp for any money amount read from the URL. */
export const MONEY_RANGE: NumberRange = { min: 0, max: 10_000_000 };
/** Clamp for a whole percentage read from the URL. */
export const PERCENT_RANGE: NumberRange = { min: 0, max: 100 };

/** Describe one piece of state to mirror into the URL query string. */
export function urlField<T extends Primitive>(
  value: T,
  set: (v: T) => void,
  def: T,
  allowed?: readonly string[],
  range?: NumberRange,
): UrlField {
  return { value, set, def, allowed, range };
}

/** The setter of a tool that keeps all its inputs in one state object. */
export type FieldUpdate<T> = <K extends keyof T>(key: K, value: T[K]) => void;

/**
 * URL fields for a tool that keeps its inputs in one object: returns a
 * function that binds a key, with `allowed` for string unions and `range`
 * for numbers.
 */
export function inputFields<T extends { [K in keyof T]: Primitive }>(input: T, update: FieldUpdate<T>, defaults: T) {
  return <K extends keyof T>(key: K, opts: { allowed?: readonly string[]; range?: NumberRange } = {}): UrlField => ({
    value: input[key],
    // Values from the URL are checked against `allowed` and `range` before they get here.
    set: (v: T[K]) => update(key, v),
    def: defaults[key],
    allowed: opts.allowed,
    range: opts.range,
  });
}

function parse(raw: string, field: UrlField): Primitive | undefined {
  switch (typeof field.def) {
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) return undefined;
      return field.range ? Math.min(field.range.max, Math.max(field.range.min, n)) : n;
    }
    case "boolean":
      return raw === "1" || raw === "true" ? true : raw === "0" || raw === "false" ? false : undefined;
    default:
      return field.allowed && !field.allowed.includes(raw) ? undefined : raw;
  }
}

function serialize(v: Primitive): string {
  return typeof v === "boolean" ? (v ? "1" : "0") : String(v);
}

/**
 * Keeps a tool's inputs in the URL so the address bar is always a shareable
 * link. On mount, any recognised query params are applied to state; after
 * that, state changes are written back with replaceState (debounced), and
 * fields at their default value are left out to keep links short.
 */
export function useUrlState(fields: Record<string, UrlField>) {
  // Setters and defaults are stable, so the fields seen on first render are
  // all the mount-time read needs.
  const [initial] = React.useState(fields);
  const ready = React.useRef(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, field] of Object.entries(initial)) {
      const raw = params.get(key);
      if (raw === null) continue;
      const parsed = parse(raw, field);
      if (parsed !== undefined) (field.set as (v: Primitive) => void)(parsed);
    }
    ready.current = true;
  }, [initial]);

  const query = Object.entries(fields)
    .filter(([, f]) => f.value !== f.def)
    .map(([k, f]) => [k, serialize(f.value)]);
  const serialized = new URLSearchParams(query).toString();

  React.useEffect(() => {
    if (!ready.current) return;
    const id = window.setTimeout(() => {
      const { pathname, hash, search } = window.location;
      const next = serialized ? `?${serialized}` : "";
      if (next !== search) window.history.replaceState(null, "", `${pathname}${next}${hash}`);
    }, 300);
    return () => window.clearTimeout(id);
  }, [serialized]);
}
