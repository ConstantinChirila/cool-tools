"use client";

import * as React from "react";
import { Check, Copy, Eraser, LoaderCircle, Replace, Sparkles } from "lucide-react";
import { Callout } from "@/components/calc/callout";
import { PillButton, TogglePill, togglePillClass } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { HighlightTextarea } from "@/components/tools/highlight-textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCopy } from "@/hooks/use-copy";
import { TIMEOUT_MS, useRegexRun } from "@/hooks/use-regex";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import { plural } from "@/lib/currency";
import { compile, countGroups, FLAGS, highlights, normaliseFlags, type Match, type RunResult } from "@/lib/regex";
import { codeSnippet, LANGUAGES, type LanguageId } from "@/lib/regex-code";
import { explain, type CaptureGroup, type ExplainNode, type Token } from "@/lib/regex-explain";
import { DEFAULT_PATTERN, LIBRARY, LIBRARY_IDS, libraryPattern } from "@/lib/regex-library";
import { cn } from "@/lib/utils";

/** Group colours, in order: shared by the text marks, the match list and the brackets in the pattern. */
const GROUP_BG = ["bg-pink", "bg-mint", "bg-sky", "bg-lilac"] as const;
const groupBg = (group: number) => GROUP_BG[(group - 1) % GROUP_BG.length];
/** Alternate matches get a lighter yellow, so two touching matches still read as two. */
const matchBg = (index: number) => (index % 2 === 0 ? "bg-yellow" : "bg-yellow/50");

/** Beyond this many coloured runs the text box stays plain: thousands of spans make typing lag. */
const MAX_MARKS = 5_000;
/** Matches listed before "Show all". */
const LIST_STEP = 100;
const LIST_MAX = 1_000;

const TOKEN_STYLE: Partial<Record<Token["kind"], string>> = {
  group: "bg-foreground/15",
  alternation: "bg-foreground/15",
  class: "bg-foreground/[0.07]",
  quantifier: "text-chart-1",
  escape: "text-chart-4",
  dot: "text-chart-4",
  backref: "text-chart-4",
  anchor: "text-chart-5",
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Line breaks and tabs made visible in the match list, where they would otherwise vanish. */
const visible = (s: string) => s.replace(/\n/g, "↵").replace(/\t/g, "⇥");

/** A zero-width caret for empty matches and empty replacements: no width, so text after it does not move. */
function EmptyMark({ className }: { className?: string }) {
  return <span className={cn("-mx-px border-l-2 border-foreground", className)} />;
}

function PatternBackdrop({ pattern, tokens }: { pattern: string; tokens: Token[] }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const t of tokens) {
    if (t.start < at || t.end > pattern.length) continue;
    if (t.start > at) parts.push(pattern.slice(at, t.start));
    const style = t.kind === "capture" && t.group !== undefined ? groupBg(t.group) : TOKEN_STYLE[t.kind];
    parts.push(
      style ? (
        <span key={t.start} className={cn("rounded-[3px]", style)}>
          {pattern.slice(t.start, t.end)}
        </span>
      ) : (
        pattern.slice(t.start, t.end)
      ),
    );
    at = t.end;
  }
  if (at < pattern.length) parts.push(pattern.slice(at));
  return <>{parts}</>;
}

function TextBackdrop({ text, matches }: { text: string; matches: Match[] }) {
  const runs = highlights(matches);
  if (runs.length > MAX_MARKS) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let at = 0;
  runs.forEach((run, i) => {
    // Results can be a keystroke behind the text: never mark past its end.
    const start = Math.min(run.start, text.length);
    const end = Math.min(run.end, text.length);
    if (start < at) return;
    if (start > at) parts.push(text.slice(at, start));
    if (start === end) parts.push(<EmptyMark key={i} />);
    else {
      parts.push(
        <span key={i} className={cn("rounded-[3px]", run.group ? groupBg(run.group) : matchBg(run.match))}>
          {text.slice(start, end)}
        </span>,
      );
    }
    at = end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const { state, copy } = useCopy();
  return (
    <PillButton onClick={() => copy(text)} aria-live="polite" className={className}>
      {state === "copied" ? <Check className="size-4" strokeWidth={2.5} /> : <Copy className="size-4" strokeWidth={2.5} />}
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label}
    </PillButton>
  );
}

function MatchList({ result, groups }: { result: RunResult; groups: CaptureGroup[] }) {
  const [shown, setShown] = React.useState(LIST_STEP);
  const { matches } = result;
  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border-[2.5px] border-dashed border-foreground/30 px-4 py-10 text-center font-semibold text-muted-foreground">
        No matches. The explanation below shows how the pattern reads.
      </p>
    );
  }
  const list = matches.slice(0, Math.min(shown, LIST_MAX));
  return (
    <div className="space-y-3">
      <ol className="space-y-2.5">
        {list.map((m, i) => (
          <li key={i} className="rounded-2xl border-2 border-foreground/15 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[13px] font-bold text-muted-foreground text-numeric">#{i + 1}</span>
              <span className={cn("rounded-[4px] px-1 font-mono text-[13px] whitespace-pre-wrap [overflow-wrap:anywhere]", matchBg(i))}>
                {m.text === "" ? <span className="italic">empty</span> : visible(m.text)}
              </span>
              <span className="ml-auto text-xs font-semibold text-muted-foreground text-numeric">
                {m.start === m.end ? `at ${m.start}` : `${m.start}–${m.end}`}
              </span>
            </div>
            {m.groups.length > 0 && (
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                {m.groups.map((g, gi) => {
                  const info = groups[gi];
                  return (
                    <React.Fragment key={gi}>
                      <dt className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        <span className={cn("size-2.5 rounded-full border-[1.5px] border-foreground", groupBg(gi + 1))} />
                        {info?.name ?? gi + 1}
                      </dt>
                      <dd className="font-mono text-[13px] whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {g.value === undefined ? (
                          <span className="text-muted-foreground italic">did not take part</span>
                        ) : g.value === "" ? (
                          <span className="text-muted-foreground italic">empty</span>
                        ) : (
                          visible(g.value)
                        )}
                      </dd>
                    </React.Fragment>
                  );
                })}
              </dl>
            )}
          </li>
        ))}
      </ol>
      {matches.length > list.length && list.length < LIST_MAX && (
        <PillButton onClick={() => setShown((n) => n + LIST_STEP * 4)}>
          Show more ({(matches.length - list.length).toLocaleString("en-GB")} left)
        </PillButton>
      )}
      {(list.length === LIST_MAX && matches.length > LIST_MAX) || result.capped ? (
        <p className="text-xs font-semibold text-muted-foreground">
          The list stops at {LIST_MAX.toLocaleString("en-GB")}
          {result.capped ? " and counting stops at 10,000" : ""}.
        </p>
      ) : null}
    </div>
  );
}

function ExplainList({ nodes, depth = 0, className }: { nodes: ExplainNode[]; depth?: number; className?: string }) {
  return (
    <ol className={cn("space-y-2", depth > 0 && "mt-2 border-l-2 border-foreground/15 pl-3", className)}>
      {nodes.map((n, i) => (
        <li key={i} className="pt-px">
          <div className="grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] items-baseline gap-x-2.5">
            <code
              className={cn(
                "rounded-[5px] border-[1.5px] border-foreground px-1.5 font-mono text-[13px] whitespace-pre-wrap [overflow-wrap:anywhere]",
                n.kind === "capture" && n.group !== undefined ? groupBg(n.group) : "bg-card",
              )}
            >
              {n.source || "(empty)"}
            </code>
            <span className="min-w-0 text-[14px] font-semibold">{capitalise(n.text)}</span>
          </div>
          {n.children && n.children.length > 0 && <ExplainList nodes={n.children} depth={depth + 1} />}
        </li>
      ))}
    </ol>
  );
}

function ReplaceOutput({ result, text }: { result: RunResult; text: string }) {
  const output = result.output ?? text;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="regex-output" className="text-[15px] font-bold">
          Result
        </h3>
        <CopyButton text={output} label="Copy result" className="h-8 bg-yellow px-3 hover:bg-yellow" />
      </div>
      <pre
        aria-labelledby="regex-output"
        className="min-h-24 rounded-2xl border-[2.5px] border-foreground bg-secondary px-3.5 py-3 font-mono text-base leading-6 whitespace-pre-wrap [overflow-wrap:anywhere] md:pointer-fine:text-[13px]"
      >
        {result.pieces
          ? result.pieces.map((p, i) =>
              p.kind === "text" ? (
                p.text
              ) : p.text === "" ? (
                <EmptyMark key={i} className="border-pink" />
              ) : (
                <span key={i} className={cn("rounded-[3px]", matchBg(p.match))}>
                  {p.text}
                </span>
              ),
            )
          : output}
      </pre>
    </div>
  );
}

export function RegexTester() {
  const [pattern, setPattern] = React.useState(DEFAULT_PATTERN.pattern);
  const [flags, setFlagsRaw] = React.useState(DEFAULT_PATTERN.flags);
  const [replaceOn, setReplaceOn] = React.useState(false);
  const [replacement, setReplacement] = React.useState(DEFAULT_PATTERN.replacement ?? "");
  const [sampleId, setSampleId] = React.useState(DEFAULT_PATTERN.id);
  const [language, setLanguage] = React.useState<LanguageId>("js");
  // Until something is typed, the text box shows the sample of the last library pattern chosen.
  const [typed, setTyped] = React.useState<string | null>(null);
  const setFlags = (next: string) => setFlagsRaw(normaliseFlags(next));

  // The test text stays out of the URL: it can be long, and people paste logs and data into it.
  useUrlState({
    p: urlField(pattern, setPattern, DEFAULT_PATTERN.pattern),
    f: urlField(flags, setFlags, DEFAULT_PATTERN.flags),
    r: urlField(replacement, setReplacement, DEFAULT_PATTERN.replacement ?? ""),
    rep: urlField(replaceOn, setReplaceOn, false),
    ex: urlField(sampleId, setSampleId, DEFAULT_PATTERN.id, LIBRARY_IDS),
    lang: urlField(language, setLanguage, "js", LANGUAGES.map((l) => l.id)),
  });

  const sample = libraryPattern(sampleId);
  const text = typed ?? sample.sample;
  const compiled = compile(pattern, flags);
  const explained = React.useMemo(() => (compiled.ok ? explain(pattern, flags) : null), [compiled.ok, pattern, flags]);
  // The engine's own count decides; the reader only supplies names, and only when it agrees.
  const groupCount = compiled.ok ? countGroups(compiled.value) : 0;
  const groups: CaptureGroup[] =
    explained && explained.groups.length === groupCount
      ? explained.groups
      : Array.from({ length: groupCount }, (_, i) => ({ number: i + 1 }));

  // Library patterns are known to be quick on their own samples, so those run during render.
  const trusted = typed === null && LIBRARY.some((p) => p.id === sampleId && p.pattern === pattern && p.flags === flags);
  const { run, pending, slow } = useRegexRun(
    { pattern, flags, text, replacement: replaceOn ? replacement : null, names: groups.map((g) => g.name) },
    { enabled: compiled.ok && pattern !== "", trusted },
  );
  const result = run?.status === "done" && run.result.ok ? run.result.value : null;

  const loadLibrary = (id: string) => {
    const p = libraryPattern(id);
    setPattern(p.pattern);
    setFlags(p.flags);
    setReplacement(p.replacement ?? "");
    setSampleId(p.id);
    setTyped(null);
  };
  const active = LIBRARY.find((p) => p.pattern === pattern && p.flags === flags);

  const toggleFlag = (id: string, on: boolean) => {
    let next = on ? flags + id : flags.replace(id, "");
    // u and v cannot be combined: switching one on switches the other off.
    if (on && id === "u") next = next.replace("v", "");
    if (on && id === "v") next = next.replace("u", "");
    setFlags(next);
  };

  const snippet = explained
    ? codeSnippet(language, {
        pattern,
        flags,
        replacement: replaceOn ? replacement : null,
        groups,
        features: explained.features,
      })
    : null;

  const count = result?.matches.length ?? 0;
  let status: React.ReactNode;
  if (!compiled.ok) {
    status = <Callout tone="warn">{compiled.error}</Callout>;
  } else if (pattern === "") {
    status = <p className="text-sm font-semibold text-muted-foreground">Type a pattern to start. An empty pattern matches everywhere.</p>;
  } else if (run?.status === "timeout" && !pending) {
    status = (
      <Callout tone="warn">
        Stopped after {TIMEOUT_MS / 1000} seconds. This usually means catastrophic backtracking: a repeat inside a repeat, like
        (a+)+ or (\w|\d)*, that tries every way to split the text before giving up. Make the inner part stricter or the
        alternatives unable to overlap.
      </Callout>
    );
  } else if (run?.status === "done" && !run.result.ok) {
    status = <Callout tone="warn">{run.result.error}</Callout>;
  } else {
    status = (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" role="status">
        <span className={cn("sticker tilt-2 rounded-xl px-3 py-1 font-heading text-lg font-extrabold", count > 0 ? "bg-yellow" : "bg-card")}>
          {result ? (result.capped ? "10,000+ matches" : plural(count, "match", "matches")) : "…"}
        </span>
        {groupCount > 0 && <span className="text-sm font-semibold text-muted-foreground">{plural(groupCount, "group")}</span>}
        {!flags.includes("g") && count === 1 && (
          <span className="text-sm font-semibold text-muted-foreground">First match only: switch on g for all of them</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="regex-pattern" className="text-[15px] font-bold">
              Regular expression
            </label>
            <div className="flex items-start gap-2 font-mono text-xl font-bold">
              <span className="pt-2.5 text-muted-foreground" aria-hidden="true">
                /
              </span>
              <HighlightTextarea
                id="regex-pattern"
                value={pattern}
                onChange={setPattern}
                singleLine
                placeholder="Type a pattern, e.g. \d+"
                aria-invalid={!compiled.ok}
                aria-describedby="regex-status"
                className="min-w-0 flex-1 font-normal"
                backdrop={<PatternBackdrop pattern={pattern} tokens={explained?.tokens ?? []} />}
              />
              <span className="pt-2.5 text-muted-foreground" aria-hidden="true">
                /{flags}
              </span>
            </div>
          </div>

          <div role="group" aria-label="Flags" className="flex flex-wrap gap-2">
            {FLAGS.map((f) => (
              <TogglePill key={f.id} pressed={flags.includes(f.id)} onPressedChange={(on) => toggleFlag(f.id, on)}>
                <span className="font-mono">{f.id}</span>
                <span title={f.hint}>{f.label}</span>
              </TogglePill>
            ))}
          </div>

          <div id="regex-status" className="flex min-h-10 items-center gap-3">
            <div className="min-w-0 flex-1">{status}</div>
            {slow && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" strokeWidth={2.5} />
                Running…
              </span>
            )}
          </div>

          <div className="space-y-2 border-t-2 border-foreground/10 pt-4">
            <p className="text-[15px] font-bold" id="regex-library">
              Pattern library
            </p>
            <div role="group" aria-labelledby="regex-library" className="flex flex-wrap gap-2">
              {LIBRARY.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active?.id === p.id}
                  onClick={() => loadLibrary(p.id)}
                  className={togglePillClass(active?.id === p.id, "h-8 px-3 text-[13px]")}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {active && <p className="text-xs font-semibold text-muted-foreground">{active.note}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="regex-text" className="text-[15px] font-bold">
                Test text
              </label>
              <span className="text-xs font-semibold text-muted-foreground">Stays in your browser</span>
            </div>
            <HighlightTextarea
              id="regex-text"
              value={text}
              onChange={setTyped}
              placeholder="Type or paste text to test the pattern on"
              layerClassName="min-h-44"
              backdrop={<TextBackdrop text={text} matches={compiled.ok && pattern !== "" ? (result?.matches ?? []) : []} />}
            />
            <div className="flex flex-wrap items-center gap-2">
              <PillButton onClick={() => setTyped(null)} disabled={typed === null}>
                <Sparkles className="size-4" strokeWidth={2.5} />
                Sample
              </PillButton>
              <PillButton onClick={() => setTyped("")} disabled={text === ""}>
                <Eraser className="size-4" strokeWidth={2.5} />
                Clear
              </PillButton>
              <span className="grow" />
              <TogglePill pressed={replaceOn} onPressedChange={setReplaceOn}>
                <Replace className="size-4" strokeWidth={2.5} />
                Replace
              </TogglePill>
            </div>

            {replaceOn && (
              <div className="space-y-4 border-t-2 border-foreground/10 pt-4">
                <div className="space-y-2">
                  <label htmlFor="regex-replacement" className="block text-[15px] font-bold">
                    Replace each match with
                  </label>
                  <Input
                    id="regex-replacement"
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="Leave empty to delete the matches"
                    spellCheck={false}
                    autoComplete="off"
                    className="border-foreground font-mono font-normal"
                  />
                  <p className="text-xs font-semibold text-muted-foreground">
                    $1 or $&lt;name&gt; for a group, $&amp; for the whole match, $$ for a dollar sign.
                    {!flags.includes("g") && " Without g only the first match is replaced."}
                  </p>
                </div>
                {result && <ReplaceOutput result={result} text={text} />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:[contain:size]">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            <h2 className="font-heading text-lg font-extrabold">Matches and groups</h2>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 max-lg:max-h-[32rem]">
              {result && compiled.ok && pattern !== "" ? (
                <MatchList key={`${pattern}/${flags}`} result={result} groups={groups} />
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">Matches show up here.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold">What the pattern means</h2>
          {explained && explained.nodes.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-muted-foreground">Read top to bottom: the text must match each step in turn.</p>
              <ExplainList nodes={explained.nodes} className="gap-x-10 lg:columns-2 [&>li]:break-inside-avoid" />
            </>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">
              {compiled.ok ? "Type a pattern to see it explained step by step." : "Fix the error above to see the pattern explained."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-extrabold">Use it in code</h2>
            {snippet && <CopyButton text={snippet.code} label="Copy code" className="bg-yellow hover:bg-yellow" />}
          </div>
          <Segmented label="Language" size="sm" value={language} onChange={setLanguage} options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))} className="w-full overflow-x-auto sm:w-auto" />
          {snippet ? (
            <>
              <pre className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground bg-secondary px-4 py-3 font-mono text-[13px] leading-6">
                {snippet.code}
              </pre>
              {snippet.warnings.length > 0 && (
                <ul className="space-y-2">
                  {snippet.warnings.map((w) => (
                    <li key={w}>
                      <Callout>{w}</Callout>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs font-semibold text-muted-foreground">
                {language === "js"
                  ? "text is the string to search."
                  : "Translated from JavaScript syntax. Engines differ in small ways, so run your tests there too."}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">A valid pattern turns into code here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
