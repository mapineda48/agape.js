import { db } from "#lib/db";
import { item } from "#models/catalogs/item";
import orderItem from "#models/purchasing/order_item";
import purchaseOrder, {
  purchaseOrderStatusEnum,
} from "#models/purchasing/purchase_order";
import supplier from "#models/purchasing/supplier";
import person from "#models/core/person";
import { company } from "#models/core/company";
import { user } from "#models/core/user";
import { documentType } from "#models/numbering/document_type";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { eq, inArray, and, gte, lte, count, desc, sql } from "drizzle-orm";
import { createInventoryMovement } from "#svc/inventory/movement";
import { inventoryMovementType } from "#models/inventory/movement_type";

// Re-export DTOs from shared module
export type {
  PurchaseOrderStatus,
  CreatePurchaseOrderInput,
  CreatePurchaseOrderItemInput,
  PurchaseOrderItem,
  PurchaseOrderItemWithProduct,
  PurchaseOrderWithItems,
  PurchaseOrderDetails,
  ListPurchaseOrdersParams,
  PurchaseOrderListItem,
  ListPurchaseOrdersResult,
  UpdatePurchaseOrderStatusInput,
  ReceivePurchaseOrderInput,
  ReceivePurchaseOrderItemInput,
  ReceivePurchaseOrderResult,
} from "#utils/dto/purchasing/purchase_order";

export { PURCHASE_ORDER_STATUS_VALUES } from "#utils/dto/purchasing/purchase_order";

import type {
  CreatePurchaseOrderInput,
  PurchaseOrderWithItems,
  ListPurchaseOrdersParams,
  ListPurchaseOrdersResult,
  PurchaseOrderDetails,
  ReceivePurchaseOrderInput,
  ReceivePurchaseOrderResult,
  PurchaseOrderStatus,
} from "#utils/dto/purchasing/purchase_order";

/**
 * Crea una nueva orden de compra con sus ítems.
 *
 * @param payload Datos de la orden de compra
 * @returns La orden de compra creada con sus ítems
 * @throws Error si el estado es inválido
 * @throws Error si no hay ítems o sus cantidades/precios son inválidos
 * @throws Error si el proveedor no existe o está inactivo
 * @throws Error si algún ítem no existe o está deshabilitado
 */
export async function createPurchaseOrder(
  payload: CreatePurchaseOrderInput
): Promise<PurchaseOrderWithItems> {
  const status = payload.status ?? "pending";

  if (!purchaseOrderStatusEnum.enumValues.includes(status)) {
    throw new Error("Estado de la orden de compra inválido");
  }

  return db.transaction(async (tx) => {
    if (!payload.items || payload.items.length === 0) {
      throw new Error("La orden de compra debe incluir al menos un ítem");
    }

    for (const orderItemInput of payload.items) {
      if (orderItemInput.quantity <= 0) {
        throw new Error("La cantidad de cada ítem debe ser mayor a cero");
      }

      const price = toDecimal(orderItemInput.unitPrice);
      if (price.lte(0)) {
        throw new Error(
          "El precio unitario de cada ítem debe ser mayor a cero"
        );
      }
    }

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

    const itemIds = [
      ...new Set(payload.items.map((orderItemInput) => orderItemInput.itemId)),
    ];

    const foundItems = await tx
      .select({
        id: item.id,
        isEnabled: item.isEnabled,
      })
      .from(item)
      .where(inArray(item.id, itemIds));

    if (foundItems.length !== itemIds.length) {
      throw new Error("Uno o más ítems no existen");
    }

    const disabledItem = foundItems.find((i) => !i.isEnabled);
    if (disabledItem) {
      throw new Error(`El ítem ${disabledItem.id} está deshabilitado`);
    }

    const orderDate =
      payload.orderDate instanceof DateTime
        ? payload.orderDate
        : payload.orderDate instanceof Date
        ? new DateTime(payload.orderDate)
        : new DateTime();

    const [order] = await tx
      .insert(purchaseOrder)
      .values({
        supplierId: payload.supplierId,
        orderDate,
        status,
      })
      .returning();

    const insertedItems = await tx
      .insert(orderItem)
      .values(
        payload.items.map((orderItemInput) => ({
          purchaseOrderId: order.id,
          itemId: orderItemInput.itemId,
          quantity: orderItemInput.quantity,
          unitPrice: toDecimal(orderItemInput.unitPrice),
        }))
      )
      .returning();

    return {
      ...order,
      items: insertedItems,
    };
  });
}

/**
 * Obtiene una orden de compra por su ID con todos los detalles.
 *
 * @param id ID de la orden de compra
 * @returns Orden de compra con ítems y datos del proveedor, o undefined si no existe
 */
export async function getPurchaseOrderById(
  id: number
): Promise<PurchaseOrderDetails | undefined> {
  const [order] = await db
    .select({
      id: purchaseOrder.id,
      supplierId: purchaseOrder.supplierId,
      orderDate: purchaseOrder.orderDate,
      status: purchaseOrder.status,
      // Supplier data (person or company name)
      supplierFirstName: person.firstName,
      supplierLastName: person.lastName,
      supplierLegalName: company.legalName,
      supplierDocumentType: documentType.name,
      supplierDocumentNumber: user.documentNumber,
    })
    .from(purchaseOrder)
    .innerJoin(supplier, eq(purchaseOrder.supplierId, supplier.id))
    .innerJoin(user, eq(supplier.id, user.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .leftJoin(documentType, eq(user.documentTypeId, documentType.id))
    .where(eq(purchaseOrder.id, id));

  if (!order) {
    return undefined;
  }

  // Get order items with product details
  const orderItems = await db
    .select({
      id: orderItem.id,
      purchaseOrderId: orderItem.purchaseOrderId,
      itemId: orderItem.itemId,
      quantity: orderItem.quantity,
      unitPrice: orderItem.unitPrice,
      itemCode: item.code,
      itemName: item.fullName,
    })
    .from(orderItem)
    .innerJoin(item, eq(orderItem.itemId, item.id))
    .where(eq(orderItem.purchaseOrderId, id));

  // Calculate subtotals
  const itemsWithSubtotal = orderItems.map((oi) => ({
    ...oi,
    subtotal: oi.unitPrice.mul(oi.quantity),
  }));

  // Calculate total
  const totalAmount = itemsWithSubtotal.reduce(
    (acc, oi) => acc.add(oi.subtotal),
    new Decimal(0)
  );

  // Build supplier name
  const supplierName = order.supplierFirstName
    ? `${order.supplierFirstName} ${order.supplierLastName ?? ""}`.trim()
    : order.supplierLegalName ?? "";

  return {
    id: order.id,
    supplierId: order.supplierId,
    supplierName,
    supplierDocumentType: order.supplierDocumentType,
    supplierDocumentNumber: order.supplierDocumentNumber,
    orderDate: order.orderDate,
    status: order.status as PurchaseOrderStatus,
    totalAmount,
    items: itemsWithSubtotal,
  };
}

/**
 * Lista órdenes de compra con filtros y paginación.
 *
 * @param params Parámetros de búsqueda y paginación
 * @returns Lista de órdenes y opcionalmente el total de registros
 */
export async function listPurchaseOrders(
  params: ListPurchaseOrdersParams = {}
): Promise<ListPurchaseOrdersResult> {
  const {
    supplierId,
    status,
    fromDate,
    toDate,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (supplierId !== undefined) {
    conditions.push(eq(purchaseOrder.supplierId, supplierId));
  }

  if (status !== undefined) {
    conditions.push(eq(purchaseOrder.status, status));
  }

  if (fromDate !== undefined) {
    const date =
      fromDate instanceof DateTime ? fromDate : new DateTime(fromDate);
    conditions.push(gte(purchaseOrder.orderDate, date));
  }

  if (toDate !== undefined) {
    const date = toDate instanceof DateTime ? toDate : new DateTime(toDate);
    conditions.push(lte(purchaseOrder.orderDate, date));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Subquery to get item count and total per order
  const orderSummary = db
    .select({
      purchaseOrderId: orderItem.purchaseOrderId,
      itemCount: count(orderItem.id).as("itemCount"),
      totalAmount:
        sql<Decimal>`SUM(${orderItem.quantity} * ${orderItem.unitPrice})`.as(
          "totalAmount"
        ),
    })
    .from(orderItem)
    .groupBy(orderItem.purchaseOrderId)
    .as("order_summary");

  const queryOrders = db
    .select({
      id: purchaseOrder.id,
      supplierId: purchaseOrder.supplierId,
      supplierFirstName: person.firstName,
      supplierLastName: person.lastName,
      supplierLegalName: company.legalName,
      orderDate: purchaseOrder.orderDate,
      status: purchaseOrder.status,
      itemCount: orderSummary.itemCount,
      totalAmount: orderSummary.totalAmount,
    })
    .from(purchaseOrder)
    .innerJoin(supplier, eq(purchaseOrder.supplierId, supplier.id))
    .innerJoin(user, eq(supplier.id, user.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .leftJoin(orderSummary, eq(purchaseOrder.id, orderSummary.purchaseOrderId))
    .where(whereClause)
    .orderBy(desc(purchaseOrder.orderDate), desc(purchaseOrder.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  if (!includeTotalCount) {
    const ordersRaw = await queryOrders;
    const orders = ordersRaw.map((o) => ({
      id: o.id,
      supplierId: o.supplierId,
      supplierName: o.supplierFirstName
        ? `${o.supplierFirstName} ${o.supplierLastName ?? ""}`.trim()
        : o.supplierLegalName ?? "",
      orderDate: o.orderDate,
      status: o.status as PurchaseOrderStatus,
      totalAmount: o.totalAmount ?? new Decimal(0),
      itemCount: Number(o.itemCount) || 0,
    }));
    return { orders };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(purchaseOrder)
    .where(whereClause);

  const [ordersRaw, [{ totalCount }]] = await Promise.all([
    queryOrders,
    queryCount,
  ]);

  const orders = ordersRaw.map((o) => ({
    id: o.id,
    supplierId: o.supplierId,
    supplierName: o.supplierFirstName
      ? `${o.supplierFirstName} ${o.supplierLastName ?? ""}`.trim()
      : o.supplierLegalName ?? "",
    orderDate: o.orderDate,
    status: o.status as PurchaseOrderStatus,
    totalAmount: o.totalAmount ?? new Decimal(0),
    itemCount: Number(o.itemCount) || 0,
  }));

  return { orders, totalCount };
}

/**
 * Actualiza el estado de una orden de compra.
 *
 * @param orderId ID de la orden de compra
 * @param status Nuevo estado
 * @returns La orden actualizada
 * @throws Error si la orden no existe
 * @throws Error si el estado es inválido
 * @throws Error si la transición de estado no es permitida
 */
export async function updatePurchaseOrderStatus(
  orderId: number,
  status: PurchaseOrderStatus
): Promise<PurchaseOrderWithItems> {
  if (!purchaseOrderStatusEnum.enumValues.includes(status)) {
    throw new Error("Estado de la orden de compra inválido");
  }

  return db.transaction(async (tx) => {
    const [currentOrder] = await tx
      .select()
      .from(purchaseOrder)
      .where(eq(purchaseOrder.id, orderId));

    if (!currentOrder) {
      throw new Error("Orden de compra no encontrada");
    }

    // Validate state transitions
    const validTransitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> =
      {
        pending: ["approved", "cancelled"],
        approved: ["received", "cancelled"],
        received: [], // Terminal state
        cancelled: [], // Terminal state
      };

    const allowedNextStates =
      validTransitions[currentOrder.status as PurchaseOrderStatus] || [];
    if (!allowedNextStates.includes(status)) {
      throw new Error(
        `No se puede cambiar el estado de '${currentOrder.status}' a '${status}'`
      );
    }

    const [updatedOrder] = await tx
      .update(purchaseOrder)
      .set({ status })
      .where(eq(purchaseOrder.id, orderId))
      .returning();

    const items = await tx
      .select()
      .from(orderItem)
      .where(eq(orderItem.purchaseOrderId, orderId));

    return {
      ...updatedOrder,
      items,
    };
  });
}

/**
 * Recibe una orden de compra y genera el movimiento de inventario correspondiente.
 * Cambia el estado de la orden a "received" y crea un movimiento de entrada.
 *
 * @param input Datos de la recepción
 * @returns Orden actualizada y datos del movimiento creado
 * @throws Error si la orden no existe
 * @throws Error si la orden no está en estado "approved"
 * @throws Error si la ubicación no existe
 * @throws Error si no hay tipo de movimiento para compras configurado
 */
export async function receivePurchaseOrder(
  input: ReceivePurchaseOrderInput
): Promise<ReceivePurchaseOrderResult> {
  return db.transaction(async (tx) => {
    // 1. Verify order exists and is in approved status
    const [currentOrder] = await tx
      .select()
      .from(purchaseOrder)
      .where(eq(purchaseOrder.id, input.orderId));

    if (!currentOrder) {
      throw new Error("Orden de compra no encontrada");
    }

    if (currentOrder.status !== "approved") {
      throw new Error(
        "Solo se pueden recibir órdenes de compra en estado 'approved'"
      );
    }

    // 2. Get order items
    const orderItems = await tx
      .select()
      .from(orderItem)
      .where(eq(orderItem.purchaseOrderId, input.orderId));

    if (orderItems.length === 0) {
      throw new Error("La orden de compra no tiene ítems");
    }

    // 3. Find the purchase entry movement type
    // Look for a movement type that is for "purchases" or "entries"
    // Factor = 1 means it's an entry movement
    const [purchaseMovementType] = await tx
      .select()
      .from(inventoryMovementType)
      .where(
        and(
          eq(inventoryMovementType.factor, 1),
          eq(inventoryMovementType.affectsStock, true),
          eq(inventoryMovementType.isEnabled, true)
        )
      );

    if (!purchaseMovementType) {
      throw new Error(
        "No hay tipo de movimiento de entrada configurado para compras"
      );
    }

    // 4. Build movement details
    // If receivedItems is provided, use those quantities; otherwise use ordered quantities
    const movementDetails = orderItems.map((oi) => {
      const receivedItem = input.receivedItems?.find(
        (ri) => ri.orderItemId === oi.id
      );

      const quantity = receivedItem?.receivedQuantity ?? oi.quantity;
      const unitCost = receivedItem?.unitCost
        ? toDecimal(receivedItem.unitCost)
        : oi.unitPrice;

      return {
        itemId: oi.itemId,
        locationId: input.locationId,
        quantity,
        unitCost,
      };
    });

    // Filter out items with zero quantity
    const filteredDetails = movementDetails.filter((d) => d.quantity > 0);

    if (filteredDetails.length === 0) {
      throw new Error("No hay ítems para recibir");
    }

    // 5. Create inventory movement
    // Note: We call the function directly since we're in a transaction
    // The movement function handles its own transaction, so we need to pass our tx
    const movement = await createInventoryMovementInTx(tx, {
      movementTypeId: purchaseMovementType.id,
      movementDate: new DateTime(),
      observation:
        input.observation ?? `Recepción de orden de compra #${currentOrder.id}`,
      userId: input.receivedById,
      sourceDocumentType: "purchase_order",
      sourceDocumentId: currentOrder.id,
      details: filteredDetails,
    });

    // 6. Update order status to received
    const [updatedOrder] = await tx
      .update(purchaseOrder)
      .set({ status: "received" })
      .where(eq(purchaseOrder.id, input.orderId))
      .returning();

    // 7. Get updated items
    const updatedItems = await tx
      .select()
      .from(orderItem)
      .where(eq(orderItem.purchaseOrderId, input.orderId));

    return {
      order: {
        ...updatedOrder,
        items: updatedItems,
      },
      inventoryMovementId: movement.id,
      movementNumber: movement.documentNumberFull,
    };
  });
}

// ============================================================================
// Internal helpers
// ============================================================================

function toDecimal(value: Decimal | number | string): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

/**
 * Internal function to create inventory movement within an existing transaction.
 * This is a simplified version that works within the purchase order transaction.
 */
async function createInventoryMovementInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    movementTypeId: number;
    movementDate: DateTime;
    observation?: string | null;
    userId: number;
    sourceDocumentType?: string | null;
    sourceDocumentId?: number | null;
    details: Array<{
      itemId: number;
      locationId?: number | null;
      quantity: number;
      unitCost?: Decimal | null;
    }>;
  }
) {
  const { inventoryMovement } = await import("#models/inventory/movement");
  const { inventoryMovementDetail } = await import(
    "#models/inventory/movement_detail"
  );
  const { documentType } = await import("#models/numbering/document_type");
  const { getNextDocumentNumberTx } = await import(
    "#svc/numbering/getNextDocumentNumber"
  );

  // Get movement type
  const [movementType] = await tx
    .select()
    .from(inventoryMovementType)
    .where(eq(inventoryMovementType.id, input.movementTypeId));

  if (!movementType) {
    throw new Error("Tipo de movimiento no encontrado");
  }

  // Get document type
  const [docType] = await tx
    .select()
    .from(documentType)
    .where(eq(documentType.id, movementType.documentTypeId));

  if (!docType) {
    throw new Error("Tipo de documento no configurado");
  }

  // Get next document number
  const tempExternalId = crypto.randomUUID();
  const numbering = await getNextDocumentNumberTx(tx, {
    documentTypeCode: docType.code,
    today: input.movementDate,
    externalDocumentType: "inventory_movement",
    externalDocumentId: tempExternalId,
  });

  // Insert movement
  const [movement] = await tx
    .insert(inventoryMovement)
    .values({
      movementTypeId: input.movementTypeId,
      movementDate: input.movementDate,
      observation: input.observation ?? null,
      userId: input.userId,
      sourceDocumentType: input.sourceDocumentType ?? null,
      sourceDocumentId: input.sourceDocumentId ?? null,
      documentSeriesId: numbering.seriesId,
      documentNumber: numbering.assignedNumber,
      documentNumberFull: numbering.fullNumber,
    })
    .returning();

  // Update external document ID
  const { documentSequence } = await import(
    "#models/numbering/document_sequence"
  );
  await tx
    .update(documentSequence)
    .set({ externalDocumentId: movement.id.toString() })
    .where(
      and(
        eq(documentSequence.seriesId, numbering.seriesId),
        eq(documentSequence.assignedNumber, numbering.assignedNumber)
      )
    );

  // Insert details
  await tx.insert(inventoryMovementDetail).values(
    input.details.map((d) => ({
      movementId: movement.id,
      itemId: d.itemId,
      locationId: d.locationId,
      quantity: d.quantity,
      unitCost: d.unitCost,
    }))
  );

  return movement;
}
