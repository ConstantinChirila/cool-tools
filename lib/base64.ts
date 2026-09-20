import { fail, ok, type Result } from "@/lib/result";

// Kept apart from lib/encoding.ts so the JWT decoder does not pull in every codec and the HTML entity tables.

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64.charAt(a >> 2);
    out += B64.charAt(((a & 3) << 4) | ((b ?? 0) >> 4));
    out += b === undefined ? "=" : B64.charAt(((b & 15) << 2) | ((c ?? 0) >> 6));
    out += c === undefined ? "=" : B64.charAt(c & 63);
  }
  return out;
}

/** Accepts the standard and URL-safe alphabets, with or without padding, ignoring whitespace. */
export function base64ToBytes(input: string): Result<Uint8Array> {
  const text = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const body = text.replace(/=+$/, "");
  const bad = body.search(/[^A-Za-z0-9+/]/);
  if (bad !== -1) return fail(`"${body.charAt(bad)}" is not a Base64 character.`);
  if (text.length - body.length > 2) return fail("Base64 never ends with more than two = signs.");
  if (body.length % 4 === 1) {
    return fail("The length is wrong for Base64: a character is missing or has been added.");
  }

  const bytes = new Uint8Array(Math.floor((body.length * 3) / 4));
  let at = 0;
  for (let i = 0; i < body.length; i += 4) {
    const n =
      (B64.indexOf(body.charAt(i)) << 18) |
      (B64.indexOf(body.charAt(i + 1)) << 12) |
      ((i + 2 < body.length ? B64.indexOf(body.charAt(i + 2)) : 0) << 6) |
      (i + 3 < body.length ? B64.indexOf(body.charAt(i + 3)) : 0);
    bytes[at++] = n >> 16;
    if (i + 2 < body.length) bytes[at++] = (n >> 8) & 255;
    if (i + 3 < body.length) bytes[at++] = n & 255;
  }
  return ok(bytes);
}
