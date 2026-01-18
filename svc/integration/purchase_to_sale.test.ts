/**
 * Test de Integración End-to-End: Flujo Compra → Venta
 * 
 * Este test valida el ciclo completo:
 * 1. Crear Orden de Compra
 * 2. Aprobar Orden de Compra  
 * 3. Recibir Orden de Compra (genera movimiento de inventario + capa de costo)
 * 4. Crear Orden de Venta
 * 5. Confirmar Orden de Venta
 * 6. Entregar Orden de Venta (consume capa de costo)
 * 7. Facturar la Entrega
 * 
 * Valida que las capas de costo se crean correctamente en la compra
 * y se consumen correctamente en la venta.
 */

import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// IDs de entidades creadas en beforeAll
let clientId: number;
let supplierId: number;
let itemId: number;
let locationId: number;
let employeeId: number;
let orderTypeId: number;

beforeAll(async () => {
    const { default: initDatabase } = await import("#lib/db");
    const uuid = crypto.randomUUID();

    await initDatabase("postgresql://postgres:mypassword@localhost", {
        tenant: `vitest_e2e_compra_venta_${uuid}`,
        env: "vitest",
        skipSeeds: true,
    });

    const { db } = await import("#lib/db");

    // ============ Core Document Types ============
    const { upsertDocumentType: upsertCoreDocType } = await import("#svc/core/documentType");
    const [idDocType] = await upsertCoreDocType({
        code: "CC",
        name: "Cédula",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
    });

    // ============ Supplier ============
    const { upsertSupplierType } = await import("#svc/purchasing/supplier_type");
    const { upsertSupplier } = await import("#svc/purchasing/supplier");

    const [supplierType] = await upsertSupplierType({ name: "Nacional" });
    const supplier = await upsertSupplier({
        user: {
            documentTypeId: idDocType.id,
            documentNumber: `SUP-${uuid.slice(0, 6)}`,
            person: { firstName: "Proveedor", lastName: "Test" },
        },
        supplierTypeId: supplierType.id,
        active: true,
    });
    supplierId = supplier.id;

    // ============ Client ============
    const { upsertClientType } = await import("#svc/crm/clientType");
    const { upsertClient } = await import("#svc/crm/client");

    const [clientType] = await upsertClientType({ name: "Regular", isEnabled: true });
    const client = await upsertClient({
        user: {
            documentTypeId: idDocType.id,
            documentNumber: `CLI-${uuid.slice(0, 6)}`,
            person: { firstName: "Cliente", lastName: "Test" },
        },
        typeId: clientType.id,
        active: true,
    });
    clientId = client.id;

    // ============ Employee ============
    const { user } = await import("#models/user");
    const [createdUser] = await db.insert(user).values({
        type: "person",
        documentTypeId: idDocType.id,
        documentNumber: `EMP-${uuid.slice(0, 6)}`,
    }).returning();
    employeeId = createdUser.id;

    const { default: person } = await import("#models/person");
    await db.insert(person).values({ id: employeeId, firstName: "Empleado", lastName: "Test" });

    const { default: employee } = await import("#models/hr/employee");
    await db.insert(employee).values({
        id: employeeId,
        hireDate: new DateTime(),
        avatarUrl: "https://example.com/avatar.png"
    });

    // ============ Business Document Types & Series ============
    const { upsertDocumentType: upsertBusDocType } = await import("#svc/numbering/documentType");
    const { upsertDocumentSeries } = await import("#svc/numbering/documentSeries");

    // Inventory Movement
    const invDoc = await upsertBusDocType({ code: "INV_MOV", name: "IM", isEnabled: true });
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

    // Purchase Order
    const poDoc = await upsertBusDocType({ code: "PURCHASE_ORDER", name: "OC", isEnabled: true });
    await upsertDocumentSeries({
        documentTypeId: poDoc.id,
        seriesCode: "OC-2025",
        prefix: "OC-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    // Purchase Invoice (requerida para recepción automática)
    const piDoc = await upsertBusDocType({ code: "PURCHASE_INVOICE", name: "FC", isEnabled: true });
    await upsertDocumentSeries({
        documentTypeId: piDoc.id,
        seriesCode: "FC-2025",
        prefix: "FC-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    // Sales Order
    const soDoc = await upsertBusDocType({ code: "SALES_ORDER", name: "OV", isEnabled: true });
    await upsertDocumentSeries({
        documentTypeId: soDoc.id,
        seriesCode: "OV-2025",
        prefix: "OV-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    // Sales Invoice
    const siDoc = await upsertBusDocType({ code: "SALES_INVOICE", name: "FV", isEnabled: true });
    await upsertDocumentSeries({
        documentTypeId: siDoc.id,
        seriesCode: "FV-2025",
        prefix: "FV-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    // ============ Inventory Setup ============
    const { upsertMovementType } = await import("#svc/inventory/movementType");
    const { upsertLocation } = await import("#svc/inventory/location");

    // Movement types
    await upsertMovementType({
        name: "Compra",
        factor: 1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: invDoc.id,
    });

    await upsertMovementType({
        name: "Venta",
        factor: -1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: invDoc.id,
    });

    // Location
    const [loc] = await upsertLocation({ name: "Bodega Principal", code: "BP", isEnabled: true });
    locationId = loc.id;

    // ============ Item Setup ============
    const taxGroup = await import("#models/finance/tax_group");
    const itemAccountingGroup = await import("#models/finance/item_accounting_group");
    const unitOfMeasure = await import("#models/inventory/unit_of_measure");
    const { upsertItem } = await import("#svc/catalogs/item");

    await db.insert(unitOfMeasure.default).values([{ id: 1, code: "UN", fullName: "Unidad", isEnabled: true }]);
    const [tg] = await db.insert(taxGroup.default).values({ code: "IVA19", fullName: "IVA", isEnabled: true }).returning();
    const [acc] = await db.insert(itemAccountingGroup.default).values({ code: "MER", fullName: "Mercancia", isEnabled: true }).returning();

    const itemRecord = await upsertItem({
        code: "PROD-E2E",
        fullName: "Producto E2E Test",
        isEnabled: true,
        basePrice: new Decimal("1000"),
        taxGroupId: tg.id,
        itemAccountingGroupId: acc.id,
        images: [],
        good: { uomId: 1 }
    });
    itemId = (itemRecord as any).id;

    // ============ Order Type ============
    const orderType = await import("#models/crm/order_type");
    const [ot] = await db.insert(orderType.default).values({ name: "Normal", disabled: false }).returning();
    orderTypeId = ot.id;

    // ============ Payment Terms ============
    const { paymentTerms } = await import("#models/finance/payment_terms");
    await db.insert(paymentTerms).values({
        code: "CASH",
        fullName: "Contado",
        dueDays: 0,
        isDefault: true,
        isEnabled: true,
    });
});

afterAll(async () => {
    const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
    const { db } = await import("#lib/db");
    const { default: config } = await import("#lib/db/schema/config");
    await deleteSchema(config.schemaName, db.$client);
    await db.$client.end();
});

describe("E2E: Flujo Compra → Venta Completo", () => {
    it("debe completar el ciclo: OC → Recepción → OV → Entrega → Factura Venta", async () => {
        // ============ FASE 1: COMPRA ============
        const { createPurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder } =
            await import("#svc/purchasing/purchase_order");

        // 1.1 Crear Orden de Compra
        const purchaseOrder = await createPurchaseOrder({
            supplierId,
            items: [{ itemId, quantity: 50, unitPrice: new Decimal("500") }]
        });
        expect(purchaseOrder.id).toBeDefined();
        expect(purchaseOrder.status).toBe("pending");
        expect(purchaseOrder.documentNumberFull).toContain("OC-");

        // 1.2 Aprobar Orden de Compra
        await updatePurchaseOrderStatus(purchaseOrder.id, "approved");

        // 1.3 Recibir Orden de Compra (genera movimiento de inventario + capa de costo)
        const receiptResult = await receivePurchaseOrder({
            orderId: purchaseOrder.id,
            locationId,
            receivedById: employeeId,
            observation: "Recepción E2E"
        });
        expect(receiptResult.order.status).toBe("received");
        expect(receiptResult.inventoryMovementId).toBeDefined();

        // 1.4 Verificar que se creó la capa de costo
        const { db } = await import("#lib/db");
        const { inventoryCostLayer } = await import("#models/inventory/cost_layer");
        const { eq, and, gt } = await import("drizzle-orm");

        const layers = await db.select()
            .from(inventoryCostLayer)
            .where(and(
                eq(inventoryCostLayer.itemId, itemId),
                eq(inventoryCostLayer.locationId, locationId),
                gt(inventoryCostLayer.remainingQuantity, new Decimal(0))
            ));

        expect(layers.length).toBe(1);
        expect(layers[0].originalQuantity.toNumber()).toBe(50);
        expect(layers[0].remainingQuantity.toNumber()).toBe(50);
        expect(layers[0].unitCost.toNumber()).toBe(500);

        // 1.5 Verificar stock agregado
        const { stock } = await import("#models/inventory/stock");
        const [stockRecord] = await db.select()
            .from(stock)
            .where(and(
                eq(stock.itemId, itemId),
                eq(stock.locationId, locationId)
            ));
        expect(stockRecord.quantity.toNumber()).toBe(50);

        // ============ FASE 2: VENTA ============
        const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } =
            await import("#svc/crm/order");
        const { deliverSalesOrder, invoiceDelivery } = await import("#svc/sales/sales_flow");

        // 2.1 Crear Orden de Venta
        const salesOrder = await createSalesOrder({
            clientId,
            orderTypeId,
            items: [{ itemId, quantity: 20, unitPrice: new Decimal("1000") }]
        });
        expect(salesOrder.id).toBeDefined();
        expect(salesOrder.status).toBe("pending");
        expect(salesOrder.documentNumberFull).toContain("OV-");

        // 2.2 Confirmar Orden de Venta
        await updateSalesOrderStatus(salesOrder.id, "confirmed");

        // 2.3 Obtener detalle de la orden para tener los IDs de líneas
        const orderDetail = await getSalesOrderById(salesOrder.id);
        expect(orderDetail).toBeDefined();
        const orderItemId = orderDetail!.items[0].id;

        // 2.4 Entregar la Orden de Venta (consume capa de costo)
        const deliveryResult = await deliverSalesOrder({
            orderId: salesOrder.id,
            locationId,
            userId: employeeId,
            items: [{ orderItemId, quantity: 20 }]
        });
        expect(deliveryResult.movementId).toBeDefined();
        expect(deliveryResult.documentNumber).toContain("IM-");

        // 2.5 Verificar que se consumió la capa de costo
        const layersAfter = await db.select()
            .from(inventoryCostLayer)
            .where(and(
                eq(inventoryCostLayer.itemId, itemId),
                eq(inventoryCostLayer.locationId, locationId)
            ));

        expect(layersAfter.length).toBe(1);
        expect(layersAfter[0].remainingQuantity.toNumber()).toBe(30); // 50 - 20 = 30

        // 2.6 Verificar stock agregado
        const [stockAfter] = await db.select()
            .from(stock)
            .where(and(
                eq(stock.itemId, itemId),
                eq(stock.locationId, locationId)
            ));
        expect(stockAfter.quantity.toNumber()).toBe(30);

        // 2.7 Verificar cantidad entregada en la orden
        const orderAfterDelivery = await getSalesOrderById(salesOrder.id);
        expect(orderAfterDelivery?.items[0].deliveredQuantity.toNumber()).toBe(20);

        // 2.8 Facturar la Entrega
        const invoiceResult = await invoiceDelivery({
            movementId: deliveryResult.movementId,
            notes: "Factura E2E"
        });
        expect(invoiceResult.invoiceId).toBeDefined();
        expect(invoiceResult.documentNumber).toContain("FV-");

        // 2.9 Verificar cantidad facturada en la orden
        const orderAfterInvoice = await getSalesOrderById(salesOrder.id);
        expect(orderAfterInvoice?.items[0].invoicedQuantity.toNumber()).toBe(20);
    });

    it("debe fallar la entrega si no hay stock disponible", async () => {
        const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } =
            await import("#svc/crm/order");
        const { deliverSalesOrder } = await import("#svc/sales/sales_flow");

        // Crear orden de venta por más cantidad de la que hay en stock
        const salesOrder = await createSalesOrder({
            clientId,
            orderTypeId,
            items: [{ itemId, quantity: 100, unitPrice: new Decimal("1000") }] // Solo hay 30 en stock
        });

        await updateSalesOrderStatus(salesOrder.id, "confirmed");

        const orderDetail = await getSalesOrderById(salesOrder.id);
        const orderItemId = orderDetail!.items[0].id;

        // Intentar entregar más de lo disponible
        await expect(deliverSalesOrder({
            orderId: salesOrder.id,
            locationId,
            userId: employeeId,
            items: [{ orderItemId, quantity: 100 }]
        })).rejects.toThrow(/Stock insuficiente|Inconsistencia/);
    });

    it("debe fallar la entrega si no hay capas de costo suficientes", async () => {
        // Este test simula el escenario donde no hay stock en una bodega

        const { upsertLocation } = await import("#svc/inventory/location");
        const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } =
            await import("#svc/crm/order");
        const { deliverSalesOrder } = await import("#svc/sales/sales_flow");

        // Crear una ubicación nueva sin stock ni capas
        const [newLoc] = await upsertLocation({
            name: "Bodega Sin Stock",
            code: "BSS",
            isEnabled: true
        });

        // Crear orden de venta
        const salesOrder = await createSalesOrder({
            clientId,
            orderTypeId,
            items: [{ itemId, quantity: 5, unitPrice: new Decimal("1000") }]
        });

        await updateSalesOrderStatus(salesOrder.id, "confirmed");

        const orderDetail = await getSalesOrderById(salesOrder.id);
        const orderItemId = orderDetail!.items[0].id;

        // Intentar entregar desde bodega sin stock
        await expect(deliverSalesOrder({
            orderId: salesOrder.id,
            locationId: newLoc.id,
            userId: employeeId,
            items: [{ orderItemId, quantity: 5 }]
        })).rejects.toThrow(/Stock insuficiente/);
    });

    it("debe permitir entregas parciales y consumir capas PEPS correctamente", async () => {
        // Primero agregamos más stock con un costo diferente
        const { createPurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder } =
            await import("#svc/purchasing/purchase_order");
        const { createSalesOrder, updateSalesOrderStatus, getSalesOrderById } =
            await import("#svc/crm/order");
        const { deliverSalesOrder } = await import("#svc/sales/sales_flow");
        const { db } = await import("#lib/db");
        const { inventoryCostLayer } = await import("#models/inventory/cost_layer");
        const { eq, and, gt } = await import("drizzle-orm");

        // Nueva compra con costo diferente
        const po2 = await createPurchaseOrder({
            supplierId,
            items: [{ itemId, quantity: 20, unitPrice: new Decimal("600") }] // Costo mayor
        });
        await updatePurchaseOrderStatus(po2.id, "approved");
        await receivePurchaseOrder({
            orderId: po2.id,
            locationId,
            receivedById: employeeId,
        });

        // Verificar que hay 2 capas de costo ahora (30 @ 500 + 20 @ 600 = 50 total)
        const layersBefore = await db.select()
            .from(inventoryCostLayer)
            .where(and(
                eq(inventoryCostLayer.itemId, itemId),
                eq(inventoryCostLayer.locationId, locationId),
                gt(inventoryCostLayer.remainingQuantity, new Decimal(0))
            ))
            .orderBy(inventoryCostLayer.createdAt);

        expect(layersBefore.length).toBe(2);
        expect(layersBefore[0].remainingQuantity.toNumber()).toBe(30); // Primera capa @ 500
        expect(layersBefore[1].remainingQuantity.toNumber()).toBe(20); // Segunda capa @ 600

        // Crear orden de venta por 40 unidades
        const salesOrder = await createSalesOrder({
            clientId,
            orderTypeId,
            items: [{ itemId, quantity: 40, unitPrice: new Decimal("1200") }]
        });
        await updateSalesOrderStatus(salesOrder.id, "confirmed");

        const orderDetail = await getSalesOrderById(salesOrder.id);
        const orderItemId = orderDetail!.items[0].id;

        // Entregar parcialmente (25 unidades)
        await deliverSalesOrder({
            orderId: salesOrder.id,
            locationId,
            userId: employeeId,
            items: [{ orderItemId, quantity: 25 }]
        });

        // Verificar consumo PEPS: primera capa se consume parcialmente
        const layersAfterFirst = await db.select()
            .from(inventoryCostLayer)
            .where(and(
                eq(inventoryCostLayer.itemId, itemId),
                eq(inventoryCostLayer.locationId, locationId),
                gt(inventoryCostLayer.remainingQuantity, new Decimal(0))
            ))
            .orderBy(inventoryCostLayer.createdAt);

        expect(layersAfterFirst.length).toBe(2);
        expect(layersAfterFirst[0].remainingQuantity.toNumber()).toBe(5);  // 30 - 25 = 5
        expect(layersAfterFirst[1].remainingQuantity.toNumber()).toBe(20); // Intacta

        // Entregar el resto (15 unidades)
        await deliverSalesOrder({
            orderId: salesOrder.id,
            locationId,
            userId: employeeId,
            items: [{ orderItemId, quantity: 15 }]
        });

        // Verificar consumo PEPS: primera capa agotada, segunda consumida parcialmente
        const layersAfterSecond = await db.select()
            .from(inventoryCostLayer)
            .where(and(
                eq(inventoryCostLayer.itemId, itemId),
                eq(inventoryCostLayer.locationId, locationId),
                gt(inventoryCostLayer.remainingQuantity, new Decimal(0))
            ))
            .orderBy(inventoryCostLayer.createdAt);

        expect(layersAfterSecond.length).toBe(1);
        expect(layersAfterSecond[0].remainingQuantity.toNumber()).toBe(10); // 20 - 10 = 10

        // Verificar orden completamente entregada
        const orderAfter = await getSalesOrderById(salesOrder.id);
        expect(orderAfter?.items[0].deliveredQuantity.toNumber()).toBe(40);
        expect(orderAfter?.status).toBe("shipped");
    });
});
