import { db } from "#lib/db";
import purchase_invoice from "#models/finance/purchase_invoice";
import supplier from "#models/purchasing/supplier";
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
  CreatePurchaseInvoiceInput,
  PurchaseInvoiceWithNumbering,
  PurchaseInvoiceDetails,
  ListPurchaseInvoicesParams,
  PurchaseInvoiceListItem,
  ListPurchaseInvoicesResult,
} from "#utils/dto/finance/purchase_invoice";

import type {
  CreatePurchaseInvoiceInput,
  PurchaseInvoiceWithNumbering,
  PurchaseInvoiceDetails,
  ListPurchaseInvoicesParams,
  PurchaseInvoiceListItem,
  ListPurchaseInvoicesResult,
} from "#utils/dto/finance/purchase_invoice";

/** Código del tipo de documento para facturas de compra */
export const PURCHASE_INVOICE_DOCUMENT_TYPE_CODE = "PURCHASE_INVOICE";

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
 * Crea una nueva factura de compra.
 * Asigna automáticamente un número de documento vía el motor de numeración.
 */
export async function createPurchaseInvoice(
  payload: CreatePurchaseInvoiceInput
): Promise<PurchaseInvoiceWithNumbering> {
  return db.transaction(async (tx) => {
    // Validar que el proveedor exista y esté activo
    const [supplierRecord] = await tx
      .select({
        id: supplier.id,
        active: supplier.active,
      })
      .from(supplier)
      .where(eq(supplier.id, payload.supplierId));

    if (!supplierRecord) {
      throw new Error("El proveedor no existe");
    }

    if (!supplierRecord.active) {
      throw new Error("El proveedor está inactivo");
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
      documentTypeCode: PURCHASE_INVOICE_DOCUMENT_TYPE_CODE,
      today: new DateTime(issueDate),
      externalDocumentType: "purchase_invoice",
      externalDocumentId: tempExternalId,
    });

    const [invoice] = await tx
      .insert(purchase_invoice)
      .values({
        supplierId: payload.supplierId,
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
 * Obtiene una factura de compra por su ID con todos los detalles.
 */
export async function getPurchaseInvoiceById(
  id: number
): Promise<PurchaseInvoiceDetails | undefined> {
  const [invoice] = await db
    .select({
      id: purchase_invoice.id,
      supplierId: purchase_invoice.supplierId,
      issueDate: purchase_invoice.issueDate,
      dueDate: purchase_invoice.dueDate,
      totalAmount: purchase_invoice.totalAmount,
      documentNumber: purchase_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      // Supplier data
      supplierFirstName: person.firstName,
      supplierLastName: person.lastName,
      supplierLegalName: company.legalName,
      supplierDocumentType: documentType.name,
      supplierDocumentNumber: user.documentNumber,
    })
    .from(purchase_invoice)
    .innerJoin(supplier, eq(purchase_invoice.supplierId, supplier.id))
    .innerJoin(user, eq(supplier.id, user.id))
    .innerJoin(documentSeries, eq(purchase_invoice.seriesId, documentSeries.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .leftJoin(documentType, eq(user.documentTypeId, documentType.id))
    .where(eq(purchase_invoice.id, id));

  if (!invoice) {
    return undefined;
  }

  const supplierName = invoice.supplierFirstName
    ? `${invoice.supplierFirstName} ${invoice.supplierLastName ?? ""}`.trim()
    : invoice.supplierLegalName ?? "";

  const prefix = invoice.seriesPrefix ?? "";
  const suffix = invoice.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

  return {
    id: invoice.id,
    supplierId: invoice.supplierId,
    supplierName,
    supplierDocumentType: invoice.supplierDocumentType,
    supplierDocumentNumber: invoice.supplierDocumentNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    totalAmount: invoice.totalAmount,
    documentNumberFull,
  };
}

/**
 * Lista facturas de compra con filtros y paginación.
 */
export async function listPurchaseInvoices(
  params: ListPurchaseInvoicesParams = {}
): Promise<ListPurchaseInvoicesResult> {
  const {
    supplierId,
    fromDate,
    toDate,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (supplierId !== undefined) {
    conditions.push(eq(purchase_invoice.supplierId, supplierId));
  }

  if (fromDate !== undefined) {
    const date = toDateString(fromDate);
    conditions.push(gte(purchase_invoice.issueDate, date));
  }

  if (toDate !== undefined) {
    const date = toDateString(toDate);
    conditions.push(lte(purchase_invoice.issueDate, date));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const queryInvoices = db
    .select({
      id: purchase_invoice.id,
      supplierId: purchase_invoice.supplierId,
      issueDate: purchase_invoice.issueDate,
      totalAmount: purchase_invoice.totalAmount,
      documentNumber: purchase_invoice.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      supplierFirstName: person.firstName,
      supplierLastName: person.lastName,
      supplierLegalName: company.legalName,
    })
    .from(purchase_invoice)
    .innerJoin(supplier, eq(purchase_invoice.supplierId, supplier.id))
    .innerJoin(user, eq(supplier.id, user.id))
    .innerJoin(documentSeries, eq(purchase_invoice.seriesId, documentSeries.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .where(whereClause)
    .orderBy(desc(purchase_invoice.issueDate), desc(purchase_invoice.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  const buildResult = (inv: {
    id: number;
    supplierId: number;
    issueDate: string;
    totalAmount: Decimal;
    documentNumber: number;
    seriesPrefix: string | null;
    seriesSuffix: string | null;
    supplierFirstName: string | null;
    supplierLastName: string | null;
    supplierLegalName: string | null;
  }): PurchaseInvoiceListItem => {
    const prefix = inv.seriesPrefix ?? "";
    const suffix = inv.seriesSuffix ?? "";
    return {
      id: inv.id,
      supplierId: inv.supplierId,
      supplierName: inv.supplierFirstName
        ? `${inv.supplierFirstName} ${inv.supplierLastName ?? ""}`.trim()
        : inv.supplierLegalName ?? "",
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
    .from(purchase_invoice)
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
