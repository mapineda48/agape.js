import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SSR_DATA_ID } from "#shared/ssr";
import type { SSRPageData } from "#shared/ssr";
import "./index.css";
import App from "./app";

const container = document.getElementById("root")!;

// Check if there's SSR data in the page (server-rendered)
const ssrDataElement = document.getElementById(SSR_DATA_ID);
const ssrData: SSRPageData | null = ssrDataElement
  ? JSON.parse(ssrDataElement.textContent!)
  : null;

// Always use createRoot. For SSR pages, the server HTML provides instant content
// while React boots up. Once the client renders, it replaces the server HTML.
// The ssrData is passed to the router so it uses the server props for the first render.
const root = createRoot(container);
root.render(
  <StrictMode>
    <App ssrData={ssrData} />
  </StrictMode>,
);
