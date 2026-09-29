import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memoises components and hooks at build time, so tools do not depend on hand-placed useMemo/React.memo.
  reactCompiler: true,
  // Baked into the client bundle and the static /version route; components/update-check.tsx compares the two.
  env: {
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  // Tools used to live under /tools/<slug>; old links and search results still point there.
  async redirects() {
    return [
      { source: "/tools", destination: "/", permanent: true },
      { source: "/tools/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
