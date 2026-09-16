"use client";

import * as React from "react";
import { MoveDown, MoveUp, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import { calculateEffectiveSpine } from "@/lib/archery";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

const POINT_PRESETS = [75, 100, 125, 150];

function signed(value: number, decimals = 0): string {
  const rounded = Number(value.toFixed(decimals));
  return `${rounded > 0 ? "+" : ""}${formatNumber(rounded, decimals)}`;
}

export function ArrowSpineCalculator() {
  const [baseSpine, setBaseSpine] = React.useState(500);
  const [baseLength, setBaseLength] = React.useState(29);
  const [basePoint, setBasePoint] = React.useState(100);
  const [newLength, setNewLength] = React.useState(28);
  const [newPoint, setNewPoint] = React.useState(125);

  useUrlState({
    spine: urlField(baseSpine, setBaseSpine, 500, undefined, { min: 150, max: 1300 }),
    len: urlField(baseLength, setBaseLength, 29, undefined, { min: 20, max: 34 }),
    point: urlField(basePoint, setBasePoint, 100, undefined, { min: 40, max: 350 }),
    newLen: urlField(newLength, setNewLength, 28, undefined, { min: 20, max: 34 }),
    newPoint: urlField(newPoint, setNewPoint, 125, undefined, { min: 40, max: 350 }),
  });

  const result = React.useMemo(
    () =>
      calculateEffectiveSpine({
        baseSpine,
        baseLength,
        basePoint,
        newLength,
        newPoint,
      }),
    [baseSpine, baseLength, basePoint, newLength, newPoint],
  );

  const modified = newLength !== baseLength || newPoint !== basePoint;
  const spineValue = formatNumber(result.effectiveSpine, 0);

  const directionBadge =
    result.direction === "unchanged" ? null : (
      <p
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
          result.direction === "stiffer"
            ? "bg-mint text-foreground"
            : "bg-pink text-foreground",
        )}
      >
        {result.direction === "stiffer" ? (
          <MoveUp className="size-3.5" />
        ) : (
          <MoveDown className="size-3.5" />
        )}
        {result.direction === "stiffer"
          ? "Acts stiffer than before"
          : "Acts weaker than before"}
      </p>
    );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        {/* Inputs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your current arrow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-7">
              <SliderField
                id="base-spine"
                label="Labeled static spine"
                value={baseSpine}
                onChange={setBaseSpine}
                min={150}
                max={1300}
                step={5}
                decimals={0}
              />
              <SliderField
                id="base-length"
                label="Shaft length"
                value={baseLength}
                onChange={setBaseLength}
                min={20}
                max={34}
                step={0.25}
                suffix="in"
              />
              <SliderField
                id="base-point"
                label="Point weight"
                value={basePoint}
                onChange={setBasePoint}
                min={40}
                max={350}
                step={5}
                suffix="gr"
                decimals={0}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Your changes</CardTitle>
              <button
                type="button"
                onClick={() => {
                  setNewLength(baseLength);
                  setNewPoint(basePoint);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            </CardHeader>
            <CardContent className="space-y-7">
              <SliderField
                id="new-length"
                label="New shaft length"
                value={newLength}
                onChange={setNewLength}
                min={20}
                max={34}
                step={0.25}
                suffix="in"
              />
              <div className="space-y-3">
                <SliderField
                  id="new-point"
                  label="New point weight"
                  value={newPoint}
                  onChange={setNewPoint}
                  min={40}
                  max={350}
                  step={5}
                  suffix="gr"
                  decimals={0}
                />
                <div className="flex gap-2">
                  {POINT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewPoint(preset)}
                      className={`h-9 flex-1 rounded-full border-2 text-sm font-bold transition-colors ${
                        newPoint === preset
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {preset} gr
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <HeroStat
                label="Effective spine of the modified arrow"
                value={spineValue}
                hint={
                  modified
                    ? `behaves like a ${spineValue} spine shaft at your original ${formatNumber(baseLength, 2)}" / ${basePoint} gr setup`
                    : "matches your current setup, so no change yet"
                }
              />
              {directionBadge}
              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
                <Stat
                  label="From length change"
                  value={`${signed(result.lengthEffect)} spine`}
                  hint={`${formatNumber(baseLength, 2)}" to ${formatNumber(newLength, 2)}"`}
                />
                <Stat
                  label="From point weight"
                  value={`${signed(result.pointEffect)} spine`}
                  hint={`${basePoint} gr to ${newPoint} gr`}
                />
                <Stat
                  label="Equivalent draw weight"
                  value={`${signed(result.drawWeightShift, 1)} lb`}
                  hint="as if your bow changed by this much"
                />
                <Stat
                  label="Closest standard size"
                  value={formatNumber(result.nearestStandard, 0)}
                  hint="nearest commercial spine"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How this is estimated</p>
              <p>
                Static spine follows the ASTM F2031 / ATA method: deflection in
                thousandths of an inch under a 1.94 lb weight on a 28-inch
                span, so 500 spine means 0.500 inches.
              </p>
              <p>
                Cutting a shaft changes its bending stiffness with the cube of
                its length, so even small trims matter: the calculator scales
                your spine by (new length / old length)&sup3;.
              </p>
              <p>
                Heavier points increase the inertial load that flexes the shaft
                on release. That effect is applied proportionally, roughly 25
                spine per 25 gr on a mid-range shaft, following the common
                field heuristic.
              </p>
              <p>
                Draw-weight equivalents are rule-of-thumb approximations;
                published guides range from about 1 to 5 lb per 25 grains of
                point weight, so treat the number as a direction rather than a
                precise figure.
              </p>
              <p>
                Results estimate dynamic behavior for comparison between
                setups. Always confirm with bareshaft or paper tuning.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileResultBar label="Effective spine" value={spineValue} />
    </>
  );
}
