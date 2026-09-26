import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memoises components and hooks at build time, so tools do not depend on hand-placed useMemo/React.memo.
  reactCompiler: true,
  // Baked into the client bundle and the static /version route; components/update-check.tsx compares the two.
  env: {
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
};

export default nextConfig;
