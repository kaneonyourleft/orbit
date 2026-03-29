import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@orbit/core', 
    '@orbit/ui', 
    '@orbit/shared', 
    '@orbit/database', 
    '@blocksuite/presets', 
    '@blocksuite/blocks', 
    '@blocksuite/store',
    '@blocksuite/data-view',
    '@blocksuite/icons'
  ],
  // Next.js 16부터 eslint 설정은 더 이상 필요하지 않거나 다른 방식으로 다뤄집니다.
  // 에러 발생을 방지하기 위해 제거합니다.
  
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
    config.ignoreWarnings = [
      { module: /node_modules\/@blocksuite/ },
    ];
    return config;
  },
};

export default nextConfig;
