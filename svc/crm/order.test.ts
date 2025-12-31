import DateTime from "#utils/data/DateTime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Decimal from "#utils/data/Decimal";

let clientId: number;
let inactiveClientId: number;
let orderTypeId: number;
let testItemId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_sales_order_${uuid}`,
    env: "vitest",
    skipSeeds: true,
  });

  const { upsertDocumentType } = await import("#svc/core/documentType");
  const { upsertClientType } = await import("#svc/crm/clientType");
  const { upsertClient } = await import("#svc/crm/client");
  const { upsertDocumentType: upsertBusinessDocType } = await import(
    "#svc/numbering/documentType"
  );
  const { upsertDocumentSeries } = await import(
    "#svc/numbering/documentSeries"
  );
  const { SALES_ORDER_DOCUMENT_TYPE_CODE } = await import("./order");
  const { upsertItem } = await import("#svc/catalogs/item");
  const { db } = await import("#lib/db");
  const taxGroup = await import("#models/finance/tax_group");
  const itemAccountingGroup = await import("#models/finance/item_accounting_group");
  const unitOfMeasure = await import("#models/inventory/unit_of_measure");

  // Setup UOM
  await db.insert(unitOfMeasure.default).values([
    { id: 1, code: "UN", fullName: "Unidad", isEnabled: true },
  ]);

  // Create document type for identification
  const [documentType] = await upsertDocumentType({
    name: `CC-${uuid.slice(0, 6)}`,
    code: `DOC-${uuid.slice(0, 6)}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: true,
  });

  // Create client type
  const [clientType] = await upsertClientType({
    name: "Cliente Regular",
    isEnabled: true,
  });

  // Create active client
  const activeClient = await upsertClient({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `CLI-${uuid.slice(0, 6)}`,
      person: { firstName: "Cliente", lastName: "Activo" },
    },
    typeId: clientType.id,
    active: true,
  });

  // Create inactive client
  const inactiveClient = await upsertClient({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `INACT-${uuid.slice(0, 6)}`,
      person: { firstName: "Cliente", lastName: "Inactivo" },
    },
    typeId: clientType.id,
    active: false,
  });

  // Create order type using direct db access
  const orderType = await import("#models/crm/order_type");
  const [createdOrderType] = await db
    .insert(orderType.default)
    .values({
      name: "Venta Directa",
      disabled: false,
    })
    .returning();

  // Create business document type for sales orders
  const salesOrderDocType = await upsertBusinessDocType({
    code: SALES_ORDER_DOCUMENT_TYPE_CODE,
    name: "Orden de Venta",
    isEnabled: true,
  });

  // Create document series for sales order document type
  await upsertDocumentSeries({
    documentTypeId: salesOrderDocType.id,
    seriesCode: `SO-SERIE-${uuid.slice(0, 6)}`,
    prefix: "OV-",
    suffix: "",
    startNumber: 1,
    endNumber: 99999,
    validFrom: new DateTime("2024-01-01"),
    validTo: new DateTime("2030-12-31"),
    isActive: true,
    isDefault: true,
  });

  // Create groups for item
  const [createdTaxGroup] = await db.insert(taxGroup.default).values({
    code: `TG-${uuid.slice(0, 6)}`,
    fullName: "IVA Tests",
    isEnabled: true,
  }).returning();

  const [createdAccGroup] = await db.insert(itemAccountingGroup.default).values({
    code: `ACC-${uuid.slice(0, 6)}`,
    fullName: "Acc Tests",
    isEnabled: true,
  }).returning();

  const itemRecord = await upsertItem({
    code: `ITEM-${uuid.slice(0, 6)}`,
    fullName: "Producto de prueba",
    isEnabled: true,
    basePrice: new Decimal("0"),
    taxGroupId: createdTaxGroup.id,
    itemAccountingGroupId: createdAccGroup.id,
    images: [],
    good: {
      uomId: 1,
    }
  });

  // Store IDs for tests
  clientId = activeClient.id;
  inactiveClientId = inactiveClient.id;
  orderTypeId = createdOrderType.id;
  testItemId = itemRecord.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("createSalesOrder service", () => {
  it("crea una orden de venta con estado pendiente por defecto, detalles y asigna numeración", async () => {
    const { createSalesOrder } = await import("./order");

    const order = await createSalesOrder({
      clientId,
      orderTypeId,
      orderDate: new DateTime("2024-01-15"),
      items: [
        {
          itemId: testItemId,
          quantity: 10,
          unitPrice: 1500,
        }
      ]
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe("pending");
    expect(order.clientId).toBe(clientId);
    expect(order.orderTypeId).toBe(orderTypeId);
    expect(Number(order.total)).toBe(15000);

    // Verificar campos de numeración
    expect(order.seriesId).toBeDefined();
    expect(order.documentNumber).toBeDefined();
    expect(order.documentNumberFull).toContain("OV-");
  });

  it("permite definir un estado válido distinto al predeterminado", async () => {
    const { createSalesOrder } = await import("./order");

    const order = await createSalesOrder({
      clientId,
      orderTypeId,
      status: "confirmed",
      items: [{ itemId: testItemId, quantity: 5, unitPrice: 1000 }]
    });

    expect(order.status).toBe("confirmed");
    expect(Number(order.total)).toBe(5000);
  });

  it("rechaza estados inválidos", async () => {
    const { createSalesOrder } = await import("./order");

    await expect(
      createSalesOrder({
        clientId,
        orderTypeId,
        status: "invalid" as any,
        items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
      })
    ).rejects.toThrow("Estado de la orden de venta inválido");
  });

  it("rechaza clientes inactivos o inexistentes", async () => {
    const { createSalesOrder } = await import("./order");

    await expect(
      createSalesOrder({
        clientId: inactiveClientId,
        orderTypeId,
        items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
      })
    ).rejects.toThrow("El cliente está inactivo");

    await expect(
      createSalesOrder({
        clientId: 999999,
        orderTypeId,
        items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
      })
    ).rejects.toThrow("El cliente no existe");
  });

  it("rechaza órdenes sin líneas", async () => {
    const { createSalesOrder } = await import("./order");

    await expect(
      createSalesOrder({
        clientId,
        orderTypeId,
        items: []
      })
    ).rejects.toThrow("La orden debe tener al menos una línea");
  });
});

describe("getSalesOrderById service", () => {
  it("retorna una orden de venta con sus detalles, líneas y número de documento", async () => {
    const { createSalesOrder, getSalesOrderById } = await import("./order");

    const created = await createSalesOrder({
      clientId,
      orderTypeId,
      items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
    });

    const order = await getSalesOrderById(created.id);

    expect(order).toBeDefined();
    expect(order?.id).toBe(created.id);
    expect(order?.clientId).toBe(clientId);
    expect(order?.clientName).toContain("Cliente");
    expect(order?.documentNumberFull).toContain("OV-");
    expect(order?.items.length).toBe(1);
    expect(order?.items[0].itemId).toBe(testItemId);
  });

  it("retorna undefined para orden inexistente", async () => {
    const { getSalesOrderById } = await import("./order");

    const order = await getSalesOrderById(999999);
    expect(order).toBeUndefined();
  });
});

describe("listSalesOrders service", () => {
  it("lista órdenes de venta con paginación y número de documento", async () => {
    const { createSalesOrder, listSalesOrders } = await import("./order");

    await createSalesOrder({
      clientId,
      orderTypeId,
      items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
    });

    const result = await listSalesOrders({
      pageIndex: 0,
      pageSize: 10,
      includeTotalCount: true,
    });

    expect(result.orders).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.orders.every((o) => o.clientName !== undefined)).toBe(true);
    expect(result.orders.every((o) => o.documentNumberFull !== undefined)).toBe(true);
  });
});

describe("updateSalesOrderStatus service", () => {
  it("actualiza el estado de una orden de pending a confirmed", async () => {
    const { createSalesOrder, updateSalesOrderStatus } = await import("./order");

    const order = await createSalesOrder({
      clientId,
      orderTypeId,
      status: "pending",
      items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
    });

    const updated = await updateSalesOrderStatus(order.id, "confirmed");

    expect(updated.status).toBe("confirmed");
    expect(updated.id).toBe(order.id);
  });

  it("rechaza transiciones de estado no permitidas", async () => {
    const { createSalesOrder, updateSalesOrderStatus } = await import("./order");

    const order = await createSalesOrder({
      clientId,
      orderTypeId,
      status: "pending",
      items: [{ itemId: testItemId, quantity: 1, unitPrice: 100 }]
    });

    await expect(updateSalesOrderStatus(order.id, "delivered")).rejects.toThrow(
      "No se puede cambiar el estado de 'pending' a 'delivered'"
    );
  });
});
