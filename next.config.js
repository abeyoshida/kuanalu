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
};

module.exports = nextConfig; 