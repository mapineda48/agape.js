import { db } from "#lib/db";
import order from "#models/crm/order";
import client from "#models/crm/client";
import person from "#models/core/person";
import { company } from "#models/core/company";
import { user } from "#models/core/user";
import { documentType } from "#models/numbering/document_type";
import { documentSequence } from "#models/numbering/document_sequence";
import { documentSeries } from "#models/numbering/document_series";
import { orderStatusEnum } from "#models/crm/order";
import DateTime from "#utils/data/DateTime";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";

// Re-export DTOs from shared module
export type {
  OrderStatus,
  CreateSalesOrderInput,
  SalesOrderWithNumbering,
  SalesOrderDetails,
  ListSalesOrdersParams,
  SalesOrderListItem,
  ListSalesOrdersResult,
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
} from "#utils/dto/crm/order";

/** Código del tipo de documento para órdenes de venta */
export const SALES_ORDER_DOCUMENT_TYPE_CODE = "SALES_ORDER";

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Crea una nueva orden de venta.
 * Asigna automáticamente un número de documento vía el motor de numeración.
 */
export async function createSalesOrder(
  payload: CreateSalesOrderInput
): Promise<SalesOrderWithNumbering> {
  const status = payload.status ?? "pending";

  if (!orderStatusEnum.enumValues.includes(status)) {
    throw new Error("Estado de la orden de venta inválido");
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
      throw new Error("El cliente no existe");
    }

    if (!clientRecord.active) {
      throw new Error("El cliente está inactivo");
    }

    // Usar DateTime directamente - el RPC ya lo deserializó
    const orderDate = payload.orderDate ?? new DateTime();
    const orderDateStr = orderDate.toISOString().split("T")[0];

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
      })
      .returning();

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
    };
  });
}

/**
 * Obtiene una orden de venta por su ID con todos los detalles.
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
  };
}

/**
 * Lista órdenes de venta con filtros y paginación.
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
      documentNumber: order.documentNumber,
      seriesPrefix: documentSeries.prefix,
      seriesSuffix: documentSeries.suffix,
      clientFirstName: person.firstName,
      clientLastName: person.lastName,
      clientLegalName: company.legalName,
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
    documentNumber: number;
    seriesPrefix: string | null;
    seriesSuffix: string | null;
    clientFirstName: string | null;
    clientLastName: string | null;
    clientLegalName: string | null;
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
 */
export async function updateSalesOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<SalesOrderWithNumbering> {
  if (!orderStatusEnum.enumValues.includes(status)) {
    throw new Error("Estado de la orden de venta inválido");
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
      })
      .from(order)
      .innerJoin(documentSeries, eq(order.seriesId, documentSeries.id))
      .where(eq(order.id, orderId));

    if (!currentOrder) {
      throw new Error("Orden de venta no encontrada");
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
      throw new Error(
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
    };
  });
}
