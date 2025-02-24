import type { NextConfig } from "next";
import backend from "./scripts/alias";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ❌ Desactiva ESLint en `next build`
  },

  webpack: (config, next) => {
    if (!next.isServer) {
      return config;
    }

    config.externals?.push(({ context, request }: any, callback: any) => {
      if (!/^@agape/.test(request)) {
        // Continue without externalizing the import
        return callback();
      }

      const external = next.dev ? backend[request] : request.replace(/^@agape/, "@dist");

      return callback(null, 'commonjs ' + external);
    });

    return config
  },
};

export default nextConfig;
