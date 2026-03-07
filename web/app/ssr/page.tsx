/**
 * Example SSR Page
 *
 * This page is rendered on the server on each request.
 * The `getServerSideProps` function runs on the server and its
 * return value is passed as props to the component.
 *
 * On the client, React hydrates the server-rendered HTML and
 * attaches event handlers.
 */

import { useState } from "react";

export const rendering = "ssr";

export async function getServerSideProps({
  query,
}: {
  params: Record<string, string>;
  query: Record<string, string>;
}) {
  return {
    serverTime: new Date().toISOString(),
    greeting: query.name ? `Hello, ${query.name}!` : "Hello from SSR!",
  };
}

export default function SSRPage({
  serverTime,
  greeting,
}: {
  serverTime: string;
  greeting: string;
}) {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Server-Side Rendered Page</h1>
      <p>
        <strong>Server Time:</strong> {serverTime}
      </p>
      <p>
        <strong>Greeting:</strong> {greeting}
      </p>
      <p>
        Try adding <code>?name=YourName</code> to the URL.
      </p>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Client-Side Interactivity</h2>
      <p>This button works after hydration:</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Clicked {count} times
      </button>

      <hr style={{ margin: "1.5rem 0" }} />

      <p>
        <a href="/">Back to SPA Home</a>
      </p>
    </div>
  );
}
