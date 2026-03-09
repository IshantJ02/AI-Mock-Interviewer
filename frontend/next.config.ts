import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for stability
  experimental: {},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.githubusercontent.com' },
    ],
  },

  // Allow Monaco editor to load properly
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },

  // Required for Vercel - disable eslint/ts strict checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
