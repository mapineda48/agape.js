import { useState } from "react";
import { useRouter } from "#web/utils/components/router/hook";
import type { RenderingMode } from "#shared/ssr";

/** Opt-in to SSR */
export const rendering: RenderingMode = "ssr";

/** Server-side props */
export async function getServerProps(ctx: {
  params: Record<string, string>;
  query: Record<string, string>;
  req: unknown;
}) {
  return {
    serverTime: new Date().toISOString(),
    items: ["Item A", "Item B", "Item C"],
  };
}

export default function TestSSR({
  serverTime,
  items,
}: {
  serverTime?: string;
  items?: string[];
}) {
  const [count, setCount] = useState(0);
  const router = useRouter();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Test SSR Page</h1>
      <p>This page is server-side rendered with data.</p>
      <p>Server time: {serverTime ?? "N/A"}</p>
      <ul>
        {(items ?? []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>Client counter: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <nav style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => router.navigate("/")}>Home</button>
        <button onClick={() => router.navigate("/test-spa")}>Test SPA</button>
        <button onClick={() => router.navigate("/about")}>About (SSR)</button>
        <button onClick={() => router.navigate("/test-ssg")}>Test SSG</button>
        <button onClick={() => router.navigate("/test-ssr/details/42")}>SSR Dynamic</button>
      </nav>
    </div>
  );
}
