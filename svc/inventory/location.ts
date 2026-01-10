import { db } from "#lib/db";
import location, { type NewLocation } from "#models/inventory/location";
import { desc, eq } from "drizzle-orm";

/**
 * Lista todas las ubicaciones de inventario.
 * @param activeOnly Si es true, retorna solo las ubicaciones activas
 * @returns Lista de ubicaciones ordenadas por ID descendente
 * @permission inventory.location.read
 */
export async function listLocations(activeOnly = true) {
  const query = db.select().from(location).orderBy(desc(location.id));

  if (activeOnly) {
    return query.where(eq(location.isEnabled, true));
  }

  return query;
}

/**
 * Obtiene una ubicación por su ID.
 * @param id Identificador único de la ubicación
 * @returns Ubicación encontrada o undefined si no existe
 * @permission inventory.location.read
 */
export async function getLocationById(id: number) {
  const [record] = await db.select().from(location).where(eq(location.id, id));

  return record;
}

/**
 * Inserta o actualiza una ubicación de inventario.
 * @param payload Datos de la ubicación a insertar o actualizar
 * @returns La ubicación insertada o actualizada
 * @permission inventory.location.manage
 */
export async function upsertLocation(payload: NewLocation) {
  const { id, ...data } = payload;

  if (typeof id !== "number") {
    return db.insert(location).values(data).returning();
  }

  return db.update(location).set(data).where(eq(location.id, id)).returning();
}
