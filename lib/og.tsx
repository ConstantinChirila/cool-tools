import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";
import type { Tool } from "@/lib/tools";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#2a2723";
const PAPER = "#fbf9f4";

/** Same blob as app/icon.svg, in a 64 unit box. */
export const BLOB = "M12 8 C26 2 44 4 55 12 C63 20 61 40 54 51 C46 62 22 62 12 54 C2 46 2 18 12 8 Z";

type GabaritoWeight = 500 | 700 | 900;

/** Gabarito from @fontsource as a satori font entry. woff, not woff2: satori cannot read woff2. */
export async function loadGabarito(weight: GabaritoWeight) {
  const data = await readFile(
    join(process.cwd(), `node_modules/@fontsource/gabarito/files/gabarito-latin-${weight}-normal.woff`),
  );
  return { name: "Gabarito", data, weight, style: "normal" as const };
}
/** Hex versions of the sticker palette (satori cannot read CSS variables). */
const TINTS: Record<string, string> = {
  "var(--sticker-yellow)": "#f7d54a",
  "var(--sticker-pink)": "#f5b8d0",
  "var(--sticker-mint)": "#a9ebc8",
  "var(--sticker-sky)": "#a9d7f4",
  "var(--sticker-lilac)": "#cfbff2",
};

const host = SITE_URL.replace(/^https?:\/\//, "");

/** The B&B blob sticker from app/icon.svg with a hard shadow. */
function Mark() {
  const size = 84;
  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size, transform: "rotate(-6deg)" }}>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ position: "absolute", left: 4, top: 4 }}>
        <path d={BLOB} fill={INK} stroke={INK} strokeWidth="3" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={BLOB} fill="#f7d54a" stroke={INK} strokeWidth="3" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 25,
          fontWeight: 900,
        }}
      >
        B&amp;B
      </div>
    </div>
  );
}

/** Sticker-style social card: tinted tile with the tool name, description and site mark. */
export async function renderOgImage({ tool }: { tool?: Tool }) {
  const fonts = await Promise.all(([500, 700, 900] as const).map(loadGabarito));
  const tint = tool ? (TINTS[tool.tint] ?? "#f7d54a") : "#f7d54a";
  const title = tool ? tool.name : "Bits & Bobs";
  const blurb = tool
    ? tool.seo.description
    : "Odd little tools that just work. Free UK calculators, no sign-up, nobody asks for your email.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          padding: 56,
          color: INK,
          fontFamily: "Gabarito",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            background: tint,
            border: `6px solid ${INK}`,
            borderRadius: 44,
            boxShadow: `14px 14px 0 ${INK}`,
            padding: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Mark />
              <div style={{ fontSize: 38, fontWeight: 900 }}>Bits &amp; Bobs</div>
            </div>
            {tool && (
              <div
                style={{
                  display: "flex",
                  border: `4px solid ${INK}`,
                  borderRadius: 999,
                  background: "#fff",
                  padding: "8px 22px",
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  transform: "rotate(3deg)",
                }}
              >
                {tool.category}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: !tool ? 96 : title.length > 24 ? 64 : 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>
              {title}
            </div>
            <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.35, maxWidth: 980 }}>{blurb}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 700 }}>
            <div>Free · No sign-up · No email</div>
            <div>{host}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
