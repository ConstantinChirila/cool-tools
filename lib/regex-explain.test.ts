import { describe, expect, it } from "vitest";
import { codeSnippet, type LanguageId } from "@/lib/regex-code";
import { explain, type ExplainNode } from "@/lib/regex-explain";
import { LIBRARY } from "@/lib/regex-library";

const texts = (nodes: ExplainNode[]): string[] => nodes.flatMap((n) => [n.text, ...texts(n.children ?? [])]);

describe("explain", () => {
  it("numbers capture groups the way the engine does", () => {
    for (const p of LIBRARY) {
      const groups = explain(p.pattern, p.flags).groups.length;
      const engine = (new RegExp(`|${p.pattern}`, p.flags.replace("g", "")).exec("")?.length ?? 1) - 1;
      expect(groups, p.id).toBe(engine);
    }
  });

  it("does not count brackets inside classes or escaped", () => {
    expect(explain(String.raw`[(]\((?:a)(?<n>b)(?=c)(d)`, "").groups).toEqual([{ number: 1, name: "n" }, { number: 2 }]);
  });

  it("joins plain characters and attaches quantifiers", () => {
    const { nodes } = explain("cats?", "");
    expect(nodes.map((n) => n.source)).toEqual(["cat", "s?"]);
    expect(nodes[1]?.text).toBe("the character “s”, optional");
  });

  it("tells back-references from octal escapes", () => {
    expect(texts(explain(String.raw`(a)\1`, "").nodes)).toContain("the same text group 1 matched");
    expect(texts(explain(String.raw`a\1`, "").nodes)).toContain("a legacy octal escape");
  });

  it("reads anchors by the m flag", () => {
    expect(texts(explain("^a$", "").nodes)).toEqual(["the start of the text", "the character “a”", "the end of the text"]);
    expect(texts(explain("^a$", "m").nodes)[0]).toBe("the start of a line");
  });

  it("flags features other engines lack", () => {
    const f = explain(String.raw`(?<=a+)\p{L}(?<x>.)\k<x>[^]`, "u").features;
    expect(f).toMatchObject({ lookbehind: true, unboundedLookbehind: true, unicodeProperty: true, backrefs: true, namedGroups: true, emptyClass: true });
  });

  it("covers the whole pattern with tokens, in order", () => {
    const pattern = String.raw`^(?<a>\d+)-(x|y)*?\b[a-z]{2}$`;
    const { tokens } = explain(pattern, "");
    let at = 0;
    for (const t of tokens) {
      expect(t.start).toBe(at);
      at = t.end;
    }
    expect(at).toBe(pattern.length);
  });

  it("never loops on odd input", () => {
    for (const p of ["", ")", "a)", "[", "(", "\\", "{", "a{1,", "(?", "[a-"]) expect(() => explain(p, "")).not.toThrow();
  });
});

function snippet(language: LanguageId, pattern: string, flags: string, replacement: string | null = null) {
  const { groups, features } = explain(pattern, flags);
  return codeSnippet(language, { pattern, flags, replacement, groups, features });
}

describe("codeSnippet", () => {
  it("writes Python named groups and back-references", () => {
    const { code } = snippet("python", String.raw`(?<w>\w+) \k<w>`, "gi", "$<w>");
    expect(code).toContain(String.raw`r"(?P<w>\w+) (?P=w)"`);
    expect(code).toContain("re.IGNORECASE");
    expect(code).toContain(String.raw`pattern.sub(r"\g<w>", text)`);
  });

  it("falls back to an escaped Python string when a raw one cannot hold the pattern", () => {
    expect(snippet("python", String.raw`"'\\`, "").code).toContain(String.raw`re.compile("\"'\\\\")`);
  });

  it("doubles PHP backslashes only where single quotes need it", () => {
    expect(snippet("php", String.raw`\d+\\`, "g").code).toContain(String.raw`$pattern = '/\d+\\\/';`);
    expect(snippet("php", "it's", "").code).toContain(String.raw`'/it\'s/'`);
  });

  it("points PHP named replacements at group numbers", () => {
    expect(snippet("php", "(?<a>x)(?<b>y)", "g", "$<b>$<a>").code).toContain("'${2}${1}'");
  });

  it("keeps a digit after a Java group reference literal", () => {
    const groups = "(a)".repeat(10);
    expect(snippet("java", groups, "g", "$10").code).toContain('replaceAll("$10")');
    expect(snippet("java", "(a)", "g", "$10").code).toContain(String.raw`replaceAll("$1\\0")`);
  });

  it("escapes $ in C# and Go replacements", () => {
    expect(snippet("csharp", "a", "g", "$$5").code).toContain('regex.Replace(text, @"$$5")');
    expect(snippet("go", "a", "g", "$$5").code).toContain("re.ReplaceAllString(text, `$$5`)");
  });

  it("warns where Go cannot follow", () => {
    expect(snippet("go", String.raw`(?<=a)b`, "g").warnings.join(" ")).toMatch(/no lookahead or lookbehind/);
    expect(snippet("go", String.raw`(a)\1`, "g").warnings.join(" ")).toMatch(/no back-references/);
  });

  it("converts \\u{…} for each engine", () => {
    expect(snippet("python", String.raw`\u{1F600}`, "u").code).toContain(String.raw`\U0001F600`);
    expect(snippet("csharp", String.raw`\u{1F600}`, "u").code).toContain(["\\u", "D83D", "\\u", "DE00"].join(""));
    expect(snippet("java", String.raw`\u{1F600}`, "u").code).toContain(String.raw`\\x{1F600}`);
  });

  it("uses RegExp.source for the JavaScript literal", () => {
    expect(snippet("js", "a/b", "g").code).toContain(String.raw`const re = /a\/b/g;`);
  });
});
