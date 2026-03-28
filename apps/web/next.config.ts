import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbit/core", "@orbit/ui", "@orbit/shared", "@orbit/database", "@blocksuite/presets", "@blocksuite/blocks", "@blocksuite/store"],
  // @ts-expect-error: Next.js 15+ may have strict config types in some environments
  eslint: {
    ignoreDuringBuilds: true,
  },
  // @ts-expect-error: Suppress NextConfig type mismatch for ignoreBuildErrors in dev
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
