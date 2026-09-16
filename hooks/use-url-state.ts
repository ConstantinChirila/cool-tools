"use client";

import * as React from "react";

type Primitive = string | number | boolean;

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
