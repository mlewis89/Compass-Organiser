import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["semantic-ui-react", "semantic-ui-css"],
  async rewrites() {
    return [{ source: "/graphql", destination: "/api/graphql" }];
  },
};

export default nextConfig;
