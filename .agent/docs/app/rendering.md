# Rendering Architecture: SPA, SSR & SSG

This document describes the hybrid rendering system that allows each page to
opt-in to a specific rendering mode. **SPA is the default** — pages must
explicitly export a `rendering` constant to enable server-side rendering.

## Rendering Modes

| Mode | When HTML is generated | Data freshness | Use case |
|------|----------------------|----------------|----------|
| **SPA** (default) | Client-side at runtime | Always fresh (client fetches) | Interactive apps, authenticated content |
| **SSR** | Server-side per request | Fresh on each page load | SEO, public pages with dynamic data |
| **SSG** | Build time (static file) | Stale until next deploy | Marketing pages, docs, static content |

## Opting In

Every page defaults to SPA. To enable SSR or SSG, export `rendering` from the
page module:

```tsx
// SPA — no export needed (default behavior)
export default function MyPage() { ... }

// SSR
export const rendering: RenderingMode = "ssr";
export default function MyPage({ serverTime }) { ... }

// SSG
export const rendering: RenderingMode = "ssg";
export default function MyPage({ buildTime }) { ... }
```

SSR/SSG pages can also export `getServerProps` to provide data:

```tsx
export async function getServerProps(ctx: {
  params: Record<string, string>;  // route params (e.g. { id: "42" })
  query: Record<string, string>;   // query string params
  req: unknown;                    // Express request object (SSR only)
}) {
  return { serverTime: new Date().toISOString() };
}
```

- For **SSR**: `getServerProps` runs on every request with access to `req`.
- For **SSG**: `getServerProps` runs once at build time (`req` is undefined).

## Architecture Overview

```
Request: GET /test-ssr
                │
                ▼
        ┌───────────────┐
        │ express.static │──→ Found static file? (SSG pages live here)
        └───────┬───────┘    Yes → serve directly (no server work)
                │ No
                ▼
        ┌───────────────┐
        │ SSR Middleware │──→ Page has rendering: "ssr"?
        └───────┬───────┘    Yes → server render + inject HTML
                │ No
                ▼
        ┌───────────────┐
        │  SPA Fallback  │──→ Serve index.html (client renders)
        └───────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `shared/ssr.ts` | Shared types (`RenderingMode`, `SSRPageData`) and constants |
| `web/entry-server.tsx` | Server-side React rendering (used by middleware + build) |
| `lib/ssr/middleware.ts` | Express middleware that intercepts and server-renders pages |
| `web/main.tsx` | Client entry — detects SSR data and bootstraps React |
| `web/app/index.tsx` | Routes component — passes `ssrData` to HistoryManager |
| `web/utils/components/router/HistoryManager.ts` | Client router with `hydrateFromSSR()` |
| `bin/build.ts` | Post-build SSG pre-rendering |
| `bin/index.ts` | Express server setup (dev + prod middleware ordering) |
| `vite.config.ssr.ts` | Vite config for SSR bundle (separate from client build) |
| `web/index.html` | HTML template with `<!--ssr-outlet-->` and `<!--ssr-data-->` |

## Detailed Flow

### 1. HTML Template (`web/index.html`)

The template contains two placeholders inside `<body>`:

```html
<div id="root"><!--ssr-outlet--></div>
<!--ssr-data-->
```

- `<!--ssr-outlet-->`: replaced with server-rendered HTML (SSR/SSG pages)
- `<!--ssr-data-->`: replaced with a `<script>` tag containing JSON props

For SPA pages, these placeholders remain as-is (empty root div).

### 2. Server Entry (`web/entry-server.tsx`)

The `render(url, req)` function:

1. Matches the URL to a page file using `filePathToPageRoute()`.
2. Lazy-loads the matched page module (avoids loading SPA-only pages that
   import `#services/*` virtual modules).
3. Checks `mod.rendering` — returns `null` for SPA pages (middleware falls
   through).
4. Calls `getServerProps({ params, query, req })` if exported.
5. Finds and loads layout modules for the matched path.
6. Builds the React element tree (page wrapped in layouts).
7. Wraps with `HistoryContext.Provider` using an SSR stub (provides
   `pathname` and `params`; navigation methods are no-ops).
8. Calls `renderToString()` and returns `{ html, ssrData }`.

The `getSSRRoutes()` function scans all page modules and returns those with
`rendering: "ssr" | "ssg"`. Used by the build process for SSG pre-rendering.

**Glob normalization:** `import.meta.glob("./app/**/page.{ts,tsx}")` produces
keys like `./app/foo/page.tsx`, but the router expects `./foo/page.tsx`.
The `stripAppPrefix()` function normalizes these keys.

### 3. SSR Middleware (`lib/ssr/middleware.ts`)

Express middleware that runs after static file serving but before the SPA
fallback.

**Request filtering** — skips requests that are:
- Non-GET methods
- API routes (`/api/`)
- Static assets (URL contains `.`)
- MessagePack requests (`accept: application/msgpack`)

**Development mode:**
- Reads `web/index.html` and transforms it with `vite.transformIndexHtml()`
- Loads entry-server via `vite.ssrLoadModule("/entry-server.tsx")` (supports HMR)
- Fixes stack traces with `vite.ssrFixStacktrace()` on errors

**Production mode:**
- Caches the built HTML template and entry-server module
- Imports from `dist/web/ssr/entry-server.js`

**HTML injection:**
```typescript
html = html.replace("<!--ssr-outlet-->", result.html);
html = html.replace("<!--ssr-data-->", ssrDataScript);
```

The SSR data script tag:
```html
<script id="__SSR_DATA__" type="application/json">
  {"pathname":"/test-ssr","params":{},"props":{"serverTime":"..."}}
</script>
```

### 4. Client Bootstrap (`web/main.tsx`)

```typescript
const ssrDataElement = document.getElementById(SSR_DATA_ID);
const ssrData: SSRPageData | null = ssrDataElement
  ? JSON.parse(ssrDataElement.textContent!)
  : null;

const root = createRoot(container);
root.render(<App ssrData={ssrData} />);
```

- Always uses `createRoot()` (not `hydrateRoot()`). Server HTML provides
  instant content while React boots, then the client takes over.
- If `__SSR_DATA__` script exists → SSR/SSG page, passes data to app.
- If not → SPA page, `ssrData` is null.

### 5. Client Router Hydration (`HistoryManager.ts`)

The `listenPage(cb, ssrData?)` method handles both modes:

- **SPA path** (`ssrData` is null): navigates to current URL, lazy-loads page.
- **SSR path** (`ssrData` present): calls `hydrateFromSSR()`:

```
hydrateFromSSR(cb, ssrData):
  1. Find page in registry by pathname
  2. Eagerly load page module (if lazy)
  3. Eagerly load all layout modules for the path
  4. Build element tree with server props
  5. Call setState callback → page renders immediately
  6. Update browser history with server state
```

After hydration, the page functions as a full SPA — all subsequent navigations
are client-side.

### 6. SSG Pre-rendering (`bin/build.ts`)

The `preRenderSSGPages()` function runs after the Vite build:

1. Imports `dist/web/ssr/entry-server.js`
2. Calls `getSSRRoutes()` to find SSG routes
3. Skips dynamic routes (containing `:param` — can't pre-render without data)
4. For each static SSG route:
   - Calls `render(pathname)` to get HTML + SSR data
   - Injects into the HTML template
   - Writes to `dist/web/www/{route}/index.html`

The output files are served directly by `express.static` — no server
computation at runtime. Example:

```
/test-ssg → dist/web/www/test-ssg/index.html
```

## Build Pipeline

```bash
# prebuild script (package.json):
rimraf dist                              # clean
tsc -p ./tsconfig.app.json              # type-check backend
vite build                               # client bundle → dist/web/www/
vite build --ssr entry-server.tsx \       # SSR bundle → dist/web/ssr/
  --outDir $PWD/dist/web/ssr \
  --config vite.config.ssr.ts

# build script:
tsx bin/build.ts                          # post-build tasks + SSG pre-render
```

### SSR Build Config (`vite.config.ssr.ts`)

```typescript
export default defineConfig({
  root: "web",
  resolve: { alias: { "#web": ..., "#shared": ... } },
  build: {
    rollupOptions: {
      // Externalize #services/* (virtual modules, client-only)
      external: (id) => id.startsWith("#services/"),
      output: { entryFileNames: "[name].js" },  // no content hash
    },
  },
});
```

Key decisions:
- **Externalize `#services/*`**: These are Vite virtual modules (RPC service
  proxies) that only exist in the client build. Externalizing prevents the SSR
  bundle from trying to include them.
- **No content hash**: The middleware imports `entry-server.js` by name.

## Server Setup (`bin/index.ts`)

### Development

```typescript
const viteDevServer = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",  // We handle HTML serving for SSR
});

app.use(viteDevServer.middlewares);          // 1. Static + HMR
app.use(createSSRMiddleware({ vite }));      // 2. SSR pages
app.use(spaFallback);                        // 3. SPA fallback
```

### Production

```typescript
app.use(express.static(frontendRoot, {       // 1. Static + SSG pages
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "public, max-age=0");
    } else {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
}));
app.use(createSSRMiddleware({}));            // 2. SSR pages
app.get(/.*/, sendIndexHtml);               // 3. SPA fallback
```

**Cache strategy:**
- Hashed assets (JS/CSS): 1 year, immutable
- HTML files (SSG): no cache (`max-age=0`) — they change between deployments
- SSR responses: no cache
- SPA fallback: no cache

## Example Pages

### SPA (`web/app/test-spa/page.tsx`)
```tsx
// No rendering export → defaults to SPA
export default function TestSPA() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

### SSR (`web/app/test-ssr/page.tsx`)
```tsx
export const rendering: RenderingMode = "ssr";

export async function getServerProps(ctx) {
  return { serverTime: new Date().toISOString(), items: ["A", "B", "C"] };
}

export default function TestSSR({ serverTime, items, params }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Server time: {serverTime ?? "N/A"}</p>
      <ul>{items?.map(i => <li key={i}>{i}</li>)}</ul>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </div>
  );
}
```

### SSG (`web/app/test-ssg/page.tsx`)
```tsx
export const rendering: RenderingMode = "ssg";

export async function getServerProps() {
  return { buildTime: new Date().toISOString(), features: [...] };
}

export default function TestSSG({ buildTime, features }) { ... }
```

### Dynamic SSR (`web/app/test-ssr/details/[id]/page.tsx`)
```tsx
export const rendering: RenderingMode = "ssr";

export async function getServerProps(ctx) {
  const { id } = ctx.params;
  return { id, title: `Detail #${id}`, timestamp: new Date().toISOString() };
}

export default function Detail({ id, title, timestamp }) { ... }
```

Note: Dynamic routes with SSG are skipped during pre-rendering (no way to
enumerate all possible param values at build time).

## Client-Side Navigation Behavior

After the initial page load (whether SPA, SSR, or SSG), all subsequent
navigation is client-side:

| From → To | Behavior |
|-----------|----------|
| SSR → SPA | Client navigation, no server round-trip |
| SSR → SSR | Client navigation (server props show as N/A) |
| SPA → SSR | Client navigation (no server props) |
| Any → Any (direct URL) | Full page load with appropriate rendering mode |

Server props from `getServerProps` are only available on **direct URL loads**
(full page request). Client-side navigation between pages does not call
`getServerProps` — the page renders with whatever props are available on the
client.
