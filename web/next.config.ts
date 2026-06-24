import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Electron app lives in the parent dir with its own lockfile; pin the
  // workspace root to this site so Turbopack doesn't infer the wrong one.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
