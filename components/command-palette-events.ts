/** Tiny module so the header can open the palette without importing cmdk. */
export const OPEN_PALETTE_EVENT = "bitsbobs:open-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}
