"use client";

import * as React from "react";
import { ArrowDownUp, Check, Copy, Eraser, Sparkles } from "lucide-react";
import { Callout } from "@/components/calc/callout";
import { CodeTextarea } from "@/components/calc/code-textarea";
import { PillButton, TogglePill } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { Card, CardContent } from "@/components/ui/card";
import { useCopy } from "@/hooks/use-copy";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  byteLength,
  codecIds,
  codecs,
  defaultVariant,
  getCodec,
  runCodec,
  type CodecId,
  type Direction,
} from "@/lib/encoding";
import { cn } from "@/lib/utils";

const SAMPLE = "Hello, wörld! <b>Fish & chips</b> for £5 👋";

const TILE_STYLE: Record<CodecId, { bg: string; tilt: string }> = {
  base64: { bg: "bg-lilac", tilt: "tilt-3" },
  url: { bg: "bg-sky", tilt: "tilt-2" },
  html: { bg: "bg-pink", tilt: "tilt-5" },
  hex: { bg: "bg-mint", tilt: "tilt-4" },
  unicode: { bg: "bg-yellow", tilt: "tilt-1" },
};

/** "42 characters, 47 bytes": bytes are only mentioned when UTF-8 makes them differ. */
function sizeOf(text: string) {
  // Code points, so an emoji counts once: every UTF-16 unit except the second half of a surrogate pair.
  let chars = 0;
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit < 0xdc00 || unit > 0xdfff) chars++;
  }
  const bytes = byteLength(text);
  const c = `${chars.toLocaleString("en-GB")} ${chars === 1 ? "character" : "characters"}`;
  return bytes === chars ? c : `${c}, ${bytes.toLocaleString("en-GB")} bytes`;
}

export function EncoderDecoder({
  initial,
}: {
  initial?: { codec?: CodecId; direction?: Direction };
} = {}) {
  const startCodec = initial?.codec ?? "base64";
  const startDirection = initial?.direction ?? "encode";
  const [codecId, setCodecId] = React.useState<CodecId>(startCodec);
  const [direction, setDirection] = React.useState<Direction>(startDirection);
  const [variant, setVariant] = React.useState(() => defaultVariant(getCodec(startCodec)));
  const [decodeOption, setDecodeOption] = React.useState(true);
  // Until something is typed, the box shows a sample that follows the chosen codec and direction.
  const [typed, setInput] = React.useState<string | null>(null);
  const { state: copyState, copy } = useCopy();

  // The text stays out of the URL on purpose: people paste tokens and keys here.
  useUrlState({
    c: urlField(codecId, setCodecId, startCodec, codecIds),
    d: urlField(direction, setDirection, startDirection, ["encode", "decode"]),
    v: urlField(variant, setVariant, defaultVariant(getCodec(startCodec))),
    o: urlField(decodeOption, setDecodeOption, true),
  });

  const codec = getCodec(codecId);
  const activeVariant = codec.variants.find((v) => v.id === variant) ?? codec.variants[0];
  const input = typed ?? (direction === "encode" ? SAMPLE : codec.encode(SAMPLE, activeVariant?.id ?? ""));
  const deferredInput = React.useDeferredValue(input);
  const result = React.useMemo(
    () => runCodec(codecId, direction, deferredInput, variant, decodeOption),
    [codecId, direction, deferredInput, variant, decodeOption],
  );
  const output = result.ok ? result.value : "";
  // Counted from the deferred text, so a huge paste is measured once rather than on every keystroke.
  const inputSize = React.useMemo(() => sizeOf(deferredInput), [deferredInput]);
  const outputSize = React.useMemo(() => sizeOf(output), [output]);

  const pickCodec = (next: CodecId) => {
    if (next === codecId) return;
    // Encoded text from one codec means nothing to another: start the new one from plain text.
    if (direction === "decode" && typed !== null) setInput(result.ok ? result.value : "");
    setCodecId(next);
    setVariant(defaultVariant(getCodec(next)));
    setDirection("encode");
  };

  const pickDirection = (next: Direction) => {
    if (next === direction) return;
    // Flipping carries the result across, so encode then decode returns to where you started.
    if (typed !== null && result.ok && result.value !== "") setInput(result.value);
    setDirection(next);
  };

  const loadSample = () => setInput(null);

  const plainLabel = "Plain text";
  const inputLabel = direction === "encode" ? plainLabel : codec.encodedLabel;
  const outputLabel = direction === "encode" ? codec.encodedLabel : plainLabel;

  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="Encoding" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {codecs.map((c) => {
          const selected = c.id === codecId;
          const style = TILE_STYLE[c.id];
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => pickCodec(c.id)}
              className={cn(
                "flex min-h-20 flex-col justify-between gap-2 rounded-2xl border-[2.5px] border-foreground px-4 py-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
                selected ? cn("sticker", style.bg, style.tilt) : "bg-card hover:bg-secondary",
              )}
            >
              <span className="font-heading text-lg leading-tight font-extrabold">{c.name}</span>
              <span className={cn("font-mono text-xs font-bold", selected ? "text-foreground/75" : "text-muted-foreground")}>
                {c.example}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Segmented
              label="Direction"
              value={direction}
              onChange={pickDirection}
              options={[
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ]}
              className="w-full sm:w-56"
            />
            {direction === "encode" && codec.variants.length > 1 && (
              <Segmented
                label={`${codec.name} style`}
                size="sm"
                value={activeVariant?.id ?? ""}
                onChange={setVariant}
                options={codec.variants.map((v) => ({ value: v.id, label: v.label }))}
                className="w-full sm:w-auto"
              />
            )}
            {direction === "decode" && codec.decodeOption && (
              <TogglePill pressed={decodeOption} onPressedChange={setDecodeOption}>
                {codec.decodeOption.label}
              </TogglePill>
            )}
            <p className="basis-full text-xs font-semibold text-muted-foreground lg:basis-auto lg:flex-1">
              {direction === "encode"
                ? activeVariant?.hint
                : (codec.decodeOption?.hint ?? `Reads every ${codec.name} style, so there is nothing to choose.`)}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="codec-input" className="text-[15px] font-bold">
                  {inputLabel}
                </label>
                <span className="text-xs font-semibold text-muted-foreground text-numeric">{inputSize}</span>
              </div>
              <CodeTextarea
                id="codec-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={direction === "encode" ? "Type or paste text to encode" : `Paste ${codec.encodedLabel.toLowerCase()} to decode`}
                className="h-44 break-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="codec-output" className="text-[15px] font-bold">
                  {outputLabel}
                </label>
                <span className="text-xs font-semibold text-muted-foreground text-numeric" aria-live="polite">
                  {result.ok ? outputSize : "Cannot decode"}
                </span>
              </div>
              {result.ok ? (
                <CodeTextarea
                  id="codec-output"
                  value={output}
                  readOnly
                  placeholder="The result appears here"
                  className="h-44 bg-secondary break-all"
                />
              ) : (
                <div id="codec-output" role="alert" className="flex h-44 flex-col justify-center rounded-2xl border-[2.5px] border-dashed border-foreground/40 px-4">
                  <Callout tone="warn">{result.error}</Callout>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PillButton onClick={loadSample}>
              <Sparkles className="size-4" strokeWidth={2.5} />
              Sample
            </PillButton>
            <PillButton onClick={() => setInput("")} disabled={input === ""}>
              <Eraser className="size-4" strokeWidth={2.5} />
              Clear
            </PillButton>
            <span className="grow" />
            <PillButton
              onClick={() => pickDirection(direction === "encode" ? "decode" : "encode")}
              disabled={!result.ok || output === ""}
            >
              <ArrowDownUp className="size-4" strokeWidth={2.5} />
              {direction === "encode" ? "Decode this" : "Encode this"}
            </PillButton>
            <PillButton
              onClick={() => copy(output)}
              disabled={!result.ok || output === ""}
              aria-live="polite"
              className="bg-yellow hover:bg-yellow"
            >
              {copyState === "copied" ? <Check className="size-4" strokeWidth={2.5} /> : <Copy className="size-4" strokeWidth={2.5} />}
              {copyState === "copied" ? "Copied" : copyState === "failed" ? "Could not copy" : "Copy result"}
            </PillButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
