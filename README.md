# Cool Tools

A growing library of fast, beautiful, dark-themed online tools and calculators. Built with Next.js (App Router), Tailwind CSS v4, and shadcn/ui. Deployed on Vercel.

## Current tools

- **Mortgage Calculator**: monthly repayment, total interest, amortization chart and yearly table
- **Compound Interest Calculator**: growth projection with contributions, compounding frequency, chart and yearly table
- **Percentage Calculator**: % of a number, what %, % change, increase/decrease

All financial tools default to GBP with a switchable currency (persisted in localStorage and shared across tools).

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
   - `components/calc/stat.tsx`: `Stat` and `HeroStat` result displays
   - `components/calc/currency-select.tsx` + `hooks/use-currency.ts`: shared currency choice
   - `components/calc/mobile-result-bar.tsx`: sticky bottom result summary on mobile
   - `components/charts/growth-chart.tsx`: line/area chart with crosshair tooltip
   - `components/charts/split-bar.tsx`: part-to-whole stacked bar with legend
3. **Create the route** at `app/tools/<slug>/page.tsx`: pull the tool from the registry, export `metadata`, and wrap the component in `ToolPageShell` (see any existing tool page, they are all ~20 lines).

Pure calculation logic lives in `lib/` (see `lib/finance.ts`) so it stays testable and separate from the UI.

## Design system notes

- Dark-only theme defined in `app/globals.css` (OKLCH tokens; the `dark` class is pinned on `<html>`)
- Chart colors (`--chart-1..5`) are validated for colorblind separation and 3:1 contrast against the card surface
- Utilities: `card-specular` (1px gradient top border), `card-glow` (top radial sheen), `hero-grid` (dot grid), `glass` (frosted bars), `text-numeric` (tabular figures)
