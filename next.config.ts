import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The page is fully prerendered at build time; only /api/poll runs on request.
  reactStrictMode: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
