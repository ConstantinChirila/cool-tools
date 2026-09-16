import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Bits & Bobs: free online calculators";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({});
}
