import { OG_SIZE, renderOgImage } from "@/lib/og";
import { getTool } from "@/lib/tools";

const tool = getTool("uk-salary-calculator")!;

export const alt = `${tool.name} on Bits & Bobs`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ tool });
}
