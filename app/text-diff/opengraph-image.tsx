import { OG_SIZE, renderOgImage } from "@/lib/og";
import { requireTool } from "@/lib/tools";

const tool = requireTool("text-diff");

export const alt = `${tool.name} on Bits & Bobs`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ tool });
}
