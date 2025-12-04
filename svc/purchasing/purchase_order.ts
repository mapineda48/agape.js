import { db } from "#lib/db";
import product from "#models/inventory/product";
import orderItem from "#models/purchasing/order_item";
import purchaseOrder, {
  purchaseOrderStatusEnum,
  type PurchaseOrderStatus,
} from "#models/purchasing/purchase_order";
import supplier from "#models/purchasing/supplier";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { eq, inArray } from "drizzle-orm";

export interface CreatePurchaseOrderItemInput {
  productId: number;
  quantity: number;
  unitPrice: Decimal | number | string;
}

export interface CreatePurchaseOrderInput {
  supplierId: number;
  orderDate?: DateTime;
  status?: PurchaseOrderStatus;
  items: CreatePurchaseOrderItemInput[];
}

export type PurchaseOrderWithItems = typeof purchaseOrder.$inferSelect & {
  items: (typeof orderItem.$inferSelect)[];
};

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

    for (const item of payload.items) {
      if (item.quantity <= 0) {
        throw new Error("La cantidad de cada ítem debe ser mayor a cero");
      }

      const price = toDecimal(item.unitPrice);
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

    const productIds = [
      ...new Set(payload.items.map((item) => item.productId)),
    ];

    const foundProducts = await tx
      .select({
        id: product.id,
        isActive: product.isActive,
      })
      .from(product)
      .where(inArray(product.id, productIds));

    if (foundProducts.length !== productIds.length) {
      throw new Error("Uno o más productos no existen");
    }

    const inactiveProduct = foundProducts.find((p) => !p.isActive);
    if (inactiveProduct) {
      throw new Error(`El producto ${inactiveProduct.id} está inactivo`);
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
        payload.items.map((item) => ({
          purchaseOrderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: toDecimal(item.unitPrice),
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
