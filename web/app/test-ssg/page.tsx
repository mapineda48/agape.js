import { useState } from "react";
import { useRouter } from "#web/utils/components/router/hook";
import type { RenderingMode } from "#shared/ssr";

/** Opt-in to SSG (Static Site Generation) */
export const rendering: RenderingMode = "ssg";

/** Server-side props - for SSG these are computed at build time */
export async function getServerProps() {
  return {
    buildTime: new Date().toISOString(),
    features: ["SSR Support", "SSG Support", "SPA Default", "Hydration"],
  };
}

export default function TestSSG({
  buildTime,
  features,
}: {
  buildTime?: string;
  features?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Test SSG Page</h1>
      <p>This page is statically generated at build time.</p>
      <p>Build time: {buildTime ?? "N/A"}</p>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide" : "Show"} Features
      </button>
      {expanded && (
        <ul>
          {(features ?? []).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <nav style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => router.navigate("/")}>Home</button>
        <button onClick={() => router.navigate("/test-spa")}>Test SPA</button>
        <button onClick={() => router.navigate("/test-ssr")}>Test SSR</button>
        <button onClick={() => router.navigate("/about")}>About (SSR)</button>
      </nav>
    </div>
  );
}
