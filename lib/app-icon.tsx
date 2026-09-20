import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const INK = "#2a2723";
const PAPER = "#fbf9f4";
const YELLOW = "#f7d54a";

/** Same blob as app/icon.svg, in a 64 unit box. */
const BLOB = "M12 8 C26 2 44 4 55 12 C63 20 61 40 54 51 C46 62 22 62 12 54 C2 46 2 18 12 8 Z";

/** Sizes served at /pwa-icon/<size> for the web manifest. */
export const MANIFEST_ICON_SIZES = [192, 512] as const;

/**
 * Home screen icon: the B&B sticker on full-bleed paper. No transparency (iOS paints it black),
 * and the mark stays inside the central 80% so Android's maskable crop never clips it.
 */
export async function renderAppIcon(size: number) {
  // woff, not woff2: satori cannot read woff2.
  const gabarito = await readFile(
    join(process.cwd(), "node_modules/@fontsource/gabarito/files/gabarito-latin-900-normal.woff"),
  );
  const mark = size * 0.66;
  const offset = size * 0.035;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
        }}
      >
        <div style={{ display: "flex", position: "relative", width: mark, height: mark, transform: "rotate(-6deg)" }}>
          <svg
            width={mark}
            height={mark}
            viewBox="0 0 64 64"
            style={{ position: "absolute", left: offset, top: offset }}
          >
            <path d={BLOB} fill={INK} stroke={INK} strokeWidth="3" />
          </svg>
          <svg width={mark} height={mark} viewBox="0 0 64 64" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={BLOB} fill={YELLOW} stroke={INK} strokeWidth="3" />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: mark,
              height: mark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: mark * 0.3,
              fontFamily: "Gabarito",
              fontWeight: 900,
              letterSpacing: -mark * 0.01,
              color: INK,
            }}
          >
            B&amp;B
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Gabarito", data: gabarito, weight: 900, style: "normal" }],
    },
  );
}
