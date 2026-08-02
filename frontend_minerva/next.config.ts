import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  output: "standalone",


  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },


  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
