"use client";

import { Wallet } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/calc/callout";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat } from "@/components/calc/stat";
import { SwitchField } from "@/components/calc/switch-field";
import { GrowthChart } from "@/components/charts/growth-chart";
import { MONEY_RANGE, useUrlState, urlField, type NumberRange } from "@/hooks/use-url-state";
import { formatGbp as money, formatGbpCompact as axis, formatPercent } from "@/lib/currency";
import {
  BUYERS,
  BUYER_INFO,
  NATIONS,
  RULES,
  calculateStampDuty,
  cashToBuy,
  compareBuyers,
  completion,
  nearestSaving,
  taxCurve,
  type BandLine,
  type Buyer,
  type Nation,
  type Nudge,
  type StampDutyResult,
  type UpfrontCosts,
  upfrontFees,
} from "@/lib/stamp-duty";
import { cn } from "@/lib/utils";

const DEFAULT_PRICE = 300_000;
const DEFAULT_COSTS: UpfrontCosts = {
  deposit: 30_000,
  legal: 1_800,
  survey: 500,
  mortgageFees: 999,
  other: 0,
};

const NATION_OPTIONS = NATIONS.map((value) => ({ value, label: RULES[value].label }));
const BUYER_OPTIONS = BUYERS.map((value) => ({ value, label: BUYER_INFO[value].short }));

const COLORS: Record<Buyer, string> = {
  main: "var(--chart-4)",
  firstTime: "var(--chart-2)",
  additional: "var(--chart-5)",
};

// Divisible by 3 so the chart's tick at each third lands on a sample.
const CHART_STEPS = 240;

const pct = (rate: number) => formatPercent(rate, 1, { trim: true });

/** Half as far again as the price, at least £1m, in steps of £300k so the chart's thirds are round. */
function chartMax(price: number): number {
  return Math.ceil(Math.max(price * 1.5, 1_000_000) / 300_000) * 300_000;
}

export function StampDutyCalculator() {
  const [price, setPrice] = React.useState(DEFAULT_PRICE);
  const [nation, setNation] = React.useState<Nation>("england");
  const [buyer, setBuyer] = React.useState<Buyer>("main");
  const [nonResident, setNonResident] = React.useState(false);
  const [costs, setCosts] = React.useState<UpfrontCosts>(DEFAULT_COSTS);

  const cost = (key: keyof UpfrontCosts, urlKey: string, range: NumberRange = MONEY_RANGE) => ({
    [urlKey]: urlField(costs[key], (v: number) => setCosts((c) => ({ ...c, [key]: v })), DEFAULT_COSTS[key], undefined, range),
  });

  useUrlState({
    price: urlField(price, setPrice, DEFAULT_PRICE, undefined, MONEY_RANGE),
    nation: urlField(nation, (v: string) => setNation(v as Nation), "england", NATIONS),
    buyer: urlField(buyer, (v: string) => setBuyer(v as Buyer), "main", BUYERS),
    nonres: urlField(nonResident, setNonResident, false),
    ...cost("deposit", "deposit"),
    ...cost("legal", "legal"),
    ...cost("survey", "survey"),
    ...cost("mortgageFees", "fees"),
    ...cost("other", "other"),
  });

  const input = { price, nation, buyer, nonResident };
  const result = calculateStampDuty(input);
  const rules = RULES[nation];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Your purchase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderField
              id="sd-price"
              label="Property price"
              value={price}
              onChange={setPrice}
              min={0}
              max={2_000_000}
              inputMax={MONEY_RANGE.max}
              step={1_000}
              sliderStep={5_000}
              prefix="£"
              grouped
              decimals={0}
            />
            <div className="space-y-2.5">
              <p className="text-[15px] font-bold">Where is it?</p>
              <Segmented label="Where is it?" size="sm" value={nation} onChange={setNation} options={NATION_OPTIONS} />
            </div>
            <div className="space-y-2.5">
              <p className="text-[15px] font-bold">Buying as</p>
              <Segmented label="Buying as" size="sm" value={buyer} onChange={setBuyer} options={BUYER_OPTIONS} />
              <p className="text-xs font-semibold text-muted-foreground">{buyerHint(buyer, nation)}</p>
            </div>
            {rules.nonResident !== undefined && (
              <SwitchField
                id="sd-nonres"
                label="Buying from outside the UK"
                hint={`Under 183 days in the UK in the year before: ${pct(rules.nonResident)} more on every band`}
                checked={nonResident}
                onCheckedChange={setNonResident}
              />
            )}
            <CostsSection price={price} tax={result.tax} costs={costs} onChange={setCosts} />
          </CardContent>
        </Card>

        <Results result={result} costs={costs} onBuyerChange={setBuyer} />
      </div>
      <BandTable result={result} />
      <PriceChart result={result} />
      <MobileResultBar label={rules.short} value={money(result.tax)} />
    </>
  );
}

function buyerHint(buyer: Buyer, nation: Nation): string {
  if (buyer === "firstTime" && nation === "wales") return "Nobody buying has ever owned a home. Wales has no relief for it, but the 0% band runs to £225,000.";
  if (buyer === "firstTime" && nation === "scotland") return "Nobody buying has ever owned a home. Relief raises the 0% band to £175,000, saving up to £600.";
  if (buyer === "firstTime") return "Nobody buying has ever owned a home. 0% up to £300,000, 5% to £500,000; no relief above that.";
  if (buyer === "additional" && nation === "scotland") return "You'll own another home too: an extra 8% of the whole price (ADS) from £40,000.";
  if (buyer === "additional" && nation === "wales") return "You'll own another home too: the higher rates table applies from £40,000.";
  if (buyer === "additional") return "You'll own another home too: 5% more on every band from £40,000.";
  return "Moving, or buying your only home when you have owned one before.";
}

function CostsSection({
  price,
  tax,
  costs,
  onChange,
}: {
  price: number;
  tax: number;
  costs: UpfrontCosts;
  onChange: React.Dispatch<React.SetStateAction<UpfrontCosts>>;
}) {
  const sections = useSectionState([]);
  const set = (key: keyof UpfrontCosts) => (v: number) => onChange((c) => ({ ...c, [key]: v }));
  const fees = upfrontFees(costs);
  const depositPct = price > 0 ? costs.deposit / price : 0;

  return (
    <Section
      icon={Wallet}
      title="Cash to buy"
      summary={`${money(costs.deposit)} deposit · ${money(fees)} fees · ${money(cashToBuy(tax, costs))} in all`}
      active={false}
      open={sections.isOpen("costs")}
      onToggle={() => sections.toggle("costs")}
    >
      <NumberField
        id="sd-deposit"
        label="Deposit"
        value={costs.deposit}
        onChange={set("deposit")}
        max={MONEY_RANGE.max}
        prefix="£"
        grouped
        decimals={0}
        hint={costs.deposit >= price ? "Cash buyer: no mortgage" : `${formatPercent(depositPct, 1, { trim: true })} of the price`}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="sd-legal"
          label="Legal fees"
          value={costs.legal}
          onChange={set("legal")}
          max={MONEY_RANGE.max}
          prefix="£"
          grouped
          decimals={0}
          hint="Conveyancing, searches, registration"
        />
        <NumberField
          id="sd-survey"
          label="Survey"
          value={costs.survey}
          onChange={set("survey")}
          max={MONEY_RANGE.max}
          prefix="£"
          grouped
          decimals={0}
          hint="A mid-level survey"
        />
        <NumberField
          id="sd-fees"
          label="Mortgage fees"
          value={costs.mortgageFees}
          onChange={set("mortgageFees")}
          max={MONEY_RANGE.max}
          prefix="£"
          grouped
          decimals={0}
          hint="Arrangement, broker, valuation"
        />
        <NumberField
          id="sd-other"
          label="Other"
          value={costs.other}
          onChange={set("other")}
          max={MONEY_RANGE.max}
          prefix="£"
          grouped
          decimals={0}
          hint="Removals, furniture, repairs"
        />
      </div>
      <p className="text-xs font-semibold text-muted-foreground">
        Typical figures to start from: swap in your solicitor&apos;s and lender&apos;s quotes. Adding a fee to the
        mortgage instead of paying it up front? Leave it out here.
      </p>
    </Section>
  );
}

function Results({
  result,
  costs,
  onBuyerChange,
}: {
  result: StampDutyResult;
  costs: UpfrontCosts;
  onBuyerChange: (b: Buyer) => void;
}) {
  const { input, tax } = result;
  const rules = RULES[input.nation];
  const byBuyer = compareBuyers(input);
  const nudge = nearestSaving(input);
  const visibleBuyers = BUYERS.filter((b) => b !== "firstTime" || rules.firstTime);
  const { fees, cash, mortgage, ltv } = completion(result, costs);

  return (
    <div className="order-first min-w-0 space-y-6 lg:order-none lg:sticky lg:top-20">
      <Card className="min-w-0 bg-sky">
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label={rules.tax}
            value={money(tax)}
            hint={
              input.price > 0
                ? `${pct(result.effectiveRate)} of the price · each extra £1,000 adds ${money(result.nextThousand)}`
                : undefined
            }
          />

          <div className={cn("grid gap-2.5", visibleBuyers.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {visibleBuyers.map((b) => (
              <BuyerTile
                key={b}
                buyer={b}
                tax={byBuyer[b]}
                current={tax}
                selected={b === input.buyer}
                onSelect={() => onBuyerChange(b)}
              />
            ))}
          </div>

          {nudge && <NudgeCallout nudge={nudge} />}
          {result.relief === "unavailable" && (
            <Callout>Wales has no first-time buyer relief: {rules.short} is the same as for anyone moving home.</Callout>
          )}
          {result.higherRates && <Callout>{replacingNote(input.nation)}</Callout>}
          {input.buyer === "additional" && !result.higherRates && input.price > 0 && (
            <Callout>
              Under {money(rules.additionalMin)}, so the additional-property rates don&apos;t apply.
            </Callout>
          )}
          {result.nonResident && (
            <Callout>
              The {pct(rules.nonResident ?? 0)} non-resident surcharge adds {money(result.nonResidentTax)}. If you then spend 183 days in the UK
              in any 365-day stretch within a year of buying, you can claim it back.
            </Callout>
          )}

          <div className="rounded-2xl border-[2.5px] border-foreground bg-card px-4 py-3.5">
            <p className="flex items-baseline justify-between gap-3 text-[15px] font-bold">
              Cash to buy
              <span className="font-heading text-2xl font-extrabold tracking-tight text-numeric">{money(cash)}</span>
            </p>
            <dl className="mt-2 space-y-1 text-sm font-semibold">
              <CashRow label="Deposit" value={money(costs.deposit)} />
              <CashRow label={rules.short} value={money(tax)} />
              <CashRow label="Fees and other costs" value={money(fees)} />
              <CashRow
                label="Mortgage"
                muted
                value={
                  mortgage > 0
                    ? `${money(mortgage)} (${formatPercent(ltv, 0)} LTV)`
                    : "none, cash purchase"
                }
              />
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function replacingNote(nation: Nation): string {
  if (nation === "scotland") {
    return "Replacing your main home? ADS is refunded if you sell the old one within 36 months, and isn't due at all if you sold it in the 36 months before.";
  }
  const tax = nation === "wales" ? "the higher rates" : "the 5% surcharge";
  return `Replacing your main home? If you sell the old one before completion, ${tax} don't apply. Sell it within three years and you can claim the difference back.`;
}

function BuyerTile({
  buyer,
  tax,
  current,
  selected,
  onSelect,
}: {
  buyer: Buyer;
  tax: number;
  current: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const diff = tax - current;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-2xl border-[2.5px] border-foreground px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "bg-foreground text-background" : "bg-card hover:bg-secondary",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[buyer] }} aria-hidden />
        {BUYER_INFO[buyer].label}
      </span>
      <span className="mt-1 block font-heading text-2xl font-extrabold tracking-tight text-numeric">{money(tax)}</span>
      <span className={cn("block font-mono text-xs font-bold", selected ? "text-background/70" : "text-muted-foreground")}>
        {selected ? "You" : diff === 0 ? "Same" : diff > 0 ? `+${money(diff)}` : `−${money(-diff)}`}
      </span>
    </button>
  );
}

function NudgeCallout({ nudge }: { nudge: Nudge }) {
  const { cut, target, saving } = nudge;
  if (nudge.reason === "firstTimeCap") {
    return (
      <Callout tone="warn">
        First-time buyer relief stops above {money(target)}. Get {money(cut)} off the price and you save{" "}
        {money(saving)} in stamp duty too, {money(cut + saving)} in all.
      </Callout>
    );
  }
  if (nudge.reason === "additionalMin") {
    return (
      <Callout>
        Below {money(target + 1)} the additional-property rates don&apos;t apply: {money(cut)} off the price saves{" "}
        {money(saving)} in tax.
      </Callout>
    );
  }
  return (
    <Callout>
      You&apos;re {money(cut)} into a higher band. Negotiate the price down to {money(target)} and you pay{" "}
      {money(saving)} less tax as well.
    </Callout>
  );
}

function CashRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", muted && "border-t border-foreground/15 pt-1.5")}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-bold text-numeric">{value}</dd>
    </div>
  );
}

function bandLabel(line: BandLine): string {
  if (line.from === 0) return `Up to ${money(line.to)}`;
  if (!Number.isFinite(line.to)) return `Over ${money(line.from)}`;
  return `${money(line.from + 1)} to ${money(line.to)}`;
}

function BandTable({ result }: { result: StampDutyResult }) {
  const { input, lines, flatSupplement } = result;
  const rules = RULES[input.nation];
  const hasSurcharge = lines.some((l) => l.surcharge > 0);
  const title =
    result.relief === "applied"
      ? "First-time buyer rates"
      : result.higherRates && rules.additional.kind === "table"
        ? "Higher rates"
        : "Standard rates";

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Band by band</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground">
          <table className="w-full min-w-[480px] font-mono text-sm font-bold text-numeric">
            <thead>
              <tr className="border-b border-foreground/15 text-left font-sans text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-bold">{title}</th>
                <th className="px-4 py-2.5 text-right font-bold">Rate</th>
                <th className="px-4 py-2.5 text-right font-bold">Price in band</th>
                <th className="px-4 py-2.5 text-right font-bold">Tax</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={line.from}
                  className={cn("border-b border-foreground/10", line.taxable === 0 && "text-muted-foreground")}
                >
                  <td className="px-4 py-2.5 font-sans font-semibold">{bandLabel(line)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {hasSurcharge ? `${pct(line.rate)} + ${pct(line.surcharge)}` : pct(line.rate)}
                  </td>
                  <td className="px-4 py-2.5 text-right">{money(line.taxable)}</td>
                  <td className="px-4 py-2.5 text-right">{money(line.tax, line.tax % 1 ? 2 : 0)}</td>
                </tr>
              ))}
              {flatSupplement && (
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2.5 font-sans font-semibold">Additional Dwelling Supplement</td>
                  <td className="px-4 py-2.5 text-right">{pct(flatSupplement.rate)}</td>
                  <td className="px-4 py-2.5 text-right">{money(input.price)}</td>
                  <td className="px-4 py-2.5 text-right">{money(flatSupplement.tax)}</td>
                </tr>
              )}
              <tr className="bg-sky">
                <td colSpan={3} className="px-4 py-2.5 font-sans">
                  Total {rules.short}
                </td>
                <td className="px-4 py-2.5 text-right">{money(result.tax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          Each rate only applies to the slice of the price inside its band, like income tax.
          {hasSurcharge && " The second rate is the surcharge added to every band."}
          {flatSupplement && " ADS is charged on the whole price on top of LBTT."} Rounded down to the pound. Rates
          for {rules.label} checked on {input.nation === "england" ? "gov.uk" : input.nation === "scotland" ? "revenue.scot" : "gov.wales"}{" "}
          in September 2026.
        </p>
      </CardContent>
    </Card>
  );
}

function PriceChart({ result }: { result: StampDutyResult }) {
  const { input } = result;
  const rules = RULES[input.nation];
  const maxPrice = chartMax(input.price);
  const curve = taxCurve({ nation: input.nation, nonResident: input.nonResident }, maxPrice, CHART_STEPS);
  const buyers = BUYERS.filter((b) => b !== "firstTime" || rules.firstTime);

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{rules.short} by price</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <GrowthChart
          series={buyers.map((b) => ({ name: BUYER_INFO[b].label, color: COLORS[b], values: curve[b] }))}
          xLabel={(i) => `${money(curve.prices[i] ?? 0)} property`}
          xTick={(i) => axis(curve.prices[i] ?? 0)}
          formatValue={(v) => money(v)}
          formatAxis={axis}
          marker={{ index: (input.price / maxPrice) * CHART_STEPS, label: "Your price" }}
        />
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          {input.nation === "england"
            ? "The first-time buyer line jumps at £500,000, where the relief is lost on the whole price."
            : input.nation === "scotland"
              ? "First-time buyers save the same £600 at every price above £175,000. ADS adds 8% of the price, so its line climbs fastest."
              : "Wales has no first-time buyer relief. The higher rates start at 5% from the first pound."}
        </p>
      </CardContent>
    </Card>
  );
}
