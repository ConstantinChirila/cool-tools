/**
 * An evidence jar labelled "your data", empty apart from a tumbleweed, with a
 * cookie that has been firmly declined. Drawn in the sticker vocabulary: ink
 * outlines, candy fills, hard offset shadow.
 */
export function PrivacyIllustration() {
  return (
    <figure className="mx-auto my-2 flex max-w-sm flex-col items-center gap-3">
      <svg
        viewBox="0 0 360 300"
        className="w-full"
        role="img"
        aria-label="An empty jar labelled 'your data' containing a single tumbleweed, next to a cookie with a no-entry sign through it."
      >
        <g stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Jar shadow */}
          <rect x="107" y="79" width="166" height="192" rx="26" fill="var(--foreground)" stroke="none" />
          {/* Jar body */}
          <rect x="100" y="72" width="166" height="192" rx="26" fill="var(--card)" />
          {/* Glass highlight */}
          <path d="M122 110 v120" stroke="var(--sticker-sky)" strokeWidth="6" />
          <path d="M122 96 v6" stroke="var(--sticker-sky)" strokeWidth="6" />
          {/* Neck and lid */}
          <rect x="112" y="60" width="142" height="18" fill="var(--card)" />
          <rect x="96" y="34" width="174" height="34" rx="9" fill="var(--sticker-yellow)" />
          <path d="M112 46 h142" strokeWidth="2.5" strokeDasharray="6 6" />
          {/* Label */}
          <g transform="rotate(-3 183 170)">
            <rect x="118" y="150" width="130" height="46" rx="8" fill="var(--sticker-pink)" />
            <text
              x="183"
              y="179"
              textAnchor="middle"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fontWeight="700"
              fontSize="17"
              fill="var(--foreground)"
              stroke="none"
            >
              YOUR DATA
            </text>
          </g>
          {/* Tumbleweed */}
          <g transform="translate(183 234)" fill="none" strokeWidth="2.2">
            <circle r="14" strokeDasharray="4 3" />
            <circle r="9" strokeDasharray="3 4" transform="rotate(30)" />
            <path d="M-11 -8 l22 16 M-10 9 l20 -17 M0 -14 v28 M-14 0 h28" strokeDasharray="2 3" />
          </g>
          {/* Dust kicked up by the tumbleweed */}
          <path d="M150 248 h8 M160 254 h5" strokeWidth="2.2" />
          {/* Cookie, declined */}
          <g transform="translate(298 214) rotate(8)">
            <circle cx="5" cy="5" r="34" fill="var(--foreground)" stroke="none" />
            <circle r="34" fill="oklch(0.86 0.08 70)" />
            <g fill="var(--foreground)" stroke="none">
              <circle cx="-12" cy="-10" r="4" />
              <circle cx="10" cy="-14" r="3.5" />
              <circle cx="14" cy="8" r="4" />
              <circle cx="-6" cy="12" r="3.5" />
              <circle cx="-16" cy="6" r="2.5" />
            </g>
            <circle r="44" fill="none" stroke="var(--destructive)" strokeWidth="6" />
            <path d="M-31 -31 L31 31" stroke="var(--destructive)" strokeWidth="6" />
          </g>
          {/* Little sticker: NOTHING */}
          <g transform="translate(48 96) rotate(-9)">
            <rect x="-30" y="-14" width="60" height="28" rx="7" fill="var(--sticker-mint)" />
            <text
              y="5"
              textAnchor="middle"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fontWeight="700"
              fontSize="11"
              fill="var(--foreground)"
              stroke="none"
            >
              NOTHING
            </text>
          </g>
          <path d="M70 110 q20 14 36 30" fill="none" strokeWidth="2.5" strokeDasharray="4 4" />
        </g>
      </svg>
      <figcaption className="text-center font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Fig. 1: everything we know about you (actual size)
      </figcaption>
    </figure>
  );
}
