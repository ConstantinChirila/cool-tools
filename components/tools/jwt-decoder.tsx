"use client";

import * as React from "react";
import { Check, Copy, Eraser, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles, type LucideIcon } from "lucide-react";
import { Callout } from "@/components/calc/callout";
import { CodeTextarea } from "@/components/calc/code-textarea";
import { PillButton, TogglePill } from "@/components/calc/pill-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCopy } from "@/hooks/use-copy";
import { useNow } from "@/hooks/use-now";
import {
  CLAIM_NAMES,
  HEADER_NAMES,
  claimTime,
  decodeJwt,
  isHmac,
  jwtStatus,
  roughDuration,
  verifyHmac,
  type DecodedJwt,
  type JsonObject,
  type VerifyResult,
} from "@/lib/jwt";
import { cn } from "@/lib/utils";

/** HS256, signed with SAMPLE_SECRET. Issued 1 January 2026, expires 1 January 2030. */
const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2JpdHNib2JzLmFwcCIsInN1YiI6InVzZXJfODY3NTMwOSIsImF1ZCI6ImJpdHMtYW5kLWJvYnMtd2ViIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NzIyNTYwMCwiZXhwIjoxODkzNDU2MDAwfQ.xZkbEvx3pE-EUrQRvv2djeo_sI0QZFkxqahBBfaamok";
const SAMPLE_SECRET = "bits-and-bobs-demo-secret";

const PART_STYLE = {
  header: "bg-pink/60",
  payload: "bg-lilac/60",
  signature: "bg-sky/60",
} as const;

const TIME_FORMAT = { dateStyle: "medium", timeStyle: "long" } as const;
// Built once: constructing a formatter is the slow part of Intl.
const LOCAL_TIME = new Intl.DateTimeFormat("en-GB", TIME_FORMAT);
const UTC_TIME = new Intl.DateTimeFormat("en-GB", { ...TIME_FORMAT, timeZone: "UTC" });

function relative(ms: number, now: number): string {
  return ms <= now ? `${roughDuration(now - ms)} ago` : `in ${roughDuration(ms - now)}`;
}

function showValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * A time claim as a date plus how far away it is. The only part of a panel
 * that follows the clock, so the once-a-second tick re-renders this and
 * nothing around it. Before hydration there is no local time zone to trust,
 * so the date is shown in UTC.
 */
function ClaimTime({ ms }: { ms: number }) {
  const now = useNow();
  return (
    <>
      {(now === null ? UTC_TIME : LOCAL_TIME).format(new Date(ms))}
      {now !== null && <span className="ml-2 font-semibold text-muted-foreground">({relative(ms, now)})</span>}
    </>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const { state, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-live="polite"
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {state === "copied" ? <Check className="size-3.5" strokeWidth={2.5} /> : <Copy className="size-3.5" strokeWidth={2.5} />}
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label}
    </button>
  );
}

const JsonPanel = React.memo(function JsonPanel({
  title,
  tone,
  data,
  names,
}: {
  title: string;
  tone: string;
  data: JsonObject;
  names: Record<string, string>;
}) {
  const json = React.useMemo(() => JSON.stringify(data, null, 2), [data]);
  const entries = Object.entries(data);
  return (
    <section className="overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-card">
      <div className={cn("flex items-center justify-between gap-3 border-b-[2.5px] border-foreground py-1.5 pr-2 pl-4", tone)}>
        <h3 className="font-heading text-lg font-extrabold">{title}</h3>
        <CopyButton text={json} label="Copy JSON" />
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">
        {json}
      </pre>
      {entries.length > 0 && (
        <dl className="divide-y-2 divide-foreground/10 border-t-2 border-foreground/15">
          {entries.map(([name, value]) => {
            const time = claimTime(name, value);
            return (
              <div key={name} className="grid gap-x-4 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="font-mono text-[13px] font-bold">{name}</dt>
                <dd className="min-w-0 space-y-0.5">
                  <p className="text-[15px] font-bold [overflow-wrap:anywhere]">
                    {time === null ? showValue(value) : <ClaimTime ms={time} />}
                  </p>
                  {names[name] && <p className="text-xs font-semibold text-muted-foreground">{names[name]}</p>}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
});

function StatusSticker({ jwt }: { jwt: DecodedJwt }) {
  const now = useNow();
  // The clock only exists in the browser; until then say nothing rather than guess.
  if (now === null) return <div className="h-[74px]" aria-hidden="true" />;
  const status = jwtStatus(jwt.payload, now);
  const view = {
    valid: { bg: "bg-mint", title: "Not expired", detail: status.kind === "valid" ? `Expires ${relative(status.expiresAt, now)}` : "" },
    expired: { bg: "bg-pink", title: "Expired", detail: status.kind === "expired" ? `Expired ${relative(status.expiredAt, now)}` : "" },
    "not-yet": { bg: "bg-yellow", title: "Not valid yet", detail: status.kind === "not-yet" ? `Becomes valid ${relative(status.validFrom, now)}` : "" },
    "no-expiry": { bg: "bg-yellow", title: "Never expires", detail: "There is no usable exp claim, so this token is valid until its key is changed" },
  }[status.kind];
  return (
    <div className={cn("sticker tilt-3 w-fit rounded-2xl px-5 py-3", view.bg)} role="status">
      <p className="font-heading text-xl font-extrabold">{view.title}</p>
      <p className="text-sm font-semibold">{view.detail}</p>
    </div>
  );
}

/** One entry per outcome, so tsc flags a new VerifyResult that has no message. */
const VERIFY_VIEW: Record<VerifyResult | "unchecked", { icon: LucideIcon; badge?: string; tone?: string; text: string }> = {
  valid: {
    icon: ShieldCheck,
    badge: "Signature verified",
    tone: "bg-mint",
    text: "The token was signed with this secret and has not been changed.",
  },
  invalid: {
    icon: ShieldAlert,
    badge: "Signature does not match",
    tone: "bg-pink",
    text: "Wrong secret, or the token was altered after signing.",
  },
  "bad-secret": { icon: ShieldAlert, text: "That secret is not valid Base64." },
  unsupported: { icon: ShieldQuestion, text: "This browser cannot check signatures here." },
  unchecked: { icon: ShieldQuestion, text: "Signature not checked. Decoding never needs the secret." },
};

function SignatureCheck({ jwt, isSample }: { jwt: DecodedJwt; isSample: boolean }) {
  const [secret, setSecret] = React.useState("");
  const [secretIsBase64, setSecretIsBase64] = React.useState(false);
  const [checked, setChecked] = React.useState<{ key: string; result: VerifyResult } | null>(null);
  const key = `${jwt.parts.header}.${jwt.parts.payload}.${jwt.parts.signature}|${secret}|${secretIsBase64}`;

  React.useEffect(() => {
    if (secret === "") return;
    let live = true;
    verifyHmac(jwt, secret, secretIsBase64)
      // crypto.subtle is missing on pages not served over HTTPS.
      .catch((): VerifyResult => "unsupported")
      .then((result) => {
        if (live) setChecked({ key, result });
      });
    return () => {
      live = false;
    };
  }, [jwt, secret, secretIsBase64, key]);

  const result = secret !== "" && checked?.key === key ? checked.result : null;
  const shown = VERIFY_VIEW[result ?? "unchecked"];

  if (!isHmac(jwt.algorithm)) {
    return (
      <Callout>
        {jwt.algorithm === "none"
          ? "This token is unsigned (alg: none). Anyone can write one, so a server must never accept it."
          : `This token is signed with ${jwt.algorithm ?? "an unknown algorithm"}, which is checked against the issuer's public key. This page only checks HMAC signatures (HS256, HS384, HS512). The header and payload are readable either way.`}
      </Callout>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64 space-y-2">
          <label htmlFor="jwt-secret" className="block text-[15px] font-bold">
            Secret, to check the {jwt.algorithm} signature
          </label>
          <Input
            id="jwt-secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Optional"
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
          />
        </div>
        <TogglePill pressed={secretIsBase64} onPressedChange={setSecretIsBase64}>
          Secret is Base64
        </TogglePill>
        {isSample && <PillButton onClick={() => setSecret(SAMPLE_SECRET)}>Sample secret</PillButton>}
      </div>
      <p role="status" className={cn("flex flex-wrap items-center gap-2 text-[15px] font-bold", !shown.badge && "text-muted-foreground")}>
        <shown.icon className="size-5 shrink-0" strokeWidth={2.5} />
        {shown.badge && (
          <span className={cn("rounded-full border-2 border-foreground px-2.5 py-0.5", shown.tone)}>{shown.badge}</span>
        )}
        <span className={cn(shown.badge && "font-semibold text-muted-foreground")}>{shown.text}</span>
      </p>
    </div>
  );
}

export function JwtDecoder() {
  const [token, setToken] = React.useState(SAMPLE_TOKEN);
  const result = React.useMemo(() => decodeJwt(token), [token]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="jwt-token" className="text-[15px] font-bold">
              Encoded token
            </label>
            <span className="text-xs font-semibold text-muted-foreground">Stays in your browser</span>
          </div>
          <CodeTextarea
            id="jwt-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste a JWT: eyJhbGciOi…"
            className="h-32 break-all"
          />
          <div className="flex flex-wrap items-center gap-2">
            <PillButton onClick={() => setToken(SAMPLE_TOKEN)}>
              <Sparkles className="size-4" strokeWidth={2.5} />
              Sample
            </PillButton>
            <PillButton onClick={() => setToken("")} disabled={token === ""}>
              <Eraser className="size-4" strokeWidth={2.5} />
              Clear
            </PillButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5">
          {!result.ok ? (
            token.trim() === "" ? (
              <p className="rounded-2xl border-[2.5px] border-dashed border-foreground/30 px-4 py-10 text-center font-semibold text-muted-foreground">
                Paste a token above and its header, payload and expiry show up here.
              </p>
            ) : (
              <div role="alert">
                <Callout tone="warn">{result.error}</Callout>
              </div>
            )
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <StatusSticker jwt={result.value} />
                <p className="max-w-xl min-w-0 flex-1 basis-72 font-mono text-xs leading-5 break-all" aria-label="The three parts of the token">
                  <span className={cn("rounded-[3px]", PART_STYLE.header)}>{result.value.parts.header}</span>.
                  <span className={cn("rounded-[3px]", PART_STYLE.payload)}>{result.value.parts.payload}</span>.
                  <span className={cn("rounded-[3px]", PART_STYLE.signature)}>{result.value.parts.signature}</span>
                </p>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <JsonPanel title="Header" tone={PART_STYLE.header} data={result.value.header} names={HEADER_NAMES} />
                  <section className="overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-card">
                    <div className={cn("border-b-[2.5px] border-foreground px-4 py-2.5", PART_STYLE.signature)}>
                      <h3 className="font-heading text-lg font-extrabold">Signature</h3>
                    </div>
                    <div className="px-4 py-4">
                      <SignatureCheck jwt={result.value} isSample={token === SAMPLE_TOKEN} />
                    </div>
                  </section>
                </div>
                <JsonPanel title="Payload" tone={PART_STYLE.payload} data={result.value.payload} names={CLAIM_NAMES} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
