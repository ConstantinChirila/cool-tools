"use client";

import * as React from "react";
import { clamp } from "@/lib/utils";

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
      return field.range ? clamp(n, field.range.min, field.range.max) : n;
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
 * Every tool's last-used inputs, keyed by the tool slug (the path), each stored
 * as the same short query string that goes in the URL (only fields that differ
 * from their default). One key for the whole site keeps storage tidy as the
 * number of tools grows.
 */
const SAVED_STATE_KEY = "bitsbobs:state";

function toolKey(): string {
  return window.location.pathname.replace(/^\//, "").replace(/\/$/, "");
}

function readSavedStates(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_STATE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function saveState(key: string, serialized: string) {
  try {
    const states = readSavedStates();
    if (serialized) states[key] = serialized;
    else delete states[key];
    if (Object.keys(states).length) localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(states));
    else localStorage.removeItem(SAVED_STATE_KEY);
  } catch {
    // Storage blocked or full: the URL still carries the state for this visit.
  }
}

function applyParams(params: URLSearchParams, fields: Record<string, UrlField>): boolean {
  let applied = false;
  for (const [key, field] of Object.entries(fields)) {
    const raw = params.get(key);
    if (raw === null) continue;
    const parsed = parse(raw, field);
    if (parsed === undefined) continue;
    (field.set as (v: Primitive) => void)(parsed);
    applied = true;
  }
  return applied;
}

/**
 * Keeps a tool's inputs in the URL so the address bar is always a shareable
 * link, and remembers them in localStorage so the tool reopens as it was left.
 * On mount, recognised query params are applied to state; a URL with none
 * falls back to the saved state. After that, state changes are written back
 * to both (debounced), with fields at their default value left out to keep
 * links short.
 */
export function useUrlState(fields: Record<string, UrlField>) {
  // Setters and defaults are stable, so the fields seen on first render are
  // all the mount-time read needs.
  const [initial] = React.useState(fields);
  const ready = React.useRef(false);

  React.useEffect(() => {
    const fromUrl = applyParams(new URLSearchParams(window.location.search), initial);
    if (!fromUrl) {
      const saved = readSavedStates()[toolKey()];
      if (saved) applyParams(new URLSearchParams(saved), initial);
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
      saveState(toolKey(), serialized);
    }, 300);
    return () => window.clearTimeout(id);
  }, [serialized]);
}
