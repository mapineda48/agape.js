/**
 * Server-side Service Caller
 *
 * Allows calling service functions directly from Next.js Server Components
 * by wrapping them in the AsyncLocalStorage context.
 *
 * This enables the same service to work transparently:
 * - Client: via RPC (MessagePack over HTTP)
 * - Server: via direct import with runContext
 *
 * @example
 * ```tsx
 * // app/dashboard/page.tsx (Server Component - zero JS to client)
 * import { callService } from "#lib/rpc/server";
 * import { getAnnouncements } from "#svc/greet";
 *
 * export default async function Dashboard() {
 *   const items = await callService(getAnnouncements);
 *   return <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
 * }
 * ```
 */

import { runContext, type IContext } from "#lib/context";

const AGAPE_TENANT = process.env.AGAPE_TENANT ?? "agape_app_development_demo";

/**
 * Default public context for unauthenticated SSR calls.
 */
function createPublicContext(): IContext {
  return {
    id: 0,
    tenant: AGAPE_TENANT,
    permissions: ["public.*"],
    session: new Map(),
    source: "http",
  };
}

/**
 * Calls a service function within a server-side context.
 *
 * Use this in Server Components to call the same service functions
 * that are exposed via RPC on the client side.
 *
 * @param fn - The service function to call
 * @param args - Arguments to pass to the function
 * @param ctx - Optional context override (defaults to public context)
 */
export function callService<A extends unknown[], R>(
  fn: (...args: A) => R,
  ...args: A
): R {
  const ctx = createPublicContext();
  return runContext(ctx, () => fn(...args));
}
