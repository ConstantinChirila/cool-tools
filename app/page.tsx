import { ToolsGrid } from "@/components/tools-grid";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
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

      <section className="pb-24">
        <ToolsGrid />
      </section>
    </div>
  );
}
