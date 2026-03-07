/**
 * Greeting & Announcements Service
 *
 * Usable from:
 * - Client: import { getGreeting } from "#services/greet" (RPC via MessagePack)
 * - Server: import { getGreeting } from "#svc/greet" + callService(getGreeting, ...)
 */

import DateTime from "#shared/data/DateTime";

/**
 * Returns a greeting with server timestamp.
 * @public
 */
export function getGreeting(name: string) {
  const now = DateTime.create();
  const hour = now.getHours();

  let period: string;
  if (hour < 12) period = "Buenos dias";
  else if (hour < 18) period = "Buenas tardes";
  else period = "Buenas noches";

  return {
    message: `${period}, ${name}!`,
    serverTime: now.toISOString(),
    timestamp: now.getTime(),
  };
}

/**
 * Returns a list of recent announcements.
 * @public
 */
export function getAnnouncements() {
  return [
    {
      id: 1,
      title: "Migracion a Next.js completada",
      body: "El sistema ahora usa Next.js con SSR y mantiene MessagePack + Socket.IO.",
      date: "2026-03-06",
    },
    {
      id: 2,
      title: "Nuevo sistema de permisos",
      body: "RBAC con soporte de wildcards (ej: sales.*) esta disponible.",
      date: "2026-03-01",
    },
    {
      id: 3,
      title: "Soporte de archivos",
      body: "Upload de archivos via MessagePack con Azure Blob Storage.",
      date: "2026-02-15",
    },
  ];
}
