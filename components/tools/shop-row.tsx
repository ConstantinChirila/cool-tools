import type * as React from "react";
import { price, type Money } from "@/components/tools/garden-format";

/** One line of a shopping list: what it is, what to buy and what it costs. */
export function ShopRow({
  icon,
  title,
  detail,
  buy,
  buyDetail,
  cost,
  money,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  buy: string;
  buyDetail: string;
  cost: number | null;
  money: Money;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border-[2.5px] border-foreground bg-card px-3 py-2.5">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold">{title}</p>
        <p className="font-mono text-xs font-bold text-muted-foreground">{detail}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold">
          {buy}
          <span className="font-heading text-lg font-extrabold text-numeric">
            {" · "}
            {cost === null ? <span className="text-sm text-muted-foreground">No price</span> : price(cost, money)}
          </span>
        </p>
        <p className="font-mono text-xs font-bold text-muted-foreground">{buyDetail}</p>
      </div>
    </li>
  );
}
