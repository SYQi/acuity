import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR?.trim() || "tmp/aia-cataract-next";

const nextConfig: NextConfig = {
  distDir,
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
