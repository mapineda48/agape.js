/**
 * Servicio de Unidades de Medida (Unit of Measure - UOM)
 *
 * Gestiona la tabla `inventory_unit_of_measure`.
 *
 * **Reglas de negocio:**
 * - Normalización de código: El `code` debe guardarse siempre en mayúsculas y sin espacios.
 * - Unicidad semántica: Antes de crear, verificar que no exista una unidad con el mismo nombre pero diferente código.
 * - Integridad de Stock: No se puede deshabilitar si hay ítems de inventario usando esta UOM.
 * - Integridad de Conversiones: No se puede deshabilitar si es parte de una regla de conversión activa.
 */
import { db } from "#lib/db";
import { eq, ilike, and, count, sql } from "drizzle-orm";
import {
  unitOfMeasure,
  type NewUnitOfMeasure,
} from "#models/inventory/unit_of_measure";
import { inventoryItem } from "#models/inventory/item";
import { itemUom } from "#models/inventory/item_uom";
import { BusinessRuleError, NotFoundError } from "#lib/error";

import type {
  IUpsertUnitOfMeasure,
  IUnitOfMeasure,
  IToggleUnitOfMeasure,
  IToggleUnitOfMeasureResult,
  IListUnitOfMeasureParams,
  IUnitOfMeasureWithUsage,
  IUnitOfMeasureUsageInfo,
} from "#utils/dto/inventory/unit_of_measure";

// ============================================================================
// Funciones auxiliares
// ============================================================================

/**
 * Normaliza el código de UOM: mayúsculas y sin espacios.
 */
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/\s+/g, "");
}

/**
 * Convierte un registro de BD a DTO.
 */
function toDto(record: typeof unitOfMeasure.$inferSelect): IUnitOfMeasure {
  return {
    id: record.id,
    code: record.code,
    fullName: record.fullName,
    description: record.description ?? null,
    isEnabled: record.isEnabled,
  };
}

// ============================================================================
// Servicios de lectura
// ============================================================================

/**
 * Lista las unidades de medida según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de unidades de medida.
 *
 * @example
 * ```ts
 * const uoms = await listUnitOfMeasures({ activeOnly: true });
 * ```
 */
export async function listUnitOfMeasures(
  params: IListUnitOfMeasureParams = {}
): Promise<IUnitOfMeasureWithUsage[]> {
  const {
    activeOnly = true,
    code,
    fullName,
    includeUsageInfo = false,
  } = params;

  const conditions = [];

  if (activeOnly) {
    conditions.push(eq(unitOfMeasure.isEnabled, true));
  }

  if (code) {
    conditions.push(ilike(unitOfMeasure.code, `%${code}%`));
  }

  if (fullName) {
    conditions.push(ilike(unitOfMeasure.fullName, `%${fullName}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  if (includeUsageInfo) {
    // Query con conteo de uso
    const results = await db
      .select({
        id: unitOfMeasure.id,
        code: unitOfMeasure.code,
        fullName: unitOfMeasure.fullName,
        description: unitOfMeasure.description,
        isEnabled: unitOfMeasure.isEnabled,
        itemsCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${inventoryItem} 
          WHERE ${inventoryItem.uomId} = ${unitOfMeasure.id}
        )`,
        conversionsCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${itemUom} 
          WHERE ${itemUom.uomId} = ${unitOfMeasure.id} AND ${itemUom.isEnabled} = true
        )`,
      })
      .from(unitOfMeasure)
      .where(whereClause)
      .orderBy(unitOfMeasure.code);

    return results.map((r) => ({
      id: r.id,
      code: r.code,
      fullName: r.fullName,
      description: r.description ?? null,
      isEnabled: r.isEnabled,
      itemsCount: r.itemsCount,
      conversionsCount: r.conversionsCount,
    }));
  }

  const records = await db
    .select()
    .from(unitOfMeasure)
    .where(whereClause)
    .orderBy(unitOfMeasure.code);

  return records.map(toDto);
}

/**
 * Obtiene una unidad de medida por su ID.
 *
 * @param id ID de la UOM.
 * @returns UOM o undefined si no existe.
 */
export async function getUnitOfMeasureById(
  id: number
): Promise<IUnitOfMeasure | undefined> {
  const [record] = await db
    .select()
    .from(unitOfMeasure)
    .where(eq(unitOfMeasure.id, id));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene una unidad de medida por su código.
 *
 * @param code Código de la UOM.
 * @returns UOM o undefined si no existe.
 */
export async function getUnitOfMeasureByCode(
  code: string
): Promise<IUnitOfMeasure | undefined> {
  const normalizedCode = normalizeCode(code);
  const [record] = await db
    .select()
    .from(unitOfMeasure)
    .where(eq(unitOfMeasure.code, normalizedCode));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene información de uso de una UOM.
 *
 * @param id ID de la UOM.
 * @returns Información de uso.
 */
export async function getUnitOfMeasureUsageInfo(
  id: number
): Promise<IUnitOfMeasureUsageInfo> {
  // Contar ítems de inventario usando esta UOM
  const [{ value: inventoryItemsCount }] = await db
    .select({ value: count() })
    .from(inventoryItem)
    .where(eq(inventoryItem.uomId, id));

  // Contar conversiones activas usando esta UOM
  const [{ value: activeConversionsCount }] = await db
    .select({ value: count() })
    .from(itemUom)
    .where(and(eq(itemUom.uomId, id), eq(itemUom.isEnabled, true)));

  const canDisable = inventoryItemsCount === 0 && activeConversionsCount === 0;
  let reason: string | undefined;

  if (inventoryItemsCount > 0) {
    reason = `No se puede deshabilitar porque hay ${inventoryItemsCount} producto(s) usando esta unidad como base`;
  } else if (activeConversionsCount > 0) {
    reason = `No se puede deshabilitar porque hay ${activeConversionsCount} regla(s) de conversión activa(s)`;
  }

  return {
    inventoryItemsCount,
    activeConversionsCount,
    canDisable,
    reason,
  };
}

// ============================================================================
// Servicios de escritura
// ============================================================================

/**
 * Crea o actualiza una unidad de medida.
 *
 * **Reglas de negocio:**
 * - El código es normalizado a mayúsculas y sin espacios.
 * - Verifica unicidad semántica: no puede existir otra UOM con el mismo nombre pero diferente código.
 *
 * @param payload Datos de la UOM.
 * @returns Array con la UOM creada/actualizada.
 *
 * @example
 * ```ts
 * const [uom] = await upsertUnitOfMeasure({ code: "kg", fullName: "Kilogramo" });
 * console.log(uom.code); // "KG"
 * ```
 */
export async function upsertUnitOfMeasure(
  payload: IUpsertUnitOfMeasure
): Promise<[IUnitOfMeasure]> {
  const { id, code, fullName, description, isEnabled = true } = payload;
  const normalizedCode = normalizeCode(code);

  return db.transaction(async (tx) => {
    // Validar unicidad semántica: mismo nombre con diferente código
    const [existingByName] = await tx
      .select()
      .from(unitOfMeasure)
      .where(
        and(
          ilike(unitOfMeasure.fullName, fullName),
          sql`${unitOfMeasure.code} != ${normalizedCode}`
        )
      );

    if (existingByName && existingByName.id !== id) {
      throw new BusinessRuleError(
        `Ya existe una unidad de medida con el nombre "${fullName}" pero código diferente (${existingByName.code}). ` +
          `Verifique que no está duplicando la misma unidad.`
      );
    }

    let record: typeof unitOfMeasure.$inferSelect;

    if (typeof id !== "number") {
      // Crear nueva UOM
      const [inserted] = await tx
        .insert(unitOfMeasure)
        .values({
          code: normalizedCode,
          fullName,
          description: description ?? null,
          isEnabled,
        } satisfies NewUnitOfMeasure)
        .returning();

      record = inserted;
    } else {
      // Verificar que existe
      const [existing] = await tx
        .select()
        .from(unitOfMeasure)
        .where(eq(unitOfMeasure.id, id));

      if (!existing) {
        throw new NotFoundError(`Unidad de medida con ID ${id} no encontrada`);
      }

      // Actualizar UOM existente
      const [updated] = await tx
        .update(unitOfMeasure)
        .set({
          code: normalizedCode,
          fullName,
          description: description ?? null,
          isEnabled,
        })
        .where(eq(unitOfMeasure.id, id))
        .returning();

      record = updated;
    }

    return [toDto(record)];
  });
}

/**
 * Habilita o deshabilita una unidad de medida.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar si hay ítems de inventario usando esta UOM como unidad base.
 * - No se puede deshabilitar si es parte de una regla de conversión activa.
 *
 * @param payload DTO con ID y nuevo estado.
 * @returns Resultado de la operación con mensaje informativo.
 *
 * @example
 * ```ts
 * const result = await toggleUnitOfMeasure({ id: 1, isEnabled: false });
 * if (!result.success) {
 *   console.log(result.message);
 * }
 * ```
 */
export async function toggleUnitOfMeasure(
  payload: IToggleUnitOfMeasure
): Promise<IToggleUnitOfMeasureResult> {
  const { id, isEnabled } = payload;

  return db.transaction(async (tx) => {
    // Verificar que existe
    const [existing] = await tx
      .select()
      .from(unitOfMeasure)
      .where(eq(unitOfMeasure.id, id));

    if (!existing) {
      throw new NotFoundError(`Unidad de medida con ID ${id} no encontrada`);
    }

    // Si se está habilitando, no hay restricciones
    if (isEnabled) {
      const [updated] = await tx
        .update(unitOfMeasure)
        .set({ isEnabled: true })
        .where(eq(unitOfMeasure.id, id))
        .returning();

      return {
        success: true,
        unitOfMeasure: toDto(updated),
        message: `Unidad de medida "${updated.code}" habilitada correctamente`,
      };
    }

    // Validar integridad antes de deshabilitar
    // R1: Verificar uso en ítems de inventario
    const [{ value: inventoryItemsCount }] = await tx
      .select({ value: count() })
      .from(inventoryItem)
      .where(eq(inventoryItem.uomId, id));

    if (inventoryItemsCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar la unidad "${existing.code}" porque hay ${inventoryItemsCount} producto(s) activo(s) usándola como unidad base`
      );
    }

    // R2: Verificar uso en conversiones activas
    const [{ value: activeConversionsCount }] = await tx
      .select({ value: count() })
      .from(itemUom)
      .where(and(eq(itemUom.uomId, id), eq(itemUom.isEnabled, true)));

    if (activeConversionsCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar la unidad "${existing.code}" porque hay ${activeConversionsCount} regla(s) de conversión activa(s) que la usan`
      );
    }

    // Deshabilitar
    const [updated] = await tx
      .update(unitOfMeasure)
      .set({ isEnabled: false })
      .where(eq(unitOfMeasure.id, id))
      .returning();

    return {
      success: true,
      unitOfMeasure: toDto(updated),
      message: `Unidad de medida "${updated.code}" deshabilitada correctamente`,
    };
  });
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  IUpsertUnitOfMeasure,
  IUnitOfMeasure,
  IToggleUnitOfMeasure,
  IToggleUnitOfMeasureResult,
  IListUnitOfMeasureParams,
  IUnitOfMeasureWithUsage,
  IUnitOfMeasureUsageInfo,
} from "#utils/dto/inventory/unit_of_measure";
