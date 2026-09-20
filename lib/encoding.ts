import { decodeHTML, encodeNonAsciiHTML, encodeXML, escapeUTF8 } from "entities";

export type CodecId = "base64" | "url" | "html" | "hex" | "unicode";
export type Direction = "encode" | "decode";

export type CodecResult = { ok: true; value: string } | { ok: false; error: string };

export interface CodecVariant {
  id: string;
  label: string;
  /** One line shown under the control. */
  hint: string;
}

export interface Codec {
  id: CodecId;
  name: string;
  /** Label for the box holding the encoded form. */
  encodedLabel: string;
  /** Short example for the picker tile. */
  example: string;
  /** Variants change how text is encoded. Decoding accepts every variant's output. */
  variants: readonly CodecVariant[];
  /** A yes/no choice that only matters when decoding. */
  decodeOption?: { label: string; hint: string };
  encode: (text: string, variant: string) => string;
  decode: (text: string, option: boolean) => CodecResult;
}

const ok = (value: string): CodecResult => ({ ok: true, value });
const fail = (error: string): CodecResult => ({ ok: false, error });

const NOT_TEXT =
  "The decoded bytes are not valid UTF-8 text. This is probably binary data (an image, a key, compressed data) rather than encoded text.";

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function utf8Text(bytes: Uint8Array): CodecResult {
  try {
    return ok(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail(NOT_TEXT);
  }
}

// --- Base64 ---------------------------------------------------------------

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
export function base64ToBytes(input: string): Uint8Array | { error: string } {
  const text = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const body = text.replace(/=+$/, "");
  const bad = body.search(/[^A-Za-z0-9+/]/);
  if (bad !== -1) return { error: `"${body.charAt(bad)}" is not a Base64 character.` };
  if (text.length - body.length > 2) return { error: "Base64 never ends with more than two = signs." };
  if (body.length % 4 === 1) {
    return { error: "The length is wrong for Base64: a character is missing or has been added." };
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
  return bytes;
}

const base64: Codec = {
  id: "base64",
  name: "Base64",
  encodedLabel: "Base64",
  example: "SGVsbG8=",
  variants: [
    { id: "standard", label: "Standard", hint: "A to Z, a to z, 0 to 9, + and /, padded with = (RFC 4648)." },
    { id: "urlsafe", label: "URL-safe", hint: "Uses - and _ instead of + and /, with no = padding. Used in JWTs and URLs." },
  ],
  encode(text, variant) {
    const encoded = bytesToBase64(utf8Bytes(text));
    return variant === "urlsafe"
      ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
      : encoded;
  },
  decode(text) {
    const bytes = base64ToBytes(text);
    return "error" in bytes ? fail(bytes.error) : utf8Text(bytes);
  },
};

// --- URL ------------------------------------------------------------------

const url: Codec = {
  id: "url",
  name: "URL",
  encodedLabel: "URL-encoded",
  example: "a%20b%26c",
  variants: [
    { id: "component", label: "Component", hint: "For one value, such as a query parameter: encodes everything that is not a letter, digit or - _ . ! ~ * ' ( )." },
    { id: "full", label: "Whole URL", hint: "For a complete address: leaves : / ? # & = and the other URL punctuation alone." },
    { id: "form", label: "Form", hint: "Like Component, but a space becomes + as in submitted HTML forms." },
  ],
  encode(text, variant) {
    // Lone surrogates make the built-ins throw; swap them for U+FFFD first.
    const safe = text.toWellFormed?.() ?? text;
    if (variant === "full") return encodeURI(safe);
    const encoded = encodeURIComponent(safe);
    return variant === "form" ? encoded.replace(/%20/g, "+") : encoded;
  },
  decodeOption: {
    label: "+ means space",
    hint: "Query strings and submitted forms write a space as +. Switch off for paths, where + is a literal plus.",
  },
  decode(input, plusIsSpace) {
    const text = plusIsSpace ? input.replace(/\+/g, " ") : input;
    const bad = text.search(/%(?![0-9A-Fa-f]{2})/);
    if (bad !== -1) {
      return fail(`The % at position ${bad + 1} is not followed by two hex digits. A literal percent sign must be written as %25.`);
    }
    try {
      return ok(decodeURIComponent(text));
    } catch {
      return fail("The percent-encoded bytes are not valid UTF-8. The text may have been encoded with an older character set such as Latin-1.");
    }
  },
};

// --- HTML entities ----------------------------------------------------------

const html: Codec = {
  id: "html",
  name: "HTML entities",
  encodedLabel: "HTML-escaped",
  example: "&lt;p&gt;",
  variants: [
    { id: "essential", label: "Essential", hint: "Only the five characters that can break HTML: & < > \" and '." },
    { id: "named", label: "Named", hint: "Also turns accents and symbols into names such as &eacute; and &euro;." },
    { id: "numeric", label: "Numeric", hint: "Also turns every non-ASCII character into a number such as &#xe9;." },
  ],
  encode(text, variant) {
    if (variant === "named") return encodeNonAsciiHTML(text);
    if (variant === "numeric") return encodeXML(text);
    return escapeUTF8(text);
  },
  decode(text) {
    return ok(decodeHTML(text));
  },
};

// --- Hex --------------------------------------------------------------------

const hex: Codec = {
  id: "hex",
  name: "Hex",
  encodedLabel: "Hex bytes",
  example: "48 65 6c",
  variants: [
    { id: "spaced", label: "Spaced", hint: "One UTF-8 byte per pair, separated by spaces: 48 65 6c 6c 6f." },
    { id: "plain", label: "Plain", hint: "No separators: 48656c6c6f." },
    { id: "escaped", label: "\\x", hint: "Each byte as a \\x escape, as used in C, Python and shell strings." },
  ],
  encode(text, variant) {
    const pairs = Array.from(utf8Bytes(text), (byte) => byte.toString(16).padStart(2, "0"));
    if (variant === "plain") return pairs.join("");
    if (variant === "escaped") return pairs.map((pair) => `\\x${pair}`).join("");
    return pairs.join(" ");
  },
  decode(text) {
    const digits = text.replace(/\\x|0x|[\s,:;-]/gi, "");
    const bad = digits.search(/[^0-9a-f]/i);
    if (bad !== -1) return fail(`"${digits.charAt(bad)}" is not a hex digit (0 to 9, a to f).`);
    if (digits.length % 2 === 1) return fail("Hex bytes come in pairs of digits, and there is an odd number of digits here.");
    const bytes = new Uint8Array(digits.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(digits.slice(i * 2, i * 2 + 2), 16);
    return utf8Text(bytes);
  },
};

// --- Unicode escapes --------------------------------------------------------

const SIMPLE_ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
  "\\": "\\",
  "'": "'",
  '"': '"',
  "/": "/",
};

const unit = (code: number) => `\\u${code.toString(16).padStart(4, "0")}`;

const unicode: Codec = {
  id: "unicode",
  name: "Unicode escapes",
  encodedLabel: "Escaped",
  example: "caf\\u00e9",
  variants: [
    { id: "nonascii", label: "Non-ASCII", hint: "Escapes accents, symbols and emoji as \\uXXXX and leaves plain ASCII readable. Valid in JSON, JavaScript, Java and C#." },
    { id: "all", label: "Everything", hint: "Escapes every character, ASCII included." },
    { id: "codepoint", label: "\\u{…}", hint: "One escape per character using the ES2015 code point form, so an emoji is \\u{1f600} rather than a surrogate pair." },
  ],
  encode(text, variant) {
    if (variant === "codepoint") {
      return Array.from(text, (char) => {
        const code = char.codePointAt(0) ?? 0;
        return code < 128 ? char : `\\u{${code.toString(16)}}`;
      }).join("");
    }
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      out += variant === "all" || code > 126 || (code < 32 && ![9, 10, 13].includes(code)) ? unit(code) : text.charAt(i);
    }
    return out;
  },
  decode(text) {
    let error: string | null = null;
    const value = text.replace(
      /\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([ntrbfv0\\'"/]))/g,
      (match, point: string | undefined, utf16: string | undefined, byte: string | undefined, simple: string | undefined) => {
        if (simple !== undefined) return SIMPLE_ESCAPES[simple] ?? match;
        if (point !== undefined) {
          const code = Number.parseInt(point, 16);
          if (code > 0x10ffff) {
            error = `\\u{${point}} is beyond the last Unicode code point, 10FFFF.`;
            return match;
          }
          return String.fromCodePoint(code);
        }
        return String.fromCharCode(Number.parseInt(utf16 ?? byte ?? "0", 16));
      },
    );
    return error === null ? ok(value) : fail(error);
  },
};

export const codecs: readonly Codec[] = [base64, url, html, hex, unicode];
export const codecIds = codecs.map((c) => c.id);

export function getCodec(id: CodecId): Codec {
  const codec = codecs.find((c) => c.id === id);
  if (!codec) throw new Error(`Unknown codec "${id}"`);
  return codec;
}

export function defaultVariant(codec: Codec): string {
  return codec.variants[0]?.id ?? "";
}

/** An unknown variant (say, left in the URL from another codec) falls back to the codec's first. */
export function runCodec(
  id: CodecId,
  direction: Direction,
  text: string,
  variant: string,
  decodeOption = true,
): CodecResult {
  const codec = getCodec(id);
  if (direction === "decode") return codec.decode(text, decodeOption);
  const known = codec.variants.some((v) => v.id === variant) ? variant : defaultVariant(codec);
  return ok(codec.encode(text, known));
}

/** Size of a text once stored or sent as UTF-8. */
export function byteLength(text: string): number {
  return utf8Bytes(text).length;
}
