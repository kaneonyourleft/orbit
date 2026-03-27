import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbit/core", "@orbit/ui", "@orbit/shared", "@orbit/database"],
};

export default nextConfig;
