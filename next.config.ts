import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@google/generative-ai",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "@google-cloud/documentai",
    "sharp",
  ],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
