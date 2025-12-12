import { db } from "#lib/db";
import clientType from "#models/crm/client_type";
import client from "#models/crm/client";
import { eq, desc, and, count } from "drizzle-orm";
import type {
  ClientType,
  NewClientType,
  IToggleClientType,
  IToggleClientTypeResult,
  IListClientTypesParams,
} from "#utils/dto/crm/clientType";

/**
 * Lista todos los tipos de cliente.
 * @param params Filtros de listado o boolean para compatibilidad
 * @returns Lista de tipos de cliente ordenados por ID descendente
 *
 * @example
 * ```ts
 * // Obtener solo tipos activos
 * const activeTypes = await listClientTypes();
 *
 * // Obtener todos los tipos
 * const allTypes = await listClientTypes({ activeOnly: false });
 * ```
 */
export async function listClientTypes(
  params: IListClientTypesParams | boolean = true
): Promise<ClientType[]> {
  // Compatibilidad con la API anterior que recibía boolean
  const activeOnly =
    typeof params === "boolean" ? params : params.activeOnly ?? true;

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
export async function getClientTypeById(
  id: number
): Promise<ClientType | undefined> {
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
export async function upsertClientType(
  payload: NewClientType
): Promise<[ClientType]> {
  const { id, ...data } = payload;

  if (typeof id !== "number") {
    const result = await db.insert(clientType).values(data).returning();
    return result as [ClientType];
  }

  const existing = await getClientTypeById(id);
  if (!existing) {
    throw new Error(`Tipo de cliente con ID ${id} no encontrado`);
  }

  const result = await db
    .update(clientType)
    .set(data)
    .where(eq(clientType.id, id))
    .returning();

  return result as [ClientType];
}

/**
 * Habilita o deshabilita un tipo de cliente.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar si hay clientes activos usando este tipo.
 *
 * @param payload ID y nuevo estado del tipo de cliente.
 * @returns Resultado de la operación con el tipo de cliente actualizado.
 *
 * @example
 * ```ts
 * const result = await toggleClientType({ id: 1, isEnabled: false });
 * if (result.success) {
 *   console.log("Tipo de cliente deshabilitado");
 * }
 * ```
 */
export async function toggleClientType(
  payload: IToggleClientType
): Promise<IToggleClientTypeResult> {
  const { id, isEnabled } = payload;

  const existing = await getClientTypeById(id);

  if (!existing) {
    throw new Error(`Tipo de cliente con ID ${id} no encontrado`);
  }

  // Regla: No deshabilitar si hay clientes activos usándolo
  if (!isEnabled) {
    const [result] = await db
      .select({ total: count() })
      .from(client)
      .where(and(eq(client.typeId, id), eq(client.active, true)));

    const activeClients = result?.total ?? 0;

    if (activeClients > 0) {
      throw new Error(
        `No se puede deshabilitar este tipo de cliente porque hay ${activeClients} cliente(s) activo(s) usándolo. ` +
          `Primero debe migrar estos clientes a otro tipo o desactivarlos.`
      );
    }
  }

  const [updated] = await db
    .update(clientType)
    .set({ isEnabled })
    .where(eq(clientType.id, id))
    .returning();

  return {
    success: true,
    clientType: updated,
    message: isEnabled
      ? "Tipo de cliente habilitado correctamente"
      : "Tipo de cliente deshabilitado correctamente",
  };
}

/**
 * Elimina un tipo de cliente por su ID.
 * @deprecated Usar toggleClientType con isEnabled=false en su lugar.
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

// Re-exportar DTOs
export type {
  ClientType,
  NewClientType,
  IClientType,
  IUpsertClientType,
  IToggleClientType,
  IToggleClientTypeResult,
  IListClientTypesParams,
} from "#utils/dto/crm/clientType";
