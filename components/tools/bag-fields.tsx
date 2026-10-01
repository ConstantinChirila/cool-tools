"use client";

import { NumberField } from "@/components/calc/number-field";
import { SizePicker } from "@/components/calc/size-picker";
import { BagIcon, type Texture } from "@/components/tools/garden-visuals";
import { MONEY_RANGE } from "@/hooks/use-url-state";
import { LIMITS, type Buying } from "@/lib/garden-materials";

/** Bag and bulk bag sizes and prices, and bulk delivery: how a loose material is bought. */
export function BagFields({
  id,
  unit,
  sizes,
  s,
  update,
  material,
  currency,
}: {
  id: string;
  unit: "L" | "kg";
  sizes: { bag: readonly number[]; bulk: readonly number[] };
  s: Buying;
  update: (key: keyof Buying, v: number) => void;
  material: Texture;
  currency: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-4">
        <SizePicker
          id={`${id}-bag`}
          label="Bag size"
          unit={unit}
          sizes={sizes.bag}
          value={s.bag}
          onChange={(v) => update("bag", v)}
          min={LIMITS.size.min}
          max={LIMITS.size.max}
          icon={<BagIcon kind="bag" material={material} className="h-7 w-6" />}
        />
        <NumberField id={`${id}-bag-price`} label="Price per bag" value={s.bagPrice} onChange={(v) => update("bagPrice", v)} max={MONEY_RANGE.max} prefix={currency} decimals={2} />
      </div>
      <div className="space-y-4">
        <SizePicker
          id={`${id}-bulk`}
          label="Bulk bag size"
          unit={unit}
          sizes={sizes.bulk}
          value={s.bulk}
          onChange={(v) => update("bulk", v)}
          min={LIMITS.size.min}
          max={LIMITS.size.max}
          icon={<BagIcon kind="bulk" material={material} className="h-7 w-6" />}
        />
        <NumberField id={`${id}-bulk-price`} label="Price per bulk bag" value={s.bulkPrice} onChange={(v) => update("bulkPrice", v)} max={MONEY_RANGE.max} prefix={currency} decimals={2} />
      </div>
      <NumberField
        id={`${id}-delivery`}
        label="Bulk bag delivery"
        value={s.delivery}
        onChange={(v) => update("delivery", v)}
        max={MONEY_RANGE.max}
        prefix={currency}
        decimals={2}
        hint="Once per order with a bulk bag. Blank if it's in the price."
      />
    </div>
  );
}
