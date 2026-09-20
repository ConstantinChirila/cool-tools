import { describe, expect, it } from "vitest";
import { claimTime, decodeJwt, jwtStatus, roughDuration, verifyHmac } from "@/lib/jwt";

/** HS256, secret "bits-and-bobs-demo-secret", iat 2026-01-01, exp 2030-01-01. Made with node:crypto. */
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2JpdHNib2JzLmFwcCIsInN1YiI6InVzZXJfODY3NTMwOSIsImF1ZCI6ImJpdHMtYW5kLWJvYnMtd2ViIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NzIyNTYwMCwiZXhwIjoxODkzNDU2MDAwfQ.xZkbEvx3pE-EUrQRvv2djeo_sI0QZFkxqahBBfaamok";
const SECRET = "bits-and-bobs-demo-secret";

function decoded(input = TOKEN) {
  const r = decodeJwt(input);
  if (!r.ok) throw new Error(r.error);
  return r.jwt;
}

describe("decodeJwt", () => {
  it("reads the header and payload", () => {
    const jwt = decoded();
    expect(jwt.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(jwt.algorithm).toBe("HS256");
    expect(jwt.payload).toMatchObject({ sub: "user_8675309", name: "Ada Lovelace", exp: 1893456000 });
  });

  it("tolerates a Bearer prefix, quotes, a header name and line breaks", () => {
    const wrapped = `Authorization: Bearer ${TOKEN.slice(0, 40)}\n${TOKEN.slice(40)}`;
    expect(decoded(wrapped).payload.sub).toBe("user_8675309");
    expect(decoded(`"${TOKEN}"`).payload.sub).toBe("user_8675309");
  });

  it("explains what is wrong with things that are not JWTs", () => {
    expect(decodeJwt("hello")).toMatchObject({ ok: false, error: expect.stringContaining("no dots") });
    expect(decodeJwt("a.b")).toMatchObject({ ok: false, error: expect.stringContaining("2 parts") });
    expect(decodeJwt("a.b.c.d.e")).toMatchObject({ ok: false, error: expect.stringContaining("JWE") });
    expect(decodeJwt("!!!.e30.x")).toMatchObject({ ok: false, error: expect.stringContaining("header is not valid Base64") });
    // "WzFd" is [1]: valid JSON, but not an object.
    expect(decodeJwt("e30.WzFd.x")).toMatchObject({ ok: false, error: expect.stringContaining("payload") });
  });
});

describe("claims and status", () => {
  it("reads NumericDate claims in seconds, and forgives milliseconds", () => {
    expect(claimTime("exp", 1893456000)).toBe(Date.UTC(2030, 0, 1));
    expect(claimTime("exp", 1893456000000)).toBe(Date.UTC(2030, 0, 1));
    expect(claimTime("sub", 1893456000)).toBeNull();
    expect(claimTime("exp", "1893456000")).toBeNull();
  });

  it("compares exp and nbf with the clock", () => {
    const exp = 1893456000;
    expect(jwtStatus({ exp }, (exp - 10) * 1000)).toEqual({ kind: "valid", expiresAt: exp * 1000 });
    expect(jwtStatus({ exp }, exp * 1000)).toEqual({ kind: "expired", expiredAt: exp * 1000 });
    expect(jwtStatus({ exp, nbf: exp - 5 }, (exp - 10) * 1000)).toEqual({ kind: "not-yet", validFrom: (exp - 5) * 1000 });
    expect(jwtStatus({ sub: "x" }, 0)).toEqual({ kind: "no-expiry" });
  });

  it("describes durations by their largest unit", () => {
    expect(roughDuration(59_000)).toBe("59 seconds");
    expect(roughDuration(3_600_000)).toBe("1 hour");
    expect(roughDuration(-3 * 86_400_000)).toBe("3 days");
  });
});

describe("verifyHmac", () => {
  it("accepts the right secret and rejects a wrong one", async () => {
    expect(await verifyHmac(decoded(), SECRET, false)).toBe("valid");
    expect(await verifyHmac(decoded(), "wrong", false)).toBe("invalid");
  });

  it("accepts the secret as Base64", async () => {
    expect(await verifyHmac(decoded(), Buffer.from(SECRET).toString("base64"), true)).toBe("valid");
    expect(await verifyHmac(decoded(), "not base64!", true)).toBe("bad-secret");
  });

  it("rejects a tampered payload", async () => {
    const [h, , s] = TOKEN.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "user_8675309", role: "superadmin" })).toString("base64url");
    expect(await verifyHmac(decoded(`${h}.${forged}.${s}`), SECRET, false)).toBe("invalid");
  });

  it("does not attempt asymmetric algorithms", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
    expect(await verifyHmac(decoded(`${header}.e30.abc`), SECRET, false)).toBe("unsupported");
  });
});
