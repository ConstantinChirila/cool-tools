import type { MetadataRoute } from "next";
import { MANIFEST_ICON_SIZES } from "@/lib/app-icon";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en-GB",
    background_color: "#fbf9f4",
    theme_color: "#fbf9f4",
    icons: MANIFEST_ICON_SIZES.flatMap((size) =>
      (["any", "maskable"] as const).map((purpose) => ({
        src: `/pwa-icon/${size}`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose,
      })),
    ),
  };
}
