/**
 * SSR Page - Zero JavaScript sent to the client.
 *
 * This is a Next.js Server Component that calls service functions
 * directly on the server via callService(). The same functions
 * are available on the client via RPC (MessagePack).
 *
 * Server: import { getGreeting } from "#svc/greet" → callService(getGreeting, "...")
 * Client: import { getGreeting } from "#services/greet" → getGreeting("...") (RPC)
 */

import { callService } from "#lib/rpc/server";
import { getGreeting, getAnnouncements } from "#svc/greet";

export const dynamic = "force-dynamic";

export default async function SSRPage() {
  const greeting = await callService(getGreeting, "Agape");
  const announcements = await callService(getAnnouncements);

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 700, margin: "0 auto", padding: "2rem" }}>
      <h1>{greeting.message}</h1>
      <p style={{ color: "#666" }}>
        Hora del servidor: {greeting.serverTime}
      </p>

      <hr style={{ margin: "2rem 0", border: "none", borderTop: "1px solid #eee" }} />

      <h2>Anuncios</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {announcements.map((a) => (
          <li
            key={a.id}
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
            }}
          >
            <strong>{a.title}</strong>
            <p style={{ margin: "0.5rem 0 0", color: "#555" }}>{a.body}</p>
            <small style={{ color: "#999" }}>{a.date}</small>
          </li>
        ))}
      </ul>

      <hr style={{ margin: "2rem 0", border: "none", borderTop: "1px solid #eee" }} />

      <footer style={{ color: "#999", fontSize: 14 }}>
        <p>Esta pagina es 100% SSR — cero JavaScript enviado al cliente.</p>
        <p>
          El servicio <code>getGreeting</code> y <code>getAnnouncements</code> se
          llaman directamente en el servidor via <code>callService()</code>.
        </p>
        <p>
          Los mismos servicios estan disponibles en el cliente via RPC con MessagePack:
          <br />
          <code>import {"{ getGreeting }"} from &quot;#services/greet&quot;</code>
        </p>
      </footer>
    </main>
  );
}
