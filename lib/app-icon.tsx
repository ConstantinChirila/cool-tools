import { ImageResponse } from "next/og";
import { BLOB, loadGabarito } from "@/lib/og";

const INK = "#2a2723";
const PAPER = "#fbf9f4";
const YELLOW = "#f7d54a";

/** Sizes served at /pwa-icon/<size> for the web manifest. */
export const MANIFEST_ICON_SIZES = [192, 512] as const;

/**
 * Home screen icon: the B&B sticker on full-bleed paper. No transparency (iOS paints it black),
 * and the mark stays inside the central 80% so Android's maskable crop never clips it.
 */
export async function renderAppIcon(size: number) {
  const gabarito = await loadGabarito(900);
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
      fonts: [gabarito],
    },
  );
}
