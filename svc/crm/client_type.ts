import { db } from "#lib/db";
import client_type from "#models/crm/client_type";
import { eq, desc } from "drizzle-orm";

/**
 * Lista todos los tipos de cliente ordenados por ID descendente
 */
export async function listClientTypes() {
  return db.select().from(client_type).orderBy(desc(client_type.id));
}

/**
 * Obtiene un tipo de cliente por su ID
 */
export async function getClientType(id: number) {
  const [record] = await db
    .select()
    .from(client_type)
    .where(eq(client_type.id, id));

  return record;
}

/**
 * Crea un nuevo tipo de cliente
 */
export async function createClientType(data: {
  name: string;
  isEnabled?: boolean;
}) {
  const [record] = await db
    .insert(client_type)
    .values({
      name: data.name,
      isEnabled: data.isEnabled ?? false,
    })
    .returning();

  return record;
}

/**
 * Actualiza un tipo de cliente existente
 */
export async function updateClientType(
  id: number,
  data: {
    name: string;
    isEnabled?: boolean;
  }
) {
  const [record] = await db
    .update(client_type)
    .set({
      name: data.name,
      isEnabled: data.isEnabled ?? false,
    })
    .where(eq(client_type.id, id))
    .returning();

  return record;
}

/**
 * Elimina un tipo de cliente por su ID
 */
export async function deleteClientType(id: number) {
  await db.delete(client_type).where(eq(client_type.id, id));
}
