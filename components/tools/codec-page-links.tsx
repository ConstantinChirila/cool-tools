import Link from "next/link";
import { codecPagePath, codecPages } from "@/lib/encoding-pages";

/** Chips linking to the per-codec landing pages. */
export function CodecPageLinks({ exclude }: { exclude?: string } = {}) {
  return (
    <section aria-labelledby="codec-guides" className="mx-auto mt-10 max-w-3xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="codec-guides" className="text-xl font-extrabold">
          Encoding guides
        </h2>
        <p className="text-sm font-semibold text-muted-foreground">How each one works, with worked examples.</p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {codecPages
          .filter((page) => page.slug !== exclude)
          .map((page) => (
            <li key={page.slug}>
              <Link
                href={codecPagePath(page)}
                className="inline-flex h-9 items-center rounded-full border-[2.5px] border-foreground bg-card px-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
              >
                {page.title}
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
