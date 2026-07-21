import type { NextConfig } from "next";

/**
 * Local dev sets NEXT_DIST_DIR (see package.json) to keep the build cache off
 * iCloud Drive. On Vercel/production NEXT_DIST_DIR is unset, so we fall back to
 * Next's default `.next` output — a custom distDir there breaks page collection
 * (PageNotFoundError: /_document).
 */
const distDir = process.env.NEXT_DIST_DIR?.trim() || undefined;

const nextConfig: NextConfig = {
  ...(distDir ? { distDir } : {}),
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  experimental: { devtoolSegmentExplorer: false },
  transpilePackages: ["recharts"],
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.watchOptions = { ...config.watchOptions, poll: 3000, aggregateTimeout: 500 };
    }
    return config;
  },
};

export default nextConfig;
