import { db } from "#lib/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import order from "#models/crm/order";
import orderItem from "#models/crm/order_item";
import { inventoryMovementType } from "#models/inventory/movement_type";
import { inventoryMovement } from "#models/inventory/movement";
import { inventoryMovementDetail } from "#models/inventory/movement_detail";
import { item } from "#models/catalogs/item";
import * as InventoryService from "#svc/inventory/movement";
import * as SalesInvoiceService from "#svc/finance/sales_invoice";
import * as SalesOrderService from "#svc/crm/order";
import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { BusinessRuleError, NotFoundError } from "#lib/error";

import type {
    DeliverSalesOrderInput,
    DeliverSalesOrderResult,
    InvoiceSalesOrderInput,
    InvoiceDeliveryInput,
    SalesFlowInvoiceResult,
} from "#utils/dto/sales/flow";

/**
 * Coordine el flujo de "Order-to-Cash" básico.
 */

/**
 * Realiza el despacho (Entrega/Remisión) de una orden de venta.
 * Corresponde al Paso 2 del flujo ideal.
 */
export async function deliverSalesOrder(
    input: DeliverSalesOrderInput
): Promise<DeliverSalesOrderResult> {
    return await db.transaction(async (tx) => {
        // 1. Validar la orden
        const salesOrder = await SalesOrderService.getSalesOrderById(input.orderId);
        if (!salesOrder) {
            throw new NotFoundError(`Orden de venta ${input.orderId} no encontrada`);
        }

        if (salesOrder.status !== "confirmed") {
            throw new BusinessRuleError(
                `Solo se pueden entregar órdenes en estado 'confirmed'. Estado actual: ${salesOrder.status}`
            );
        }

        // 2. Determinar ítems a entregar
        const itemsToDeliver: { orderItemId: number; quantity: Decimal }[] = [];

        if (input.items && input.items.length > 0) {
            for (const itemInput of input.items) {
                const orderLine = salesOrder.items.find((i) => i.id === itemInput.orderItemId);
                if (!orderLine) {
                    throw new BusinessRuleError(`La línea ${itemInput.orderItemId} no pertenece a esta orden`);
                }

                const qtyToDeliver = new Decimal(itemInput.quantity);
                const pendingQty = orderLine.quantity.sub(orderLine.deliveredQuantity);

                if (qtyToDeliver.gt(pendingQty)) {
                    throw new BusinessRuleError(
                        `La cantidad a entregar (${qtyToDeliver}) excede la pendiente (${pendingQty}) para el ítem ${orderLine.itemName}`
                    );
                }

                if (qtyToDeliver.gt(0)) {
                    itemsToDeliver.push({ orderItemId: orderLine.id, quantity: qtyToDeliver });
                }
            }
        } else {
            // Entregar todo lo pendiente
            for (const orderLine of salesOrder.items) {
                const pendingQty = orderLine.quantity.sub(orderLine.deliveredQuantity);
                if (pendingQty.gt(0)) {
                    itemsToDeliver.push({ orderItemId: orderLine.id, quantity: pendingQty });
                }
            }
        }

        if (itemsToDeliver.length === 0) {
            throw new BusinessRuleError("No hay ítems pendientes por entregar en esta orden");
        }

        // 3. Crear el movimiento de inventario (Goods Issue)
        // Buscamos el tipo de movimiento de "Venta"
        const [movType] = await tx
            .select()
            .from(inventoryMovementType)
            .where(eq(inventoryMovementType.name, "Venta"));

        if (!movType) {
            throw new BusinessRuleError("Tipo de movimiento 'Venta' no encontrado en el sistema");
        }

        const movementDate = input.deliveryDate ?? new DateTime();

        // Preparar detalles para el servicio de inventario
        const movementDetails = itemsToDeliver.map((d) => {
            const orderLine = salesOrder.items.find((i) => i.id === d.orderItemId)!;
            return {
                itemId: orderLine.itemId,
                locationId: input.locationId,
                quantity: d.quantity.toNumber(),
                // El costo unitario lo determinará el servicio de inventario al postear (FIFO)
                // pero podemos pasar el precio de venta como referencia si fuera necesario
            };
        });

        const result = await InventoryService.createInventoryMovement({
            movementTypeId: movType.id,
            movementDate: movementDate,
            observation: input.observation || `Entrega de Orden ${salesOrder.documentNumberFull}`,
            userId: input.userId,
            details: movementDetails,
            sourceDocumentType: "SALES_ORDER",
            sourceDocumentId: salesOrder.id,
            autoPost: true, // Postear inmediatamente para afectar stock
        });

        // 4. Actualizar cantidades entregadas en la orden
        for (const d of itemsToDeliver) {
            await tx
                .update(orderItem)
                .set({
                    deliveredQuantity: sql`delivered_quantity + ${d.quantity.toString()}`,
                })
                .where(eq(orderItem.id, d.orderItemId));
        }

        // 5. Verificar si se completó la entrega total de la orden
        const remainingItems = await tx
            .select({ count: sql`COUNT(*)` })
            .from(orderItem)
            .where(
                and(
                    eq(orderItem.orderId, salesOrder.id),
                    sql`delivered_quantity < quantity`
                )
            );

        const isFullyDelivered = Number((remainingItems[0] as any).count) === 0;
        if (isFullyDelivered) {
            await SalesOrderService.updateSalesOrderStatus(salesOrder.id, "shipped");
        }

        return {
            movementId: result.movementId,
            documentNumber: result.documentNumber,
        };
    });
}

/**
 * Crea una factura de venta directamente desde una orden (Variante B: Servicios).
 * Corresponde al Paso 3 del flujo ideal (sin inventario).
 */
export async function invoiceSalesOrder(
    input: InvoiceSalesOrderInput
): Promise<SalesFlowInvoiceResult> {
    return await db.transaction(async (tx) => {
        // 1. Validar la orden
        const salesOrder = await SalesOrderService.getSalesOrderById(input.orderId);
        if (!salesOrder) {
            throw new NotFoundError(`Orden de venta ${input.orderId} no encontrada`);
        }

        // 2. Determinar ítems a facturar
        const itemsToInvoice: { orderItemId: number; quantity: Decimal }[] = [];

        if (input.items && input.items.length > 0) {
            for (const itemInput of input.items) {
                const orderLine = salesOrder.items.find((i) => i.id === itemInput.orderItemId);
                if (!orderLine) {
                    throw new BusinessRuleError(`La línea ${itemInput.orderItemId} no pertenece a esta orden`);
                }

                const qtyToInvoice = new Decimal(itemInput.quantity);
                const pendingQty = orderLine.quantity.sub(orderLine.invoicedQuantity);

                if (qtyToInvoice.gt(pendingQty)) {
                    throw new BusinessRuleError(
                        `La cantidad a facturar (${qtyToInvoice}) excede la pendiente (${pendingQty}) para el ítem ${orderLine.itemName}`
                    );
                }

                if (qtyToInvoice.gt(0)) {
                    itemsToInvoice.push({ orderItemId: orderLine.id, quantity: qtyToInvoice });
                }
            }
        } else {
            // Facturar todo lo pendiente
            for (const orderLine of salesOrder.items) {
                const pendingQty = orderLine.quantity.sub(orderLine.invoicedQuantity);
                if (pendingQty.gt(0)) {
                    itemsToInvoice.push({ orderItemId: orderLine.id, quantity: pendingQty });
                }
            }
        }

        if (itemsToInvoice.length === 0) {
            throw new BusinessRuleError("No hay ítems pendientes por facturar en esta orden");
        }

        // 3. Crear la factura de venta
        const invoiceDate = input.invoiceDate ?? new DateTime();

        // Preparar inputs para el servicio de finanzas
        const invoiceItems = itemsToInvoice.map((d) => {
            const orderLine = salesOrder.items.find((i) => i.id === d.orderItemId)!;
            return {
                itemId: orderLine.itemId,
                orderItemId: orderLine.id,
                quantity: d.quantity,
                unitPrice: orderLine.unitPrice,
                discountPercent: orderLine.discountPercent,
                description: orderLine.itemName,
                // taxId: orderLine.taxId // Si tuviéramos taxId en el pedido
            };
        });

        const invoiceResult = await SalesInvoiceService.createSalesInvoice({
            clientId: salesOrder.clientId,
            orderId: salesOrder.id,
            issueDate: invoiceDate,
            items: invoiceItems,
            notes: input.notes || `Factura de Orden ${salesOrder.documentNumberFull}`,
        });

        // 4. Postear la factura (Calcula totales y asigna número definitivo)
        const postResult = await SalesInvoiceService.postSalesInvoice(invoiceResult.id);

        // 5. Actualizar cantidades facturadas en la orden
        for (const d of itemsToInvoice) {
            await tx
                .update(orderItem)
                .set({
                    invoicedQuantity: sql`invoiced_quantity + ${d.quantity.toString()}`,
                })
                .where(eq(orderItem.id, d.orderItemId));
        }

        return {
            invoiceId: postResult.salesInvoiceId,
            documentNumber: postResult.documentNumberFull,
        };
    });
}

/**
 * Crea una factura de venta a partir de un despacho (Variante A: Inventario).
 * Corresponde al Paso 3 del flujo ideal (con inventario).
 */
export async function invoiceDelivery(
    input: InvoiceDeliveryInput
): Promise<SalesFlowInvoiceResult> {
    return await db.transaction(async (tx) => {
        // 1. Obtener el movimiento de inventario (entrega)
        const movement = await InventoryService.getInventoryMovement(input.movementId);
        if (!movement) {
            throw new NotFoundError(`Entrega ${input.movementId} no encontrada`);
        }

        if (movement.sourceDocumentType !== "SALES_ORDER" || !movement.sourceDocumentId) {
            throw new BusinessRuleError("Esta entrega no está vinculada a una orden de venta");
        }

        if (movement.status !== "posted") {
            throw new BusinessRuleError("Solo se pueden facturar entregas en estado 'posted'");
        }

        // 2. Obtener la orden de venta original
        const salesOrder = await SalesOrderService.getSalesOrderById(movement.sourceDocumentId);
        if (!salesOrder) {
            throw new NotFoundError("Orden de venta de origen no encontrada");
        }

        // 3. Crear la factura de venta basada en las cantidades de la entrega
        const invoiceDate = input.invoiceDate ?? new DateTime();

        // Mapear detalles del movimiento a ítems de factura
        // Necesitamos encontrar la relación entre movement_detail y order_item
        // En este flujo simplificado, buscaremos la línea de la orden que coincida con el itemId
        const invoiceItems = movement.details.map((movLine) => {
            const orderLine = salesOrder.items.find((i) => i.itemId === movLine.itemId);
            if (!orderLine) {
                throw new BusinessRuleError(`El ítem ${movLine.itemId} no existe en la orden original`);
            }

            return {
                itemId: movLine.itemId,
                orderItemId: orderLine.id,
                quantity: new Decimal(movLine.quantity),
                unitPrice: orderLine.unitPrice,
                discountPercent: orderLine.discountPercent,
                description: orderLine.itemName,
            };
        });

        const invoiceResult = await SalesInvoiceService.createSalesInvoice({
            clientId: salesOrder.clientId,
            orderId: salesOrder.id,
            issueDate: invoiceDate,
            items: invoiceItems,
            notes: input.notes || `Factura de Entrega ${movement.documentNumberFull}`,
        });

        // 4. Postear la factura
        const postResult = await SalesInvoiceService.postSalesInvoice(invoiceResult.id);

        // 5. Actualizar cantidades facturadas en la orden
        for (const item of invoiceItems) {
            await tx
                .update(orderItem)
                .set({
                    invoicedQuantity: sql`invoiced_quantity + ${item.quantity.toString()}`,
                })
                .where(eq(orderItem.id, item.orderItemId));
        }

        return {
            invoiceId: postResult.salesInvoiceId,
            documentNumber: postResult.documentNumberFull,
        };
    });
}
