import Link from "next/link";
import { categories } from "@/lib/units/data";
import { pairPath, pairs, type UnitPair } from "@/lib/units/pairs";

/** Chips linking to the per-conversion landing pages, grouped by category. */
export function UnitPairLinks({ exclude }: { exclude?: string } = {}) {
  const grouped = categories
    .map((category) => ({
      category,
      pairs: pairs.filter((p) => p.category === category.id && p.slug !== exclude),
    }))
    .filter((g) => g.pairs.length > 0);

  return (
    <section aria-labelledby="unit-guides" className="mx-auto mt-10 max-w-4xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="unit-guides" className="text-xl font-extrabold">
          Conversion guides
        </h2>
        <p className="text-sm font-semibold text-muted-foreground">Formula, quick table and worked examples for the common ones.</p>
      </div>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {grouped.map(({ category, pairs: group }) => (
          <div key={category.id} className="space-y-2">
            <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">{category.name}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.map((pair: UnitPair) => (
                <li key={pair.slug}>
                  <Link
                    href={pairPath(pair)}
                    className="inline-flex h-9 items-center rounded-full border-[2.5px] border-foreground bg-card px-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    {pair.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
