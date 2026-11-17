import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * TUMA renders authenticated dashboards from live Supabase rows. With Cache
   * Components every dynamic route is partially prerendered and resumed
   * mid-stream, which left the dashboard's Suspense boundary pending on the
   * first request after a deploy. The classic model renders the dashboard in a
   * single pass (the marketing pages stay static), which is what a
   * session-first product needs.
   */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
