import type { CaptureGroup, PatternFeatures } from "@/lib/regex-explain";

/**
 * Turns a JavaScript pattern, its flags and an optional replacement into a
 * ready-to-paste snippet for another language. The pattern is translated
 * where the syntax differs (named groups for Python and Go, \u{…} escapes),
 * and anything that has no equivalent becomes a warning instead.
 */

export type LanguageId = "js" | "python" | "php" | "java" | "csharp" | "go";

export const LANGUAGES: readonly { id: LanguageId; label: string }[] = [
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
];

export interface CodeInput {
  pattern: string;
  flags: string;
  /** Null when replace mode is off. */
  replacement: string | null;
  groups: CaptureGroup[];
  features: PatternFeatures;
}

export interface Snippet {
  code: string;
  warnings: string[];
}

// ── Pattern translation ────────────────────────────────────────────────────

interface PatternRules {
  namedGroup: (name: string) => string;
  namedRef: (name: string) => string;
  /** A code point from \u{…} or a \uXXXX unit, as hex. `inClass` matters where astral needs a surrogate pair. */
  codePoint: (hex: string, inClass: boolean) => string;
}

const hex4 = (hex: string) => hex.toUpperCase().padStart(4, "0");

/** Rewrites the escapes and group syntax a target engine spells differently, skipping everything else verbatim. */
function translatePattern(src: string, rules: PatternRules): string {
  let out = "";
  let inClass = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i] ?? "";
    if (c === "\\") {
      const rest = src.slice(i);
      let m: RegExpExecArray | null;
      if ((m = /^\\u\{([0-9a-fA-F]+)\}/.exec(rest)) || (m = /^\\u([0-9a-fA-F]{4})/.exec(rest))) {
        out += rules.codePoint(m[1] ?? "", inClass);
        i += m[0].length - 1;
      } else if (!inClass && (m = /^\\k<([^>]+)>/.exec(rest))) {
        out += rules.namedRef(m[1] ?? "");
        i += m[0].length - 1;
      } else {
        out += src.slice(i, i + 2);
        i++;
      }
      continue;
    }
    if (inClass) {
      if (c === "]") inClass = false;
      out += c;
      continue;
    }
    if (c === "[") inClass = true;
    const named = c === "(" ? /^\(\?<([^=!>][^>]*)>/.exec(src.slice(i)) : null;
    if (named) {
      out += rules.namedGroup(named[1] ?? "");
      i += named[0].length - 1;
    } else {
      out += c;
    }
  }
  return out;
}

// ── Replacement translation ────────────────────────────────────────────────

type ReplacePart =
  | { kind: "text"; text: string }
  | { kind: "group"; n: number }
  | { kind: "named"; name: string }
  | { kind: "before" }
  | { kind: "after" };

/** The replacement string read with the same rules as lib/regex.ts expandReplacement. */
function readReplacement(replacement: string, groups: CaptureGroup[]): ReplacePart[] {
  const parts: ReplacePart[] = [];
  const hasNames = groups.some((g) => g.name !== undefined);
  const text = (t: string) => {
    const last = parts[parts.length - 1];
    if (last?.kind === "text") last.text += t;
    else parts.push({ kind: "text", text: t });
  };
  let i = 0;
  while (i < replacement.length) {
    const ch = replacement[i] ?? "";
    const next = replacement[i + 1];
    if (ch !== "$" || next === undefined) {
      text(ch);
      i++;
    } else if (next === "$") {
      text("$");
      i += 2;
    } else if (next === "&") {
      parts.push({ kind: "group", n: 0 });
      i += 2;
    } else if (next === "`" || next === "'") {
      parts.push({ kind: next === "`" ? "before" : "after" });
      i += 2;
    } else if (next >= "0" && next <= "9") {
      const two = replacement[i + 2];
      let digits = two !== undefined && two >= "0" && two <= "9" ? next + two : next;
      if (Number(digits) > groups.length && digits.length === 2) digits = next;
      const n = Number(digits);
      if (n >= 1 && n <= groups.length) parts.push({ kind: "group", n });
      else text("$" + digits);
      i += 1 + digits.length;
    } else if (next === "<" && hasNames && replacement.indexOf(">", i + 2) !== -1) {
      const close = replacement.indexOf(">", i + 2);
      parts.push({ kind: "named", name: replacement.slice(i + 2, close) });
      i = close + 1;
    } else {
      text("$");
      i++;
    }
  }
  return parts;
}

interface ReplaceRules {
  text: (t: string) => string;
  group: (n: number) => string;
  named: (name: string, n: number) => string;
  /** Null when the language has no way to say "the text before/after the match". */
  before: string | null;
  after: string | null;
  /** Put between a group reference and a literal digit, where the language would read the digit as part of the number. */
  digitGuard?: string;
}

function writeReplacement(parts: ReplacePart[], groups: CaptureGroup[], rules: ReplaceRules, warnings: string[]): string {
  let out = "";
  parts.forEach((p, index) => {
    const following = parts[index + 1];
    if (p.kind === "text") {
      out += rules.text(p.text);
    } else if (p.kind === "group") {
      out += rules.group(p.n);
    } else if (p.kind === "named") {
      out += rules.named(p.name, groups.find((g) => g.name === p.name)?.number ?? 0);
    } else {
      const token = p.kind === "before" ? rules.before : rules.after;
      if (token === null) {
        const word = p.kind === "before" ? "$`" : "$'";
        warnings.push(`${word} (the text ${p.kind} the match) has no equivalent here, so it was left out.`);
      } else {
        out += token;
      }
    }
    if (p.kind === "group" && following?.kind === "text" && /^\d/.test(following.text)) out += rules.digitGuard ?? "";
  });
  return out;
}

// ── String literals ────────────────────────────────────────────────────────

function cStyle(s: string, quote: string): string {
  let out = "";
  for (const ch of s) {
    if (ch === "\\") out += "\\\\";
    else if (ch === quote) out += "\\" + quote;
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else out += ch;
  }
  return quote + out + quote;
}

/** Python: a raw string when one can hold the text, otherwise an ordinary escaped one. */
function pythonString(s: string): string {
  const trailing = /\\+$/.exec(s)?.[0].length ?? 0;
  if (trailing % 2 === 0 && !/[\n\r]/.test(s)) {
    if (!s.includes('"')) return `r"${s}"`;
    if (!s.includes("'")) return `r'${s}'`;
  }
  return cStyle(s, '"');
}

/** PHP single quotes: only \\ and \' are escapes, so a backslash needs doubling only before \, ' or the end. */
function phpString(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];
    if (c === "\\" && (next === undefined || next === "\\" || next === "'")) out += "\\\\";
    else if (c === "'") out += "\\'";
    else out += c;
  }
  return `'${out}'`;
}

function csharpString(s: string): string {
  return `@"${s.replaceAll('"', '""')}"`;
}

function goString(s: string): string {
  return s.includes("`") || /[\n\r]/.test(s) ? cStyle(s, '"') : `\`${s}\``;
}

/** The pattern escaped for a /…/ literal, as RegExp.prototype.source does. */
function slashSource(pattern: string, flags: string): string {
  try {
    return new RegExp(pattern, flags).source;
  } catch {
    return pattern.replace(/\//g, "\\/");
  }
}

// ── Languages ──────────────────────────────────────────────────────────────

const unicodePropertyNote = "Check the \\p{…} names: other engines spell some Unicode properties differently.";
const emptyClassNote = "[^] and [] only mean “any character” and “nothing” in JavaScript: use [\\s\\S] instead.";
const setsNote = "Class set operations (v flag) are JavaScript-only: rewrite the class without -- or &&.";
const boundedLookbehindNote = "This lookbehind has no maximum length, which this engine may refuse.";
/** \d, \w or \b, which other engines read with Unicode rules. */
const WORD_DIGIT = /\\[dDwWbB]/;
const stickyNote = "There is no sticky flag here: anchor the pattern at a position instead.";

function javascript(input: CodeInput): Snippet {
  const { flags, replacement, groups } = input;
  const global = flags.includes("g");
  const named = groups.some((g) => g.name !== undefined);
  const show = named ? "m.groups" : groups.length > 0 ? "m.slice(1)" : "";
  const log = `console.log(m.index, m[0]${show ? `, ${show}` : ""});`;
  const lines = [`const re = /${slashSource(input.pattern, flags)}/${flags};`, ""];
  if (global) lines.push("for (const m of text.matchAll(re)) {", `  ${log}`, "}");
  else lines.push("const m = re.exec(text);", `if (m) ${log}`);
  if (replacement !== null) {
    lines.push("", `const result = text.replace(re, ${JSON.stringify(replacement)});${global ? "" : " // first match only"}`);
  }
  return { code: lines.join("\n"), warnings: [] };
}

function python(input: CodeInput): Snippet {
  const { flags, replacement, groups, features } = input;
  const warnings: string[] = [];
  const pattern = translatePattern(input.pattern, {
    namedGroup: (name) => `(?P<${name}>`,
    namedRef: (name) => `(?P=${name})`,
    codePoint: (hex) => (parseInt(hex, 16) > 0xffff ? `\\U${hex.toUpperCase().padStart(8, "0")}` : `\\u${hex4(hex)}`),
  });
  const pyFlags = [flags.includes("i") && "re.IGNORECASE", flags.includes("m") && "re.MULTILINE", flags.includes("s") && "re.DOTALL"].filter(Boolean);
  if (features.unicodeProperty) warnings.push("Python's re module has no \\p{…}: install the regex package and use import regex as re.");
  if (features.unboundedLookbehind) warnings.push("Python only allows fixed-width lookbehinds.");
  if (features.emptyClass) warnings.push(emptyClassNote);
  if (features.setOperations) warnings.push(setsNote);
  if (flags.includes("y")) warnings.push("There is no sticky flag: pattern.match(text, pos) matches at one position.");
  if (WORD_DIGIT.test(input.pattern)) warnings.push("In Python, \\d and \\w also match digits and letters from other scripts: add re.ASCII to behave like JavaScript.");

  const named = groups.some((g) => g.name !== undefined);
  const show = named ? "m.groupdict()" : groups.length > 0 ? "m.groups()" : "";
  const print = `print(m.start(), m.group(0)${show ? `, ${show}` : ""})`;
  const lines = ["import re", "", `pattern = re.compile(${[pythonString(pattern), pyFlags.join(" | ")].filter(Boolean).join(", ")})`, ""];
  if (flags.includes("g")) lines.push("for m in pattern.finditer(text):", `    ${print}`);
  else lines.push("m = pattern.search(text)", "if m:", `    ${print}`);
  if (replacement !== null) {
    const template = writeReplacement(
      readReplacement(replacement, groups),
      groups,
      {
        text: (t) => t.replaceAll("\\", "\\\\"),
        group: (n) => `\\g<${n}>`,
        named: (name) => `\\g<${name}>`,
        before: null,
        after: null,
      },
      warnings,
    );
    lines.push("", `result = pattern.sub(${pythonString(template)}, text${flags.includes("g") ? "" : ", count=1"})`);
  }
  return { code: lines.join("\n"), warnings };
}

function php(input: CodeInput): Snippet {
  const { flags, replacement, groups, features } = input;
  const warnings: string[] = [];
  const pattern = translatePattern(slashSource(input.pattern, flags), {
    namedGroup: (name) => `(?<${name}>`,
    namedRef: (name) => `\\k<${name}>`,
    codePoint: (hex) => `\\x{${hex.toUpperCase()}}`,
  });
  const modifiers = [..."ims"].filter((f) => flags.includes(f)).join("") + (/[uv]/.test(flags) ? "u" : "");
  if (features.unicodeProperty) warnings.push(unicodePropertyNote);
  if (features.unboundedLookbehind) warnings.push(boundedLookbehindNote);
  if (features.emptyClass) warnings.push(emptyClassNote);
  if (features.setOperations) warnings.push(setsNote);
  if (flags.includes("y")) warnings.push(stickyNote);
  if (features.codePointEscape && !/[uv]/.test(flags)) warnings.push("\\x{…} above FF needs the u modifier.");

  const global = flags.includes("g");
  const lines = ["<?php", "", `$pattern = ${phpString(`/${pattern}/${modifiers}`)};`, ""];
  if (global) {
    lines.push(
      "preg_match_all($pattern, $text, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);",
      "foreach ($matches as $m) {",
      "    echo $m[0][1], ': ', $m[0][0], \"\\n\";",
      "}",
    );
  } else {
    lines.push("if (preg_match($pattern, $text, $m, PREG_OFFSET_CAPTURE)) {", "    echo $m[0][1], ': ', $m[0][0], \"\\n\";", "}");
  }
  if (replacement !== null) {
    const template = writeReplacement(
      readReplacement(replacement, groups),
      groups,
      {
        text: (t) => t.replaceAll("\\", "\\\\").replaceAll("$", "\\$"),
        group: (n) => `\${${n}}`,
        // preg_replace has no named references: point at the group's number instead.
        named: (_, n) => `\${${n}}`,
        before: null,
        after: null,
      },
      warnings,
    );
    lines.push("", `$result = preg_replace($pattern, ${phpString(template)}, $text${global ? "" : ", 1"});`);
  }
  return { code: lines.join("\n"), warnings };
}

function java(input: CodeInput): Snippet {
  const { flags, replacement, groups, features } = input;
  const warnings: string[] = [];
  const pattern = translatePattern(input.pattern, {
    namedGroup: (name) => `(?<${name}>`,
    namedRef: (name) => `\\k<${name}>`,
    codePoint: (hex) => `\\x{${hex.toUpperCase()}}`,
  });
  const javaFlags = [
    flags.includes("i") && "Pattern.CASE_INSENSITIVE",
    flags.includes("i") && /[uv]/.test(flags) && "Pattern.UNICODE_CASE",
    flags.includes("m") && "Pattern.MULTILINE",
    flags.includes("s") && "Pattern.DOTALL",
  ].filter(Boolean);
  if (groups.some((g) => g.name !== undefined && !/^[A-Za-z][A-Za-z0-9]*$/.test(g.name))) {
    warnings.push("Java group names may only use letters and digits: rename any with _ or $.");
  }
  if (features.unicodeProperty) warnings.push(unicodePropertyNote);
  if (features.unboundedLookbehind) warnings.push(boundedLookbehindNote);
  if (features.emptyClass) warnings.push(emptyClassNote);
  if (features.setOperations) warnings.push(setsNote);
  if (flags.includes("y")) warnings.push(stickyNote);

  const global = flags.includes("g");
  const lines = [
    "import java.util.regex.Matcher;",
    "import java.util.regex.Pattern;",
    "",
    `Pattern pattern = Pattern.compile(${[cStyle(pattern, '"'), javaFlags.join(" | ")].filter(Boolean).join(", ")});`,
    "Matcher matcher = pattern.matcher(text);",
    `${global ? "while" : "if"} (matcher.find()) {`,
    '    System.out.println(matcher.start() + ": " + matcher.group());',
    "}",
  ];
  if (replacement !== null) {
    const template = writeReplacement(
      readReplacement(replacement, groups),
      groups,
      {
        text: (t) => t.replaceAll("\\", "\\\\").replaceAll("$", "\\$"),
        group: (n) => `$${n}`,
        named: (name) => `\${${name}}`,
        before: null,
        after: null,
        // Java reads $1 followed by 0 as group 10 when that exists: an escaped digit stays literal.
        digitGuard: "\\",
      },
      warnings,
    );
    lines.push("", `String result = pattern.matcher(text).${global ? "replaceAll" : "replaceFirst"}(${cStyle(template, '"')});`);
  }
  return { code: lines.join("\n"), warnings };
}

function csharp(input: CodeInput): Snippet {
  const { flags, replacement, groups, features } = input;
  const warnings: string[] = [];
  let astralInClass = false;
  const pattern = translatePattern(input.pattern, {
    namedGroup: (name) => `(?<${name}>`,
    namedRef: (name) => `\\k<${name}>`,
    codePoint: (hex, inClass) => {
      const cp = parseInt(hex, 16);
      if (cp <= 0xffff) return `\\u${hex4(hex)}`;
      if (inClass) astralInClass = true;
      // .NET matches UTF-16 code units, so an emoji is its surrogate pair.
      const units = String.fromCodePoint(cp);
      return [...Array(units.length).keys()].map((k) => `\\u${units.charCodeAt(k).toString(16).toUpperCase()}`).join("");
    },
  });
  const options = [
    flags.includes("i") && "RegexOptions.IgnoreCase",
    flags.includes("m") && "RegexOptions.Multiline",
    flags.includes("s") && "RegexOptions.Singleline",
  ].filter(Boolean);
  if (astralInClass) warnings.push(".NET works in UTF-16, so a character above U+FFFF cannot sit inside a [class].");
  if (features.unicodeProperty) warnings.push(unicodePropertyNote);
  if (features.emptyClass) warnings.push(emptyClassNote);
  if (features.setOperations) warnings.push(setsNote);
  if (flags.includes("y")) warnings.push(stickyNote);
  if (WORD_DIGIT.test(input.pattern)) {
    warnings.push("In .NET, \\d and \\w also match digits and letters from other scripts: RegexOptions.ECMAScript (allowed only with IgnoreCase and Multiline) behaves like JavaScript.");
  }

  const global = flags.includes("g");
  const lines = [
    "using System.Text.RegularExpressions;",
    "",
    `var regex = new Regex(${[csharpString(pattern), options.join(" | ")].filter(Boolean).join(", ")});`,
  ];
  if (global) lines.push("foreach (Match m in regex.Matches(text))", "{", '    Console.WriteLine($"{m.Index}: {m.Value}");', "}");
  else lines.push("var m = regex.Match(text);", 'if (m.Success) Console.WriteLine($"{m.Index}: {m.Value}");');
  if (replacement !== null) {
    const template = writeReplacement(
      readReplacement(replacement, groups),
      groups,
      {
        text: (t) => t.replaceAll("$", "$$$$"),
        group: (n) => (n === 0 ? "$&" : `\${${n}}`),
        named: (name) => `\${${name}}`,
        before: "$`",
        after: "$'",
      },
      warnings,
    );
    lines.push("", `string result = regex.Replace(text, ${csharpString(template)}${global ? "" : ", 1"});`);
  }
  return { code: lines.join("\n"), warnings };
}

function go(input: CodeInput): Snippet {
  const { flags, replacement, groups, features } = input;
  const warnings: string[] = [];
  if (features.lookahead || features.lookbehind) warnings.push("Go's regexp (RE2) has no lookahead or lookbehind, so this pattern will not compile there.");
  if (features.backrefs) warnings.push("Go's regexp (RE2) has no back-references, so this pattern will not compile there.");
  if (features.unicodeProperty) warnings.push(unicodePropertyNote);
  if (features.emptyClass) warnings.push(emptyClassNote);
  if (features.setOperations) warnings.push(setsNote);
  if (flags.includes("y")) warnings.push(stickyNote);
  const translated = translatePattern(input.pattern, {
    namedGroup: (name) => `(?P<${name}>`,
    namedRef: (name) => `\\k<${name}>`,
    codePoint: (hex) => `\\x{${hex.toUpperCase()}}`,
  });
  const inline = [..."ims"].filter((f) => flags.includes(f)).join("");
  const pattern = inline ? `(?${inline})${translated}` : translated;

  const global = flags.includes("g");
  const lines = ["import (", '\t"fmt"', '\t"regexp"', ")", "", `re := regexp.MustCompile(${goString(pattern)})`];
  if (global) lines.push("for _, m := range re.FindAllStringIndex(text, -1) {", "\tfmt.Println(m[0], text[m[0]:m[1]])", "}");
  else lines.push("if m := re.FindStringIndex(text); m != nil {", "\tfmt.Println(m[0], text[m[0]:m[1]])", "}");
  if (replacement !== null) {
    const template = writeReplacement(
      readReplacement(replacement, groups),
      groups,
      {
        text: (t) => t.replaceAll("$", "$$$$"),
        group: (n) => `\${${n}}`,
        named: (name) => `\${${name}}`,
        before: null,
        after: null,
      },
      warnings,
    );
    lines.push("", `result := re.ReplaceAllString(text, ${goString(template)})`);
    if (!global) warnings.push("Go has no replace-first: ReplaceAllString replaces every match.");
  }
  return { code: lines.join("\n"), warnings };
}

const WRITERS: Record<LanguageId, (input: CodeInput) => Snippet> = { js: javascript, python, php, java, csharp, go };

export function codeSnippet(language: LanguageId, input: CodeInput): Snippet {
  return WRITERS[language](input);
}
