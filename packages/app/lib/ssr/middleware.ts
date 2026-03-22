/**
 * SSR Middleware for Express
 *
 * Handles server-side rendering for pages that opt-in to SSR/SSG.
 * Works in both development (via Vite ssrLoadModule) and production
 * (via pre-built SSR bundle).
 */

import fs from "node:fs";
import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import {
  SSR_OUTLET,
  SSR_DATA_PLACEHOLDER,
  SSR_DATA_ID,
} from "@mapineda48/agape-core/ssr";

// ============================================================================
// Types
// ============================================================================

/** Minimal Vite dev server interface to avoid importing vite directly */
interface ViteDevServer {
  transformIndexHtml(url: string, html: string): Promise<string>;
  ssrLoadModule(url: string): Promise<unknown>;
  ssrFixStacktrace(error: Error): void;
}

interface SSRMiddlewareOptions {
  /** Vite dev server instance (development only) */
  vite?: ViteDevServer;
  /** Root path for frontend resources (frontend package root in dev, web/ dir in prod) */
  frontendRoot?: string;
}

interface EntryServerModule {
  render: (
    url: string,
    req?: unknown,
  ) => Promise<{
    html: string;
    ssrData: { pathname: string; params: Record<string, string>; props: Record<string, unknown> };
  } | null>;
}

// ============================================================================
// Middleware Factory
// ============================================================================

/**
 * Creates an Express middleware that handles SSR for opt-in pages.
 * Falls through to the next middleware for SPA pages.
 */
export function createSSRMiddleware(options: SSRMiddlewareOptions) {
  const { vite, frontendRoot } = options;
  const isDev = !!vite;

  // Cache template and render module in production
  let prodTemplate: string | null = null;
  let prodRender: EntryServerModule["render"] | null = null;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only handle GET requests for HTML pages
    if (req.method !== "GET") return next();

    // Skip API/RPC endpoints and static assets
    const url = req.originalUrl;
    if (
      url.startsWith("/api/") ||
      url.includes(".") || // static files have extensions
      req.headers.accept?.includes("application/msgpack")
    ) {
      return next();
    }

    try {
      let template: string;
      let render: EntryServerModule["render"];

      if (isDev) {
        // Development: read template from frontend package and transform with Vite
        const rawTemplate = fs.readFileSync(
          path.resolve(frontendRoot!, "index.html"),
          "utf-8",
        );
        template = await vite!.transformIndexHtml(url, rawTemplate);

        // Load server entry through Vite (full HMR support)
        const entryModule = (await vite!.ssrLoadModule(
          "/entry-server.tsx",
        )) as EntryServerModule;
        render = entryModule.render;
      } else {
        // Production: use pre-built assets (web/ is relative to CWD in dist)
        if (!prodTemplate) {
          prodTemplate = fs.readFileSync(
            path.resolve("web/index.html"),
            "utf-8",
          );
        }
        template = prodTemplate;

        if (!prodRender) {
          const entryModule = (await import(
            path.resolve("web/ssr/entry-server.js")
          )) as EntryServerModule;
          prodRender = entryModule.render;
        }
        render = prodRender;
      }

      // Try to render the page as SSR
      const result = await render(url, req);

      // If the page is not SSR, fall through to SPA handler
      if (!result) return next();

      // Build the SSR data script tag
      const ssrDataScript = `<script id="${SSR_DATA_ID}" type="application/json">${
        JSON.stringify(result.ssrData).replace(/</g, "\\u003c")
      }</script>`;

      // Inject SSR content into template
      let html = template;

      // Replace SSR outlet with rendered HTML
      html = html.replace(SSR_OUTLET, result.html);

      // Replace SSR data placeholder with script tag
      html = html.replace(SSR_DATA_PLACEHOLDER, ssrDataScript);

      // Send SSR response (no cache for SSR pages)
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "public, max-age=0");
      res.status(200).end(html);
    } catch (error) {
      // In development, let Vite fix the stack trace
      if (isDev && vite) {
        vite.ssrFixStacktrace(error as Error);
      }
      console.error("[SSR] Render error:", error);
      // Fall through to SPA on error
      next();
    }
  };
}
