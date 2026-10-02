import Link from "next/link";
import { InstallApp } from "@/components/install-app";
import { toolPath, tools, type ToolCategory } from "@/lib/tools";

// Footer columns: the long lists get a column each, the short categories
// pair up. A category missing from this list lands in the last column.
const PLACED: ToolCategory[][] = [["Finance"], ["Garden"], ["Everyday", "Maths"], ["Developer", "Text", "Sport"]];
const COLUMNS: ToolCategory[][] = (() => {
  const missing = [...new Set(tools.map((t) => t.category))].filter((c) => !PLACED.flat().includes(c));
  const last = PLACED.at(-1) ?? [];
  return [...PLACED.slice(0, -1), [...last, ...missing]];
})();

function CategoryList({ category }: { category: ToolCategory }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {category}
      </p>
      <ul className="space-y-2 text-sm font-bold">
        {tools
          .filter((t) => t.category === category)
          .map((t) => (
            <li key={t.slug}>
              <Link href={toolPath(t)} className="hover:underline">
                {t.name}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-[2.5px] border-foreground bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <nav aria-label="All tools" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.join()} className="space-y-8">
              {column.map((category) => (
                <CategoryList key={category} category={category} />
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-10 flex flex-col gap-2 border-t border-foreground/15 pt-6 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <p>Bits &amp; Bobs</p>
            <InstallApp />
            <Link href="/terms" className="text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:underline">
              Privacy
            </Link>
          </div>
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
