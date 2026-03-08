import { useState } from "react";
import { useRouter } from "#web/utils/components/router/hook";
import type { RenderingMode } from "#shared/ssr";

/** Opt-in to SSR with dynamic route params */
export const rendering: RenderingMode = "ssr";

/** Server-side props with dynamic params */
export async function getServerProps(ctx: {
  params: Record<string, string>;
  query: Record<string, string>;
  req: unknown;
}) {
  const { id } = ctx.params;
  return {
    id,
    title: `Detail #${id}`,
    description: `Server-rendered detail page for item ${id}`,
    timestamp: new Date().toISOString(),
  };
}

export default function TestSSRDetail({
  id,
  title,
  description,
  timestamp,
  params,
}: {
  id?: string;
  title?: string;
  description?: string;
  timestamp?: string;
  params?: Record<string, string>;
}) {
  const [liked, setLiked] = useState(false);
  const router = useRouter();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{title ?? `Detail ${params?.id ?? "?"}`}</h1>
      <p>{description ?? "Loading..."}</p>
      <p>Timestamp: {timestamp ?? "N/A"}</p>
      <button onClick={() => setLiked(!liked)}>
        {liked ? "Liked!" : "Like"}
      </button>
      <nav style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => router.navigate("/test-ssr")}>Back to SSR</button>
        <button onClick={() => router.navigate("/test-ssr/details/99")}>Detail #99</button>
        <button onClick={() => router.navigate("/test-spa")}>Test SPA</button>
        <button onClick={() => router.navigate("/")}>Home</button>
      </nav>
    </div>
  );
}
