import { useState } from "react";
import { useRouter } from "#web/utils/components/router/hook";

/**
 * Test SPA page - no SSR, default rendering mode.
 * This page should only render on the client.
 */
export default function TestSPA() {
  const [count, setCount] = useState(0);
  const router = useRouter();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Test SPA Page</h1>
      <p>This page is rendered entirely on the client (SPA mode).</p>
      <p>Counter: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <nav style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => router.navigate("/")}>Home</button>
        <button onClick={() => router.navigate("/about")}>About (SSR)</button>
        <button onClick={() => router.navigate("/test-ssr")}>Test SSR</button>
        <button onClick={() => router.navigate("/test-ssg")}>Test SSG</button>
        <button onClick={() => router.navigate("/test-ssr/details/42")}>SSR Dynamic</button>
      </nav>
    </div>
  );
}
