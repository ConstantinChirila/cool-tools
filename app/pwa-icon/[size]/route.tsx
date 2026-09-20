import { MANIFEST_ICON_SIZES, renderAppIcon } from "@/lib/app-icon";

export const dynamicParams = false;

export function generateStaticParams() {
  return MANIFEST_ICON_SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  return renderAppIcon(Number(size));
}
