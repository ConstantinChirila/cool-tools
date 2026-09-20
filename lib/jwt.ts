import { base64ToBytes } from "@/lib/base64";
import { fail, ok, type Result } from "@/lib/result";

export type JsonObject = Record<string, unknown>;

export interface DecodedJwt {
  /** The three dot-separated parts exactly as pasted. */
  parts: { header: string; payload: string; signature: string };
  header: JsonObject;
  payload: JsonObject;
  /** `alg` from the header, if it is a string. */
  algorithm: string | null;
}

export type JwtResult = Result<DecodedJwt>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodePart(part: string, name: string): Result<JsonObject> {
  const bytes = base64ToBytes(part);
  if (!bytes.ok) return fail(`The ${name} is not valid Base64: ${bytes.error}`);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.value);
  } catch {
    return fail(`The ${name} decodes to bytes that are not text, so this is not a JSON Web Token.`);
  }
  try {
    const value: unknown = JSON.parse(text);
    if (isJsonObject(value)) return ok(value);
  } catch {
    // Falls through to the shared message.
  }
  return fail(`The ${name} decodes to text that is not a JSON object. The token may be cut short or corrupted.`);
}

const QUOTES = /^["']|["']$/g;

/** Splits and decodes a signed JWT. Tolerates surrounding whitespace, quotes and a "Bearer " prefix. */
export function decodeJwt(input: string): JwtResult {
  // Quotes can wrap the whole line, the header value or just the token, so they are stripped at each layer.
  const token = input
    .trim()
    .replace(QUOTES, "")
    .replace(/^authorization:\s*/i, "")
    .replace(QUOTES, "")
    .replace(/^bearer\s+/i, "")
    .replace(QUOTES, "")
    .replace(/\s+/g, "");
  if (token === "") return fail("Paste a token to decode it.");

  const parts = token.split(".");
  if (parts.length === 5) {
    return fail("This token has five parts, which makes it an encrypted JWT (JWE). Its contents can only be read with the decryption key, so there is nothing to decode here.");
  }
  if (parts.length !== 3) {
    return fail(`A JWT is three parts separated by dots (header.payload.signature). This has ${parts.length === 1 ? "no dots" : `${parts.length} parts`}.`);
  }
  const [headerPart = "", payloadPart = "", signature = ""] = parts;

  const header = decodePart(headerPart, "header");
  if (!header.ok) return header;
  const payload = decodePart(payloadPart, "payload");
  if (!payload.ok) return payload;

  return ok({
    parts: { header: headerPart, payload: payloadPart, signature },
    header: header.value,
    payload: payload.value,
    algorithm: typeof header.value.alg === "string" ? header.value.alg : null,
  });
}

/* ---------- Claims ---------- */

/** Registered claims (RFC 7519) plus the OpenID Connect ones seen in most ID tokens. */
export const CLAIM_NAMES: Record<string, string> = {
  iss: "Issuer: who created and signed the token",
  sub: "Subject: who the token is about, usually a user ID",
  aud: "Audience: who the token is meant for",
  exp: "Expires: the token must be rejected after this time",
  nbf: "Not before: the token must be rejected before this time",
  iat: "Issued at: when the token was created",
  jti: "JWT ID: a unique identifier, used to prevent replay",
  auth_time: "When the user last signed in",
  azp: "Authorised party: the client the token was issued to",
  scope: "Permissions granted, separated by spaces",
  nonce: "Value tying the token to one sign-in request",
  sid: "Session ID",
};

export const HEADER_NAMES: Record<string, string> = {
  alg: "Algorithm used to sign the token",
  typ: "Type of token",
  kid: "Key ID: which of the issuer's keys signed it",
  cty: "Content type of the payload",
  jku: "URL of the issuer's key set",
  x5t: "Thumbprint of the signing certificate",
};

/** The furthest a JavaScript Date reaches either side of 1970. */
const MAX_DATE_MS = 8.64e15;

const TIME_CLAIMS = new Set(["exp", "nbf", "iat", "auth_time", "updated_at"]);

/** A claim's value as a time in ms, if it is one of the NumericDate claims. */
export function claimTime(name: string, value: unknown): number | null {
  if (!TIME_CLAIMS.has(name) || typeof value !== "number" || !Number.isFinite(value)) return null;
  // NumericDate is in seconds. A value this large was written in milliseconds by mistake.
  const ms = value > 1e11 ? value : value * 1000;
  // Sentinels such as MAX_SAFE_INTEGER are beyond what a Date can hold; show them as plain numbers.
  return Math.abs(ms) <= MAX_DATE_MS ? ms : null;
}

export type JwtStatus =
  | { kind: "valid"; expiresAt: number }
  | { kind: "expired"; expiredAt: number }
  | { kind: "not-yet"; validFrom: number }
  | { kind: "no-expiry" };

/** Where the token stands against the clock. Says nothing about the signature. */
export function jwtStatus(payload: JsonObject, nowMs: number): JwtStatus {
  const nbf = claimTime("nbf", payload.nbf);
  const exp = claimTime("exp", payload.exp);
  if (exp !== null && nowMs >= exp) return { kind: "expired", expiredAt: exp };
  if (nbf !== null && nowMs < nbf) return { kind: "not-yet", validFrom: nbf };
  return exp === null ? { kind: "no-expiry" } : { kind: "valid", expiresAt: exp };
}

const UNITS: [number, string][] = [
  [365 * 86_400_000, "year"],
  [30 * 86_400_000, "month"],
  [86_400_000, "day"],
  [3_600_000, "hour"],
  [60_000, "minute"],
  [1000, "second"],
];

/** "3 hours", "2 days": the largest whole unit, for relative times. */
export function roughDuration(ms: number): string {
  const size = Math.abs(ms);
  for (const [unit, name] of UNITS) {
    if (size >= unit) {
      const n = Math.floor(size / unit);
      return `${n} ${name}${n === 1 ? "" : "s"}`;
    }
  }
  return "less than a second";
}

/* ---------- Signature ---------- */

// A Map, not an object: `alg` comes from the token, and "toString" must not find Object.prototype.toString.
const HMAC_HASH = new Map([
  ["HS256", "SHA-256"],
  ["HS384", "SHA-384"],
  ["HS512", "SHA-512"],
]);

export function isHmac(algorithm: string | null): boolean {
  return algorithm !== null && HMAC_HASH.has(algorithm);
}

export type VerifyResult = "valid" | "invalid" | "unsupported" | "bad-secret";

/** Checks an HS256/384/512 signature. The secret is used as UTF-8 text, or decoded first if `secretIsBase64`. */
export async function verifyHmac(jwt: DecodedJwt, secret: string, secretIsBase64: boolean): Promise<VerifyResult> {
  const hash = jwt.algorithm === null ? undefined : HMAC_HASH.get(jwt.algorithm);
  if (!hash) return "unsupported";

  const key = secretIsBase64 ? base64ToBytes(secret) : ok(new TextEncoder().encode(secret));
  if (!key.ok || key.value.length === 0) return "bad-secret";
  const signature = base64ToBytes(jwt.parts.signature);
  if (!signature.ok) return "invalid";

  const cryptoKey = await crypto.subtle.importKey("raw", new Uint8Array(key.value), { name: "HMAC", hash }, false, ["verify"]);
  const signed = new TextEncoder().encode(`${jwt.parts.header}.${jwt.parts.payload}`);
  return (await crypto.subtle.verify("HMAC", cryptoKey, new Uint8Array(signature.value), signed)) ? "valid" : "invalid";
}
