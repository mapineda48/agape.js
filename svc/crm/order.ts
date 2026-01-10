import { db } from "#lib/db";
import order from "#models/crm/order";
import orderItem from "#models/crm/order_item";
import orderType from "#models/crm/order_type";
import client from "#models/crm/client";
import person from "#models/core/person";
import { company } from "#models/core/company";
import { user } from "#models/core/user";
import { item } from "#models/catalogs/item";
import { documentType } from "#models/numbering/document_type";
import { documentSequence } from "#models/numbering/document_sequence";
import { documentSeries } from "#models/numbering/document_series";
import { orderStatusEnum } from "#models/crm/order";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { eq, and, gte, lte, count, desc, sql } from "drizzle-orm";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";
import { BusinessRuleError, NotFoundError } from "#lib/error";

// Re-export DTOs from shared module
export type {
  OrderStatus,
  CreateSalesOrderInput,
  SalesOrderWithNumbering,
  SalesOrderDetails,
  ListSalesOrdersParams,
  SalesOrderListItem,
  ListSalesOrdersResult,
  SalesOrderType,
} from "#utils/dto/crm/order";

export { ORDER_STATUS_VALUES } from "#utils/dto/crm/order";

import type {
  OrderStatus,
  CreateSalesOrderInput,
  SalesOrderWithNumbering,
  SalesOrderDetails,
  ListSalesOrdersParams,
  SalesOrderListItem,
  ListSalesOrdersResult,
  SalesOrderType,
} from "#utils/dto/crm/order";

/** Código del tipo de documento para órdenes de venta */
export const SALES_ORDER_DOCUMENT_TYPE_CODE = "SALES_ORDER";

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
 * Crea una nueva orden de venta con sus líneas.
 * Asigna automáticamente un número de documento vía el motor de numeración.
 * @permission sales.order.manage
 */
export async function createSalesOrder(
  payload: CreateSalesOrderInput
): Promise<SalesOrderWithNumbering> {
  const status = payload.status ?? "pending";

  if (!orderStatusEnum.enumValues.includes(status)) {
    throw new BusinessRuleError("Estado de la orden de venta inválido");
  }

  return db.transaction(async (tx) => {
    // Validar que el cliente exista y esté activo
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

    // Validar que haya al menos una línea
    if (!payload.items || payload.items.length === 0) {
      throw new BusinessRuleError("La orden debe tener al menos una línea");
    }

    // Usar DateTime directamente - el RPC ya lo deserializó
    const orderDate = payload.orderDate ?? new DateTime();
    const orderDateStr = orderDate.toISOString().split("T")[0];

    // Calcular totales de líneas
    let subtotalSum = new Decimal(0);
    // Para simplificar el mínimo ideal, asumiremos impuestos por línea del 19% si no se especifica, 
    // o podemos dejarlo en 0 si no queremos complicar el catálogo de impuestos aquí.
    // El modelo crm_order_item tiene taxPercent y taxAmount.
    let taxAmountSum = new Decimal(0);

    const itemsToInsert = payload.items.map((lineInput, index) => {
      const qty = toDecimal(lineInput.quantity);
      const unitPrice = toDecimal(lineInput.unitPrice);
      const discountPct = toDecimal(lineInput.discountPercent);

      const grossAmount = qty.mul(unitPrice);
      const discountAmount = grossAmount.mul(discountPct).div(100);
      const lineSubtotal = grossAmount.sub(discountAmount);

      // Default tax 0 for now as it's not in the input DTO yet
      const taxPercent = new Decimal(0);
      const lineTaxAmount = lineSubtotal.mul(taxPercent).div(100);
      const lineTotal = lineSubtotal.add(lineTaxAmount);

      subtotalSum = subtotalSum.add(lineSubtotal);
      taxAmountSum = taxAmountSum.add(lineTaxAmount);

      return {
        lineNumber: index + 1,
        itemId: lineInput.itemId,
        quantity: qty,
        unitPrice,
        discountPercent: discountPct,
        discountAmount,
        taxPercent,
        taxAmount: lineTaxAmount,
        subtotal: lineSubtotal,
        total: lineTotal,
        notes: lineInput.notes,
      };
    });

    const totalAmount = subtotalSum.add(taxAmountSum);

    // Obtener número de documento usando ID temporal
    const tempExternalId = crypto.randomUUID();
    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: SALES_ORDER_DOCUMENT_TYPE_CODE,
      today: orderDate,
      externalDocumentType: "sales_order",
      externalDocumentId: tempExternalId,
    });

    const [createdOrder] = await tx
      .insert(order)
      .values({
        clientId: payload.clientId,
        orderTypeId: payload.orderTypeId,
        orderDate: orderDateStr,
        status,
        disabled: false,
        seriesId: numbering.seriesId,
        documentNumber: numbering.assignedNumber,
        subtotal: subtotalSum,
        taxAmount: taxAmountSum,
        total: totalAmount,
        notes: payload.notes,
        paymentTermsId: payload.paymentTermsId,
        priceListId: payload.priceListId,
      })
      .returning();

    // Insertar líneas
    await tx.insert(orderItem).values(
      itemsToInsert.map((item) => ({
        ...item,
        orderId: createdOrder.id,
      }))
    );

    // Actualizar externalDocumentId en document_sequence con el ID real
    await tx
      .update(documentSequence)
      .set({ externalDocumentId: createdOrder.id.toString() })
      .where(
        and(
          eq(documentSequence.seriesId, numbering.seriesId),
          eq(documentSequence.assignedNumber, numbering.assignedNumber)
        )
      );

    return {
      ...createdOrder,
      documentNumberFull: numbering.fullNumber,
      total: totalAmount,
      orderDate: createdOrder.orderDate,
      status: createdOrder.status as OrderStatus,
    };
  });
}

/**
 * Obtiene una orden de venta por su ID con todos los detalles y líneas.
 * @permission sales.order.read
 */
export async function getSalesOrderById(
  id: number
): Promise<SalesOrderDetails | undefined> {
  const [orderRecord] = await db
    .select({
      id: order.id,
      clientId: order.clientId,
      orderTypeId: order.orderTypeId,
      orderDate: order.orderDate,
      status: order.status,
      disabled: order.disabled,
      seriesId: order.seriesId,
      documentNumber: order.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      notes: order.notes,
      // Client data
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
      clientDocumentType: documentType.name,
      clientDocumentNumber: user.documentNumber,
    })
    .from(order)
    .innerJoin(client, eq(order.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(order.seriesId, documentSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .leftJoin(documentType, eq(user.documentTypeId, documentType.id))
    .where(eq(order.id, id));

  if (!orderRecord) {
    return undefined;
  }

  // Obtener líneas de la orden
  const lines = await db
    .select({
      id: orderItem.id,
      lineNumber: orderItem.lineNumber,
      itemId: orderItem.itemId,
      itemCode: item.code,
      itemName: item.fullName,
      quantity: orderItem.quantity,
      unitPrice: orderItem.unitPrice,
      discountPercent: orderItem.discountPercent,
      discountAmount: orderItem.discountAmount,
      taxPercent: orderItem.taxPercent,
      taxAmount: orderItem.taxAmount,
      subtotal: orderItem.subtotal,
      total: orderItem.total,
      notes: orderItem.notes,
      deliveredQuantity: orderItem.deliveredQuantity,
      invoicedQuantity: orderItem.invoicedQuantity,
    })
    .from(orderItem)
    .innerJoin(item, eq(orderItem.itemId, item.id))
    .where(eq(orderItem.orderId, id))
    .orderBy(orderItem.lineNumber);

  const clientName = orderRecord.clientFirstName
    ? `${orderRecord.clientFirstName} ${orderRecord.clientLastName ?? ""
      }`.trim()
    : orderRecord.clientLegalName ?? "";

  const prefix = orderRecord.seriesPrefix ?? "";
  const suffix = orderRecord.seriesSuffix ?? "";
  const documentNumberFull = `${prefix}${orderRecord.documentNumber}${suffix}`;

  return {
    id: orderRecord.id,
    clientId: orderRecord.clientId,
    clientName,
    clientDocumentType: orderRecord.clientDocumentType,
    clientDocumentNumber: orderRecord.clientDocumentNumber,
    orderTypeId: orderRecord.orderTypeId,
    orderDate: orderRecord.orderDate,
    status: orderRecord.status as OrderStatus,
    documentNumberFull,
    disabled: orderRecord.disabled,
    subtotal: toDecimal(orderRecord.subtotal),
    taxAmount: toDecimal(orderRecord.taxAmount),
    total: toDecimal(orderRecord.total),
    notes: orderRecord.notes,
    items: lines.map((l) => ({
      ...l,
      quantity: toDecimal(l.quantity),
      unitPrice: toDecimal(l.unitPrice),
      discountPercent: toDecimal(l.discountPercent),
      discountAmount: toDecimal(l.discountAmount),
      taxPercent: toDecimal(l.taxPercent),
      taxAmount: toDecimal(l.taxAmount),
      subtotal: toDecimal(l.subtotal),
      total: toDecimal(l.total),
      deliveredQuantity: toDecimal(l.deliveredQuantity),
      invoicedQuantity: toDecimal(l.invoicedQuantity),
    })),
  };
}

/**
 * Lista órdenes de venta con filtros y paginación.
 * @permission sales.order.read
 */
export async function listSalesOrders(
  params: ListSalesOrdersParams = {}
): Promise<ListSalesOrdersResult> {
  const {
    clientId,
    orderTypeId,
    status,
    fromDate,
    toDate,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (clientId !== undefined) {
    conditions.push(eq(order.clientId, clientId));
  }

  if (orderTypeId !== undefined) {
    conditions.push(eq(order.orderTypeId, orderTypeId));
  }

  if (status !== undefined) {
    conditions.push(eq(order.status, status));
  }

  if (fromDate !== undefined) {
    const dateStr = fromDate.toISOString().split("T")[0];
    conditions.push(gte(order.orderDate, dateStr));
  }

  if (toDate !== undefined) {
    const dateStr = toDate.toISOString().split("T")[0];
    conditions.push(lte(order.orderDate, dateStr));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const queryOrders = db
    .select({
      id: order.id,
      clientId: order.clientId,
      orderTypeId: order.orderTypeId,
      orderDate: order.orderDate,
      status: order.status,
      total: order.total,
      documentNumber: order.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
      deliveredPercent: sql<number>`COALESCE((SELECT SUM(${orderItem.deliveredQuantity}) / NULLIF(SUM(${orderItem.quantity}), 0) * 100 FROM ${orderItem} WHERE ${orderItem.orderId} = ${order.id}), 0)`,
      invoicedPercent: sql<number>`COALESCE((SELECT SUM(${orderItem.invoicedQuantity}) / NULLIF(SUM(${orderItem.quantity}), 0) * 100 FROM ${orderItem} WHERE ${orderItem.orderId} = ${order.id}), 0)`,
    })
    .from(order)
    .innerJoin(client, eq(order.clientId, client.id))
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(documentSeries, eq(order.seriesId, documentSeries.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .where(whereClause)
    .orderBy(desc(order.orderDate), desc(order.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  const buildResult = (o: {
    id: number;
    clientId: number;
    orderTypeId: number;
    orderDate: string;
    status: string;
    total: string | number | Decimal;
    documentNumber: number;
    seriesPrefix: string | null;
    seriesSuffix: string | null;
    clientFirstName: string | null;
    clientLastName: string | null;
    clientLegalName: string | null;
    deliveredPercent: number;
    invoicedPercent: number;
  }): SalesOrderListItem => {
    const prefix = o.seriesPrefix ?? "";
    const suffix = o.seriesSuffix ?? "";
    return {
      id: o.id,
      clientId: o.clientId,
      clientName: o.clientFirstName
        ? `${o.clientFirstName} ${o.clientLastName ?? ""}`.trim()
        : o.clientLegalName ?? "",
      orderTypeId: o.orderTypeId,
      orderDate: o.orderDate,
      status: o.status as OrderStatus,
      documentNumberFull: `${prefix}${o.documentNumber}${suffix}`,
      total: toDecimal(o.total),
      deliveredPercent: Number(o.deliveredPercent) || 0,
      invoicedPercent: Number(o.invoicedPercent) || 0,
    };
  };

  if (!includeTotalCount) {
    const ordersRaw = await queryOrders;
    return { orders: ordersRaw.map(buildResult) };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(order)
    .where(whereClause);

  const [ordersRaw, [{ totalCount }]] = await Promise.all([
    queryOrders,
    queryCount,
  ]);

  return {
    orders: ordersRaw.map(buildResult),
    totalCount,
  };
}

/**
 * Actualiza el estado de una orden de venta.
 * @permission sales.order.manage
 */
export async function updateSalesOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<SalesOrderWithNumbering> {
  if (!orderStatusEnum.enumValues.includes(status)) {
    throw new BusinessRuleError("Estado de la orden de venta inválido");
  }

  return db.transaction(async (tx) => {
    const [currentOrder] = await tx
      .select({
        id: order.id,
        clientId: order.clientId,
        orderTypeId: order.orderTypeId,
        orderDate: order.orderDate,
        status: order.status,
        disabled: order.disabled,
        seriesId: order.seriesId,
        documentNumber: order.documentNumber,
        seriesPrefix: documentSeries.prefix,
        seriesSuffix: documentSeries.suffix,
        total: order.total,
      })
      .from(order)
      .innerJoin(documentSeries, eq(order.seriesId, documentSeries.id))
      .where(eq(order.id, orderId));

    if (!currentOrder) {
      throw new NotFoundError("Orden de venta no encontrada");
    }

    // Validate state transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
    };

    const allowedNextStates =
      validTransitions[currentOrder.status as OrderStatus] || [];
    if (!allowedNextStates.includes(status)) {
      throw new BusinessRuleError(
        `No se puede cambiar el estado de '${currentOrder.status}' a '${status}'`
      );
    }

    const [updatedOrder] = await tx
      .update(order)
      .set({ status })
      .where(eq(order.id, orderId))
      .returning();

    const prefix = currentOrder.seriesPrefix ?? "";
    const suffix = currentOrder.seriesSuffix ?? "";
    const documentNumberFull = `${prefix}${currentOrder.documentNumber}${suffix}`;

    return {
      ...updatedOrder,
      documentNumberFull,
      total: toDecimal(currentOrder.total),
      orderDate: updatedOrder.orderDate,
      status: updatedOrder.status as OrderStatus,
    };
  });
}

/**
 * Lista los tipos de órdenes de venta disponibles.
 * @permission sales.order.read
 */
export async function listSalesOrderTypes(): Promise<SalesOrderType[]> {
  return db
    .select({
      id: orderType.id,
      name: orderType.name,
      disabled: orderType.disabled,
    })
    .from(orderType)
    .where(eq(orderType.disabled, false))
    .orderBy(orderType.name);
}
