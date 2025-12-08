import { db } from "#lib/db";
import clientType, { type NewClientType } from "#models/crm/client_type";
import { eq, desc } from "drizzle-orm";

/**
 * Lista todos los tipos de cliente.
 * @param activeOnly Si es true, retorna solo los tipos habilitados (por defecto: true)
 * @returns Lista de tipos de cliente ordenados por ID descendente
 *
 * @example
 * ```ts
 * // Obtener solo tipos activos
 * const activeTypes = await listClientTypes();
 *
 * // Obtener todos los tipos
 * const allTypes = await listClientTypes(false);
 * ```
 */
export async function listClientTypes(activeOnly = true) {
  const query = db.select().from(clientType);

  if (activeOnly) {
    return query
      .where(eq(clientType.isEnabled, true))
      .orderBy(desc(clientType.id));
  }

  return query.orderBy(desc(clientType.id));
}

/**
 * Obtiene un tipo de cliente por su ID.
 * @param id Identificador único del tipo de cliente
 * @returns El tipo de cliente o undefined si no existe
 *
 * @example
 * ```ts
 * const type = await getClientTypeById(1);
 * if (type) {
 *   console.log(type.name);
 * }
 * ```
 */
export async function getClientTypeById(id: number) {
  const [record] = await db
    .select()
    .from(clientType)
    .where(eq(clientType.id, id));

  return record;
}

/**
 * Inserta o actualiza un tipo de cliente.
 * Si el payload incluye `id`, actualiza el registro existente.
 * Si no incluye `id`, crea un nuevo registro.
 *
 * @param payload Datos del tipo de cliente a insertar o actualizar
 * @returns El tipo de cliente insertado o actualizado
 *
 * @example
 * ```ts
 * // Crear nuevo tipo
 * const [newType] = await upsertClientType({
 *   name: "VIP",
 *   isEnabled: true,
 * });
 *
 * // Actualizar tipo existente
 * const [updated] = await upsertClientType({
 *   id: 1,
 *   name: "VIP Premium",
 *   isEnabled: true,
 * });
 * ```
 */
export async function upsertClientType(payload: NewClientType) {
  const { id, ...data } = payload;

  if (typeof id !== "number") {
    return db.insert(clientType).values(data).returning();
  }

  return db
    .update(clientType)
    .set(data)
    .where(eq(clientType.id, id))
    .returning();
}

/**
 * Elimina un tipo de cliente por su ID.
 * @param id Identificador único del tipo de cliente a eliminar
 *
 * @example
 * ```ts
 * await deleteClientType(1);
 * ```
 */
export async function deleteClientType(id: number) {
  await db.delete(clientType).where(eq(clientType.id, id));
}

// ============================================================================
// Types
// ============================================================================

/**
 * Tipo de cliente individual del listado.
 */
export type ClientType = Awaited<ReturnType<typeof listClientTypes>>[number];

/**
 * Re-exportación del tipo para creación/actualización.
 */
export type { NewClientType };
