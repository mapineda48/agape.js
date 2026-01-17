/**
 * Servicio de Listas de Precios (Price List Service)
 *
 * Gestiona la tabla `catalogs_price_list`.
 *
 * **Reglas de negocio:**
 * - Unicidad de Default: Solo puede haber una lista marcada como default.
 * - Protección de Default: No se puede deshabilitar la lista que está marcada como default.
 * - Al marcar una nueva lista como default, se quita el flag de la anterior.
 */
import { db } from "#lib/db";
import { eq, and, ne, count, sql } from "drizzle-orm";
import { priceList, type NewPriceList } from "#models/catalogs/price_list";
import { BusinessRuleError, NotFoundError } from "#lib/error";

import type {
  IUpsertPriceList,
  IPriceList,
  ITogglePriceList,
  ITogglePriceListResult,
  ISetDefaultPriceList,
  ISetDefaultPriceListResult,
  IListPriceListsParams,
  IPriceListWithUsage,
  IPriceListUsageInfo,
} from "#utils/dto/catalogs/price_list";

// ============================================================================
// Funciones auxiliares
// ============================================================================

/**
 * Convierte un registro de BD a DTO.
 */
function toDto(record: typeof priceList.$inferSelect): IPriceList {
  return {
    id: record.id,
    code: record.code,
    fullName: record.fullName,
    description: record.description ?? null,
    isDefault: record.isDefault,
    isEnabled: record.isEnabled,
  };
}

// ============================================================================
// Servicios de lectura
// ============================================================================

/**
 * Lista las listas de precios según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de listas de precios.
 * @permission catalogs.price_list.read
 * *
 */
export async function listPriceLists(
  params: IListPriceListsParams = {}
): Promise<IPriceListWithUsage[]> {
  const { activeOnly = true, includeUsageInfo = false } = params;

  const whereClause = activeOnly ? eq(priceList.isEnabled, true) : undefined;

  // Por ahora implementamos sin conteo de uso (se puede agregar después)
  const records = await db
    .select()
    .from(priceList)
    .where(whereClause)
    .orderBy(priceList.code);

  return records.map((r) => ({
    ...toDto(r),
    // Se pueden agregar conteos cuando existan las tablas relacionadas
    itemsCount: includeUsageInfo ? 0 : undefined,
    clientsCount: includeUsageInfo ? 0 : undefined,
  }));
}

/**
 * Obtiene una lista de precios por su ID.
 *
 * @param id ID de la lista.
 * @returns Lista o undefined si no existe.
 * @permission catalogs.price_list.read
 */
export async function getPriceListById(
  id: number
): Promise<IPriceList | undefined> {
  const [record] = await db
    .select()
    .from(priceList)
    .where(eq(priceList.id, id));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene la lista de precios default.
 *
 * @returns Lista default o undefined si no hay ninguna.
 * @permission catalogs.price_list.read
 */
export async function getDefaultPriceList(): Promise<IPriceList | undefined> {
  const [record] = await db
    .select()
    .from(priceList)
    .where(eq(priceList.isDefault, true));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene información de uso de una lista de precios.
 *
 * @param id ID de la lista.
 * @returns Información de uso.
 * @permission catalogs.price_list.read
 */
export async function getPriceListUsageInfo(
  id: number
): Promise<IPriceListUsageInfo> {
  const [record] = await db
    .select()
    .from(priceList)
    .where(eq(priceList.id, id));

  if (!record) {
    throw new NotFoundError(`Lista de precios con ID ${id} no encontrada`);
  }

  // Por ahora, los conteos se dejan en 0 hasta que existan las tablas relacionadas
  const itemsWithPriceCount = 0;
  const clientsCount = 0;

  const canDisable =
    !record.isDefault && itemsWithPriceCount === 0 && clientsCount === 0;
  let reason: string | undefined;

  if (record.isDefault) {
    reason = "No se puede deshabilitar la lista de precios por defecto";
  } else if (itemsWithPriceCount > 0) {
    reason = `No se puede deshabilitar porque hay ${itemsWithPriceCount} producto(s) con precio`;
  } else if (clientsCount > 0) {
    reason = `No se puede deshabilitar porque hay ${clientsCount} cliente(s) con esta lista asignada`;
  }

  return {
    itemsWithPriceCount,
    clientsCount,
    isDefault: record.isDefault,
    canDisable,
    reason,
  };
}

// ============================================================================
// Servicios de escritura
// ============================================================================

/**
 * Crea o actualiza una lista de precios.
 *
 * **Reglas de negocio:**
 * - Si isDefault es true, se quita el flag de cualquier otra lista que lo tenga.
 *
 * @param payload Datos de la lista de precios.
 * @returns Array con la lista creada/actualizada.
 * @permission catalogs.price_list.manage
 * *
 */
export async function upsertPriceList(
  payload: IUpsertPriceList
): Promise<[IPriceList]> {
  const {
    id,
    code,
    fullName,
    description,
    isDefault = false,
    isEnabled = true,
  } = payload;

  return db.transaction(async (tx) => {
    // R1: Si se marca como default, quitar el flag de otras listas
    if (isDefault) {
      await tx
        .update(priceList)
        .set({ isDefault: false })
        .where(
          id
            ? and(eq(priceList.isDefault, true), ne(priceList.id, id))
            : eq(priceList.isDefault, true)
        );
    }

    let record: typeof priceList.$inferSelect;

    if (typeof id !== "number") {
      // Crear nueva lista
      const [inserted] = await tx
        .insert(priceList)
        .values({
          code: code.toUpperCase(),
          fullName,
          description: description ?? null,
          isDefault,
          isEnabled,
        } satisfies NewPriceList)
        .returning();

      record = inserted;
    } else {
      // Verificar que existe
      const [existing] = await tx
        .select()
        .from(priceList)
        .where(eq(priceList.id, id));

      if (!existing) {
        throw new NotFoundError(`Lista de precios con ID ${id} no encontrada`);
      }

      // Actualizar
      const [updated] = await tx
        .update(priceList)
        .set({
          code: code.toUpperCase(),
          fullName,
          description: description ?? null,
          isDefault,
          isEnabled,
        })
        .where(eq(priceList.id, id))
        .returning();

      record = updated;
    }

    return [toDto(record)];
  });
}

/**
 * Establece una lista de precios como default.
 *
 * **Reglas de negocio:**
 * - Solo puede haber una lista default.
 * - Se quita el flag de la anterior y se pone en la nueva.
 *
 * @param payload DTO con el ID de la lista.
 * @returns Resultado con la nueva lista default y la anterior.
 * @permission catalogs.price_list.manage
 */
export async function setDefaultPriceList(
  payload: ISetDefaultPriceList
): Promise<ISetDefaultPriceListResult> {
  const { id } = payload;

  return db.transaction(async (tx) => {
    // Verificar que existe
    const [existing] = await tx
      .select()
      .from(priceList)
      .where(eq(priceList.id, id));

    if (!existing) {
      throw new NotFoundError(`Lista de precios con ID ${id} no encontrada`);
    }

    // Verificar que está habilitada
    if (!existing.isEnabled) {
      throw new BusinessRuleError(
        "No se puede marcar como default una lista de precios deshabilitada"
      );
    }

    // Si ya es default, no hay nada que hacer
    if (existing.isDefault) {
      return {
        success: true,
        priceList: toDto(existing),
        message: `La lista "${existing.code}" ya es la lista por defecto`,
      };
    }

    // Buscar la lista default actual
    const [currentDefault] = await tx
      .select()
      .from(priceList)
      .where(eq(priceList.isDefault, true));

    // Quitar flag de la anterior
    if (currentDefault) {
      await tx
        .update(priceList)
        .set({ isDefault: false })
        .where(eq(priceList.id, currentDefault.id));
    }

    // Poner flag en la nueva
    const [updated] = await tx
      .update(priceList)
      .set({ isDefault: true })
      .where(eq(priceList.id, id))
      .returning();

    return {
      success: true,
      priceList: toDto(updated),
      previousDefault: currentDefault ? toDto(currentDefault) : undefined,
      message: `Lista "${updated.code}" establecida como lista por defecto`,
    };
  });
}

/**
 * Habilita o deshabilita una lista de precios.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar la lista que está marcada como default.
 *
 * @param payload DTO con ID y nuevo estado.
 * @returns Resultado de la operación.
 * @permission catalogs.price_list.manage
 */
export async function togglePriceList(
  payload: ITogglePriceList
): Promise<ITogglePriceListResult> {
  const { id, isEnabled } = payload;

  return db.transaction(async (tx) => {
    // Verificar que existe
    const [existing] = await tx
      .select()
      .from(priceList)
      .where(eq(priceList.id, id));

    if (!existing) {
      throw new NotFoundError(`Lista de precios con ID ${id} no encontrada`);
    }

    // Si se está habilitando, no hay restricciones
    if (isEnabled) {
      const [updated] = await tx
        .update(priceList)
        .set({ isEnabled: true })
        .where(eq(priceList.id, id))
        .returning();

      return {
        success: true,
        priceList: toDto(updated),
        message: `Lista de precios "${updated.code}" habilitada correctamente`,
      };
    }

    // R1: No se puede deshabilitar la lista default
    if (existing.isDefault) {
      throw new BusinessRuleError(
        `No se puede deshabilitar la lista "${existing.code}" porque es la lista de precios por defecto. ` +
        `Primero asigne el default a otra lista.`
      );
    }

    // Deshabilitar
    const [updated] = await tx
      .update(priceList)
      .set({ isEnabled: false })
      .where(eq(priceList.id, id))
      .returning();

    return {
      success: true,
      priceList: toDto(updated),
      message: `Lista de precios "${updated.code}" deshabilitada correctamente`,
    };
  });
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  IUpsertPriceList,
  IPriceList,
  ITogglePriceList,
  ITogglePriceListResult,
  ISetDefaultPriceList,
  ISetDefaultPriceListResult,
  IListPriceListsParams,
  IPriceListWithUsage,
  IPriceListUsageInfo,
} from "#utils/dto/catalogs/price_list";
