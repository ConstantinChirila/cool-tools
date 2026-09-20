import { describe, expect, it } from "vitest";
import { getCodec, runCodec } from "@/lib/encoding";
import { codecPages } from "@/lib/encoding-pages";

describe("codec landing pages", () => {
  it("have unique slugs", () => {
    const slugs = codecPages.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  describe.each(codecPages.map((page) => [page.slug, page] as const))("%s", (_slug, page) => {
    const codec = getCodec(page.codec);

    it("only uses variants its codec has", () => {
      const known = codec.variants.map((v) => v.id);
      for (const example of page.examples) expect(known).toContain(example.variant);
    });

    it("shows examples that decode back to their text", () => {
      for (const example of page.examples) {
        const encoded = codec.encode(example.text, example.variant);
        expect(encoded).not.toBe("");
        // Form encoding is the one style where + has to be read back as a space.
        expect(runCodec(page.codec, "decode", encoded, "", example.variant === "form")).toEqual({
          ok: true,
          value: example.text,
        });
      }
    });

    it("keeps titles and descriptions within search snippet length", () => {
      expect(page.seoTitle.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(165);
    });
  });
});
