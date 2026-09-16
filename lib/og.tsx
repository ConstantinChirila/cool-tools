import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";
import type { Tool } from "@/lib/tools";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#2a2723";
const PAPER = "#fbf9f4";
/** Hex versions of the sticker palette (satori cannot read CSS variables). */
const TINTS: Record<string, string> = {
  "var(--sticker-yellow)": "#f7d54a",
  "var(--sticker-pink)": "#f5b8d0",
  "var(--sticker-mint)": "#a9ebc8",
  "var(--sticker-sky)": "#a9d7f4",
  "var(--sticker-lilac)": "#cfbff2",
};

const host = SITE_URL.replace(/^https?:\/\//, "");

function Mark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: 36,
        background: "#f7d54a",
        border: `4px solid ${INK}`,
        fontSize: 22,
        fontWeight: 700,
        color: INK,
        transform: "rotate(-6deg)",
      }}
    >
      B&amp;B
    </div>
  );
}

/** Sticker-style social card: tinted tile with the tool name, description and site mark. */
export function renderOgImage({ tool }: { tool?: Tool }) {
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
          fontFamily: "sans-serif",
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
              <div style={{ fontSize: 36, fontWeight: 700 }}>Bits &amp; Bobs</div>
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
            <div style={{ fontSize: tool ? 76 : 96, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              {title}
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.35, maxWidth: 980 }}>{blurb}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 700 }}>
            <div>Free · No sign-up · No email</div>
            <div>{host}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
