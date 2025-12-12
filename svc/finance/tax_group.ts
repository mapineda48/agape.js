/**
 * Servicio de Grupos de Impuestos (Tax Group Service)
 *
 * Gestiona las tablas `finance_tax_group`, `finance_tax` y `finance_tax_group_tax`.
 *
 * **Reglas de negocio:**
 * - Composición obligatoria: Un TaxGroup debe tener al menos un impuesto asociado.
 * - Consistencia de relación: Al guardar, se limpia la relación previa y se recrea.
 * - Existencia de impuestos: Validar que todos los taxIds existan y estén activos.
 * - No se puede deshabilitar si hay productos activos usándolo.
 */
import { db } from "#lib/db";
import { eq, and, count, sql, inArray } from "drizzle-orm";
import { taxGroup, type NewTaxGroup } from "#models/finance/tax_group";
import { tax, type NewTax } from "#models/finance/tax";
import {
  taxGroupTax,
  type NewTaxGroupTax,
} from "#models/finance/tax_group_tax";
import { item } from "#models/catalogs/item";
import salesInvoiceItem from "#models/finance/sales_invoice_item";
import purchaseInvoiceItem from "#models/finance/purchase_invoice_item";
import salesInvoice from "#models/finance/sales_invoice";
import { BusinessRuleError, NotFoundError } from "#lib/error";
import Decimal from "#utils/data/Decimal";

import type {
  IUpsertTax,
  ITax,
  IUpsertTaxGroup,
  ITaxGroup,
  ITaxGroupWithTaxes,
  IToggleTaxGroup,
  IToggleTaxGroupResult,
  IToggleTax,
  IToggleTaxResult,
  ITaxUsageInfo,
  IListTaxGroupsParams,
  IListTaxesParams,
  ITaxGroupUsageInfo,
} from "#utils/dto/finance/tax_group";

// ============================================================================
// Funciones auxiliares
// ============================================================================

/**
 * Convierte un registro de Tax de BD a DTO.
 */
function toTaxDto(record: typeof tax.$inferSelect): ITax {
  return {
    id: record.id,
    code: record.code,
    fullName: record.fullName,
    description: record.description ?? null,
    rate: record.rate,
    isEnabled: record.isEnabled,
  };
}

/**
 * Convierte un registro de TaxGroup de BD a DTO.
 */
function toTaxGroupDto(record: typeof taxGroup.$inferSelect): ITaxGroup {
  return {
    id: record.id,
    code: record.code,
    fullName: record.fullName,
    description: record.description ?? null,
    isEnabled: record.isEnabled,
  };
}

// ============================================================================
// Servicios de Impuestos (Tax)
// ============================================================================

/**
 * Lista los impuestos según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de impuestos.
 */
export async function listTaxes(
  params: IListTaxesParams = {}
): Promise<ITax[]> {
  const { activeOnly = true } = params;

  const whereClause = activeOnly ? eq(tax.isEnabled, true) : undefined;

  const records = await db
    .select()
    .from(tax)
    .where(whereClause)
    .orderBy(tax.code);

  return records.map(toTaxDto);
}

/**
 * Obtiene un impuesto por su ID.
 *
 * @param id ID del impuesto.
 * @returns Impuesto o undefined si no existe.
 */
export async function getTaxById(id: number): Promise<ITax | undefined> {
  const [record] = await db.select().from(tax).where(eq(tax.id, id));

  return record ? toTaxDto(record) : undefined;
}

/**
 * Crea o actualiza un impuesto.
 *
 * @param payload Datos del impuesto.
 * @returns Array con el impuesto creado/actualizado.
 */
export async function upsertTax(payload: IUpsertTax): Promise<[ITax]> {
  const { id, code, fullName, description, rate, isEnabled = true } = payload;

  let record: typeof tax.$inferSelect;

  if (typeof id !== "number") {
    // Crear nuevo impuesto
    const [inserted] = await db
      .insert(tax)
      .values({
        code: code.toUpperCase(),
        fullName,
        description: description ?? null,
        rate,
        isEnabled,
      } satisfies NewTax)
      .returning();

    record = inserted;
  } else {
    // Verificar que existe
    const [existing] = await db.select().from(tax).where(eq(tax.id, id));

    if (!existing) {
      throw new NotFoundError(`Impuesto con ID ${id} no encontrado`);
    }

    // Actualizar
    const [updated] = await db
      .update(tax)
      .set({
        code: code.toUpperCase(),
        fullName,
        description: description ?? null,
        rate,
        isEnabled,
      })
      .where(eq(tax.id, id))
      .returning();

    record = updated;
  }

  return [toTaxDto(record)];
}

/**
 * Obtiene información de uso de un impuesto individual.
 *
 * @param id ID del impuesto.
 * @returns Información de uso.
 */
export async function getTaxUsageInfo(id: number): Promise<ITaxUsageInfo> {
  // Verificar que el impuesto existe
  const [taxRecord] = await db.select().from(tax).where(eq(tax.id, id));

  if (!taxRecord) {
    throw new NotFoundError(`Impuesto con ID ${id} no encontrado`);
  }

  // Contar líneas de facturas de venta con este impuesto que NO están canceladas
  const [{ value: salesInvoiceItemsCount }] = await db
    .select({ value: count() })
    .from(salesInvoiceItem)
    .innerJoin(
      salesInvoice,
      eq(salesInvoiceItem.salesInvoiceId, salesInvoice.id)
    )
    .where(
      and(
        eq(salesInvoiceItem.taxId, id),
        sql`${salesInvoice.status} != 'cancelled'`
      )
    );

  // Contar líneas de facturas de compra con este impuesto
  const [{ value: purchaseInvoiceItemsCount }] = await db
    .select({ value: count() })
    .from(purchaseInvoiceItem)
    .where(eq(purchaseInvoiceItem.taxId, id));

  // Contar grupos de impuestos activos que incluyen este impuesto
  const [{ value: activeTaxGroupsCount }] = await db
    .select({ value: count() })
    .from(taxGroupTax)
    .innerJoin(taxGroup, eq(taxGroupTax.taxGroupId, taxGroup.id))
    .where(and(eq(taxGroupTax.taxId, id), eq(taxGroup.isEnabled, true)));

  // Determinar si se puede deshabilitar
  const hasOpenInvoices =
    salesInvoiceItemsCount > 0 || purchaseInvoiceItemsCount > 0;
  const canDisable = !hasOpenInvoices && activeTaxGroupsCount === 0;

  let reason: string | undefined;
  if (hasOpenInvoices) {
    reason = `No se puede deshabilitar porque hay facturas activas: ${salesInvoiceItemsCount} línea(s) de venta, ${purchaseInvoiceItemsCount} línea(s) de compra`;
  } else if (activeTaxGroupsCount > 0) {
    reason = `No se puede deshabilitar porque está incluido en ${activeTaxGroupsCount} grupo(s) de impuestos activo(s)`;
  }

  return {
    salesInvoiceItemsCount,
    purchaseInvoiceItemsCount,
    activeTaxGroupsCount,
    canDisable,
    reason,
  };
}

/**
 * Habilita o deshabilita un impuesto individual.
 *
 * **Reglas de negocio (UC-9):**
 * - No se puede deshabilitar si está en uso en items de facturas abiertas.
 * - No se puede deshabilitar si está incluido en grupos de impuestos activos.
 * - Habilitar siempre está permitido.
 *
 * @param payload DTO con ID y nuevo estado.
 * @returns Resultado de la operación.
 *
 * @example
 * ```ts
 * const result = await toggleTax({ id: 1, isEnabled: false });
 * if (!result.success) {
 *   console.log(result.message);
 * }
 * ```
 */
export async function toggleTax(
  payload: IToggleTax
): Promise<IToggleTaxResult> {
  const { id, isEnabled } = payload;

  return db.transaction(async (tx) => {
    // Verificar que existe
    const [existing] = await tx.select().from(tax).where(eq(tax.id, id));

    if (!existing) {
      throw new NotFoundError(`Impuesto con ID ${id} no encontrado`);
    }

    // Si se está habilitando, no hay restricciones
    if (isEnabled) {
      const [updated] = await tx
        .update(tax)
        .set({ isEnabled: true })
        .where(eq(tax.id, id))
        .returning();

      return {
        success: true,
        tax: toTaxDto(updated),
        message: `Impuesto "${updated.code}" habilitado correctamente`,
      };
    }

    // Validar que no hay facturas de venta abiertas usando este impuesto
    const [{ value: salesCount }] = await tx
      .select({ value: count() })
      .from(salesInvoiceItem)
      .innerJoin(
        salesInvoice,
        eq(salesInvoiceItem.salesInvoiceId, salesInvoice.id)
      )
      .where(
        and(
          eq(salesInvoiceItem.taxId, id),
          sql`${salesInvoice.status} != 'cancelled'`
        )
      );

    if (salesCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar el impuesto "${existing.code}" porque hay ${salesCount} línea(s) de factura de venta activa(s) usándolo. ` +
          `Deshabilitar este impuesto podría generar inconsistencias en facturación electrónica.`
      );
    }

    // Validar que no hay facturas de compra usando este impuesto
    const [{ value: purchaseCount }] = await tx
      .select({ value: count() })
      .from(purchaseInvoiceItem)
      .where(eq(purchaseInvoiceItem.taxId, id));

    if (purchaseCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar el impuesto "${existing.code}" porque hay ${purchaseCount} línea(s) de factura de compra registrada(s) usándolo.`
      );
    }

    // Validar que no está en grupos de impuestos activos
    const [{ value: activeGroupsCount }] = await tx
      .select({ value: count() })
      .from(taxGroupTax)
      .innerJoin(taxGroup, eq(taxGroupTax.taxGroupId, taxGroup.id))
      .where(and(eq(taxGroupTax.taxId, id), eq(taxGroup.isEnabled, true)));

    if (activeGroupsCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar el impuesto "${existing.code}" porque está incluido en ${activeGroupsCount} grupo(s) de impuestos activo(s). ` +
          `Primero debe removerlo de esos grupos o deshabilitarlos.`
      );
    }

    // Deshabilitar
    const [updated] = await tx
      .update(tax)
      .set({ isEnabled: false })
      .where(eq(tax.id, id))
      .returning();

    return {
      success: true,
      tax: toTaxDto(updated),
      message: `Impuesto "${updated.code}" deshabilitado correctamente`,
    };
  });
}

// ============================================================================
// Servicios de Grupos de Impuestos (Tax Group)
// ============================================================================

/**
 * Lista los grupos de impuestos según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de grupos de impuestos.
 */
export async function listTaxGroups(
  params: IListTaxGroupsParams = {}
): Promise<ITaxGroupWithTaxes[]> {
  const { activeOnly = true, includeTaxes = true } = params;

  const whereClause = activeOnly ? eq(taxGroup.isEnabled, true) : undefined;

  const groups = await db
    .select()
    .from(taxGroup)
    .where(whereClause)
    .orderBy(taxGroup.code);

  if (!includeTaxes) {
    return groups.map((g) => ({
      ...toTaxGroupDto(g),
      taxes: [],
      totalRate: new Decimal(0),
    }));
  }

  // Obtener impuestos para cada grupo
  const result: ITaxGroupWithTaxes[] = [];

  for (const group of groups) {
    const taxes = await db
      .select({
        id: tax.id,
        code: tax.code,
        fullName: tax.fullName,
        description: tax.description,
        rate: tax.rate,
        isEnabled: tax.isEnabled,
      })
      .from(taxGroupTax)
      .innerJoin(tax, eq(taxGroupTax.taxId, tax.id))
      .where(eq(taxGroupTax.taxGroupId, group.id));

    const totalRate = taxes.reduce(
      (sum, t) => sum.plus(t.rate),
      new Decimal(0)
    );

    result.push({
      ...toTaxGroupDto(group),
      taxes: taxes.map((t) => ({
        ...t,
        description: t.description ?? null,
      })),
      totalRate,
    });
  }

  return result;
}

/**
 * Obtiene un grupo de impuestos por su ID con sus impuestos.
 *
 * @param id ID del grupo.
 * @returns Grupo con impuestos o undefined si no existe.
 */
export async function getTaxGroupById(
  id: number
): Promise<ITaxGroupWithTaxes | undefined> {
  const [group] = await db.select().from(taxGroup).where(eq(taxGroup.id, id));

  if (!group) return undefined;

  const taxes = await db
    .select({
      id: tax.id,
      code: tax.code,
      fullName: tax.fullName,
      description: tax.description,
      rate: tax.rate,
      isEnabled: tax.isEnabled,
    })
    .from(taxGroupTax)
    .innerJoin(tax, eq(taxGroupTax.taxId, tax.id))
    .where(eq(taxGroupTax.taxGroupId, id));

  const totalRate = taxes.reduce((sum, t) => sum.plus(t.rate), new Decimal(0));

  return {
    ...toTaxGroupDto(group),
    taxes: taxes.map((t) => ({
      ...t,
      description: t.description ?? null,
    })),
    totalRate,
  };
}

/**
 * Obtiene información de uso de un grupo de impuestos.
 *
 * @param id ID del grupo.
 * @returns Información de uso.
 */
export async function getTaxGroupUsageInfo(
  id: number
): Promise<ITaxGroupUsageInfo> {
  // Contar productos usando este grupo de impuestos
  const [{ value: productsCount }] = await db
    .select({ value: count() })
    .from(item)
    .where(and(eq(item.taxGroupId, id), eq(item.isEnabled, true)));

  const canDisable = productsCount === 0;
  let reason: string | undefined;

  if (productsCount > 0) {
    reason = `No se puede deshabilitar porque hay ${productsCount} producto(s) activo(s) usando este grupo de impuestos`;
  }

  return {
    productsCount,
    canDisable,
    reason,
  };
}

/**
 * Crea o actualiza un grupo de impuestos.
 *
 * **Reglas de negocio:**
 * - Un grupo debe tener al menos un impuesto asociado.
 * - Todos los taxIds deben existir y estar activos.
 * - Al actualizar, se recrea la relación de impuestos (diff completo).
 *
 * @param payload Datos del grupo de impuestos.
 * @returns Array con el grupo creado/actualizado.
 *
 * @example
 * ```ts
 * const [group] = await upsertTaxGroup({
 *   code: "GRAVADO19",
 *   fullName: "Productos Gravados 19%",
 *   taxIds: [1, 2], // IDs de impuestos
 * });
 * ```
 */
export async function upsertTaxGroup(
  payload: IUpsertTaxGroup
): Promise<[ITaxGroupWithTaxes]> {
  const { id, code, fullName, description, taxIds, isEnabled = true } = payload;

  // R1: Validar composición obligatoria
  if (!taxIds || taxIds.length === 0) {
    throw new BusinessRuleError(
      "Un grupo de impuestos debe tener al menos un impuesto asociado"
    );
  }

  return db.transaction(async (tx) => {
    // R2: Validar que todos los impuestos existan y estén activos
    const existingTaxes = await tx
      .select()
      .from(tax)
      .where(inArray(tax.id, taxIds));

    const foundIds = new Set(existingTaxes.map((t) => t.id));
    const missingIds = taxIds.filter((taxId) => !foundIds.has(taxId));

    if (missingIds.length > 0) {
      throw new BusinessRuleError(
        `Los siguientes IDs de impuesto no existen: ${missingIds.join(", ")}`
      );
    }

    const inactiveTaxes = existingTaxes.filter((t) => !t.isEnabled);
    if (inactiveTaxes.length > 0) {
      throw new BusinessRuleError(
        `Los siguientes impuestos están deshabilitados: ${inactiveTaxes
          .map((t) => t.code)
          .join(", ")}`
      );
    }

    let record: typeof taxGroup.$inferSelect;

    if (typeof id !== "number") {
      // Crear nuevo grupo
      const [inserted] = await tx
        .insert(taxGroup)
        .values({
          code: code.toUpperCase(),
          fullName,
          description: description ?? null,
          isEnabled,
        } satisfies NewTaxGroup)
        .returning();

      record = inserted;
    } else {
      // Verificar que existe
      const [existing] = await tx
        .select()
        .from(taxGroup)
        .where(eq(taxGroup.id, id));

      if (!existing) {
        throw new NotFoundError(
          `Grupo de impuestos con ID ${id} no encontrado`
        );
      }

      // Actualizar
      const [updated] = await tx
        .update(taxGroup)
        .set({
          code: code.toUpperCase(),
          fullName,
          description: description ?? null,
          isEnabled,
        })
        .where(eq(taxGroup.id, id))
        .returning();

      record = updated;

      // R3: Limpiar relaciones previas
      await tx.delete(taxGroupTax).where(eq(taxGroupTax.taxGroupId, id));
    }

    // Crear nuevas relaciones
    await tx.insert(taxGroupTax).values(
      taxIds.map(
        (taxId) =>
          ({
            taxGroupId: record.id,
            taxId,
          } satisfies NewTaxGroupTax)
      )
    );

    // Cargar los impuestos para retornar
    const taxes = existingTaxes.map(toTaxDto);
    const totalRate = taxes.reduce(
      (sum, t) => sum.plus(t.rate),
      new Decimal(0)
    );

    return [
      {
        ...toTaxGroupDto(record),
        taxes,
        totalRate,
      },
    ];
  });
}

/**
 * Habilita o deshabilita un grupo de impuestos.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar si hay productos activos usándolo.
 *
 * @param payload DTO con ID y nuevo estado.
 * @returns Resultado de la operación.
 */
export async function toggleTaxGroup(
  payload: IToggleTaxGroup
): Promise<IToggleTaxGroupResult> {
  const { id, isEnabled } = payload;

  return db.transaction(async (tx) => {
    // Verificar que existe
    const [existing] = await tx
      .select()
      .from(taxGroup)
      .where(eq(taxGroup.id, id));

    if (!existing) {
      throw new NotFoundError(`Grupo de impuestos con ID ${id} no encontrado`);
    }

    // Si se está habilitando, no hay restricciones
    if (isEnabled) {
      const [updated] = await tx
        .update(taxGroup)
        .set({ isEnabled: true })
        .where(eq(taxGroup.id, id))
        .returning();

      return {
        success: true,
        taxGroup: toTaxGroupDto(updated),
        message: `Grupo de impuestos "${updated.code}" habilitado correctamente`,
      };
    }

    // Validar que no hay productos usando este grupo
    const [{ value: productsCount }] = await tx
      .select({ value: count() })
      .from(item)
      .where(and(eq(item.taxGroupId, id), eq(item.isEnabled, true)));

    if (productsCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar el grupo "${existing.code}" porque hay ${productsCount} producto(s) activo(s) usándolo. ` +
          `Deshabilitar este grupo podría generar errores en facturación electrónica.`
      );
    }

    // Deshabilitar
    const [updated] = await tx
      .update(taxGroup)
      .set({ isEnabled: false })
      .where(eq(taxGroup.id, id))
      .returning();

    return {
      success: true,
      taxGroup: toTaxGroupDto(updated),
      message: `Grupo de impuestos "${updated.code}" deshabilitado correctamente`,
    };
  });
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  IUpsertTax,
  ITax,
  IToggleTax,
  IToggleTaxResult,
  ITaxUsageInfo,
  IUpsertTaxGroup,
  ITaxGroup,
  ITaxGroupWithTaxes,
  IToggleTaxGroup,
  IToggleTaxGroupResult,
  IListTaxGroupsParams,
  IListTaxesParams,
  ITaxGroupUsageInfo,
} from "#utils/dto/finance/tax_group";
