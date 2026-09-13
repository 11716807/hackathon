import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@google/generative-ai"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
