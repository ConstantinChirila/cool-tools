import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memoises components and hooks at build time, so tools do not depend on hand-placed useMemo/React.memo.
  reactCompiler: true,
};

export default nextConfig;
