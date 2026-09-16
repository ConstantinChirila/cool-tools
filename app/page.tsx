import { JsonLd } from "@/components/json-ld";
import { ToolsGrid } from "@/components/tools-grid";
import { siteJsonLd } from "@/lib/seo";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <JsonLd data={siteJsonLd(tools)} />
      <section className="flex flex-col items-center gap-4 pt-6 pb-6 text-center sm:pt-10 sm:pb-8">
        <h1 className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 font-heading font-black leading-none tracking-tight">
          <span className="sticker tilt-1 inline-block rounded-2xl bg-yellow px-4 py-1.5 text-3xl sm:px-5 sm:text-5xl lg:text-[60px]">
            Bits
          </span>
          <span className="inline-block rotate-6 text-2xl sm:text-3xl lg:text-5xl">&amp;</span>
          <span className="sticker tilt-2 inline-block rounded-2xl bg-pink px-4 py-1.5 text-3xl sm:px-5 sm:text-5xl lg:text-[60px]">
            Bobs
          </span>
        </h1>
        <p className="max-w-xl text-balance text-base font-semibold sm:text-lg">
          Odd little tools that just work. Free, quick, and nobody asks for your email.
        </p>
      </section>

      <section className="pb-16" aria-label="Tools">
        <ToolsGrid />
      </section>

      <section className="mx-auto max-w-3xl space-y-4 pb-24 font-semibold leading-relaxed text-foreground/85">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Free online calculators, built for the UK
        </h2>
        <p>
          Bits &amp; Bobs is a small, growing collection of calculators for the questions that come up
          in real life: what your salary is worth after tax, what a mortgage costs each month and how
          much overpaying saves, how savings grow with compound interest, and quick percentage maths.
          Every tool runs in your browser, works on your phone, and gives you a link you can share
          with the numbers already filled in.
        </p>
        <p>
          The money tools use current HMRC rates and standard lender formulas, and each page explains
          how the calculation works so you can check it yourself. They are estimates for planning,
          not financial advice.
        </p>
      </section>
    </div>
  );
}
