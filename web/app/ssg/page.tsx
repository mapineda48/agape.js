/**
 * Example SSG Page
 *
 * This page is pre-rendered to static HTML at build time.
 * The `getStaticProps` function runs during the build and its
 * return value is baked into the HTML.
 *
 * On the client, React hydrates the static HTML.
 */

import { useState } from "react";

export const rendering = "ssg";

export async function getStaticProps() {
  return {
    buildTime: new Date().toISOString(),
    message: "This content was generated at build time!",
  };
}

export default function SSGPage({
  buildTime,
  message,
}: {
  buildTime: string;
  message: string;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Static Site Generated Page</h1>
      <p>
        <strong>Build Time:</strong> {buildTime}
      </p>
      <p>
        <strong>Message:</strong> {message}
      </p>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        This HTML was generated at build time and served as a static file.
        Refresh the page — the build time stays the same.
      </p>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Client-Side Interactivity</h2>
      <p>This button works after hydration:</p>
      <button onClick={() => setLiked((l) => !l)}>
        {liked ? "❤️ Liked" : "🤍 Like this page"}
      </button>

      <hr style={{ margin: "1.5rem 0" }} />

      <p>
        <a href="/">Back to SPA Home</a>
      </p>
    </div>
  );
}
