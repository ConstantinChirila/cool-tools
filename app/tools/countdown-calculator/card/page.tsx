import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { CountdownCard } from "@/components/tools/countdown-card";
import { DEFAULT_TIME, NAME_MAX, isValidDateString, isValidTimeString } from "@/lib/countdown";
import { subPageMetadata, toolPath } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("countdown-calculator");

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface CardParams {
  to: string;
  at: string;
  name: string;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Validates the query the same way the tool does, so the two pages always agree. */
async function readParams(searchParams: SearchParams): Promise<CardParams> {
  const params = await searchParams;
  const to = first(params.to).slice(0, 10);
  const at = first(params.at).slice(0, 5);
  return {
    to: isValidDateString(to) ? to : "",
    at: isValidTimeString(at) ? at : DEFAULT_TIME,
    name: first(params.name).slice(0, NAME_MAX).trim(),
  };
}

/** "25 December 2026" from "2026-12-25", without touching time zones. */
function describeDate(to: string): string {
  const [y = 0, m = 1, d = 1] = to.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

function editHref({ to, at, name }: CardParams): string {
  const query = new URLSearchParams();
  if (to) query.set("to", to);
  if (at !== DEFAULT_TIME) query.set("at", at);
  if (name) query.set("name", name);
  const search = query.toString();
  return `${toolPath(tool)}${search ? `?${search}` : ""}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { to, at, name } = await readParams(searchParams);
  const when = to ? `${describeDate(to)}${at !== DEFAULT_TIME ? ` at ${at}` : ""}` : "New Year";
  const title = name ? `Countdown to ${name}` : `Countdown to ${when}`;
  const description = name
    ? `${name}: ${when}. Days, hours, minutes and seconds, ticking live, plus the sleeps, weekends and working days to go.`
    : `Days, hours, minutes and seconds until ${when}, ticking live, plus the sleeps, weekends and working days to go.`;
  const base = subPageMetadata(tool, { path: `${toolPath(tool)}/card`, title, crumb: title, description });
  return {
    ...base,
    // Every date and name is a new URL: no canonical, no og:url, and keep the variants out of search results.
    alternates: undefined,
    openGraph: { ...base.openGraph, url: undefined },
    robots: { index: false, follow: true },
  };
}

export default async function CountdownCardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readParams(searchParams);
  const { to, at, name } = params;
  const heading = name || (to ? `Countdown to ${describeDate(to)}` : "Countdown to New Year");
  const subheading = name
    ? `${to ? describeDate(to) : "New Year"}${at !== DEFAULT_TIME ? ` at ${at}` : ""}, counting live.`
    : "Days, hours, minutes and seconds, counting live.";

  return (
    <ToolPageShell
      tool={tool}
      subPage={{ title: heading, lead: subheading, back: { href: "/", label: "All tools" }, truncateTitle: true }}
    >
      <CountdownCard to={to} at={at} name={name} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">
          Made with the{" "}
          <Link href={toolPath(tool)} className="font-bold text-foreground underline underline-offset-4">
            {tool.name}
          </Link>
          . Change the date, time or name and share your own.
        </p>
        <Link
          href={editHref(params)}
          className="sticker-sm inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-yellow px-5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Pencil className="size-4" strokeWidth={2.5} />
          Edit this card
        </Link>
      </div>
    </ToolPageShell>
  );
}
