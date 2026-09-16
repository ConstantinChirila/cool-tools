import Link from "next/link";
import { categories, tools } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t-[2.5px] border-foreground bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <nav aria-label="All tools" className="grid gap-8 sm:grid-cols-3">
          {categories.map((category) => (
            <div key={category}>
              <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {category}
              </p>
              <ul className="space-y-2 text-sm font-bold">
                {tools
                  .filter((t) => t.category === category)
                  .map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tools/${t.slug}`} className="hover:underline">
                        {t.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-10 flex flex-col gap-2 border-t border-foreground/15 pt-6 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
          <p>Bits &amp; Bobs</p>
          <p className="text-muted-foreground">
            Free, fast, no sign-up. Made in the UK by{" "}
            <a
              href="https://constantinchirila.com"
              rel="author"
              className="text-foreground underline underline-offset-2 hover:no-underline"
            >
              Constantin Chirila
            </a>
            . Figures are estimates, not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
