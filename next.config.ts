import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.CLOUD_RUN_BUILD === "1" ? "standalone" : undefined,
  poweredByHeader: false,
};

export default nextConfig;
