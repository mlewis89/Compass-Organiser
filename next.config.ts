import path from "node:path";
import { createRequire } from "node:module";
import type { NextConfig } from "next";

const require = createRequire(path.join(process.cwd(), "package.json"));
const refFindNodePolyfill = path.join(
  process.cwd(),
  "lib/polyfills/RefFindNode.js",
);
const reactDomShim = path.join(process.cwd(), "lib/polyfills/react-dom-client.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["semantic-ui-react", "semantic-ui-css"],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Must resolve to the real package path, not the "react-dom" alias (avoids a circular import).
        "react-dom-original": require.resolve("react-dom"),
        "react-dom$": reactDomShim,
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
