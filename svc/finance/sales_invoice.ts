import { db } from "#lib/db";
import sales_invoice from "#models/finance/sales_invoice";
import sales_invoice_item from "#models/finance/sales_invoice_item";
import order from "#models/crm/order";
import client from "#models/crm/client";
import person from "#models/core/person";
import { company } from "#models/core/company";
import { user } from "#models/core/user";
import { documentType } from "#models/numbering/document_type";
import { documentSequence } from "#models/numbering/document_sequence";
import { documentSeries } from "#models/numbering/document_series";
import { item } from "#models/catalogs/item";
import { tax } from "#models/finance/tax";
import payment_allocation from "#models/finance/payment_allocation";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { eq, and, gte, lte, count, desc, sql } from "drizzle-orm";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";
import { BusinessRuleError, NotFoundError } from "#lib/error";

// Re-export DTOs from shared module
export type {
  SalesInvoiceStatus,
  CreateSalesInvoiceItemInput,
  CreateSalesInvoiceInput,
  SalesInvoiceWithNumbering,
  SalesInvoiceItemDetails,
  SalesInvoiceDetails,
  ListSalesInvoicesParams,
  SalesInvoiceListItem,
  ListSalesInvoicesResult,
  PostSalesInvoiceResult,
  SalesInvoicePdfData,
  SalesInvoiceItemPdfDetails,
  CompanyInfo,
  SendSalesInvoiceEmailInput,
  SendSalesInvoiceEmailResult,
} from "#utils/dto/finance/sales_invoice";

import type {
  SalesInvoiceStatus,
  CreateSalesInvoiceItemInput,
  CreateSalesInvoiceInput,
  SalesInvoiceWithNumbering,
  SalesInvoiceItemDetails,
  SalesInvoiceDetails,
  ListSalesInvoicesParams,
  SalesInvoiceListItem,
  ListSalesInvoicesResult,
  PostSalesInvoiceResult,
} from "#utils/dto/finance/sales_invoice";

/** Código del tipo de documento para facturas de venta */
export const SALES_INVOICE_DOCUMENT_TYPE_CODE = "SALES_INVOICE";

// ============================================================================
// Helper Functions
// ============================================================================

function toDecimal(
  value: Decimal | number | string | undefined | null
): Decimal {
  if (value === undefined || value === null) return new Decimal(0);
  return value instanceof Decimal ? value : new Decimal(value);
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Crea una nueva factura de venta en estado borrador.
 * Asigna automáticamente un número de documento vía el motor de numeración.
 *
 * @param payload Datos de la factura con líneas
 * @returns Factura creada con numeración
 * @permission finance.sales_invoice.manage
 */
export async function createSalesInvoice(
  payload: CreateSalesInvoiceInput
): Promise<SalesInvoiceWithNumbering> {
  return db.transaction(async (tx) => {
    // Validar que el cliente exista
    const [clientRecord] = await tx
      .select({
        id: client.id,
        active: client.active,
      })
      .from(client)
      .where(eq(client.id, payload.clientId));

    if (!clientRecord) {
      throw new NotFoundError("El cliente no existe");
    }
    if (!clientRecord.active) {
      throw new BusinessRuleError("El cliente está inactivo");
    }

    // Validar orden si se proporciona
    if (payload.orderId) {
      const [orderRecord] = await tx
        .select({
          id: order.id,
          status: order.status,
          clientId: order.clientId,
        })
        .from(order)
        .where(eq(order.id, payload.orderId));

      if (!orderRecord) {
        throw new NotFoundError("La orden de venta no existe");
      }
      if (orderRecord.clientId !== payload.clientId) {
        throw new BusinessRuleError(
          "La orden pertenece a un cliente diferente"
        );
      }
    }

    // Validar que haya al menos una línea
    if (!payload.items || payload.items.length === 0) {
      throw new BusinessRuleError("La factura debe tener al menos una línea");
    }

    // Validar existencia de items y taxes
    const itemIds = [...new Set(payload.items.map((i) => i.itemId))];
    const existingItems = await tx
      .select({ id: item.id })
      .from(item)
      .where(sql`${item.id} IN ${itemIds}`);

    const existingItemIds = new Set(existingItems.map((i) => i.id));
    for (const itemId of itemIds) {
      if (!existingItemIds.has(itemId)) {
        throw new NotFoundError(`El item con ID ${itemId} no existe`);
      }
    }

    // Validar taxes si se proporcionan
    const taxIds = payload.items
      .filter((i) => i.taxId !== undefined)
      .map((i) => i.taxId!);

    if (taxIds.length > 0) {
      const uniqueTaxIds = [...new Set(taxIds)];
      const existingTaxes = await tx
        .select({ id: tax.id, rate: tax.rate })
        .from(tax)
        .where(sql`${tax.id} IN ${uniqueTaxIds}`);

      const existingTaxIds = new Set(existingTaxes.map((t) => t.id));
      for (const taxId of uniqueTaxIds) {
        if (!existingTaxIds.has(taxId)) {
          throw new NotFoundError(`El impuesto con ID ${taxId} no existe`);
        }
      }
    }

    // Usar DateTime directamente - el RPC ya lo deserializó
    const issueDate = payload.issueDate ?? new DateTime();
    const issueDateStr = issueDate.toISOString().split("T")[0];
    const dueDateStr = payload.dueDate ? payload.dueDate.toISOString().split("T")[0] : null;
    const globalDiscountPercent = toDecimal(payload.globalDiscountPercent);

    // Obtener número de documento usando ID temporal
    const tempExternalId = crypto.randomUUID();
    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: SALES_INVOICE_DOCUMENT_TYPE_CODE,
      today: issueDate,
      externalDocumentType: "sales_invoice",
      externalDocumentId: tempExternalId,
    });

    // Insertar factura con totales en 0 (se calcularán en posteo)
    const [invoice] = await tx
      .insert(sales_invoice)
      .values({
        clientId: payload.clientId,
        orderId: payload.orderId ?? null,
        paymentTermsId: payload.paymentTermsId,
        issueDate: issueDateStr,
        dueDate: dueDateStr,
        status: "draft",
        subtotal: new Decimal(0),
        globalDiscountPercent,
        globalDiscountAmount: new Decimal(0),
        taxAmount: new Decimal(0),
        totalAmount: new Decimal(0),
        notes: payload.notes,
        seriesId: numbering.seriesId,
        documentNumber: numbering.assignedNumber,
      })
      .returning();

    // Actualizar externalDocumentId en document_sequence con el ID real
    await tx
      .update(documentSequence)
      .set({ externalDocumentId: invoice.id.toString() })
      .where(
        and(
          eq(documentSequence.seriesId, numbering.seriesId),
          eq(documentSequence.assignedNumber, numbering.assignedNumber)
        )
      );

    // Insertar líneas de la factura
    const itemsToInsert = payload.items.map((lineInput, index) => {
      const qty = toDecimal(lineInput.quantity);
      const unitPrice = toDecimal(lineInput.unitPrice);
      const discountPct = toDecimal(lineInput.discountPercent);

      // Calcular subtotal de línea: qty * unitPrice - descuento
      const grossAmount = qty.mul(unitPrice);
      const discountAmount = grossAmount.mul(discountPct).div(100);
      const subtotal = grossAmount.sub(discountAmount);

      // El impuesto se calculará en posteo (necesitamos obtener la tasa)
      // Por ahora guardamos 0, se recalculará
      return {
        salesInvoiceId: invoice.id,
        lineNumber: index + 1,
        itemId: lineInput.itemId,
        orderItemId: lineInput.orderItemId,
        quantity: qty,
        unitPrice,
        discountPercent: discountPct,
        discountAmount,
        taxId: lineInput.taxId,
        taxAmount: new Decimal(0),
        subtotal,
        total: subtotal, // Sin impuesto aún
        description: lineInput.description,
      };
    });

    await tx.insert(sales_invoice_item).values(itemsToInsert);

    return {
      id: invoice.id,
      clientId: invoice.clientId,
      orderId: invoice.orderId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status as SalesInvoiceStatus,
      subtotal: invoice.subtotal,
      globalDiscountAmount: invoice.globalDiscountAmount,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      seriesId: invoice.seriesId,
      documentNumber: invoice.documentNumber,
      documentNumberFull: numbering.fullNumber,
    };
  });
}

/**
 * Postea una factura de venta.
 *
 * **Reglas de negocio (UC-13):**
 * - Genera numeración (ya se genera en creación)
 * - Calcula totales (neto, impuestos, total)
 * - Bloquea edición posterior (estado Draft → Issued)
 *
 * **Validaciones:**
 * - No permite postear si faltan líneas
 * - No permite postear si ya está posteada (idempotencia)
 *
 * @param id ID de la factura a postear
 * @returns Resultado del posteo con totales calculados
 * @permission finance.sales_invoice.manage
 */
export async function postSalesInvoice(
  id: number
): Promise<PostSalesInvoiceResult> {
  return db.transaction(async (tx) => {
    // 1. Obtener la factura
    const [invoice] = await tx
      .select({
        id: sales_invoice.id,
        status: sales_invoice.status,
        globalDiscountPercent: sales_invoice.globalDiscountPercent,
        seriesId: sales_invoice.seriesId,
        documentNumber: sales_invoice.documentNumber,
        seriesPrefix: documentSeries.prefix,
        seriesSuffix: documentSeries.suffix,
      })
      .from(sales_invoice)
      .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
      .where(eq(sales_invoice.id, id));

    if (!invoice) {
      throw new NotFoundError("Factura de venta no encontrada");
    }

    // 2. Validar estado - Solo Draft puede postearse
    if (invoice.status !== "draft") {
      throw new BusinessRuleError(
        `La factura ya fue posteada. Estado actual: ${invoice.status}`
      );
    }

    // 3. Obtener líneas de la factura
    const lines = await tx
      .select({
        id: sales_invoice_item.id,
        quantity: sales_invoice_item.quantity,
        unitPrice: sales_invoice_item.unitPrice,
        discountPercent: sales_invoice_item.discountPercent,
        discountAmount: sales_invoice_item.discountAmount,
        taxId: sales_invoice_item.taxId,
        subtotal: sales_invoice_item.subtotal,
      })
      .from(sales_invoice_item)
      .where(eq(sales_invoice_item.salesInvoiceId, id));

    // 4. Validar que tenga líneas
    if (lines.length === 0) {
      throw new BusinessRuleError("No se puede postear una factura sin líneas");
    }

    // 5. Obtener tasas de impuestos para las líneas que tienen taxId
    const taxIdsInLines = lines
      .filter((l) => l.taxId !== null)
      .map((l) => l.taxId!);

    const taxRatesMap = new Map<number, Decimal>();

    if (taxIdsInLines.length > 0) {
      const uniqueTaxIds = [...new Set(taxIdsInLines)];
      const taxes = await tx
        .select({ id: tax.id, rate: tax.rate })
        .from(tax)
        .where(sql`${tax.id} IN ${uniqueTaxIds}`);

      for (const t of taxes) {
        taxRatesMap.set(t.id, t.rate);
      }
    }

    // 6. Calcular totales por línea y actualizar
    let subtotalSum = new Decimal(0);
    let taxAmountSum = new Decimal(0);

    for (const line of lines) {
      const lineSubtotal = toDecimal(line.subtotal);
      subtotalSum = subtotalSum.add(lineSubtotal);

      // Calcular impuesto de la línea
      let lineTaxAmount = new Decimal(0);
      if (line.taxId && taxRatesMap.has(line.taxId)) {
        const taxRate = taxRatesMap.get(line.taxId)!;
        lineTaxAmount = lineSubtotal.mul(taxRate).div(100);
      }
      taxAmountSum = taxAmountSum.add(lineTaxAmount);

      const lineTotal = lineSubtotal.add(lineTaxAmount);

      // Actualizar línea con impuesto calculado
      await tx
        .update(sales_invoice_item)
        .set({
          taxAmount: lineTaxAmount,
          total: lineTotal,
        })
        .where(eq(sales_invoice_item.id, line.id));
    }

    // 7. Calcular descuento global
    const globalDiscountPct = toDecimal(invoice.globalDiscountPercent);
    const globalDiscountAmount = subtotalSum.mul(globalDiscountPct).div(100);

    // 8. Calcular total final
    // Total = Subtotal - Descuento Global + Impuestos
    // Nota: Los impuestos se calculan sobre el subtotal de cada línea (ya descontado el descuento por línea)
    // El descuento global se aplica sobre el subtotal total
    const subtotalAfterDiscount = subtotalSum.sub(globalDiscountAmount);
    const totalAmount = subtotalAfterDiscount.add(taxAmountSum);

    // 9. Actualizar factura con totales y cambiar estado
    await tx
      .update(sales_invoice)
      .set({
        subtotal: subtotalSum,
        globalDiscountAmount,
        taxAmount: taxAmountSum,
        totalAmount,
        status: "issued",
        updatedAt: new DateTime(),
      })
      .where(eq(sales_invoice.id, id));

    const prefix = invoice.seriesPrefix ?? "";
    const suffix = invoice.seriesSuffix ?? "";
    const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

    return {
      salesInvoiceId: id,
      documentNumberFull,
      previousStatus: invoice.status as SalesInvoiceStatus,
      newStatus: "issued" as SalesInvoiceStatus,
      subtotal: subtotalSum,
      globalDiscountAmount,
      taxAmount: taxAmountSum,
      totalAmount,
    };
  });
}

/**
 * Obtiene una factura de venta por su ID con todos los detalles.
 * @permission finance.sales_invoice.read
 */
export async function getSalesInvoiceById(
  id: number
): Promise<SalesInvoiceDetails | undefined> {
  // Get order's document series for order number
  const orderSeries = db
    .select({
      id: documentSeries.id,
      prefix: documentSeries.prefix,
      suffix: documentSeries.suffix,
    })
    .from(documentSeries)
    .as("order_series");

  const [invoice] = await db
    .select({
      id: sales_invoice.id,
      orderId: sales_invoice.orderId,
      issueDate: sales_invoice.issueDate,
      dueDate: sales_invoice.dueDate,
      status: sales_invoice.status,
      subtotal: sales_invoice.subtotal,
      globalDiscountPercent: sales_invoice.globalDiscountPercent,
      globalDiscountAmount: sales_invoice.globalDiscountAmount,
      taxAmount: sales_invoice.taxAmount,
      totalAmount: sales_invoice.totalAmount,
      totalPaid: sql<Decimal>`(SELECT COALESCE(SUM(${payment_allocation.amount}), 0) FROM ${payment_allocation} WHERE ${payment_allocation.salesInvoiceId} = ${sales_invoice.id})`,
      documentNumber: sales_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      notes: sales_invoice.notes,
      orderDocumentNumber: order.documentNumber,
      orderSeriesPrefix: orderSeries.prefix,
      orderSeriesSuffix: orderSeries.suffix,
      clientId: sales_invoice.clientId,
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
      clientDocumentType: documentType.name,
      clientDocumentNumber: user.documentNumber,
    })
    .from(sales_invoice)
    .leftJoin(order, eq(sales_invoice.orderId, order.id))
    .innerJoin(client, eq(sales_invoice.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
    .leftJoin(orderSeries, eq(order.seriesId, orderSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .leftJoin(documentType, eq(user.documentTypeId, documentType.id))
    .where(eq(sales_invoice.id, id));

  if (!invoice) {
    return undefined;
  }

  // Obtener líneas de la factura
  const lines = await db
    .select({
      id: sales_invoice_item.id,
      lineNumber: sales_invoice_item.lineNumber,
      itemId: sales_invoice_item.itemId,
      itemCode: item.code,
      itemName: item.fullName,
      quantity: sales_invoice_item.quantity,
      unitPrice: sales_invoice_item.unitPrice,
      discountPercent: sales_invoice_item.discountPercent,
      discountAmount: sales_invoice_item.discountAmount,
      taxId: sales_invoice_item.taxId,
      taxRate: tax.rate,
      taxAmount: sales_invoice_item.taxAmount,
      subtotal: sales_invoice_item.subtotal,
      total: sales_invoice_item.total,
      description: sales_invoice_item.description,
    })
    .from(sales_invoice_item)
    .innerJoin(item, eq(sales_invoice_item.itemId, item.id))
    .leftJoin(tax, eq(sales_invoice_item.taxId, tax.id))
    .where(eq(sales_invoice_item.salesInvoiceId, id))
    .orderBy(sales_invoice_item.lineNumber);

  const clientName = invoice.clientFirstName
    ? `${invoice.clientFirstName} ${invoice.clientLastName ?? ""}`.trim()
    : invoice.clientLegalName ?? "";

  const prefix = invoice.seriesPrefix ?? "";
  const suffix = invoice.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

  let orderDocumentNumber: string | null = null;
  if (invoice.orderId && invoice.orderDocumentNumber) {
    const orderPrefix = invoice.orderSeriesPrefix ?? "";
    const orderSuffix = invoice.orderSeriesSuffix ?? "";
    orderDocumentNumber = `${orderPrefix}${invoice.orderDocumentNumber}${orderSuffix}`;
  }

  return {
    id: invoice.id,
    orderId: invoice.orderId,
    orderDocumentNumber,
    clientId: invoice.clientId,
    clientName,
    clientDocumentType: invoice.clientDocumentType,
    clientDocumentNumber: invoice.clientDocumentNumber,
    status: invoice.status as SalesInvoiceStatus,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    globalDiscountPercent: invoice.globalDiscountPercent,
    globalDiscountAmount: invoice.globalDiscountAmount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    totalPaid: toDecimal(invoice.totalPaid),
    balance: toDecimal(invoice.totalAmount).sub(toDecimal(invoice.totalPaid)),
    documentNumberFull,
    items: lines.map((l) => ({
      id: l.id,
      lineNumber: l.lineNumber,
      itemId: l.itemId,
      itemCode: l.itemCode,
      itemName: l.itemName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountPercent: toDecimal(l.discountPercent),
      discountAmount: toDecimal(l.discountAmount),
      taxId: l.taxId,
      taxRate: l.taxRate ?? null,
      taxAmount: toDecimal(l.taxAmount),
      subtotal: l.subtotal,
      total: l.total,
      description: l.description,
    })),
    notes: invoice.notes,
  };
}

/**
 * Lista facturas de venta con filtros y paginación.
 * @permission finance.sales_invoice.read
 */
export async function listSalesInvoices(
  params: ListSalesInvoicesParams = {}
): Promise<ListSalesInvoicesResult> {
  const {
    clientId,
    orderId,
    status,
    fromDate,
    toDate,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (clientId !== undefined) {
    conditions.push(eq(sales_invoice.clientId, clientId));
  }

  if (orderId !== undefined) {
    conditions.push(eq(sales_invoice.orderId, orderId));
  }

  if (status !== undefined) {
    conditions.push(eq(sales_invoice.status, status));
  }

  if (fromDate !== undefined) {
    const dateStr = fromDate.toISOString().split("T")[0];
    conditions.push(gte(sales_invoice.issueDate, dateStr));
  }

  if (toDate !== undefined) {
    const dateStr = toDate.toISOString().split("T")[0];
    conditions.push(lte(sales_invoice.issueDate, dateStr));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderSeries = db
    .select({
      id: documentSeries.id,
      prefix: documentSeries.prefix,
      suffix: documentSeries.suffix,
    })
    .from(documentSeries)
    .as("order_series");

  const queryInvoices = db
    .select({
      id: sales_invoice.id,
      clientId: sales_invoice.clientId,
      orderId: sales_invoice.orderId,
      status: sales_invoice.status,
      issueDate: sales_invoice.issueDate,
      totalAmount: sales_invoice.totalAmount,
      totalPaid: sql<Decimal>`(SELECT COALESCE(SUM(${payment_allocation.amount}), 0) FROM ${payment_allocation} WHERE ${payment_allocation.salesInvoiceId} = ${sales_invoice.id})`,
      documentNumber: sales_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      orderDocumentNumber: order.documentNumber,
      orderSeriesPrefix: orderSeries.prefix,
      orderSeriesSuffix: orderSeries.suffix,
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
    })
    .from(sales_invoice)
    .leftJoin(order, eq(sales_invoice.orderId, order.id))
    .innerJoin(client, eq(sales_invoice.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
    .leftJoin(orderSeries, eq(order.seriesId, orderSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .where(whereClause)
    .orderBy(desc(sales_invoice.issueDate), desc(sales_invoice.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  const buildResult = (inv: {
    id: number;
    clientId: number;
    orderId: number | null;
    status: string;
    issueDate: string;
    totalAmount: Decimal;
    totalPaid: Decimal;
    documentNumber: number;
    seriesPrefix: string | null;
    seriesSuffix: string | null;
    orderDocumentNumber: number | null;
    orderSeriesPrefix: string | null;
    orderSeriesSuffix: string | null;
    clientFirstName: string | null;
    clientLastName: string | null;
    clientLegalName: string | null;
  }): SalesInvoiceListItem => {
    const prefix = inv.seriesPrefix ?? "";
    const suffix = inv.seriesSuffix ?? "";

    let orderDocNumber: string | null = null;
    if (inv.orderId && inv.orderDocumentNumber) {
      const orderPrefix = inv.orderSeriesPrefix ?? "";
      const orderSuffix = inv.orderSeriesSuffix ?? "";
      orderDocNumber = `${orderPrefix}${inv.orderDocumentNumber}${orderSuffix}`;
    }

    return {
      id: inv.id,
      clientId: inv.clientId,
      clientName: inv.clientFirstName
        ? `${inv.clientFirstName} ${inv.clientLastName ?? ""}`.trim()
        : inv.clientLegalName ?? "",
      orderId: inv.orderId,
      orderDocumentNumber: orderDocNumber,
      status: inv.status as SalesInvoiceStatus,
      issueDate: inv.issueDate,
      totalAmount: inv.totalAmount,
      totalPaid: toDecimal(inv.totalPaid),
      balance: toDecimal(inv.totalAmount).sub(toDecimal(inv.totalPaid)),
      documentNumberFull: `${prefix}${inv.documentNumber}${suffix}`,
    };
  };

  if (!includeTotalCount) {
    const invoicesRaw = await queryInvoices;
    return { invoices: invoicesRaw.map(buildResult) };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(sales_invoice)
    .where(whereClause);

  const [invoicesRaw, [{ totalCount }]] = await Promise.all([
    queryInvoices,
    queryCount,
  ]);

  return {
    invoices: invoicesRaw.map(buildResult),
    totalCount,
  };
}

// ============================================================================
// PDF Generation
// ============================================================================

import type {
  SalesInvoicePdfData,
  SalesInvoiceItemPdfDetails,
} from "#utils/dto/finance/sales_invoice";
import { getSystemConfig } from "#svc/config/systemConfig";

/**
 * Obtiene los datos completos de una factura de venta para generar el PDF.
 * Incluye ítems detallados, información del cliente y datos de la empresa.
 * @permission finance.sales_invoice.read
 */
export async function getSalesInvoiceForPdf(
  id: number
): Promise<SalesInvoicePdfData | undefined> {
  // Obtener factura con datos del cliente
  const [invoice] = await db
    .select({
      id: sales_invoice.id,
      clientId: sales_invoice.clientId,
      orderId: sales_invoice.orderId,
      status: sales_invoice.status,
      issueDate: sales_invoice.issueDate,
      dueDate: sales_invoice.dueDate,
      subtotal: sales_invoice.subtotal,
      globalDiscountPercent: sales_invoice.globalDiscountPercent,
      globalDiscountAmount: sales_invoice.globalDiscountAmount,
      taxAmount: sales_invoice.taxAmount,
      totalAmount: sales_invoice.totalAmount,
      notes: sales_invoice.notes,
      documentNumber: sales_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      // Client data
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
      clientDocumentType: documentType.name,
      clientDocumentNumber: user.documentNumber,
    })
    .from(sales_invoice)
    .innerJoin(client, eq(sales_invoice.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .leftJoin(documentType, eq(user.documentTypeId, documentType.id))
    .where(eq(sales_invoice.id, id));

  if (!invoice) {
    return undefined;
  }

  // Obtener ítems de la factura con información del producto
  const items = await db
    .select({
      id: sales_invoice_item.id,
      lineNumber: sales_invoice_item.lineNumber,
      itemCode: item.code,
      itemName: item.fullName,
      quantity: sales_invoice_item.quantity,
      unitPrice: sales_invoice_item.unitPrice,
      discountPercent: sales_invoice_item.discountPercent,
      discountAmount: sales_invoice_item.discountAmount,
      taxId: sales_invoice_item.taxId,
      taxAmount: sales_invoice_item.taxAmount,
      total: sales_invoice_item.total,
      description: sales_invoice_item.description,
      taxRate: tax.rate,
    })
    .from(sales_invoice_item)
    .innerJoin(item, eq(sales_invoice_item.itemId, item.id))
    .leftJoin(tax, eq(sales_invoice_item.taxId, tax.id))
    .where(eq(sales_invoice_item.salesInvoiceId, id))
    .orderBy(sales_invoice_item.lineNumber);

  // Obtener configuración de la empresa
  const systemConfig = await getSystemConfig();

  const itemsDetails: SalesInvoiceItemPdfDetails[] = items.map((i) => {
    return {
      id: i.id,
      lineNumber: i.lineNumber,
      itemCode: i.itemCode,
      itemName: i.itemName,
      quantity: toDecimal(i.quantity),
      unitPrice: toDecimal(i.unitPrice),
      discountPercent: toDecimal(i.discountPercent),
      discountAmount: toDecimal(i.discountAmount),
      taxRate: i.taxRate ? toDecimal(i.taxRate) : null,
      taxAmount: toDecimal(i.taxAmount),
      total: toDecimal(i.total),
      description: i.description,
    };
  });

  const clientName = invoice.clientFirstName
    ? `${invoice.clientFirstName} ${invoice.clientLastName ?? ""}`.trim()
    : invoice.clientLegalName ?? "";

  const prefix = invoice.seriesPrefix ?? "";
  const suffix = invoice.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

  return {
    id: invoice.id,
    documentNumberFull,
    status: invoice.status as SalesInvoiceStatus,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    client: {
      id: invoice.clientId,
      name: clientName,
      documentType: invoice.clientDocumentType,
      documentNumber: invoice.clientDocumentNumber,
    },
    company: {
      name: systemConfig.companyName || "Mi Empresa",
      nit: systemConfig.companyNit || "",
      address: systemConfig.companyAddress || "",
      phone: systemConfig.companyPhone || "",
      email: systemConfig.companyEmail || "",
      logo: systemConfig.companyLogo || undefined,
    },
    items: itemsDetails,
    subtotal: toDecimal(invoice.subtotal),
    globalDiscountPercent: toDecimal(invoice.globalDiscountPercent),
    globalDiscountAmount: toDecimal(invoice.globalDiscountAmount),
    taxAmount: toDecimal(invoice.taxAmount),
    totalAmount: toDecimal(invoice.totalAmount),
    currency: systemConfig.currency || "COP",
    notes: invoice.notes,
  };
}

// ============================================================================
// Email Service
// ============================================================================

import type {
  SendSalesInvoiceEmailInput,
  SendSalesInvoiceEmailResult,
} from "#utils/dto/finance/sales_invoice";
import MailManager from "#lib/services/mail/MailManager";
import {
  generateSalesInvoiceEmailHtml,
  generateSalesInvoiceEmailSubject,
} from "#lib/services/mail/template/salesInvoice";
import { contactMethod } from "#models/core/contactMethod";

/**
 * Envía una factura de venta por correo electrónico al cliente.
 * 
 * **Requisitos:**
 * - La factura debe estar en estado "issued" (emitida)
 * - El cliente debe tener un email primario registrado
 * - El PDF se genera en el cliente y se envía como base64
 * 
 * @param input - Datos para el envío (ID factura, PDF en base64)
 * @returns Resultado del envío
 */
export async function sendSalesInvoiceByEmail(
  input: SendSalesInvoiceEmailInput
): Promise<SendSalesInvoiceEmailResult> {
  // 1. Obtener datos de la factura
  const [invoice] = await db
    .select({
      id: sales_invoice.id,
      clientId: sales_invoice.clientId,
      status: sales_invoice.status,
      issueDate: sales_invoice.issueDate,
      dueDate: sales_invoice.dueDate,
      totalAmount: sales_invoice.totalAmount,
      documentNumber: sales_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      // Client name
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
    })
    .from(sales_invoice)
    .innerJoin(client, eq(sales_invoice.clientId, client.id))
    .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .where(eq(sales_invoice.id, input.salesInvoiceId));

  if (!invoice) {
    throw new NotFoundError("Factura de venta no encontrada");
  }

  // 2. Validar que la factura esté emitida
  if (invoice.status !== "issued") {
    throw new BusinessRuleError(
      "Solo se pueden enviar por correo facturas emitidas. Estado actual: " + invoice.status
    );
  }

  // 3. Obtener email primario del cliente
  const [clientEmail] = await db
    .select({
      email: contactMethod.value,
    })
    .from(contactMethod)
    .where(
      and(
        eq(contactMethod.userId, invoice.clientId),
        eq(contactMethod.type, "email"),
        eq(contactMethod.isPrimary, true),
        eq(contactMethod.isActive, true)
      )
    );

  if (!clientEmail) {
    throw new BusinessRuleError(
      "El cliente no tiene un email primario registrado. Por favor, agregue un email al cliente."
    );
  }

  // 4. Obtener configuración del sistema para datos de la empresa
  const systemConfig = await getSystemConfig();

  // 5. Construir nombre del cliente
  const clientName = invoice.clientFirstName
    ? `${invoice.clientFirstName} ${invoice.clientLastName ?? ""}`.trim()
    : invoice.clientLegalName ?? "Cliente";

  // 6. Construir número de documento completo
  const prefix = invoice.seriesPrefix ?? "";
  const suffix = invoice.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

  // 7. Formatear fechas
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // 8. Formatear total
  const totalNumber = toDecimal(invoice.totalAmount).toNumber();
  const totalFormatted = `$${totalNumber.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
  })}`;

  // 9. Generar contenido del email
  const htmlContent = generateSalesInvoiceEmailHtml({
    documentNumber: documentNumberFull,
    clientName,
    issueDate: formatDate(invoice.issueDate),
    dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : undefined,
    totalAmount: totalFormatted,
    companyName: systemConfig.companyName || "Mi Empresa",
    companyEmail: systemConfig.companyEmail || undefined,
    companyPhone: systemConfig.companyPhone || undefined,
  });

  const subject = generateSalesInvoiceEmailSubject(
    documentNumberFull,
    systemConfig.companyName || "Mi Empresa"
  );

  // 10. Enviar correo con adjunto
  const pdfFilename = input.pdfFilename || `Factura_${documentNumberFull}.pdf`;

  await MailManager.sendMailWithAttachments({
    to: clientEmail.email,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: pdfFilename,
        content: input.pdfBase64,
      },
    ],
  });

  return {
    success: true,
    recipientEmail: clientEmail.email,
    message: `Factura ${documentNumberFull} enviada exitosamente a ${clientEmail.email}`,
  };
}
