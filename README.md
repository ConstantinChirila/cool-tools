# Bits & Bobs

Odd little tools that just work. A growing library of free online calculators built with Next.js (App Router), Tailwind CSS v4, and shadcn/ui. Deployed on Vercel.

## Current tools

- **UK Salary Calculator**: take-home pay for 2025/26 and 2026/27 with Scottish rates, tax codes, pension types, student loan plans, bonus, overtime, benefits, salary sacrifice, allowances and a salary curve (engine in `lib/uk-tax.ts`)
- **Car Finance Calculator**: PCP, hire purchase, personal loan and lease (PCH) compared on one car, by total paid or real cost after the car's value at the end (engine in `lib/car-finance.ts`; APRs are annual effective rates; car value and GMFV default to a 20%-a-year rule of thumb until edited; dealer deposit contributions cut HP/PCP borrowing only; miles over the allowance come off an owned car's value at the excess rate)
- **Stamp Duty Calculator**: SDLT (England & NI), LBTT (Scotland) and LTT (Wales) for movers, first-time buyers and additional properties, with the SDLT non-resident surcharge, a band-by-band table, every buyer type side by side, a tax-by-price chart, a "negotiate to the band edge" nudge and the total cash needed to buy (engine in `lib/stamp-duty.ts`; rates as data in `RULES`, tests use the official gov.uk / revenue.scot / gov.wales worked examples)
- **Mortgage Calculator**: monthly repayment, total interest, amortization chart and yearly table, with a repayment vs interest-only toggle
- **Mortgage Overpayment Calculator**: interest and time saved by overpaying monthly or with a lump sum, with a with/without overpayment comparison chart and yearly table
- **Inflation Calculator**: what money from one year is worth in another (ONS CPI from 1988, long-run RPI from 1800, annual averages; the unfinished current year uses its latest month), whether pay has kept up with prices, and future prices at a steady rate (engine in `lib/inflation.ts`; data in the generated `lib/inflation-data.ts`, refreshed with `pnpm data:inflation`)
- **Compound Interest Calculator**: growth projection with contributions, compounding frequency, chart and yearly table
- **Percentage Calculator**: % of a number, what %, % change, increase/decrease
- **TV Viewing Distance Calculator**: best seat for a TV size and best size for a seat, from SMPTE 30° / THX 40° viewing angles, with a draggable top-down floor plan (sofa sets the distance, TV ends set the size), viewing zones striped on the floor, a size guide table and when 4K/8K detail is visible at 20/20 acuity (engine in `lib/tv-distance.ts`)
- **Garden Materials Calculator**: topsoil, compost, mulch, bark, gravel and sand in one tool (material tabs), for several rectangles, circles or known areas with cut-outs; depth set by job presets or by dragging the layer in a side-view cross-section with a brick for scale; m³, litres, weight and barrow loads; and the cheapest of bags only, bulk bags only, or bulk bags topped up with bags, including delivery. Litre bags for soils and bark, kg bags for aggregates via density. Settings are remembered per material and mirrored into the URL as `<material>-<setting>` (engine and material data in `lib/garden-materials.ts`, drawings in `components/tools/garden-visuals.tsx`)
- **Countdown Calculator**: live days/hours/minutes/seconds to any date and time, with calendar breakdown, weeks, sleeps, weekends and working days (engine in `lib/countdown.ts`)
- **Text Diff Checker**: line-by-line comparison of two texts with word-level highlights, side by side or inline, ignore case/whitespace, folding of unchanged runs and copy as unified patch (engine in `lib/text-diff.ts`, built on jsdiff; `hooks/use-text-diff.ts` runs small diffs during render and sends anything over 20,000 characters to the `lib/text-diff.worker.ts` web worker). The texts are deliberately kept out of the URL: only the view options are shareable
- **Encoder & Decoder**: Base64, URL percent-encoding, HTML entities, hex and Unicode escapes in one two-box tool (engine in `lib/encoding.ts`, HTML entities via the `entities` package). Each codec also has a static landing page at `/encoder-decoder/<slug>` driven by `lib/encoding-pages.ts` (title, examples run through the engine at build time, sections, FAQs): add a page there and the route, sitemap and guide chips pick it up
- **JWT Decoder**: header, payload and claims with time claims as dates, expiry status and HS256/384/512 signature check via WebCrypto (engine in `lib/jwt.ts`). No signature verification for RS/ES/PS/EdDSA

All financial tools default to GBP with a switchable currency (persisted in localStorage and shared across tools).

The last four tools opened are pinned as a "Recent" row under the homepage search and as a "Recent" group in the ⌘K palette (localStorage key `bitsbobs:recent`, managed by `hooks/use-recent-tools.ts`; `ToolPageShell` records the visit, so every tool page gets it automatically).

Every tool mirrors its inputs into the query string via `hooks/use-url-state.ts`: on mount, recognised query params are applied to state, and non-default values are written back into the URL with `replaceState` as you edit. The "Share link" button in `ToolPageShell` (`components/share-link.tsx`) just copies the current URL, so any set of inputs is a shareable link. New tools should call `useUrlState` with one `urlField(value, setter, default, allowed?)` per input, right after the `useState` declarations.

## Development

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm lint     # eslint
```

## Keeping figures current

Tax rates, stamp duty bands, inflation data and market-rate defaults go stale. `scripts/data-reviews.json` lists each group with its files, official sources and a `due` date (set to the next Budget, tax year or data release, and never more than a year after the last check). A SessionStart hook in `.claude/settings.json` runs `scripts/check-data-reviews.mjs --hook`, so Claude Code flags anything due at the start of a session.

```bash
pnpm data:reviews                          # list every group and when it is due
pnpm data:inflation                        # refetch ONS CPI/RPI into lib/inflation-data.ts
pnpm data:reviewed <id> <next-due>         # after checking: stamp today and set the next due date
```

When a tool gains figures that can change by law or by market, add or extend an entry there.

## Adding a new tool

1. **Register it** in `lib/tools.ts`: add an entry with `slug`, `name`, `description`, `category`, a lucide `icon`, search `keywords`, and a `tint` color. New categories are added to the `ToolCategory` type and `categories` array in the same file. The homepage grid, search, and the ⌘K command palette all read from this registry, so this step alone makes the tool discoverable.
2. **Build the UI** as a client component in `components/tools/<slug>.tsx`. Reusable pieces:
   - `components/calc/slider-field.tsx`: paired slider + editable numeric input
   - `components/calc/number-field.tsx`: labelled numeric input without a slider, for typed amounts
   - `components/calc/segmented.tsx`: compact single-choice pill control (2-6 short options)
   - `components/calc/switch-field.tsx`: labelled toggle row with a hint
   - `components/calc/pill-button.tsx`: `PillButton` and `TogglePill` for toolbars (swap, clear, copy, on/off options)
   - `components/calc/code-textarea.tsx`: monospace paste box for text, code and tokens
   - `hooks/use-copy.ts`: copy to clipboard with `idle` / `copied` / `failed` button state
   - `hooks/use-now.ts`: shared once-a-second clock, `null` before hydration
   - `components/calc/stat.tsx`: `Stat` and `HeroStat` result displays
   - `components/calc/currency-select.tsx` + `hooks/use-currency.ts`: shared currency choice
   - `components/calc/mobile-result-bar.tsx`: sticky bottom result summary on mobile
   - `components/charts/growth-chart.tsx`: line/area chart with crosshair tooltip
   - `components/charts/split-bar.tsx`: part-to-whole stacked bar with legend
3. **Write the guide** in `content/<slug>.ts`: a `ToolContent` object (intro, sections, FAQs; type in `lib/tool-content.ts`). It renders under the calculator and feeds the FAQ structured data, so make it genuinely useful and keep the numbers verified against the engine.
4. **Create the route** at `app/<slug>/page.tsx` plus `opengraph-image.tsx`: copy any existing tool folder and change the slug. `toolMetadata(tool)` builds title, description, canonical and social tags from the registry's `seo` field; `ToolPageShell` adds breadcrumbs, JSON-LD, the guide and related tools.

Static pages under a tool (unit conversion pairs, codec pages) render through the same `ToolPageShell` with its `subPage` prop, and take their metadata and structured data from `subPageMetadata` / `subPageJsonLd` in `lib/seo.ts`.

Engines that can fail return the `Result<T>` union from `lib/result.ts` (`ok`, then `value` or `error`). The React Compiler is on (`reactCompiler: true` in `next.config.ts`), so components do not need hand-placed `useMemo`; reach for `React.memo` only to stop a large subtree re-rendering from a parent that changes on every keystroke.

Pure calculation logic lives in `lib/` (see `lib/finance.ts`) so it stays testable and separate from the UI. Engine tests sit beside the code as `lib/<name>.test.ts` and run with `pnpm test` (Vitest, Node environment).

## SEO

- Site URL is `https://bitsnbobs.tools` (`lib/site.ts`), overridable with `NEXT_PUBLIC_SITE_URL` for previews; it drives canonicals, Open Graph URLs, the sitemap and structured data.
- `app/sitemap.ts` and `app/robots.ts` are generated from the registry; `updated` on each tool feeds `lastmod`.
- Social cards are rendered at build time by `lib/og.tsx` (one `opengraph-image.tsx` per route).
- Structured data: `WebApplication` + `BreadcrumbList` + `FAQPage` per tool, `WebSite` + `Organization` + `ItemList` on the homepage (`lib/seo.ts`). Validate with https://search.google.com/test/rich-results after deploying.
- Analytics: Cloudflare Web Analytics beacon in `app/layout.tsx`.
- Unit converter landing pages: `lib/units/pairs.ts` is a curated list of conversions (stone to kg, mpg to L/100km…) that each get a static page at `/unit-converter/<slug>` via `app/unit-converter/[pair]/page.tsx`, with their own metadata, quick table, FAQ structured data and sitemap entries. Add a pair there; nothing else needs registering.

## Design system notes

"Sticker sheet": warm paper background, ink outlines, flat candy fills, hard offset shadows. Light only.

- Tokens live in `app/globals.css` (OKLCH). Fonts: Gabarito (headings), Nunito (body), Space Mono (numbers and tags), loaded via `next/font` in `app/layout.tsx`.
- Sticker palette as Tailwind colours: `bg-yellow`, `bg-pink`, `bg-mint`, `bg-sky`, `bg-lilac`. Each tool picks one as its `tint` in `lib/tools.ts`.
- Utilities: `sticker` / `sticker-lg` / `sticker-sm` (ink border + hard shadow), `outline-ink` (border only), `dot-grid` (page background), `tilt-1` to `tilt-6` (slight rotations for tiles), `glass` (sticky bars), `text-numeric` (tabular figures).
- shadcn primitives (card, input, select, tabs, badge, slider, switch, dialog) are restyled in place to the sticker look, so tools get it for free.
- Chart colours (`--chart-1..5`) are deeper versions of the sticker fills so lines clear 3:1 on white.
- Logo: `components/logo.tsx` (`LogoMark`, `Wordmark`); favicon is `app/icon.svg`.
