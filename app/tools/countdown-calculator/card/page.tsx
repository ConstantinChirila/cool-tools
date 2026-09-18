import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { ShareLink } from "@/components/share-link";
import { CountdownCard } from "@/components/tools/countdown-card";
import { DEFAULT_TIME, NAME_MAX, isValidDateString, isValidTimeString } from "@/lib/countdown";
import { toolPath } from "@/lib/seo";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
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
  // A segment's opengraph-image does not cascade to child routes, so point at the tool's.
  const image = { url: absoluteUrl(`${toolPath(tool)}/opengraph-image`), width: 1200, height: 630, alt: `${tool.name} on ${SITE_NAME}` };
  return {
    title,
    description,
    // Every date and name is a new URL, so keep the endless variants out of search results.
    robots: { index: false, follow: true },
    openGraph: { type: "website", title: `${title} · ${SITE_NAME}`, description, siteName: SITE_NAME, locale: "en_GB", images: [image] },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [image.url] },
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
    <article className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3 py-6">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          All tools
        </Link>
        <ShareLink />
      </nav>

      <header className="mb-8 flex items-center gap-5">
        <span
          className="sticker flex size-16 shrink-0 -rotate-6 items-center justify-center rounded-[22px] sm:size-[72px]"
          style={{ background: tool.tint }}
          aria-hidden="true"
        >
          <tool.icon className="size-8" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-black tracking-tight sm:text-5xl">{heading}</h1>
          <p className="mt-1.5 max-w-2xl font-semibold text-muted-foreground sm:text-lg">{subheading}</p>
        </div>
      </header>

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
    </article>
  );
}
