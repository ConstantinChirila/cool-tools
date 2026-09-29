import { describe, expect, it } from "vitest";
import { searchTools, tools } from "@/lib/tools";

const slugs = (query: string) => searchTools(query).map((t) => t.slug);

describe("searchTools", () => {
  it("returns the registry unchanged for a blank query", () => {
    expect(searchTools("")).toBe(tools);
    expect(searchTools("   ")).toBe(tools);
  });

  it("ranks a tool whose name matches above tools that only mention the term", () => {
    expect(slugs("percentage")[0]).toBe("percentage-calculator");
    const salary = slugs("salary");
    expect(salary[0]).toBe("uk-salary-calculator");
    expect(salary).toContain("bonus-tax-calculator");
  });

  it("puts an exact name match first", () => {
    expect(slugs("mortgage calculator")[0]).toBe("mortgage-calculator");
    expect(slugs("uk salary")[0]).toBe("uk-salary-calculator");
  });

  it("requires every term to match somewhere", () => {
    expect(slugs("mortgage overpayment")).toEqual(["mortgage-overpayment-calculator"]);
    expect(slugs("mortgage zzzz")).toEqual([]);
  });

  it("still finds tools by keyword and description", () => {
    expect(slugs("take home")).toContain("uk-salary-calculator");
    expect(slugs("base64")[0]).toBe("encoder-decoder");
  });

  it("is case-insensitive", () => {
    expect(slugs("JWT")[0]).toBe("jwt-decoder");
  });
});

describe("tool slugs", () => {
  // Tools are served at /<slug>, so a slug must not collide with another top-level route or metadata file.
  const reserved = ["tools", "version", "pwa-icon", "manifest.webmanifest", "robots.txt", "sitemap.xml", "opengraph-image", "apple-icon", "icon.svg"];
  it("do not shadow a top-level route", () => {
    for (const tool of tools) expect(reserved).not.toContain(tool.slug);
  });
  it("are unique and URL-safe", () => {
    expect(new Set(tools.map((t) => t.slug)).size).toBe(tools.length);
    for (const tool of tools) expect(tool.slug).toMatch(/^[a-z0-9-]+$/);
  });
});
