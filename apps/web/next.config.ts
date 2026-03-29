import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    '@orbit/core', 
    '@orbit/ui', 
    '@orbit/shared', 
    '@orbit/database'
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack 환경에서 webpack 설정을 사용할 수 있도록 빈 설정을 추가합니다.
  turbopack: {},
  webpack: (config) => {
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    return config;
  },
};

export default nextConfig;
