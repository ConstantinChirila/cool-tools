"use client";

import * as React from "react";
import { Coins, Dices, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { urlField, useUrlState } from "@/hooks/use-url-state";
import { rollDie } from "@/lib/dice";
import { cn } from "@/lib/utils";
import { DiceCanvas } from "./dice-canvas";

type Mode = "dice" | "coin";
type Side = "heads" | "tails";

const SIDES = [4, 6, 8, 10, 12, 20] as const;
const COUNTS = [1, 2, 3, 4, 5] as const;
const TINT_VARS = [
  "--sticker-yellow",
  "--sticker-mint",
  "--sticker-sky",
  "--sticker-pink",
  "--sticker-lilac",
];

const FLIP_MS = 1100;
const HISTORY_MAX = 8;
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** A labelled group of choice pills: the rail is too narrow for a segmented row. */
function PillGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  columns,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  columns: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[15px] font-bold">{label}</p>
      <div role="radiogroup" aria-label={label} className={cn("grid gap-1.5", columns)}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "h-10 rounded-xl border-[2.5px] border-foreground text-sm font-bold transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "bg-foreground text-background"
                  : "bg-card hover:-translate-y-0.5 hover:bg-secondary",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CoinFace({ label, className, back }: { label: string; className: string; back?: boolean }) {
  return (
    <span
      className={cn(
        "sticker absolute inset-0 flex flex-col items-center justify-center rounded-full [backface-visibility:hidden]",
        className,
      )}
      style={back ? { transform: "rotateY(180deg)" } : undefined}
      aria-hidden
    >
      <span className="font-heading text-5xl font-black">{label.charAt(0)}</span>
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </span>
  );
}

export function DiceRoller() {
  const reduced = usePrefersReducedMotion();

  const [mode, setMode] = React.useState<Mode>("dice");
  const [count, setCount] = React.useState(2);
  const [sides, setSides] = React.useState(6);
  const [call, setCall] = React.useState<Side>("heads");

  const [faces, setFaces] = React.useState<number[]>(() => [1, 1]);
  const [rolling, setRolling] = React.useState(false);
  const [rollId, setRollId] = React.useState(0);

  const [side, setSide] = React.useState<Side>("heads");
  const [rotation, setRotation] = React.useState(0);
  const [flipping, setFlipping] = React.useState(false);
  const [lastCall, setLastCall] = React.useState<boolean | null>(null);

  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const landing = React.useRef<string | null>(null);

  /** Faces the new die does not have fall back to 1, and a throw in the air is dropped. */
  function changeSides(next: number) {
    landing.current = null;
    setSides(next);
    setFaces((current) => current.map((face) => (face > next ? 1 : face)));
  }

  useUrlState({
    mode: urlField(mode, setMode, "dice" as Mode, ["dice", "coin"]),
    n: urlField(count, setCount, 2, undefined, { min: 1, max: 5 }),
    d: urlField(
      sides,
      (v: number) => {
        if ((SIDES as readonly number[]).includes(v)) changeSides(v);
      },
      6,
    ),
  });

  /** The chip row: the last few throws, newest first. `label` is a dice total or H / T. */
  const [history, setHistory] = React.useState<{ id: number; label: string; tint: string }[]>([]);
  /** Kept apart from the chip row, which is capped: the tally covers every flip. */
  const [tally, setTally] = React.useState({ heads: 0, tails: 0, last: null as Side | null, run: 0, longest: 0 });
  const nextId = React.useRef(0);

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const busy = rolling || flipping;
  // The tray follows the dice count without resetting state: extra slots start on 1.
  const shown = React.useMemo(
    () => Array.from({ length: count }, (_, i) => faces[i] ?? 1),
    [faces, count],
  );
  const dice = React.useMemo(
    () =>
      shown.map((value, i) => ({
        value,
        tint: TINT_VARS[i % TINT_VARS.length] ?? "--sticker-yellow",
      })),
    [shown],
  );

  function remember(label: string, tint: string) {
    const id = nextId.current++;
    setHistory((h) => [{ id, label, tint }, ...h].slice(0, HISTORY_MAX));
  }

  function clearHistory() {
    setHistory([]);
    setTally({ heads: 0, tails: 0, last: null, run: 0, longest: 0 });
  }

  function rollDice() {
    const final = Array.from({ length: count }, () => rollDie(sides));
    landing.current = String(final.reduce((sum, face) => sum + face, 0));
    setFaces(final);
    setRollId((n) => n + 1);
    if (reduced) {
      settle();
      return;
    }
    setRolling(true);
  }

  /** Called when the canvas finishes its throw (or immediately, if animation is off). */
  function settle() {
    const label = landing.current;
    landing.current = null;
    setRolling(false);
    if (label) remember(label, "bg-card");
  }

  function land(result: Side) {
    setSide(result);
    setLastCall(result === call);
    remember(result === "heads" ? "H" : "T", result === "heads" ? "bg-yellow" : "bg-sky");
    setTally((t) => {
      const run = t.last === result ? t.run + 1 : 1;
      return {
        heads: t.heads + (result === "heads" ? 1 : 0),
        tails: t.tails + (result === "tails" ? 1 : 0),
        last: result,
        run,
        longest: Math.max(t.longest, run),
      };
    });
  }

  function flipCoin() {
    const result: Side = rollDie(2) === 1 ? "heads" : "tails";
    const want = result === "heads" ? 0 : 180;

    if (reduced) {
      setRotation(want);
      land(result);
      return;
    }

    // Land on a rotation whose parity shows the drawn face, after five spins.
    let next = rotation + 5 * 360;
    next += ((want - (next % 360)) + 360) % 360;

    setFlipping(true);
    setLastCall(null);
    setRotation(next);
    timers.current.push(
      setTimeout(() => {
        setFlipping(false);
        land(result);
      }, FLIP_MS),
    );
  }

  const total = shown.reduce((sum, f) => sum + f, 0);
  const headline = busy ? "…" : mode === "dice" ? total : side === "heads" ? "Heads" : "Tails";
  const subline =
    mode === "dice"
      ? rolling
        ? "Rolling…"
        : shown.join("  +  ")
      : flipping
        ? "Spinning…"
        : lastCall === null
          ? `You called ${call}`
          : lastCall
            ? `Called it: ${call} ✓`
            : `Missed: you called ${call}`;

  return (
    <div className="grid w-full gap-3 lg:grid-cols-[272px_1fr] lg:items-stretch">
      <style>{`
        @keyframes coin-toss {
          0%   { transform: translateY(0)     scale(1); }
          35%  { transform: translateY(-42px) scale(1.06); }
          70%  { transform: translateY(-12px) scale(1.02); }
          100% { transform: translateY(0)     scale(1); }
        }
      `}</style>

      {/* Stage: first in the DOM so a phone shows the throw above the controls;
          every row has a fixed height, so a result can never resize the card
          (and with it, shift the button in the rail). */}
      <Card className="h-full lg:order-2">
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div
            className="relative h-60 overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-secondary sm:h-72 lg:h-auto lg:min-h-72 lg:flex-1"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="absolute left-3 top-3 z-10 rounded-full border-2 border-foreground bg-card px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide">
              {mode === "dice" ? `${count} × d${sides}` : "Coin toss"}
            </span>
            {mode === "dice" ? (
              // Absolute so the canvas element's own size never feeds back into
              // the card height (a fractional pixel there shifted the rail).
              <DiceCanvas
                dice={dice}
                sides={sides}
                rollId={rollId}
                animate={!reduced}
                onSettled={settle}
                className="absolute inset-0 block h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="[perspective:900px]"
                  style={flipping ? { animation: `coin-toss ${FLIP_MS}ms ease-in-out` } : undefined}
                >
                  <div
                    className="relative size-32 transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0.75,0.2,1)] [transform-style:preserve-3d] sm:size-44"
                    style={{ transform: `rotateY(${rotation}deg)` }}
                  >
                    <CoinFace label="Heads" className="bg-yellow" />
                    <CoinFace label="Tails" className="bg-sky" back />
                  </div>
                </div>
              </div>
            )}
            {!busy && (
              <span className="sr-only">
                {mode === "dice" ? `Total ${total}` : side === "heads" ? "Heads" : "Tails"}
              </span>
            )}
          </div>

          <div className="flex h-16 items-center justify-between gap-4 px-1">
            <div className="min-w-0">
              <p className="text-[15px] font-bold">{mode === "dice" ? "Total" : "Landed on"}</p>
              <p className="truncate font-mono text-[13px] font-bold text-muted-foreground">{subline}</p>
            </div>
            <p className="shrink-0 font-heading text-5xl font-black leading-none tracking-tight text-numeric">
              {headline}
            </p>
          </div>

          <div className="flex h-11 items-center gap-2 border-t-2 border-dashed border-foreground/20 pt-3">
            <p className="shrink-0 text-[13px] font-bold text-muted-foreground">
              {history.length > 0 ? "Recent" : "Nothing thrown yet"}
            </p>
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
              {history.map((h) => (
                <span
                  key={h.id}
                  className={cn(
                    "shrink-0 rounded-full border-2 border-foreground px-2.5 py-0.5 font-mono text-[11px] font-bold",
                    h.tint,
                  )}
                >
                  {h.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={clearHistory}
              disabled={history.length === 0}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-secondary disabled:invisible focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <RotateCcw className="size-3.5" strokeWidth={2.5} />
              Clear
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Controls rail: on desktop the throw button is pinned to the bottom, so it
          stays put when the setup above changes; on a phone it leads the rail, so
          it sits right under the tray. */}
      <Card className="h-full lg:order-1">
        <CardContent className="flex h-full flex-col gap-4 py-4">
          <PillGroup
            label="Throwing"
            value={mode}
            onChange={setMode}
            columns="grid-cols-2"
            options={[
              { value: "dice", label: "Dice" },
              { value: "coin", label: "Coin" },
            ]}
          />

          {/* Both setups share one grid cell, so the area is always as tall as the
              taller of the two and the throw button below never shifts. */}
          <div className="grid">
            <div
              className={cn("col-start-1 row-start-1 space-y-4", mode === "dice" || "invisible")}
              inert={mode !== "dice"}
            >
              <PillGroup
                label="How many"
                value={String(count)}
                onChange={(v) => setCount(Number(v))}
                columns="grid-cols-5"
                options={COUNTS.map((c) => ({ value: String(c), label: String(c) }))}
              />
              <PillGroup
                label="Sides"
                value={String(sides)}
                onChange={(v) => changeSides(Number(v))}
                columns="grid-cols-3"
                options={SIDES.map((s) => ({ value: String(s), label: `d${s}` }))}
              />
            </div>

            <div
              className={cn("col-start-1 row-start-1 space-y-4", mode === "coin" || "invisible")}
              inert={mode !== "coin"}
            >
              <PillGroup
                label="Call it"
                value={call}
                onChange={setCall}
                columns="grid-cols-2"
                options={[
                  { value: "heads" as Side, label: "Heads" },
                  { value: "tails" as Side, label: "Tails" },
                ]}
              />
              <div className="space-y-1.5">
                <p className="text-[15px] font-bold">This session</p>
                <dl className="space-y-1 rounded-xl border-2 border-dashed border-foreground/25 px-3 py-2 text-[13px] font-bold">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Heads / tails</dt>
                    <dd className="text-numeric">
                      {tally.heads} / {tally.tails}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Flips</dt>
                    <dd className="text-numeric">{tally.heads + tally.tails}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Longest streak</dt>
                    <dd className="text-numeric">{tally.longest}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="order-first lg:order-none lg:mt-auto">
            <button
              type="button"
              onClick={mode === "dice" ? rollDice : flipCoin}
              disabled={busy}
              className="sticker flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-foreground font-heading text-lg font-extrabold text-background transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
            >
              {mode === "dice" ? (
                <Dices className="size-5" strokeWidth={2.5} />
              ) : (
                <Coins className="size-5" strokeWidth={2.5} />
              )}
              {mode === "dice" ? `Roll ${count === 1 ? "die" : "dice"}` : "Flip coin"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
