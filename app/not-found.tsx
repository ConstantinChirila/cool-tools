import Link from "next/link";
import { ToolsGrid } from "@/components/tools-grid";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      <section className="flex flex-col items-center gap-4 pt-10 pb-8 text-center">
        <span className="sticker tilt-2 inline-block rounded-2xl bg-pink px-5 py-1.5 font-heading text-5xl font-black">
          404
        </span>
        <h1 className="text-2xl font-extrabold">That bit doesn&apos;t exist</h1>
        <p className="max-w-md font-semibold text-muted-foreground">
          The page you were after has moved or never existed. Here is everything we do have.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold"
        >
          Back to all tools
        </Link>
      </section>
      <ToolsGrid />
    </div>
  );
}
