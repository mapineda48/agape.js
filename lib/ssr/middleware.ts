/**
 * SSR Middleware for Express
 *
 * Handles server-side rendering for pages that opt-in via `rendering: "ssr"`.
 * Reads the client-built HTML template, renders the page on the server,
 * and injects the rendered HTML + serialized props into the template.
 */

import fs from "node:fs";
import path from "node:path";
import type { RequestHandler } from "express";

interface RenderResult {
  html: string;
  props: Record<string, unknown>;
  pagePath: string;
  layoutPaths: string[];
}

interface SSRModule {
  render(url: string): Promise<RenderResult | null>;
  getManifest(): Record<string, { rendering: "ssr" | "ssg" }>;
  getStaticPaths(): string[];
}

/**
 * Converts an Express-style route pattern (e.g., "/users/:id")
 * to a regex-based Express route.
 */
function patternToExpressRoute(pattern: string): string {
  return pattern;
}

/**
 * Escapes a string for safe inclusion in an HTML <script> tag.
 * Prevents XSS by escaping </script> sequences.
 */
function escapeJsonForHtml(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

/**
 * Injects SSR content into the HTML template.
 */
function injectSSR(template: string, result: RenderResult): string {
  const serializedData = escapeJsonForHtml(
    JSON.stringify({
      props: result.props,
      pagePath: result.pagePath,
      layoutPaths: result.layoutPaths,
    }),
  );

  const ssrScript = `<script>window.__SSR_DATA__=${serializedData}</script>`;

  return template
    .replace('<div id="root"></div>', `<div id="root">${result.html}</div>`)
    .replace("</head>", `${ssrScript}\n</head>`);
}

/**
 * Creates SSR request handlers for all SSR routes.
 *
 * @param ssrModule - The loaded SSR server module
 * @param templatePath - Path to the client-built index.html
 * @returns Array of [pattern, handler] tuples to register with Express
 */
export function createSSRHandlers(
  ssrModule: SSRModule,
  templatePath: string,
): Array<[string, RequestHandler]> {
  const template = fs.readFileSync(templatePath, "utf-8");
  const manifest = ssrModule.getManifest();
  const handlers: Array<[string, RequestHandler]> = [];

  for (const [pattern, { rendering }] of Object.entries(manifest)) {
    if (rendering !== "ssr") continue;

    const expressRoute = patternToExpressRoute(pattern);

    const handler: RequestHandler = async (req, res, next) => {
      try {
        const url = req.originalUrl || req.url;
        const result = await ssrModule.render(url);

        if (!result) {
          next();
          return;
        }

        const html = injectSSR(template, result);
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "public, max-age=0");
        res.send(html);
      } catch (error) {
        next(error);
      }
    };

    handlers.push([expressRoute, handler]);
  }

  return handlers;
}

/**
 * Pre-renders SSG pages to static HTML files at build time.
 *
 * @param ssrModule - The loaded SSR server module
 * @param templatePath - Path to the client-built index.html
 * @param outputDir - Directory to write the static HTML files
 */
export async function generateStaticPages(
  ssrModule: SSRModule,
  templatePath: string,
  outputDir: string,
): Promise<string[]> {
  const template = fs.readFileSync(templatePath, "utf-8");
  const staticPaths = ssrModule.getStaticPaths();
  const generated: string[] = [];

  for (const pagePath of staticPaths) {
    const result = await ssrModule.render(pagePath);
    if (!result) continue;

    const html = injectSSR(template, result);

    // Write to output directory
    // "/about" -> outputDir/about/index.html
    // "/" -> outputDir/index.html
    const filePath =
      pagePath === "/"
        ? path.join(outputDir, "index.html")
        : path.join(outputDir, pagePath, "index.html");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html, "utf-8");
    generated.push(pagePath);
  }

  return generated;
}
