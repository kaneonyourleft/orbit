import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbit/core", "@orbit/ui", "@orbit/shared", "@orbit/database"],
  // @ts-expect-error - Next.js 15+ may have strict config types in some environments
  eslint: {
    ignoreDuringBuilds: true,
  },
  // @ts-expect-error
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
