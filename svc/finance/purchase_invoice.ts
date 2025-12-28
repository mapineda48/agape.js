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
import purchase_invoice_item from "#models/finance/purchase_invoice_item";
import { paymentTerms } from "#models/finance/payment_terms";
import goods_receipt_item from "#models/purchasing/goods_receipt_item";
import order_item from "#models/purchasing/order_item";
import { item } from "#models/catalogs/item";
import { getSystemConfig } from "#svc/config/systemConfig";

// Re-export DTOs from shared module
export type {
  CreatePurchaseInvoiceInput,
  PurchaseInvoiceWithNumbering,
  PurchaseInvoiceDetails,
  ListPurchaseInvoicesParams,
  PurchaseInvoiceListItem,
  ListPurchaseInvoicesResult,
  PurchaseInvoiceItemDetails,
  PurchaseInvoicePdfData,
  CompanyInfo,
} from "#utils/dto/finance/purchase_invoice";

import type {
  CreatePurchaseInvoiceInput,
  PurchaseInvoiceWithNumbering,
  PurchaseInvoiceDetails,
  ListPurchaseInvoicesParams,
  PurchaseInvoiceListItem,
  ListPurchaseInvoicesResult,
  PurchaseInvoiceItemDetails,
  PurchaseInvoicePdfData,
} from "#utils/dto/finance/purchase_invoice";

/** Código del tipo de documento para facturas de compra */
export const PURCHASE_INVOICE_DOCUMENT_TYPE_CODE = "PURCHASE_INVOICE";

// ============================================================================
// Helper Functions
// ============================================================================

function toDecimal(value: Decimal | number | string): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
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

    // Usar DateTime directamente - el RPC ya lo deserializó
    const issueDate = payload.issueDate ?? new DateTime();
    const issueDateStr = issueDate.toISOString().split("T")[0];

    // R8: Calcular Due Date basado en Payment Terms
    let paymentTermsId = payload.paymentTermsId;
    let computedDueDate: string | null = null;

    if (payload.dueDate) {
      computedDueDate = payload.dueDate.toISOString().split("T")[0];
    } else {
      // Si no se proporcionó fecha, es OBLIGATORIO tener payment terms
      if (!paymentTermsId) {
        throw new Error(
          "Debe proporcionar Fecha de Vencimiento o Términos de Pago"
        );
      }

      const [terms] = await tx
        .select()
        .from(paymentTerms)
        .where(eq(paymentTerms.id, paymentTermsId));
      if (!terms) throw new Error("Términos de pago no encontrados");

      computedDueDate = issueDate
        .addDays(terms.dueDays)
        .toISOString()
        .substring(0, 10);
    }

    // Validar Items y R6/R7
    if (!payload.items || payload.items.length === 0) {
      throw new Error("La factura debe tener al menos un ítem");
    }

    const itemsToInsert = [];
    let calculatedTotal = new Decimal(0);

    for (const itemInput of payload.items) {
      const qty = itemInput.quantity;
      const price = toDecimal(itemInput.unitPrice);

      if (qty <= 0) throw new Error("Cantidad debe ser mayor a 0");
      if (price.lt(0)) throw new Error("Precio no puede ser negativo");

      const subtotal = new Decimal(qty).mul(price);
      calculatedTotal = calculatedTotal.add(subtotal); // Nota: esto es subtotal antes de impuestos/descuentos.
      // El payload.totalAmount es el total FINAL con impuestos.
      // Aquí simplificamos y no validamos tax mathematics a fondo, pero validamos varianza de precio unitario.

      // R7: Quantity Match & R6: Price Variance
      if (itemInput.goodsReceiptItemId) {
        const [grItem] = await tx
          .select()
          .from(goods_receipt_item)
          .where(eq(goods_receipt_item.id, itemInput.goodsReceiptItemId));
        if (!grItem)
          throw new Error(
            `Ítem de recepción ${itemInput.goodsReceiptItemId} no encontrado`
          );

        // R7
        if (qty > grItem.quantity) {
          throw new Error(
            `Cantidad facturada (${qty}) excede la recibida (${grItem.quantity}) para ítem ${grItem.itemId}`
          );
        }

        // R6
        // Tolerancia de precio? Digamos 5%
        const variance = price.sub(new Decimal(grItem.unitCost)).abs();
        const threshold = new Decimal(grItem.unitCost).mul(0.05); // 5%
        if (variance.gt(threshold)) {
          // Warning o Error. Usuario pidió "Exigir autorización". Lanzamos error.
          throw new Error(
            `Variación de precio detectada para ítem ${grItem.itemId}. Factura: ${price}, Recepción: ${grItem.unitCost}. Excede límite.`
          );
        }
      } else if (itemInput.orderItemId) {
        const [poItem] = await tx
          .select()
          .from(order_item)
          .where(eq(order_item.id, itemInput.orderItemId));
        if (!poItem)
          throw new Error(
            `Ítem de orden ${itemInput.orderItemId} no encontrado`
          );

        // R7 vs Orden (si facturamos directo)
        if (qty > poItem.quantity)
          throw new Error(`Cantidad facturada excede orden`);

        // R6
        const variance = price.sub(new Decimal(poItem.unitPrice)).abs();
        const threshold = new Decimal(poItem.unitPrice).mul(0.05);
        if (variance.gt(threshold)) {
          throw new Error(`Variación de precio vs Orden detectada`);
        }
      }

      itemsToInsert.push({
        itemId: itemInput.itemId,
        quantity: qty,
        unitPrice: price,
        orderItemId: itemInput.orderItemId,
        goodsReceiptItemId: itemInput.goodsReceiptItemId,
        taxId: itemInput.taxId,
        subtotal: subtotal,
        // discount, taxAmount defaulted
      });
    }

    // Obtener número de documento usando ID temporal
    const tempExternalId = crypto.randomUUID();
    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: PURCHASE_INVOICE_DOCUMENT_TYPE_CODE,
      today: issueDate,
      externalDocumentType: "purchase_invoice",
      externalDocumentId: tempExternalId,
    });

    const [invoice] = await tx
      .insert(purchase_invoice)
      .values({
        supplierId: payload.supplierId,
        purchaseOrderId: payload.purchaseOrderId,
        goodsReceiptId: payload.goodsReceiptId,
        paymentTermsId: paymentTermsId,
        issueDate: issueDateStr,
        dueDate: computedDueDate,
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

    // Insertar Items
    if (itemsToInsert.length > 0) {
      await tx.insert(purchase_invoice_item).values(
        itemsToInsert.map((i) => ({
          purchaseInvoiceId: invoice.id,
          ...i,
        }))
      );
    }

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
    const dateStr = fromDate.toISOString().split("T")[0];
    conditions.push(gte(purchase_invoice.issueDate, dateStr));
  }

  if (toDate !== undefined) {
    const dateStr = toDate.toISOString().split("T")[0];
    conditions.push(lte(purchase_invoice.issueDate, dateStr));
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

/**
 * Obtiene los datos completos de una factura de compra para generar el PDF.
 * Incluye ítems detallados, información del proveedor y datos de la empresa.
 */
export async function getPurchaseInvoiceForPdf(
  id: number
): Promise<PurchaseInvoicePdfData | undefined> {
  // Obtener factura con datos del proveedor
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

  // Obtener ítems de la factura con información del producto
  const items = await db
    .select({
      id: purchase_invoice_item.id,
      itemCode: item.code,
      itemName: item.fullName,
      quantity: purchase_invoice_item.quantity,
      unitPrice: purchase_invoice_item.unitPrice,
      discountAmount: purchase_invoice_item.discountAmount,
      taxAmount: purchase_invoice_item.taxAmount,
      subtotal: purchase_invoice_item.subtotal,
      description: purchase_invoice_item.description,
    })
    .from(purchase_invoice_item)
    .innerJoin(item, eq(purchase_invoice_item.itemId, item.id))
    .where(eq(purchase_invoice_item.purchaseInvoiceId, id));

  // Obtener configuración de la empresa
  const systemConfig = await getSystemConfig();

  // Calcular totales
  let subtotal = new Decimal(0);
  let totalDiscount = new Decimal(0);
  let totalTax = new Decimal(0);

  const itemsDetails: PurchaseInvoiceItemDetails[] = items.map((i) => {
    const unitPrice = i.unitPrice instanceof Decimal ? i.unitPrice : new Decimal(i.unitPrice ?? 0);
    const discountAmount = i.discountAmount instanceof Decimal ? i.discountAmount : new Decimal(i.discountAmount ?? 0);
    const taxAmount = i.taxAmount instanceof Decimal ? i.taxAmount : new Decimal(i.taxAmount ?? 0);
    const itemSubtotal = i.subtotal instanceof Decimal ? i.subtotal : new Decimal(i.subtotal ?? 0);

    subtotal = subtotal.add(itemSubtotal);
    totalDiscount = totalDiscount.add(discountAmount);
    totalTax = totalTax.add(taxAmount);

    return {
      id: i.id,
      itemCode: i.itemCode,
      itemName: i.itemName,
      quantity: i.quantity,
      unitPrice,
      discountAmount,
      taxAmount,
      subtotal: itemSubtotal,
      description: i.description,
    };
  });

  const supplierName = invoice.supplierFirstName
    ? `${invoice.supplierFirstName} ${invoice.supplierLastName ?? ""}`.trim()
    : invoice.supplierLegalName ?? "";

  const prefix = invoice.seriesPrefix ?? "";
  const suffix = invoice.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${invoice.documentNumber}${suffix}`;

  return {
    id: invoice.id,
    documentNumberFull,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    supplier: {
      id: invoice.supplierId,
      name: supplierName,
      documentType: invoice.supplierDocumentType,
      documentNumber: invoice.supplierDocumentNumber,
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
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount: invoice.totalAmount instanceof Decimal
      ? invoice.totalAmount
      : new Decimal(invoice.totalAmount),
    currency: systemConfig.currency || "COP",
  };
}
