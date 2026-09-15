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
    <div className="sticker fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-2xl bg-yellow px-4 py-3 lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="text-sm font-bold">{label}</span>
      <span className="font-heading text-xl font-black tracking-tight text-numeric">{value}</span>
    </div>
  );
}
