import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/** Metadata for a plain prose page (terms, privacy): title, description, canonical. */
export function legalMetadata(path: string, title: string, description: string): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `${title} · ${SITE_NAME}`, description, siteName: SITE_NAME, locale: "en_GB" },
    twitter: { card: "summary", title: `${title} · ${SITE_NAME}`, description },
  };
}

// Full class names so Tailwind can see them.
const TINT = {
  yellow: "bg-yellow",
  pink: "bg-pink",
  mint: "bg-mint",
  sky: "bg-sky",
  lilac: "bg-lilac",
} as const;

/**
 * Shell for the legal pages: a sticker title, a one-line gist, the date it
 * last changed, then plain prose. Same vocabulary as the tool guides.
 */
export function LegalPage({
  title,
  tint,
  gist,
  updated,
  children,
}: {
  title: string;
  tint: keyof typeof TINT;
  gist: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
      <header className="flex flex-col items-center gap-4 pt-10 pb-10 text-center">
        <h1
          className={`sticker tilt-2 inline-block rounded-2xl ${TINT[tint]} px-5 py-1.5 font-heading text-3xl font-black sm:text-5xl`}
        >
          {title}
        </h1>
        <p className="max-w-xl text-balance text-lg font-semibold">{gist}</p>
        <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Last updated {updated}
        </p>
      </header>
      <div className="space-y-10 font-semibold leading-relaxed text-foreground/85 sm:text-lg [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:sm:text-3xl [&_section]:space-y-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:marker:text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:no-underline [&_strong]:text-foreground">
        {children}
      </div>
      <p className="mt-14 text-center">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold"
        >
          Back to all tools
        </Link>
      </p>
    </div>
  );
}
