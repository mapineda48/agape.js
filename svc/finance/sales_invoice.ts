import { db } from "#lib/db";
import sales_invoice from "#models/finance/sales_invoice";
import order from "#models/crm/order";
import client from "#models/crm/client";
import person from "#models/core/person";
import { company } from "#models/core/company";
import { user } from "#models/core/user";
import { documentType } from "#models/numbering/document_type";
import { documentSequence } from "#models/numbering/document_sequence";
import { documentSeries } from "#models/numbering/document_series";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";

// Re-export DTOs from shared module
export type {
  CreateSalesInvoiceInput,
  SalesInvoiceWithNumbering,
  SalesInvoiceDetails,
  ListSalesInvoicesParams,
  SalesInvoiceListItem,
  ListSalesInvoicesResult,
} from "#utils/dto/finance/sales_invoice";

import type {
  CreateSalesInvoiceInput,
  SalesInvoiceWithNumbering,
  SalesInvoiceDetails,
  ListSalesInvoicesParams,
  SalesInvoiceListItem,
  ListSalesInvoicesResult,
} from "#utils/dto/finance/sales_invoice";

/** Código del tipo de documento para facturas de venta */
export const SALES_INVOICE_DOCUMENT_TYPE_CODE = "SALES_INVOICE";

// ============================================================================
// Helper Functions
// ============================================================================

function toDecimal(value: Decimal | number | string): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

function toDateString(value: Date | string | undefined): string {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    return value;
  }
  return value.toISOString().split("T")[0];
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Crea una nueva factura de venta.
 * Asigna automáticamente un número de documento vía el motor de numeración.
 */
export async function createSalesInvoice(
  payload: CreateSalesInvoiceInput
): Promise<SalesInvoiceWithNumbering> {
  return db.transaction(async (tx) => {
    // Validar que la orden exista
    const [orderRecord] = await tx
      .select({
        id: order.id,
        status: order.status,
      })
      .from(order)
      .where(eq(order.id, payload.orderId));

    if (!orderRecord) {
      throw new Error("La orden de venta no existe");
    }

    const totalAmount = toDecimal(payload.totalAmount);
    if (totalAmount.lte(0)) {
      throw new Error("El monto total debe ser mayor a cero");
    }

    const issueDate = toDateString(payload.issueDate);
    const dueDate = payload.dueDate ? toDateString(payload.dueDate) : null;

    // Obtener número de documento usando ID temporal
    const tempExternalId = crypto.randomUUID();
    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: SALES_INVOICE_DOCUMENT_TYPE_CODE,
      today: new DateTime(issueDate),
      externalDocumentType: "sales_invoice",
      externalDocumentId: tempExternalId,
    });

    const [invoice] = await tx
      .insert(sales_invoice)
      .values({
        orderId: payload.orderId,
        issueDate,
        dueDate,
        totalAmount,
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

    return {
      ...invoice,
      documentNumberFull: numbering.fullNumber,
    };
  });
}

/**
 * Obtiene una factura de venta por su ID con todos los detalles.
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
      totalAmount: sales_invoice.totalAmount,
      documentNumber: sales_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      // Order data
      orderDocumentNumber: order.documentNumber,
      orderSeriesPrefix: orderSeries.prefix,
      orderSeriesSuffix: orderSeries.suffix,
      clientId: order.clientId,
      // Client data
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
      clientDocumentType: documentType.name,
      clientDocumentNumber: user.documentNumber,
    })
    .from(sales_invoice)
    .innerJoin(order, eq(sales_invoice.orderId, order.id))
    .innerJoin(client, eq(order.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
    .innerJoin(orderSeries, eq(order.seriesId, orderSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .leftJoin(documentType, eq(user.documentTypeId, documentType.id))
    .where(eq(sales_invoice.id, id));

  if (!invoice) {
    return undefined;
  }

  const clientName = invoice.clientFirstName
    ? `${invoice.clientFirstName} ${invoice.clientLastName ?? ""}`.trim()
    : invoice.clientLegalName ?? "";

  const prefix = invoice.seriesPrefix ?? "";
  const suffix = invoice.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

  const orderPrefix = invoice.orderSeriesPrefix ?? "";
  const orderSuffix = invoice.orderSeriesSuffix ?? "";
  const orderDocumentNumber = `${orderPrefix}${invoice.orderDocumentNumber}${orderSuffix}`;

  return {
    id: invoice.id,
    orderId: invoice.orderId,
    orderDocumentNumber,
    clientId: invoice.clientId,
    clientName,
    clientDocumentType: invoice.clientDocumentType,
    clientDocumentNumber: invoice.clientDocumentNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    totalAmount: invoice.totalAmount,
    documentNumberFull,
  };
}

/**
 * Lista facturas de venta con filtros y paginación.
 */
export async function listSalesInvoices(
  params: ListSalesInvoicesParams = {}
): Promise<ListSalesInvoicesResult> {
  const {
    orderId,
    fromDate,
    toDate,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (orderId !== undefined) {
    conditions.push(eq(sales_invoice.orderId, orderId));
  }

  if (fromDate !== undefined) {
    const date = toDateString(fromDate);
    conditions.push(gte(sales_invoice.issueDate, date));
  }

  if (toDate !== undefined) {
    const date = toDateString(toDate);
    conditions.push(lte(sales_invoice.issueDate, date));
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
      orderId: sales_invoice.orderId,
      issueDate: sales_invoice.issueDate,
      totalAmount: sales_invoice.totalAmount,
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
    .innerJoin(order, eq(sales_invoice.orderId, order.id))
    .innerJoin(client, eq(order.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(sales_invoice.seriesId, documentSeries.id))
    .innerJoin(orderSeries, eq(order.seriesId, orderSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .where(whereClause)
    .orderBy(desc(sales_invoice.issueDate), desc(sales_invoice.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  const buildResult = (inv: {
    id: number;
    orderId: number;
    issueDate: string;
    totalAmount: Decimal;
    documentNumber: number;
    seriesPrefix: string | null;
    seriesSuffix: string | null;
    orderDocumentNumber: number;
    orderSeriesPrefix: string | null;
    orderSeriesSuffix: string | null;
    clientFirstName: string | null;
    clientLastName: string | null;
    clientLegalName: string | null;
  }): SalesInvoiceListItem => {
    const prefix = inv.seriesPrefix ?? "";
    const suffix = inv.seriesSuffix ?? "";
    const orderPrefix = inv.orderSeriesPrefix ?? "";
    const orderSuffix = inv.orderSeriesSuffix ?? "";
    return {
      id: inv.id,
      orderId: inv.orderId,
      orderDocumentNumber: `${orderPrefix}${inv.orderDocumentNumber}${orderSuffix}`,
      clientName: inv.clientFirstName
        ? `${inv.clientFirstName} ${inv.clientLastName ?? ""}`.trim()
        : inv.clientLegalName ?? "",
      issueDate: inv.issueDate,
      totalAmount: inv.totalAmount,
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
