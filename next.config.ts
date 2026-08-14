import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["semantic-ui-react", "semantic-ui-css"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-dom-original": "react-dom",
        "react-dom$": path.join(process.cwd(), "lib/polyfills/react-dom-client.ts"),
      };
    }
    return config;
  },
  async rewrites() {
    return [{ source: "/graphql", destination: "/api/graphql" }];
  },
};

export default nextConfig;
