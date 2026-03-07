import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const container = document.getElementById("root")!;
const ssrData = (window as any).__SSR_DATA__;

if (ssrData) {
  // SSR/SSG hydration: load only the page + layout modules, then hydrate
  const { hydrate } = await import("./ssr/hydrate");
  await hydrate(container, ssrData);
} else {
  // SPA mode (existing behavior)
  const { default: App } = await import("./app");
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
