import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbit/core", "@orbit/ui", "@orbit/shared", "@orbit/database"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
