# Bits & Bobs

Odd little tools that just work. A growing library of free online calculators built with Next.js (App Router), Tailwind CSS v4, and shadcn/ui. Deployed on Vercel.

## Current tools

- **UK Salary Calculator**: take-home pay for 2025/26 and 2026/27 with Scottish rates, tax codes, pension types, student loan plans, bonus, overtime, benefits, salary sacrifice, allowances and a salary curve (engine in `lib/uk-tax.ts`)
- **Mortgage Calculator**: monthly repayment, total interest, amortization chart and yearly table, with a repayment vs interest-only toggle
- **Mortgage Overpayment Calculator**: interest and time saved by overpaying monthly or with a lump sum, with a with/without overpayment comparison chart and yearly table
- **Compound Interest Calculator**: growth projection with contributions, compounding frequency, chart and yearly table
- **Percentage Calculator**: % of a number, what %, % change, increase/decrease
- **Countdown Calculator**: live days/hours/minutes/seconds to any date and time, with calendar breakdown, weeks, sleeps, weekends and working days (engine in `lib/countdown.ts`)

All financial tools default to GBP with a switchable currency (persisted in localStorage and shared across tools).

The last four tools opened are pinned as a "Recent" row under the homepage search and as a "Recent" group in the ⌘K palette (localStorage key `bitsbobs:recent`, managed by `hooks/use-recent-tools.ts`; `ToolPageShell` records the visit, so every tool page gets it automatically).

Every tool mirrors its inputs into the query string via `hooks/use-url-state.ts`: on mount, recognised query params are applied to state, and non-default values are written back into the URL with `replaceState` as you edit. The "Share link" button in `ToolPageShell` (`components/share-link.tsx`) just copies the current URL, so any set of inputs is a shareable link. New tools should call `useUrlState` with one `urlField(value, setter, default, allowed?)` per input, right after the `useState` declarations.

## Development

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm lint     # eslint
```

## Adding a new tool

1. **Register it** in `lib/tools.ts`: add an entry with `slug`, `name`, `description`, `category`, a lucide `icon`, search `keywords`, and a `tint` color. New categories are added to the `ToolCategory` type and `categories` array in the same file. The homepage grid, search, and the ⌘K command palette all read from this registry, so this step alone makes the tool discoverable.
2. **Build the UI** as a client component in `components/tools/<slug>.tsx`. Reusable pieces:
   - `components/calc/slider-field.tsx`: paired slider + editable numeric input
   - `components/calc/number-field.tsx`: labelled numeric input without a slider, for typed amounts
   - `components/calc/segmented.tsx`: compact single-choice pill control (2-6 short options)
   - `components/calc/switch-field.tsx`: labelled toggle row with a hint
   - `components/calc/stat.tsx`: `Stat` and `HeroStat` result displays
   - `components/calc/currency-select.tsx` + `hooks/use-currency.ts`: shared currency choice
   - `components/calc/mobile-result-bar.tsx`: sticky bottom result summary on mobile
   - `components/charts/growth-chart.tsx`: line/area chart with crosshair tooltip
   - `components/charts/split-bar.tsx`: part-to-whole stacked bar with legend
3. **Write the guide** in `content/<slug>.ts`: a `ToolContent` object (intro, sections, FAQs; type in `lib/tool-content.ts`). It renders under the calculator and feeds the FAQ structured data, so make it genuinely useful and keep the numbers verified against the engine.
4. **Create the route** at `app/tools/<slug>/page.tsx` plus `opengraph-image.tsx`: copy any existing tool folder and change the slug. `toolMetadata(tool)` builds title, description, canonical and social tags from the registry's `seo` field; `ToolPageShell` adds breadcrumbs, JSON-LD, the guide and related tools.

Pure calculation logic lives in `lib/` (see `lib/finance.ts`) so it stays testable and separate from the UI.

## SEO

- Site URL comes from `NEXT_PUBLIC_SITE_URL` (fallback in `lib/site.ts`); it drives canonicals, Open Graph URLs, the sitemap and structured data. Set it in Vercel before launch.
- `app/sitemap.ts` and `app/robots.ts` are generated from the registry; `updated` on each tool feeds `lastmod`.
- Social cards are rendered at build time by `lib/og.tsx` (one `opengraph-image.tsx` per route).
- Structured data: `WebApplication` + `BreadcrumbList` + `FAQPage` per tool, `WebSite` + `Organization` + `ItemList` on the homepage (`lib/seo.ts`). Validate with https://search.google.com/test/rich-results after deploying.
- Analytics: Cloudflare Web Analytics beacon in `app/layout.tsx`.
- Unit converter landing pages: `lib/units/pairs.ts` is a curated list of conversions (stone to kg, mpg to L/100km…) that each get a static page at `/tools/unit-converter/<slug>` via `app/tools/unit-converter/[pair]/page.tsx`, with their own metadata, quick table, FAQ structured data and sitemap entries. Add a pair there; nothing else needs registering.

## Design system notes

"Sticker sheet": warm paper background, ink outlines, flat candy fills, hard offset shadows. Light only.

- Tokens live in `app/globals.css` (OKLCH). Fonts: Gabarito (headings), Nunito (body), Space Mono (numbers and tags), loaded via `next/font` in `app/layout.tsx`.
- Sticker palette as Tailwind colours: `bg-yellow`, `bg-pink`, `bg-mint`, `bg-sky`, `bg-lilac`. Each tool picks one as its `tint` in `lib/tools.ts`.
- Utilities: `sticker` / `sticker-lg` / `sticker-sm` (ink border + hard shadow), `outline-ink` (border only), `dot-grid` (page background), `tilt-1` to `tilt-6` (slight rotations for tiles), `glass` (sticky bars), `text-numeric` (tabular figures).
- shadcn primitives (card, input, select, tabs, badge, slider, switch, dialog) are restyled in place to the sticker look, so tools get it for free.
- Chart colours (`--chart-1..5`) are deeper versions of the sticker fills so lines clear 3:1 on white.
- Logo: `components/logo.tsx` (`LogoMark`, `Wordmark`); favicon is `app/icon.svg`.
