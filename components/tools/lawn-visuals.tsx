"use client";

import { texture } from "@/components/tools/garden-visuals";
import { cn } from "@/lib/utils";

const INK = "var(--foreground)";

/** A roll of turf seen from the end: grass wrapped round its soil. Needs `TextureDefs` on the page. */
export function TurfRoll({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 32" className={cn("shrink-0", className)} aria-hidden>
      <path d="M12 6 H38 Q42 6 42 16 Q42 26 38 26 H12 Z" fill={texture("grass")} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={12} cy={16} rx={8} ry={10} fill={texture("topsoil")} stroke={INK} strokeWidth={2.5} />
      <path d="M12 16 m-1 0 a1.5 2 0 1 1 3 0 a3.5 4.5 0 1 1 -7 0 a5.5 7 0 1 1 11 0" fill="none" stroke="oklch(0.66 0.15 140)" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

/**
 * A pack of grass seed or lawn feed. `big` draws the tall sack sizes (5 kg
 * and up) rather than the small box.
 */
export function Pack({ kind, big = false, className }: { kind: "seed" | "feed"; big?: boolean; className?: string }) {
  const band = kind === "seed" ? "var(--sticker-mint)" : "var(--sticker-sky)";
  return (
    <svg viewBox="0 0 32 40" className={cn("shrink-0", className)} aria-hidden>
      {big ? (
        <path d="M6 6 Q16 2 26 6 L28 36 Q16 39 4 36 Z" fill="var(--card)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      ) : (
        <rect x={5} y={4} width={22} height={32} rx={3} fill="var(--card)" stroke={INK} strokeWidth={2.5} />
      )}
      <rect x={big ? 6.5 : 7} y={15} width={big ? 19.5 : 18} height={12} fill={band} />
      {kind === "seed" ? (
        <path d="M11 25 q1 -6 5 -8 M16 25 q0 -5 0 -9 M21 25 q-1 -6 -5 -8" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      ) : (
        <>
          <circle cx={12} cy={21} r={1.6} fill={INK} />
          <circle cx={17} cy={19} r={1.6} fill={INK} />
          <circle cx={20} cy={23.5} r={1.6} fill={INK} />
          <circle cx={14.5} cy={24.5} r={1.6} fill={INK} />
        </>
      )}
      {big ? (
        <path d="M6 15 H26" stroke={INK} strokeWidth={2} />
      ) : (
        <path d="M7 15 H25 M7 27 H25" stroke={INK} strokeWidth={2} />
      )}
    </svg>
  );
}

/** A watering can, for the water line. */
export function WateringCan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" className={cn("shrink-0", className)} aria-hidden>
      <path d="M26 14 L37 6" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M35 4 l4 4" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M8 12 Q8 6 16 6 Q24 6 24 12" fill="none" stroke={INK} strokeWidth={2.5} />
      <rect x={4} y={12} width={24} height={16} rx={3} fill="var(--sticker-sky)" stroke={INK} strokeWidth={2.5} />
      <path d="M9 18 q3 -2 6 0 t6 0" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
