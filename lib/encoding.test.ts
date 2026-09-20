import { describe, expect, it } from "vitest";
import { byteLength, codecs, runCodec, type CodecId } from "@/lib/encoding";

const enc = (id: CodecId, text: string, variant = "") => {
  const r = runCodec(id, "encode", text, variant);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const dec = (id: CodecId, text: string, option = true) => runCodec(id, "decode", text, "", option);
const value = (id: CodecId, text: string, option = true) => {
  const r = dec(id, text, option);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const TRICKY = "Café & crème <b>\"5 €\"</b> it's 😀\n\ttab 100% a+b/c?d=e#f \\ end";

describe("round trips", () => {
  for (const codec of codecs) {
    for (const variant of codec.variants) {
      it(`${codec.id} / ${variant.id}`, () => {
        // Form encoding is the one case where + must be read back as a space.
        const option = codec.id === "url" && variant.id === "form";
        expect(value(codec.id, enc(codec.id, TRICKY, variant.id), option)).toBe(TRICKY);
      });
    }
  }
});

describe("base64", () => {
  it("matches the RFC 4648 test vectors", () => {
    const vectors = [["", ""], ["f", "Zg=="], ["fo", "Zm8="], ["foo", "Zm9v"], ["foob", "Zm9vYg=="], ["fooba", "Zm9vYmE="], ["foobar", "Zm9vYmFy"]] as const;
    for (const [plain, encoded] of vectors) {
      expect(enc("base64", plain, "standard")).toBe(encoded);
      expect(value("base64", encoded)).toBe(plain);
    }
  });

  it("encodes text as UTF-8", () => {
    expect(enc("base64", "é😀", "standard")).toBe("w6nwn5iA");
  });

  it("uses - and _ without padding when URL-safe", () => {
    expect(enc("base64", "??>>", "standard")).toBe("Pz8+Pg==");
    expect(enc("base64", "??>>", "urlsafe")).toBe("Pz8-Pg");
  });

  it("decodes either alphabet, missing padding and wrapped lines", () => {
    expect(value("base64", "Pz8-Pg")).toBe("??>>");
    expect(value("base64", "Zm9v\nYmFy\n")).toBe("foobar");
  });

  it("explains what is wrong", () => {
    expect(dec("base64", "Zm9v!")).toMatchObject({ ok: false, error: expect.stringContaining('"!"') });
    expect(dec("base64", "Zm9vY")).toMatchObject({ ok: false, error: expect.stringContaining("length") });
    expect(dec("base64", "/w==")).toMatchObject({ ok: false, error: expect.stringContaining("UTF-8") });
  });
});

describe("url", () => {
  it("component encodes URL punctuation, whole URL keeps it", () => {
    const address = "https://example.com/a b?q=1&r=é";
    expect(enc("url", address, "component")).toBe("https%3A%2F%2Fexample.com%2Fa%20b%3Fq%3D1%26r%3D%C3%A9");
    expect(enc("url", address, "full")).toBe("https://example.com/a%20b?q=1&r=%C3%A9");
  });

  it("form encoding writes a space as + and a plus as %2B", () => {
    expect(enc("url", "a b+c", "form")).toBe("a+b%2Bc");
  });

  it("reads + as a space only when asked", () => {
    expect(value("url", "a+b%2Bc", true)).toBe("a b+c");
    expect(value("url", "a+b%2Bc", false)).toBe("a+b+c");
  });

  it("reports a stray percent sign and bad UTF-8", () => {
    expect(dec("url", "100% sure")).toMatchObject({ ok: false, error: expect.stringContaining("position 4") });
    expect(dec("url", "%E9")).toMatchObject({ ok: false, error: expect.stringContaining("UTF-8") });
  });

  it("does not throw on a lone surrogate", () => {
    expect(enc("url", "\ud83d", "component")).toBe("%EF%BF%BD");
  });
});

describe("html", () => {
  it("escapes the five unsafe characters", () => {
    expect(enc("html", `<a href="x">Tom & Jerry's</a>`, "essential")).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;",
    );
  });

  it("names or numbers non-ASCII characters", () => {
    expect(enc("html", "café €", "named")).toBe("caf&eacute; &euro;");
    expect(enc("html", "café €", "numeric")).toBe("caf&#xe9; &#x20ac;");
  });

  it("decodes named, decimal and hex entities", () => {
    expect(value("html", "&lt;p&gt; caf&eacute; &#169; &#x1F600; &nbsp;|")).toBe("<p> café © 😀  |");
  });
});

describe("hex", () => {
  it("writes UTF-8 bytes", () => {
    expect(enc("hex", "Hé", "spaced")).toBe("48 c3 a9");
    expect(enc("hex", "Hé", "plain")).toBe("48c3a9");
    expect(enc("hex", "Hé", "escaped")).toBe("\\x48\\xc3\\xa9");
  });

  it("decodes common notations", () => {
    expect(value("hex", "0x48, 0x69")).toBe("Hi");
    expect(value("hex", "48:69")).toBe("Hi");
    expect(value("hex", "4869")).toBe("Hi");
  });

  it("rejects odd lengths and non-hex", () => {
    expect(dec("hex", "486")).toMatchObject({ ok: false });
    expect(dec("hex", "48 zz")).toMatchObject({ ok: false, error: expect.stringContaining('"z"') });
  });
});

describe("unicode escapes", () => {
  it("escapes only non-ASCII by default, with surrogate pairs for emoji", () => {
    expect(enc("unicode", "café 😀", "nonascii")).toBe("caf\\u00e9 \\ud83d\\ude00");
    expect(enc("unicode", "café 😀", "codepoint")).toBe("caf\\u{e9} \\u{1f600}");
    expect(enc("unicode", "Hi", "all")).toBe("\\u0048\\u0069");
  });

  it("decodes \\u, \\u{}, \\x and simple escapes, leaving anything else alone", () => {
    expect(value("unicode", "caf\\u00e9 \\ud83d\\ude00 \\u{1F600} \\x41 a\\tb \\q \\u12")).toBe("café 😀 😀 A a\tb \\q \\u12");
  });

  it("rejects code points past the end of Unicode", () => {
    expect(dec("unicode", "\\u{110000}")).toMatchObject({ ok: false });
  });
});

describe("byteLength", () => {
  it("counts UTF-8 bytes, not characters", () => {
    expect(byteLength("é😀")).toBe(6);
  });
});
