import { db } from "#lib/db";
import { item } from "#models/catalogs/item";
import orderItem from "#models/purchasing/order_item";
import purchaseOrder, {
  purchaseOrderStatusEnum,
  type PurchaseOrderStatus,
} from "#models/purchasing/purchase_order";
import supplier from "#models/purchasing/supplier";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { eq, inArray } from "drizzle-orm";

/**
 * Input para un ítem de orden de compra.
 */
export interface CreatePurchaseOrderItemInput {
  /** ID del ítem del catálogo de inventario */
  itemId: number;
  /** Cantidad a ordenar */
  quantity: number;
  /** Precio unitario */
  unitPrice: Decimal | number | string;
}

/**
 * Input para crear una orden de compra.
 */
export interface CreatePurchaseOrderInput {
  /** ID del proveedor */
  supplierId: number;
  /** Fecha de la orden (opcional, por defecto hoy) */
  orderDate?: DateTime;
  /** Estado de la orden (opcional, por defecto 'pending') */
  status?: PurchaseOrderStatus;
  /** Lista de ítems a ordenar */
  items: CreatePurchaseOrderItemInput[];
}

export type PurchaseOrderWithItems = typeof purchaseOrder.$inferSelect & {
  items: (typeof orderItem.$inferSelect)[];
};

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

    const [order] = await tx
      .insert(purchaseOrder)
      .values({
        supplierId: payload.supplierId,
        orderDate: payload.orderDate ?? new DateTime(),
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

function toDecimal(value: Decimal | number | string) {
  return value instanceof Decimal ? value : new Decimal(value);
}
