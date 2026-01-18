import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let clientId: number;
let orderTypeId: number;
let itemId: number;
let locationId: number;
let userId: number;
let salesOrderDocTypeId: number;
let inventoryDocTypeId: number;
let salesInvoiceDocTypeId: number;

beforeAll(async () => {
    const { default: initDatabase } = await import("#lib/db");
    const uuid = crypto.randomUUID();

    await initDatabase("postgresql://postgres:mypassword@localhost", {
        tenant: `vitest_sales_flow_${uuid}`,
        env: "vitest",
        skipSeeds: true,
    });

    const { db } = await import("#lib/db");
    const { upsertDocumentType: upsertCoreDocType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("#svc/crm/clientType");
    const { upsertClient } = await import("#svc/crm/client");
    const { upsertDocumentType: upsertBusDocType } = await import("#svc/numbering/documentType");
    const { upsertDocumentSeries } = await import("#svc/numbering/documentSeries");
    const { upsertMovementType } = await import("#svc/inventory/movementType");
    const { upsertLocation } = await import("#svc/inventory/location");
    const { upsertItem } = await import("#svc/catalogs/item");

    // 1. Identity
    const [idDocType] = await upsertCoreDocType({
        code: "CC",
        name: "Cédula",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
    });

    // 2. Client
    const [clientType] = await upsertClientType({ name: "Regular", isEnabled: true });
    const activeClient = await upsertClient({
        user: {
            documentTypeId: idDocType.id,
            documentNumber: `CLI-${uuid.slice(0, 6)}`,
            person: { firstName: "Test", lastName: "Flow" },
        },
        typeId: clientType.id,
        active: true,
    });
    clientId = activeClient.id;

    // 3. User/Employee for movements
    const { user } = await import("#models/user");
    const [createdUser] = await db.insert(user).values({
        type: "person",
        documentTypeId: idDocType.id,
        documentNumber: `EMP-${uuid.slice(0, 6)}`,
    }).returning();
    userId = createdUser.id;

    const { default: person } = await import("#models/person");
    await db.insert(person).values({ id: userId, firstName: "Emply", lastName: "Eee" });

    const { default: employee } = await import("#models/hr/employee");
    await db.insert(employee).values({
        id: userId,
        hireDate: new DateTime(),
        avatarUrl: "https://example.com/avatar.png"
    });

    // 4. Numbering & Doc Types
    const salesOrderDoc = await upsertBusDocType({ code: "SALES_ORDER", name: "OV", isEnabled: true });
    salesOrderDocTypeId = salesOrderDoc.id;
    await upsertDocumentSeries({
        documentTypeId: salesOrderDoc.id,
        seriesCode: "OV-2025",
        prefix: "OV-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    const invDoc = await upsertBusDocType({ code: "INV_MOV", name: "IM", isEnabled: true });
    inventoryDocTypeId = invDoc.id;
    await upsertDocumentSeries({
        documentTypeId: invDoc.id,
        seriesCode: "IM-2025",
        prefix: "IM-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    const invoiceDoc = await upsertBusDocType({ code: "SALES_INVOICE", name: "FAC", isEnabled: true });
    salesInvoiceDocTypeId = invoiceDoc.id;
    await upsertDocumentSeries({
        documentTypeId: invoiceDoc.id,
        seriesCode: "FAC-2025",
        prefix: "FAC-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    // 5. Inventory Setup
    const [vntType] = await upsertMovementType({
        name: "Venta",
        factor: -1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: invDoc.id,
    });

    const [compraType] = await upsertMovementType({
        name: "Compra",
        factor: 1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: invDoc.id,
    });

    const [loc] = await upsertLocation({ name: "B1", code: "B1", isEnabled: true });
    locationId = loc.id;

    // 6. Items & Taxes
    const taxGroup = await import("#models/finance/tax_group");
    const itemAccountingGroup = await import("#models/finance/item_accounting_group");
    const unitOfMeasure = await import("#models/inventory/unit_of_measure");

    await db.insert(unitOfMeasure.default).values([{ id: 1, code: "UN", fullName: "Unidad", isEnabled: true }]);
    const [tg] = await db.insert(taxGroup.default).values({ code: "IVA19", fullName: "IVA", isEnabled: true }).returning();
    const [acc] = await db.insert(itemAccountingGroup.default).values({ code: "MER", fullName: "Mercancia", isEnabled: true }).returning();

    const itemRecord = await upsertItem({
        code: "ITEM-FLOW",
        fullName: "Item para Flow",
        isEnabled: true,
        basePrice: new Decimal("0"),
        taxGroupId: tg.id,
        itemAccountingGroupId: acc.id,
        images: [],
        good: { uomId: 1 }
    });
    itemId = (itemRecord as any).id;

    // 7. Order Type
    const orderType = await import("#models/crm/order_type");
    const [ot] = await db.insert(orderType.default).values({ name: "Normal", disabled: false }).returning();
    orderTypeId = ot.id;

    // 8. Add initial stock to B1 (Required for delivery)
    const { createInventoryMovement } = await import("#svc/inventory/movement");
    await createInventoryMovement({
        movementTypeId: compraType.id,
        movementDate: new DateTime(),
        userId,
        details: [{ itemId, locationId, quantity: 100, unitCost: new Decimal("500") }],
        autoPost: true
    });
});

afterAll(async () => {
    const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
    const { db } = await import("#lib/db");
    const { default: config } = await import("#lib/db/schema/config");
    await deleteSchema(config.schemaName, db.$client);
    await db.$client.end();
});

describe("Sales Flow Service", () => {
    describe("Variante A: Con Inventario (Entrega -> Factura)", () => {
        it("debe realizar el ciclo completo: Orden -> Entrega -> Factura", async () => {
            const { createSalesOrder, updateSalesOrderStatus } = await import("#svc/crm/order");
            const { deliverSalesOrder, invoiceDelivery } = await import("./sales_flow");
            const { getSalesOrderById } = await import("#svc/crm/order");

            // 1. Crear y confirmar orden
            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 10, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            // Refetch order to get line IDs
            const orderDetail = await getSalesOrderById(order.id);
            const lineId = orderDetail!.items[0].id;

            // 2. Entregar parcial (6 unidades)
            const deliveryReal = await deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 6 }]
            });

            expect(deliveryReal.movementId).toBeDefined();
            expect(deliveryReal.documentNumber).toContain("IM-");

            // Verificar cantidad entregada en la orden
            const orderAfterDeliv = await getSalesOrderById(order.id);
            expect(orderAfterDeliv?.items[0].deliveredQuantity.toNumber()).toBe(6);
            expect(orderAfterDeliv?.status).toBe("confirmed"); // Parcial

            // 3. Facturar la entrega
            const invoiceResult = await invoiceDelivery({
                movementId: deliveryReal.movementId,
                notes: "Factura parcial de prueba"
            });

            expect(invoiceResult.invoiceId).toBeDefined();
            expect(invoiceResult.documentNumber).toContain("FAC-");

            // Verificar cantidad facturada en la orden
            const orderAfterInv = await getSalesOrderById(order.id);
            expect(orderAfterInv?.items[0].invoicedQuantity.toNumber()).toBe(6);
        });

        it("debe marcar la orden como 'shipped' cuando se entrega todo", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 2, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            const detail = await getSalesOrderById(order.id);
            const lineId = detail!.items[0].id;

            await deliverSalesOrder({ orderId: order.id, locationId, userId }); // Entregar todo por defecto

            const orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.status).toBe("shipped");
            expect(orderAfter?.items[0].deliveredQuantity.toNumber()).toBe(2);
        });

        it("debe permitir múltiples entregas parciales hasta completar la orden", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 10, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            const detail = await getSalesOrderById(order.id);
            const lineId = detail!.items[0].id;

            // Primera entrega: 3 unidades
            await deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 3 }]
            });

            let orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].deliveredQuantity.toNumber()).toBe(3);
            expect(orderAfter?.status).toBe("confirmed");

            // Segunda entrega: 4 unidades
            await deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 4 }]
            });

            orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].deliveredQuantity.toNumber()).toBe(7);
            expect(orderAfter?.status).toBe("confirmed");

            // Tercera entrega: 3 unidades (completa)
            await deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 3 }]
            });

            orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].deliveredQuantity.toNumber()).toBe(10);
            expect(orderAfter?.status).toBe("shipped");
        });

        it("debe permitir múltiples facturas para entregas sucesivas", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder, invoiceDelivery } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 6, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            const detail = await getSalesOrderById(order.id);
            const lineId = detail!.items[0].id;

            // Entrega 1: 2 unidades
            const delivery1 = await deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 2 }]
            });

            // Factura 1
            const invoice1 = await invoiceDelivery({ movementId: delivery1.movementId });
            expect(invoice1.documentNumber).toContain("FAC-");

            let orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].invoicedQuantity.toNumber()).toBe(2);

            // Entrega 2: 4 unidades
            const delivery2 = await deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 4 }]
            });

            // Factura 2
            const invoice2 = await invoiceDelivery({ movementId: delivery2.movementId });
            expect(invoice2.documentNumber).toContain("FAC-");

            orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].invoicedQuantity.toNumber()).toBe(6);
            expect(orderAfter?.status).toBe("shipped");
        });
    });

    describe("Variante B: Servicios (Orden -> Factura)", () => {
        it("debe facturar directamente la orden sin pasar por entrega", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { invoiceSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 5, unitPrice: 2000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            const invoiceResult = await invoiceSalesOrder({
                orderId: order.id
            });

            expect(invoiceResult.invoiceId).toBeDefined();

            const orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].invoicedQuantity.toNumber()).toBe(5);
        });

        it("debe permitir facturación parcial directa en múltiples pasos", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { invoiceSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 10, unitPrice: 500 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            const detail = await getSalesOrderById(order.id);
            const lineId = detail!.items[0].id;

            // Factura 1: 3 unidades
            await invoiceSalesOrder({
                orderId: order.id,
                items: [{ orderItemId: lineId, quantity: 3 }]
            });

            let orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].invoicedQuantity.toNumber()).toBe(3);

            // Factura 2: 5 unidades
            await invoiceSalesOrder({
                orderId: order.id,
                items: [{ orderItemId: lineId, quantity: 5 }]
            });

            orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].invoicedQuantity.toNumber()).toBe(8);

            // Factura 3: 2 unidades (completa)
            await invoiceSalesOrder({
                orderId: order.id,
                items: [{ orderItemId: lineId, quantity: 2 }]
            });

            orderAfter = await getSalesOrderById(order.id);
            expect(orderAfter?.items[0].invoicedQuantity.toNumber()).toBe(10);
        });
    });

    describe("Validaciones de Entrega", () => {
        it("no debe permitir entregar más de lo pedido", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 5, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            const detail = await getSalesOrderById(order.id);
            const lineId = detail!.items[0].id;

            await expect(deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: lineId, quantity: 10 }]
            })).rejects.toThrow(/excede la pendiente/);
        });

        it("no debe permitir entregar si no hay stock suficiente", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");
            const { upsertLocation } = await import("#svc/inventory/location");

            // Crear una bodega sin stock
            const [emptyLoc] = await upsertLocation({ name: "Vacía", code: "VAC", isEnabled: true });

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 5, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            await expect(deliverSalesOrder({
                orderId: order.id,
                locationId: emptyLoc.id,
                userId,
            })).rejects.toThrow(/Stock insuficiente/);
        });

        it("no debe permitir entregar órdenes no confirmadas", async () => {
            const { createSalesOrder, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 3, unitPrice: 1000 }]
            });
            // No confirmar la orden

            await expect(deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
            })).rejects.toThrow(/Solo se pueden entregar órdenes en estado 'confirmed'/);
        });

        it("no debe permitir entregar órdenes inexistentes", async () => {
            const { deliverSalesOrder } = await import("./sales_flow");

            await expect(deliverSalesOrder({
                orderId: 999999,
                locationId,
                userId,
            })).rejects.toThrow(/no encontrada/);
        });

        it("no debe permitir entregar líneas que no pertenecen a la orden", async () => {
            const { createSalesOrder, updateSalesOrderStatus } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 5, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            await expect(deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
                items: [{ orderItemId: 999999, quantity: 1 }]
            })).rejects.toThrow(/no pertenece a esta orden/);
        });

        it("no debe permitir entregas cuando ya está todo entregado", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { deliverSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 2, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            // Entregar todo
            await deliverSalesOrder({ orderId: order.id, locationId, userId });

            // Intentar entregar de nuevo (la orden está en shipped)
            await expect(deliverSalesOrder({
                orderId: order.id,
                locationId,
                userId,
            })).rejects.toThrow(/Solo se pueden entregar órdenes en estado 'confirmed'/);
        });
    });

    describe("Validaciones de Facturación", () => {
        it("no debe permitir facturar más de lo pedido", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { invoiceSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 1, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");
            const detail = await getSalesOrderById(order.id);
            const lineId = detail!.items[0].id;

            await expect(invoiceSalesOrder({
                orderId: order.id,
                items: [{ orderItemId: lineId, quantity: 2 }]
            })).rejects.toThrow(/excede la pendiente/);
        });

        it("no debe permitir facturar órdenes inexistentes", async () => {
            const { invoiceSalesOrder } = await import("./sales_flow");

            await expect(invoiceSalesOrder({
                orderId: 999999,
            })).rejects.toThrow(/no encontrada/);
        });

        it("no debe permitir facturar líneas que no pertenecen a la orden", async () => {
            const { createSalesOrder, updateSalesOrderStatus } = await import("#svc/crm/order");
            const { invoiceSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 5, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            await expect(invoiceSalesOrder({
                orderId: order.id,
                items: [{ orderItemId: 999999, quantity: 1 }]
            })).rejects.toThrow(/no pertenece a esta orden/);
        });

        it("no debe permitir facturar cuando ya está todo facturado", async () => {
            const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } = await import("#svc/crm/order");
            const { invoiceSalesOrder } = await import("./sales_flow");

            const order = await createSalesOrder({
                clientId,
                orderTypeId,
                items: [{ itemId, quantity: 2, unitPrice: 1000 }]
            });
            await updateSalesOrderStatus(order.id, "confirmed");

            // Facturar todo
            await invoiceSalesOrder({ orderId: order.id });

            // Intentar facturar de nuevo
            await expect(invoiceSalesOrder({
                orderId: order.id,
            })).rejects.toThrow(/No hay ítems pendientes por facturar/);
        });

        it("no debe facturar movimientos no vinculados a órdenes de venta", async () => {
            const { invoiceDelivery } = await import("./sales_flow");
            const { createInventoryMovement } = await import("#svc/inventory/movement");
            const { db } = await import("#lib/db");
            const { inventoryMovementType } = await import("#models/inventory/movement_type");
            const { eq } = await import("drizzle-orm");

            // Buscar tipo de movimiento de venta (salida)
            const [movType] = await db.select().from(inventoryMovementType).where(eq(inventoryMovementType.name, "Venta"));

            // Crear un movimiento sin vincularlo a una orden
            const movement = await createInventoryMovement({
                movementTypeId: movType.id,
                movementDate: new DateTime(),
                userId,
                details: [{ itemId, locationId, quantity: 1 }],
                autoPost: true,
            });

            await expect(invoiceDelivery({
                movementId: movement.movementId,
            })).rejects.toThrow(/no está vinculada a una orden de venta/);
        });
    });
});

