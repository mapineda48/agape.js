/**
 * Framework-agnostic SSR middleware.
 *
 * Works with any HTTP framework (Express, Koa, Hono, etc.) by using
 * generic request/response interfaces instead of framework-specific types.
 */

import fs from "node:fs";
import path from "node:path";
import {
  SSR_OUTLET,
  SSR_DATA_PLACEHOLDER,
  SSR_DATA_ID,
} from "@mapineda48/agape-core/ssr";

// ============================================================================
// Generic HTTP Types (framework-agnostic)
// ============================================================================

export interface SSRRequest {
  method?: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface SSRResponse {
  setHeader(name: string, value: string): void;
  statusCode: number;
  end(data?: string): void;
}

/** Minimal Vite dev server interface */
export interface ViteDevServer {
  transformIndexHtml(url: string, html: string): Promise<string>;
  ssrLoadModule(url: string): Promise<unknown>;
  ssrFixStacktrace(error: Error): void;
}

export interface SSRMiddlewareOptions {
  /** Vite dev server instance (development only) */
  vite?: ViteDevServer;
  /** Root path for frontend resources */
  frontendRoot?: string;
}

interface EntryServerModule {
  render: (
    url: string,
    req?: unknown,
  ) => Promise<{
    html: string;
    ssrData: {
      pathname: string;
      params: Record<string, string>;
      props: Record<string, unknown>;
    };
  } | null>;
}

// ============================================================================
// Middleware Factory
// ============================================================================

export type SSRHandler = (
  req: SSRRequest,
  res: SSRResponse,
  next: (err?: unknown) => void,
) => Promise<void>;

/**
 * Creates a framework-agnostic SSR middleware.
 * Falls through (calls next) for non-SSR pages.
 */
export function createSSRMiddleware(options: SSRMiddlewareOptions): SSRHandler {
  const { vite, frontendRoot } = options;
  const isDev = !!vite;

  // Cache template and render module in production
  let prodTemplate: string | null = null;
  let prodRender: EntryServerModule["render"] | null = null;

  return async (req, res, next) => {
    // Only handle GET requests for HTML pages
    if (req.method !== "GET") return next();

    // Skip API/RPC endpoints and static assets
    const url = req.url;
    if (
      url.startsWith("/api/") ||
      url.includes(".") ||
      (typeof req.headers.accept === "string" &&
        req.headers.accept.includes("application/msgpack"))
    ) {
      return next();
    }

    try {
      let template: string;
      let render: EntryServerModule["render"];

      if (isDev) {
        const rawTemplate = fs.readFileSync(
          path.resolve(frontendRoot!, "index.html"),
          "utf-8",
        );
        template = await vite!.transformIndexHtml(url, rawTemplate);

        const entryModule = (await vite!.ssrLoadModule(
          "/entry-server.tsx",
        )) as EntryServerModule;
        render = entryModule.render;
      } else {
        if (!prodTemplate) {
          prodTemplate = fs.readFileSync(
            path.resolve(frontendRoot!, "index.html"),
            "utf-8",
          );
        }
        template = prodTemplate;

        if (!prodRender) {
          const entryModule = (await import(
            path.resolve(frontendRoot!, "ssr/entry-server.js")
          )) as EntryServerModule;
          prodRender = entryModule.render;
        }
        render = prodRender;
      }

      const result = await render(url, req);

      // Not an SSR page — fall through to SPA handler
      if (!result) return next();

      // Build SSR data script tag
      const ssrDataScript = `<script id="${SSR_DATA_ID}" type="application/json">${
        JSON.stringify(result.ssrData).replace(/</g, "\\u003c")
      }</script>`;

      // Inject SSR content into template
      let html = template;
      html = html.replace(SSR_OUTLET, result.html);
      html = html.replace(SSR_DATA_PLACEHOLDER, ssrDataScript);

      // Send response
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "public, max-age=0");
      res.statusCode = 200;
      res.end(html);
    } catch (error) {
      if (isDev && vite) {
        vite.ssrFixStacktrace(error as Error);
      }
      console.error("[SSR] Render error:", error);
      next();
    }
  };
}
