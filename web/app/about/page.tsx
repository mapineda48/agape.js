import type { RenderingMode } from "#shared/ssr";
import { useRouter } from "#web/utils/components/router/hook";

/** Opt-in to SSR for this page */
export const rendering: RenderingMode = "ssr";

/** Server-side props fetcher */
export async function getServerProps(ctx: {
  params: Record<string, string>;
  query: Record<string, string>;
  req: unknown;
}) {
  return {
    serverTime: new Date().toISOString(),
    message: "Hello from the server!",
  };
}

export default function About({
  serverTime,
  message,
}: {
  serverTime?: string;
  message?: string;
}) {
  const router = useRouter();
  return (
    <div onClick={() => router.navigate("/")}>
      <h1>About (SSR)</h1>
      {message && <p>{message}</p>}
      {serverTime && <p>Server time: {serverTime}</p>}
    </div>
  );
}
