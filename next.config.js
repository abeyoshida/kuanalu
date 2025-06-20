/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript and ESLint checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable React strict mode for now to avoid double rendering issues
  reactStrictMode: false,
  // Add webpack configuration to help with chunk loading issues
  webpack: (config, { dev, isServer }) => {
    // Optimize chunk loading
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
      },
    };
    
    return config;
  },
};

module.exports = nextConfig; 