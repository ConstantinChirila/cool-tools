"use client";

/**
 * Compact result summary pinned above the device gesture area on mobile,
 * so the hero number stays visible while scrolling the inputs.
 */
export function MobileResultBar({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="glass card-specular fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-xl px-4 py-3 shadow-[0_8px_32px_-8px_oklch(0_0_0/60%)] lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold tracking-tight text-numeric">{value}</span>
    </div>
  );
}
