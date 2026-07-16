import { ToolsGrid } from "@/components/tools-grid";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <div className="relative">
      <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-105" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-105"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, oklch(0.68 0.17 285 / 7%), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="py-16 text-center sm:py-24">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {tools.length} tools and growing
          </p>
          <h1 className="mx-auto max-w-2xl text-balance bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Sharp little tools for everyday questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
            Calculators and utilities that are fast, free, and beautiful.
            No ads, no sign-up, instant answers.
          </p>
        </section>

        <section className="pb-20">
          <ToolsGrid />
        </section>
      </div>
    </div>
  );
}
