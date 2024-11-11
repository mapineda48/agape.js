import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Important: return the modified config
    config.externals?.push(({ context, request }: any, callback: any) => {
      if (/^agape-backend/.test(request) && isServer) {
        return callback(null, 'commonjs ' + dev ? request.replace(/^agape-backend/, "agape-backend/dist/server") : request);
      }
      // Continue without externalizing the import
      callback();
    });

    if (!isServer) {
      config.resolve.alias["agape-backend"] = path.resolve(__dirname, "../agape-backend/dist/browser");
    }

    return config
  },
};

export default nextConfig;