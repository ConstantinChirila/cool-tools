"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/logo";
import { openCommandPalette } from "@/components/command-palette";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40">
      <div className="mx-auto flex h-[76px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <LogoMark
            size={42}
            className="-rotate-6 transition-transform duration-200 group-hover:rotate-3"
          />
          <Wordmark className="hidden sm:inline" />
        </Link>

        <nav className="flex items-center gap-2 text-sm font-bold">
          <Link
            href="/"
            className="hidden h-11 items-center rounded-full border-[2.5px] border-foreground bg-card px-4 transition-transform hover:-translate-y-0.5 sm:flex"
          >
            All tools
          </Link>
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search tools"
            className="sticker-sm flex h-11 items-center gap-2 rounded-full bg-yellow px-4 transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Search className="size-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden font-mono text-[11px] sm:inline">⌘K</kbd>
          </button>
        </nav>
      </div>
    </header>
  );
}
