/**
 * A reader for JavaScript regex syntax that turns a pattern into a tree of
 * plain-English steps, plus the flat token list that colours the pattern box.
 * The engine (new RegExp) decides whether a pattern is valid; this only
 * describes patterns that already compiled, so it is forgiving rather than
 * strict.
 */

export type TokenKind =
  | "literal"
  | "escape"
  | "class"
  | "dot"
  | "anchor"
  | "quantifier"
  | "alternation"
  | "group"
  | "capture"
  | "backref";

export interface Token {
  start: number;
  end: number;
  kind: TokenKind;
  /** For capture group brackets: the group number. */
  group?: number;
}

export interface ExplainNode {
  /** The part of the pattern this step covers, quantifier included. */
  source: string;
  text: string;
  kind: TokenKind;
  group?: number;
  children?: ExplainNode[];
}

export interface CaptureGroup {
  number: number;
  name?: string;
}

export interface PatternFeatures {
  lookahead: boolean;
  lookbehind: boolean;
  /** A lookbehind containing *, + or {n,}: some engines refuse these. */
  unboundedLookbehind: boolean;
  backrefs: boolean;
  namedGroups: boolean;
  unicodeProperty: boolean;
  /** \u{…} code point escapes. */
  codePointEscape: boolean;
  modifiers: boolean;
  /** [^] or [], JavaScript-only classes. */
  emptyClass: boolean;
  /** Class set operations or nested classes (v flag). */
  setOperations: boolean;
}

export interface Explained {
  nodes: ExplainNode[];
  tokens: Token[];
  groups: CaptureGroup[];
  features: PatternFeatures;
}

const ESCAPES: Record<string, string> = {
  d: "a digit (0–9)",
  D: "any character that is not a digit",
  w: "a word character (letter, digit or underscore)",
  W: "any character that is not a word character",
  s: "a whitespace character (space, tab, line break…)",
  S: "any character that is not whitespace",
  n: "a line feed (new line)",
  r: "a carriage return",
  t: "a tab",
  v: "a vertical tab",
  f: "a form feed",
  "0": "a null character",
};

const FLAG_NAMES: Record<string, string> = { i: "ignore case", m: "multiline", s: "dot all" };

function quote(ch: string): string {
  if (ch === " ") return "a space";
  return `“${ch}”`;
}

function hexChar(hex: string): string {
  const code = parseInt(hex, 16);
  const ch = String.fromCodePoint(code);
  const shown = code > 0x20 && code !== 0x7f ? ` (${ch})` : "";
  return `the character U+${hex.toUpperCase().padStart(4, "0")}${shown}`;
}

function times(n: number): string {
  return n === 1 ? "once" : `${n} times`;
}

interface Quantifier {
  source: string;
  text: string;
}

class Parser {
  i = 0;
  tokens: Token[] = [];
  groups: CaptureGroup[] = [];
  features: PatternFeatures = {
    lookahead: false,
    lookbehind: false,
    unboundedLookbehind: false,
    backrefs: false,
    namedGroups: false,
    unicodeProperty: false,
    codePointEscape: false,
    modifiers: false,
    emptyClass: false,
    setOperations: false,
  };
  private lookbehindDepth = 0;
  private readonly unicode: boolean;
  private readonly sets: boolean;
  private readonly flags: string;
  /** Total capture groups, found up front so \12 can tell a back-reference from an escape. */
  private readonly groupTotal: number;

  constructor(
    private readonly src: string,
    flags: string,
  ) {
    this.flags = flags;
    this.unicode = flags.includes("u") || flags.includes("v");
    this.sets = flags.includes("v");
    this.groupTotal = countCaptures(src, this.sets);
  }

  private token(start: number, end: number, kind: TokenKind, group?: number) {
    if (end > start) this.tokens.push(group === undefined ? { start, end, kind } : { start, end, kind, group });
  }

  /** Alternatives separated by |, up to a closing bracket or the end. */
  parseDisjunction(): ExplainNode[] {
    const start = this.i;
    const branches: { start: number; end: number; nodes: ExplainNode[] }[] = [];
    for (;;) {
      const branchStart = this.i;
      const nodes = this.parseSequence();
      branches.push({ start: branchStart, end: this.i, nodes });
      if (this.src[this.i] !== "|") break;
      this.token(this.i, this.i + 1, "alternation");
      this.i++;
    }
    if (branches.length === 1) return branches[0]?.nodes ?? [];
    return [
      {
        source: this.src.slice(start, this.i),
        kind: "alternation",
        text: `Either of ${branches.length} alternatives`,
        children: branches.map((branch, b): ExplainNode => {
          const [only] = branch.nodes;
          // A one-step option reads as that step: no need to nest it.
          if (only && branch.nodes.length === 1) return { ...only, text: `Option ${b + 1}: ${only.text}` };
          return {
            source: this.src.slice(branch.start, branch.end),
            kind: "alternation",
            text: branch.nodes.length === 0 ? `Option ${b + 1}: nothing (always matches)` : `Option ${b + 1}, in order:`,
            children: branch.nodes,
          };
        }),
      },
    ];
  }

  private parseSequence(): ExplainNode[] {
    const nodes: ExplainNode[] = [];
    let prevQuantified = false;
    while (this.i < this.src.length && this.src[this.i] !== "|" && this.src[this.i] !== ")") {
      const atomStart = this.i;
      const atom = this.parseAtom();
      if (!atom) break;
      const q = this.parseQuantifier();
      if (q) {
        atom.text = `${atom.text}, ${q.text}`;
        atom.source = atom.children ? `${atom.source}${q.source}` : this.src.slice(atomStart, this.i);
        if (this.lookbehindDepth > 0 && /^[*+]|,\}/.test(q.source)) this.features.unboundedLookbehind = true;
      }
      // Run plain characters together: "cat" reads better than c, a, t.
      const prev = nodes[nodes.length - 1];
      if (!q && !prevQuantified && atom.kind === "literal" && prev?.kind === "literal") {
        prev.source += atom.source;
        prev.text = `the text “${prev.source.replace(/\\(.)/gu, "$1")}”`;
      } else {
        nodes.push(atom);
      }
      prevQuantified = q !== null;
    }
    return nodes;
  }

  private parseQuantifier(): Quantifier | null {
    const start = this.i;
    const rest = this.src.slice(this.i);
    let m = /^[*+?]/.exec(rest);
    let text = "";
    let range = true;
    if (m) {
      text = m[0] === "*" ? "zero or more times" : m[0] === "+" ? "one or more times" : "optional";
      range = m[0] !== "?";
    } else {
      m = /^\{(\d+)(,(\d*))?\}/.exec(rest);
      if (!m) return null;
      const min = Number(m[1]);
      if (m[2] === undefined) {
        text = `exactly ${times(min)}`;
        range = false;
      } else if (m[3] === "") {
        text = `${min} or more times`;
      } else {
        text = `between ${min} and ${Number(m[3])} times`;
      }
    }
    this.i += m[0].length;
    let lazy = false;
    if (this.src[this.i] === "?") {
      lazy = true;
      this.i++;
    }
    if (range) text += lazy ? ", as few as possible (lazy)" : ", as many as possible";
    else if (lazy) text += " (lazy)";
    this.token(start, this.i, "quantifier");
    return { source: this.src.slice(start, this.i), text };
  }

  private parseAtom(): ExplainNode | null {
    const start = this.i;
    const ch = this.src[this.i];
    if (ch === undefined) return null;
    if (ch === "(") return this.parseGroup();
    if (ch === "[") return this.parseClass();
    if (ch === "\\") return this.parseEscape(false);
    this.i++;
    if (ch === ".") {
      this.token(start, this.i, "dot");
      return {
        source: ".",
        kind: "dot",
        text: this.flags.includes("s") ? "any character, line breaks included" : "any character except a line break",
      };
    }
    if (ch === "^" || ch === "$") {
      this.token(start, this.i, "anchor");
      const line = this.flags.includes("m");
      const text =
        ch === "^"
          ? line ? "the start of a line" : "the start of the text"
          : line ? "the end of a line" : "the end of the text";
      return { source: ch, kind: "anchor", text };
    }
    // Without u, a { that is not a quantifier, ] and } are ordinary characters.
    const cp = this.unicode ? String.fromCodePoint(this.src.codePointAt(start) ?? 0) : ch;
    this.i = start + cp.length;
    this.token(start, this.i, "literal");
    return { source: cp, kind: "literal", text: `the character ${quote(cp)}` };
  }

  private parseGroup(): ExplainNode {
    const start = this.i;
    const rest = this.src.slice(this.i);
    let open: RegExpExecArray | null;
    let kind: TokenKind = "group";
    let text: string;
    let group: number | undefined;
    let behind = false;
    if ((open = /^\(\?<([^=!>][^>]*)>/.exec(rest))) {
      kind = "capture";
      group = this.groups.length + 1;
      this.groups.push({ number: group, name: open[1] });
      this.features.namedGroups = true;
      text = `Group ${group} “${open[1]}”, which captures`;
    } else if ((open = /^\(\?:/.exec(rest))) {
      text = "Group (non-capturing)";
    } else if ((open = /^\(\?=/.exec(rest))) {
      this.features.lookahead = true;
      text = "Followed by (lookahead, not part of the match)";
    } else if ((open = /^\(\?!/.exec(rest))) {
      this.features.lookahead = true;
      text = "Not followed by (negative lookahead)";
    } else if ((open = /^\(\?<=/.exec(rest))) {
      this.features.lookbehind = true;
      behind = true;
      text = "Preceded by (lookbehind, not part of the match)";
    } else if ((open = /^\(\?<!/.exec(rest))) {
      this.features.lookbehind = true;
      behind = true;
      text = "Not preceded by (negative lookbehind)";
    } else if ((open = /^\(\?([ims]*)(?:-([ims]*))?:/.exec(rest))) {
      this.features.modifiers = true;
      const on = [...(open[1] ?? "")].map((f) => FLAG_NAMES[f]).join(", ");
      const off = [...(open[2] ?? "")].map((f) => FLAG_NAMES[f]).join(", ");
      text = `Group with ${[on && `${on} on`, off && `${off} off`].filter(Boolean).join(" and ")}`;
    } else {
      open = /^\(/.exec(rest) as RegExpExecArray;
      kind = "capture";
      group = this.groups.length + 1;
      this.groups.push({ number: group });
      text = `Group ${group}, which captures`;
    }
    this.i += open[0].length;
    this.token(start, this.i, kind, group);
    if (behind) this.lookbehindDepth++;
    const children = this.parseDisjunction();
    if (behind) this.lookbehindDepth--;
    const close = this.i;
    if (this.src[this.i] === ")") this.i++;
    this.token(close, this.i, kind, group);
    const node: ExplainNode = { source: `${open[0]}…)`, kind, text, children };
    if (group !== undefined) node.group = group;
    return node;
  }

  private parseClass(): ExplainNode {
    const start = this.i;
    this.i++;
    let negated = false;
    if (this.src[this.i] === "^") {
      negated = true;
      this.i++;
    }
    const items: string[] = [];
    let nested = false;
    if (this.sets) {
      // v-mode classes nest and take -- and && operators: find the matching bracket and describe the set as a whole.
      let depth = 1;
      while (this.i < this.src.length && depth > 0) {
        const c = this.src[this.i];
        if (c === "\\") this.i += 2;
        else {
          if (c === "[") {
            depth++;
            nested = true;
          } else if (c === "]") depth--;
          else if ((c === "-" || c === "&") && this.src[this.i + 1] === c) nested = true;
          this.i++;
        }
      }
    }
    if (nested) {
      this.features.setOperations = true;
      this.token(start, this.i, "class");
      return {
        source: this.src.slice(start, this.i),
        kind: "class",
        text: negated ? "one character outside this set (with set operations)" : "one character from this set (with set operations)",
      };
    }
    if (this.sets) this.i = start + 1 + (negated ? 1 : 0);
    while (this.i < this.src.length && this.src[this.i] !== "]") {
      const from = this.classAtom();
      if (this.src[this.i] === "-" && this.src[this.i + 1] !== "]" && this.src[this.i + 1] !== undefined && from.single) {
        this.i++;
        const to = this.classAtom();
        items.push(to.single ? `${from.label} to ${to.label}` : `${from.label}, “-”, ${to.label}`);
      } else {
        items.push(from.label);
      }
    }
    if (this.src[this.i] === "]") this.i++;
    this.token(start, this.i, "class");
    const source = this.src.slice(start, this.i);
    if (items.length === 0) {
      this.features.emptyClass = true;
      return { source, kind: "class", text: negated ? "any character at all, line breaks included" : "nothing (an empty class never matches)" };
    }
    const list = items.join(", ");
    return {
      source,
      kind: "class",
      text: negated ? `any character except ${list}` : `one character from ${list}`,
    };
  }

  /** One character or shorthand inside a class. `single` is false for \d and friends, which cannot start a range. */
  private classAtom(): { label: string; single: boolean } {
    const ch = this.src[this.i] ?? "";
    if (ch !== "\\") {
      // An astral character is two UTF-16 units; with u it is one class member.
      const cp = this.unicode ? String.fromCodePoint(this.src.codePointAt(this.i) ?? 0) : ch;
      this.i += cp.length;
      return { label: quote(cp), single: true };
    }
    const next = this.src[this.i + 1] ?? "";
    if (next === "b") {
      this.i += 2;
      return { label: "a backspace", single: true };
    }
    if (next === "-") {
      this.i += 2;
      return { label: quote("-"), single: true };
    }
    const node = this.parseEscape(true);
    return { label: node.text, single: !/^[dDwWsSpP]$/.test(next) };
  }

  private parseEscape(inClass: boolean): ExplainNode {
    const start = this.i;
    const rest = this.src.slice(this.i);
    const next = rest[1] ?? "";
    let m: RegExpExecArray | null;
    let text: string;
    let kind: TokenKind = "escape";
    let length = 2;
    if (!inClass && (next === "b" || next === "B")) {
      kind = "anchor";
      text = next === "b" ? "a word boundary" : "a position that is not a word boundary";
    } else if ((m = /^\\([pP])\{([^}]*)\}/.exec(rest)) && this.unicode) {
      this.features.unicodeProperty = true;
      length = m[0].length;
      const [prop, value] = (m[2] ?? "").split("=");
      const what = value ? `${prop} ${value}` : prop;
      text = m[1] === "p" ? `a character with the Unicode property ${what}` : `a character without the Unicode property ${what}`;
    } else if (!inClass && (m = /^\\k<([^>]+)>/.exec(rest)) && (this.unicode || this.features.namedGroups || /\(\?<[^=!]/.test(this.src))) {
      this.features.backrefs = true;
      kind = "backref";
      length = m[0].length;
      text = `the same text group “${m[1]}” matched`;
    } else if (!inClass && (m = /^\\([1-9]\d*)/.exec(rest)) && Number(m[1]) <= this.groupTotal) {
      this.features.backrefs = true;
      kind = "backref";
      length = m[0].length;
      text = `the same text group ${m[1]} matched`;
    } else if (!inClass && !this.unicode && /^\\[1-9]/.test(rest)) {
      length = /^\\[0-7]{1,3}/.exec(rest)?.[0].length ?? 2;
      text = length > 2 || /[0-7]/.test(next) ? "a legacy octal escape" : `the character ${quote(next)}`;
    } else if ((m = /^\\x([0-9a-fA-F]{2})/.exec(rest))) {
      length = 4;
      text = hexChar(m[1] ?? "");
    } else if ((m = /^\\u\{([0-9a-fA-F]+)\}/.exec(rest)) && this.unicode) {
      this.features.codePointEscape = true;
      length = m[0].length;
      text = hexChar(m[1] ?? "");
    } else if ((m = /^\\u([0-9a-fA-F]{4})/.exec(rest))) {
      length = 6;
      text = hexChar(m[1] ?? "");
    } else if ((m = /^\\c([A-Za-z])/.exec(rest))) {
      length = 3;
      text = `the control character Ctrl+${(m[1] ?? "").toUpperCase()}`;
    } else if (ESCAPES[next] && !(next === "0" && /[0-9]/.test(rest[2] ?? ""))) {
      text = ESCAPES[next] ?? "";
    } else if (next === "") {
      length = 1;
      text = "a backslash";
    } else {
      // An escaped character stands for itself: \. is a full stop, \\ a backslash.
      const cp = String.fromCodePoint(rest.codePointAt(1) ?? 0);
      length = 1 + cp.length;
      kind = "literal";
      text = `the character ${quote(cp)}`;
    }
    this.i += length;
    if (!inClass) this.token(start, this.i, kind === "literal" ? "escape" : kind);
    return { source: this.src.slice(start, this.i), kind, text };
  }
}

/** Capture groups counted with the same rules as the parser: not inside classes, not escaped, not (?: and friends. */
function countCaptures(src: string, sets: boolean): number {
  let count = 0;
  let classDepth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") i++;
    else if (c === "[") classDepth = sets || classDepth === 0 ? classDepth + 1 : classDepth;
    else if (c === "]" && classDepth > 0) classDepth--;
    else if (c === "(" && classDepth === 0 && (src[i + 1] !== "?" || (src[i + 2] === "<" && src[i + 3] !== "=" && src[i + 3] !== "!"))) count++;
  }
  return count;
}

/** Explain a pattern that compiled with these flags. */
export function explain(pattern: string, flags: string): Explained {
  const parser = new Parser(pattern, flags);
  const nodes: ExplainNode[] = [];
  while (parser.i < pattern.length) {
    nodes.push(...parser.parseDisjunction());
    // A stray ) cannot get past the engine; skip it rather than loop.
    if (pattern[parser.i] === ")") parser.i++;
  }
  return { nodes, tokens: parser.tokens, groups: parser.groups, features: parser.features };
}
