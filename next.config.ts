import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@google/generative-ai", "sharp"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
