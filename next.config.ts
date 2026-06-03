import type { NextConfig } from "next";

// Force Node.js timezone to Asia/Bangkok for consistent date handling
process.env.TZ = "Asia/Bangkok";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
};

export default nextConfig;
