/**
 * Servicio de Monedas (Currency Service)
 *
 * Gestiona la tabla `finance_currency`.
 *
 * **Reglas de negocio:**
 * - Solo una moneda base por tenant (isBase = true).
 * - No se puede deshabilitar la moneda base.
 * - No se puede establecer como base una moneda deshabilitada.
 * - No se puede deshabilitar si hay facturas abiertas en esa moneda.
 */
import { db } from "#lib/db";
import { eq, and, count, or, sql, ne, ilike } from "drizzle-orm";
import { currency, type NewCurrency } from "#models/finance/currency";
import salesInvoice from "#models/finance/sales_invoice";
import purchaseInvoice from "#models/finance/purchase_invoice";
import order from "#models/crm/order";
import { BusinessRuleError, NotFoundError } from "#lib/error";
import Decimal from "#utils/data/Decimal";

import type {
  IUpsertCurrency,
  ICurrency,
  IToggleCurrency,
  IToggleCurrencyResult,
  ISetBaseCurrency,
  ISetBaseCurrencyResult,
  IListCurrenciesParams,
  ICurrencyUsageInfo,
} from "#utils/dto/finance/currency";

// ============================================================================
// Funciones auxiliares
// ============================================================================

/**
 * Normaliza el código de moneda: mayúsculas y 3 caracteres.
 */
function normalizeCode(code: string): string {
  return code.toUpperCase().trim().substring(0, 3);
}

/**
 * Convierte un registro de BD a DTO.
 */
function toDto(record: typeof currency.$inferSelect): ICurrency {
  return {
    id: record.id,
    code: record.code,
    fullName: record.fullName,
    symbol: record.symbol,
    exchangeRate: record.exchangeRate,
    isBase: record.isBase,
    isEnabled: record.isEnabled,
  };
}

// ============================================================================
// Servicios de lectura
// ============================================================================

/**
 * Lista las monedas según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de monedas.
 * @permission finance.currency.read
 */
export async function listCurrencies(
  params: IListCurrenciesParams = {}
): Promise<ICurrency[]> {
  const { activeOnly = true, code } = params;

  const conditions = [];

  if (activeOnly) {
    conditions.push(eq(currency.isEnabled, true));
  }

  if (code) {
    conditions.push(ilike(currency.code, `%${code}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(currency)
    .where(whereClause)
    .orderBy(sql`${currency.isBase} DESC, ${currency.code}`);

  return records.map(toDto);
}

/**
 * Obtiene una moneda por su ID.
 *
 * @param id ID de la moneda.
 * @returns Moneda o undefined si no existe.
 * @permission finance.currency.read
 */
export async function getCurrencyById(
  id: number
): Promise<ICurrency | undefined> {
  const [record] = await db.select().from(currency).where(eq(currency.id, id));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene una moneda por su código.
 *
 * @param code Código de la moneda.
 * @returns Moneda o undefined si no existe.
 * @permission finance.currency.read
 */
export async function getCurrencyByCode(
  code: string
): Promise<ICurrency | undefined> {
  const normalizedCode = normalizeCode(code);
  const [record] = await db
    .select()
    .from(currency)
    .where(eq(currency.code, normalizedCode));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene la moneda base del sistema.
 *
 * @returns Moneda base o undefined si no hay ninguna configurada.
 * @permission finance.currency.read
 */
export async function getBaseCurrency(): Promise<ICurrency | undefined> {
  const [record] = await db
    .select()
    .from(currency)
    .where(eq(currency.isBase, true));

  return record ? toDto(record) : undefined;
}

/**
 * Obtiene información de uso de una moneda.
 *
 * @param id ID de la moneda.
 * @returns Información de uso.
 * @permission finance.currency.read
 */
export async function getCurrencyUsageInfo(
  id: number
): Promise<ICurrencyUsageInfo> {
  // Obtener la moneda para saber su código
  const [currencyRecord] = await db
    .select()
    .from(currency)
    .where(eq(currency.id, id));

  if (!currencyRecord) {
    throw new NotFoundError(`Moneda con ID ${id} no encontrada`);
  }

  const currencyCode = currencyRecord.code;

  // Contar facturas de venta activas
  const [{ value: salesInvoicesCount }] = await db
    .select({ value: count() })
    .from(salesInvoice)
    .where(
      and(
        eq(salesInvoice.currencyCode, currencyCode),
        ne(salesInvoice.status, "cancelled")
      )
    );

  // Contar facturas de compra (todas, ya que no tienen status de anulación)
  const [{ value: purchaseInvoicesCount }] = await db
    .select({ value: count() })
    .from(purchaseInvoice)
    .where(eq(purchaseInvoice.currencyCode, currencyCode));

  // Contar órdenes en proceso (pendientes o confirmadas, no enviadas/entregadas/canceladas)
  const [{ value: ordersCount }] = await db
    .select({ value: count() })
    .from(order)
    .where(
      and(
        eq(order.currencyCode, currencyCode),
        or(eq(order.status, "pending"), eq(order.status, "confirmed"))
      )
    );

  // Determinar si se puede deshabilitar
  const isBase = currencyRecord.isBase;
  const hasOpenDocuments =
    salesInvoicesCount > 0 || purchaseInvoicesCount > 0 || ordersCount > 0;
  const canDisable = !isBase && !hasOpenDocuments;

  let reason: string | undefined;
  if (isBase) {
    reason = "No se puede deshabilitar la moneda base del sistema";
  } else if (hasOpenDocuments) {
    reason = `No se puede deshabilitar porque hay documentos activos: ${salesInvoicesCount} facturas de venta, ${purchaseInvoicesCount} facturas de compra, ${ordersCount} órdenes`;
  }

  return {
    salesInvoicesCount,
    purchaseInvoicesCount,
    ordersCount,
    canDisable,
    reason,
  };
}

// ============================================================================
// Servicios de escritura
// ============================================================================

/**
 * Crea o actualiza una moneda.
 *
 * @param payload Datos de la moneda.
 * @returns Array con la moneda creada/actualizada.
 * @permission finance.currency.manage
 * *
 */
export async function upsertCurrency(
  payload: IUpsertCurrency
): Promise<[ICurrency]> {
  const {
    id,
    code,
    fullName,
    symbol = "$",
    exchangeRate = new Decimal(1),
    isEnabled = true,
  } = payload;
  const normalizedCode = normalizeCode(code);

  let record: typeof currency.$inferSelect;

  if (typeof id !== "number") {
    // Crear nueva moneda
    const [inserted] = await db
      .insert(currency)
      .values({
        code: normalizedCode,
        fullName,
        symbol,
        exchangeRate,
        isEnabled,
        isBase: false, // Nunca crear como base directamente
      } satisfies NewCurrency)
      .returning();

    record = inserted;
  } else {
    // Verificar que existe
    const [existing] = await db
      .select()
      .from(currency)
      .where(eq(currency.id, id));

    if (!existing) {
      throw new NotFoundError(`Moneda con ID ${id} no encontrada`);
    }

    // No permitir cambiar isBase vía upsert (usar setBaseCurrency)
    // No cambiar exchangeRate si es la moneda base
    const newExchangeRate = existing.isBase ? new Decimal(1) : exchangeRate;

    const [updated] = await db
      .update(currency)
      .set({
        code: normalizedCode,
        fullName,
        symbol,
        exchangeRate: newExchangeRate,
        isEnabled,
      })
      .where(eq(currency.id, id))
      .returning();

    record = updated;
  }

  return [toDto(record)];
}

/**
 * Habilita o deshabilita una moneda.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar la moneda base.
 * - No se puede deshabilitar si hay documentos activos en esa moneda.
 *
 * @param payload DTO con ID y nuevo estado.
 * @returns Resultado de la operación.
 * @permission finance.currency.manage
 */
export async function toggleCurrency(
  payload: IToggleCurrency
): Promise<IToggleCurrencyResult> {
  const { id, isEnabled } = payload;

  return db.transaction(async (tx) => {
    // Verificar que existe
    const [existing] = await tx
      .select()
      .from(currency)
      .where(eq(currency.id, id));

    if (!existing) {
      throw new NotFoundError(`Moneda con ID ${id} no encontrada`);
    }

    // Si se está habilitando, no hay restricciones
    if (isEnabled) {
      const [updated] = await tx
        .update(currency)
        .set({ isEnabled: true })
        .where(eq(currency.id, id))
        .returning();

      return {
        success: true,
        currency: toDto(updated),
        message: `Moneda "${updated.code}" habilitada correctamente`,
      };
    }

    // R1: No se puede deshabilitar la moneda base
    if (existing.isBase) {
      throw new BusinessRuleError(
        `No se puede deshabilitar la moneda "${existing.code}" porque es la moneda base del sistema. ` +
        `Primero debe establecer otra moneda como base.`
      );
    }

    // R2: No se puede deshabilitar si hay documentos activos
    // Contar facturas de venta no canceladas
    const [{ value: salesCount }] = await tx
      .select({ value: count() })
      .from(salesInvoice)
      .where(
        and(
          eq(salesInvoice.currencyCode, existing.code),
          ne(salesInvoice.status, "cancelled")
        )
      );

    if (salesCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar la moneda "${existing.code}" porque hay ${salesCount} factura(s) de venta activa(s)`
      );
    }

    // Contar facturas de compra
    const [{ value: purchaseCount }] = await tx
      .select({ value: count() })
      .from(purchaseInvoice)
      .where(eq(purchaseInvoice.currencyCode, existing.code));

    if (purchaseCount > 0) {
      throw new BusinessRuleError(
        `No se puede deshabilitar la moneda "${existing.code}" porque hay ${purchaseCount} factura(s) de compra registrada(s)`
      );
    }

    // Deshabilitar
    const [updated] = await tx
      .update(currency)
      .set({ isEnabled: false })
      .where(eq(currency.id, id))
      .returning();

    return {
      success: true,
      currency: toDto(updated),
      message: `Moneda "${updated.code}" deshabilitada correctamente`,
    };
  });
}

/**
 * Establece una moneda como la moneda base del sistema.
 *
 * **Reglas de negocio:**
 * - Solo puede haber una moneda base por tenant.
 * - No se puede establecer como base una moneda deshabilitada.
 * - La tasa de cambio de la moneda base siempre es 1.
 *
 * @param payload DTO con el ID de la nueva moneda base.
 * @returns Resultado de la operación.
 * @permission finance.currency.manage
 * *
 */
export async function setBaseCurrency(
  payload: ISetBaseCurrency
): Promise<ISetBaseCurrencyResult> {
  const { id } = payload;

  return db.transaction(async (tx) => {
    // Verificar que la moneda existe
    const [newBase] = await tx
      .select()
      .from(currency)
      .where(eq(currency.id, id));

    if (!newBase) {
      throw new NotFoundError(`Moneda con ID ${id} no encontrada`);
    }

    // R1: No se puede establecer como base una moneda deshabilitada
    if (!newBase.isEnabled) {
      throw new BusinessRuleError(
        `No se puede establecer la moneda "${newBase.code}" como base porque está deshabilitada. ` +
        `Primero debe habilitarla.`
      );
    }

    // R2: Si ya es la moneda base, no hay nada que hacer
    if (newBase.isBase) {
      return {
        success: true,
        newBaseCurrency: toDto(newBase),
        message: `La moneda "${newBase.code}" ya es la moneda base del sistema`,
      };
    }

    // Buscar la moneda base actual (si existe)
    const [currentBase] = await tx
      .select()
      .from(currency)
      .where(eq(currency.isBase, true));

    // Quitar flag de base a la moneda actual
    if (currentBase) {
      await tx
        .update(currency)
        .set({ isBase: false })
        .where(eq(currency.id, currentBase.id));
    }

    // Establecer nueva moneda base con exchangeRate = 1
    const [updated] = await tx
      .update(currency)
      .set({
        isBase: true,
        exchangeRate: new Decimal(1),
      })
      .where(eq(currency.id, id))
      .returning();

    return {
      success: true,
      newBaseCurrency: toDto(updated),
      previousBaseCurrency: currentBase ? toDto(currentBase) : undefined,
      message: `Moneda "${updated.code}" establecida como moneda base del sistema`,
    };
  });
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  IUpsertCurrency,
  ICurrency,
  IToggleCurrency,
  IToggleCurrencyResult,
  ISetBaseCurrency,
  ISetBaseCurrencyResult,
  IListCurrenciesParams,
  ICurrencyUsageInfo,
} from "#utils/dto/finance/currency";
