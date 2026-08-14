import path from "node:path";
import type { NextConfig } from "next";

const refFindNodePolyfill = path.join(
  process.cwd(),
  "lib/polyfills/RefFindNode.js",
);

const nextConfig: NextConfig = {
  transpilePackages: ["semantic-ui-react", "semantic-ui-css"],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-dom-original": "react-dom",
        "react-dom$": path.join(process.cwd(), "lib/polyfills/react-dom-client.ts"),
      };

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /@fluentui\/react-component-ref\/dist\/es\/RefFindNode\.js$/,
          refFindNodePolyfill,
        ),
      );
    }
    return config;
  },
  async rewrites() {
    return [{ source: "/graphql", destination: "/api/graphql" }];
  },
};

export default nextConfig;
