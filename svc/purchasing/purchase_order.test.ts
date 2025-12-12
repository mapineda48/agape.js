import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let supplierId: number;
let inactiveSupplierId: number;
let itemId: number;
let disabledItemId: number;
let locationId: number;
let employeeId: number;
let movementTypeId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_purchase_order_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  const { upsertDocumentType } = await import("#svc/core/documentType");
  const { upsertSupplierType } = await import("./supplier_type");
  const { upsertSupplier } = await import("./supplier");
  const { upsertCategory, upsertSubcategory } = await import(
    "#svc/catalogs/category"
  );
  const { upsertItem } = await import("#svc/inventory/item");
  const { upsertLocation } = await import("#svc/inventory/location");
  const { upsertEmployee } = await import("#svc/hr/employee");
  const { upsertMovementType } = await import("#svc/inventory/movementType");
  const { upsertDocumentType: upsertBusinessDocType } = await import(
    "#svc/numbering/documentType"
  );
  const { upsertDocumentSeries } = await import(
    "#svc/numbering/documentSeries"
  );
  const { PURCHASE_ORDER_DOCUMENT_TYPE_CODE } = await import(
    "./purchase_order"
  );

  // Create document type for identification
  const [documentType] = await upsertDocumentType({
    name: `CC-${uuid.slice(0, 6)}`,
    code: `DOC-${uuid.slice(0, 6)}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: true,
  });

  // Create UOM
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");
  const { db } = await import("#lib/db");
  await db.insert(unitOfMeasure).values({
    id: 1,
    code: "UN",
    fullName: "Unidad",
    isEnabled: true,
  });

  // Create supplier type
  const [supplierType] = await upsertSupplierType({
    name: "Proveedor Nacional",
  });

  // Create active supplier
  const activeSupplier = await upsertSupplier({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `SUP-${uuid.slice(0, 6)}`,
      person: { firstName: "Proveedor", lastName: "Activo" },
    },
    supplierTypeId: supplierType.id,
    active: true,
  });

  // Create inactive supplier
  const inactiveSupplier = await upsertSupplier({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `INACT-${uuid.slice(0, 6)}`,
      person: { firstName: "Proveedor", lastName: "Inactivo" },
    },
    supplierTypeId: supplierType.id,
    active: false,
  });

  // Create category with subcategory
  const [category] = await upsertCategory({
    fullName: "Compras Test",
    isEnabled: true,
  });

  const [subcategory] = await upsertSubcategory({
    fullName: "Insumos Test",
    categoryId: category.id,
    isEnabled: true,
  });

  const subcategoryId = subcategory.id;

  // Create active item
  const activeItem = await upsertItem({
    code: `ITEM-ACT-${uuid.slice(0, 6)}`,
    fullName: "Ítem de Compra Activo",
    slogan: "Ítem para órdenes",
    isEnabled: true,
    basePrice: new Decimal("50.00"),
    categoryId: category.id,
    subcategoryId,
    rating: 5,
    images: [],
    good: {
      uomId: 1,
    },
  });

  // Create disabled item
  const disabledItem = await upsertItem({
    code: `ITEM-DIS-${uuid.slice(0, 6)}`,
    fullName: "Ítem Deshabilitado",
    slogan: "No debe usarse",
    isEnabled: false,
    basePrice: new Decimal("75.00"),
    categoryId: category.id,
    subcategoryId,
    rating: 3,
    images: [],
    good: {
      uomId: 1,
    },
  });

  // Create location for inventory reception
  const [location] = await upsertLocation({
    name: `Bodega Principal ${uuid.slice(0, 6)}`,
    code: `BOD-${uuid.slice(0, 3)}`,
    isEnabled: true,
  });

  // Create employee for movement registration
  const employee = await upsertEmployee({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `EMP-${uuid.slice(0, 6)}`,
      person: { firstName: "Empleado", lastName: "Test" },
    },
    isActive: true,
  });

  // Create business document type for inventory movements
  const businessDocType = await upsertBusinessDocType({
    code: `INV_ENT_${uuid.slice(0, 6)}`,
    name: "Entrada de Inventario Test",
    isEnabled: true,
  });

  // Create document series for inventory movement document type
  await upsertDocumentSeries({
    documentTypeId: businessDocType.id,
    seriesCode: `SERIE-${uuid.slice(0, 6)}`,
    prefix: "ENT-",
    suffix: "",
    startNumber: 1,
    endNumber: 99999,
    validFrom: new DateTime("2024-01-01"),
    validTo: new DateTime("2030-12-31"),
    isActive: true,
    isDefault: true,
  });

  // Create business document type for purchase orders
  const purchaseOrderDocType = await upsertBusinessDocType({
    code: PURCHASE_ORDER_DOCUMENT_TYPE_CODE,
    name: "Orden de Compra",
    isEnabled: true,
  });

  // Create document series for purchase order document type
  await upsertDocumentSeries({
    documentTypeId: purchaseOrderDocType.id,
    seriesCode: `PO-SERIE-${uuid.slice(0, 6)}`,
    prefix: "OC-",
    suffix: "",
    startNumber: 1,
    endNumber: 99999,
    validFrom: new DateTime("2024-01-01"),
    validTo: new DateTime("2030-12-31"),
    isActive: true,
    isDefault: true,
  });

  // Create movement type for purchase entries
  const [purchaseMovementType] = await upsertMovementType({
    name: "Entrada por Compra Test",
    factor: 1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: businessDocType.id,
  });

  // Store IDs for tests
  supplierId = activeSupplier.id;
  inactiveSupplierId = inactiveSupplier.id;
  itemId = activeItem.id;
  disabledItemId = disabledItem.id;
  locationId = location.id;
  employeeId = employee.id;
  movementTypeId = purchaseMovementType.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("createPurchaseOrder service", () => {
  it("crea una orden de compra con estado pendiente por defecto y asigna numeración", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    const order = await createPurchaseOrder({
      supplierId,
      orderDate: new DateTime("2024-01-15"),
      items: [
        { itemId, quantity: 2, unitPrice: new Decimal("50.00") },
        { itemId, quantity: 1, unitPrice: new Decimal("50.00") },
      ],
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe("pending");
    expect(order.items).toHaveLength(2);
    expect(order.items.every((item) => item.purchaseOrderId === order.id)).toBe(
      true
    );
    // Verificar campos de numeración
    expect(order.seriesId).toBeDefined();
    expect(order.documentNumber).toBeDefined();
    expect(order.documentNumber).toBeGreaterThan(0);
    expect(order.documentNumberFull).toBeDefined();
    expect(order.documentNumberFull).toContain("OC-"); // Prefijo definido en beforeAll
  });

  it("permite definir un estado válido distinto al predeterminado", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    const order = await createPurchaseOrder({
      supplierId,
      status: "approved",
      items: [{ itemId, quantity: 3, unitPrice: "99.99" }],
    });

    expect(order.status).toBe("approved");
    expect(order.items[0]?.unitPrice).toBeInstanceOf(Decimal);
  });

  it("rechaza estados inválidos", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    await expect(
      createPurchaseOrder({
        supplierId,
        status: "invalid" as any,
        items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
      })
    ).rejects.toThrow("Estado de la orden de compra inválido");
  });

  it("rechaza proveedores inactivos o inexistentes", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    await expect(
      createPurchaseOrder({
        supplierId: inactiveSupplierId,
        items: [{ itemId, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow("El proveedor está inactivo");

    await expect(
      createPurchaseOrder({
        supplierId: 999999,
        items: [{ itemId, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow("El proveedor no existe");
  });

  it("valida ítems requeridos y habilitados", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [{ itemId: 999999, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow("Uno o más ítems no existen");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [{ itemId: disabledItemId, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow(`El ítem ${disabledItemId} está deshabilitado`);
  });

  it("exige ítems y cantidades/precios mayores a cero", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [],
      })
    ).rejects.toThrow("La orden de compra debe incluir al menos un ítem");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [{ itemId, quantity: 0, unitPrice: "10.00" }],
      })
    ).rejects.toThrow("La cantidad de cada ítem debe ser mayor a cero");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [{ itemId, quantity: 1, unitPrice: "0" }],
      })
    ).rejects.toThrow("El precio unitario de cada ítem debe ser mayor a cero");
  });
});

describe("getPurchaseOrderById service", () => {
  it("retorna una orden de compra con sus detalles y número de documento", async () => {
    const { createPurchaseOrder, getPurchaseOrderById } = await import(
      "./purchase_order"
    );

    const created = await createPurchaseOrder({
      supplierId,
      items: [
        { itemId, quantity: 5, unitPrice: "100.00" },
        { itemId, quantity: 3, unitPrice: "150.00" },
      ],
    });

    const order = await getPurchaseOrderById(created.id);

    expect(order).toBeDefined();
    expect(order?.id).toBe(created.id);
    expect(order?.supplierId).toBe(supplierId);
    expect(order?.supplierName).toContain("Proveedor");
    expect(order?.items).toHaveLength(2);
    // Verificar número de documento
    expect(order?.documentNumberFull).toBeDefined();
    expect(order?.documentNumberFull).toContain("OC-");
    // Total = 5*100 + 3*150 = 500 + 450 = 950
    const totalNumber =
      order?.totalAmount instanceof Decimal
        ? order.totalAmount.toNumber()
        : Number(order?.totalAmount);
    expect(totalNumber).toBe(950);
  });

  it("retorna undefined para orden inexistente", async () => {
    const { getPurchaseOrderById } = await import("./purchase_order");

    const order = await getPurchaseOrderById(999999);
    expect(order).toBeUndefined();
  });
});

describe("listPurchaseOrders service", () => {
  it("lista órdenes de compra con paginación y número de documento", async () => {
    const { createPurchaseOrder, listPurchaseOrders } = await import(
      "./purchase_order"
    );

    // Crear algunas órdenes para listar
    await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    const result = await listPurchaseOrders({
      pageIndex: 0,
      pageSize: 10,
      includeTotalCount: true,
    });

    expect(result.orders).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.orders.every((o) => o.supplierName !== undefined)).toBe(true);
    // Verificar que todas las órdenes tienen número de documento
    expect(result.orders.every((o) => o.documentNumberFull !== undefined)).toBe(
      true
    );
  });

  it("filtra por estado de la orden", async () => {
    const { createPurchaseOrder, listPurchaseOrders } = await import(
      "./purchase_order"
    );

    // Crear orden aprobada
    await createPurchaseOrder({
      supplierId,
      status: "approved",
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    const approvedOrders = await listPurchaseOrders({
      status: "approved",
    });

    expect(approvedOrders.orders.every((o) => o.status === "approved")).toBe(
      true
    );
  });

  it("filtra por rango de fechas", async () => {
    const { createPurchaseOrder, listPurchaseOrders } = await import(
      "./purchase_order"
    );

    // Crear orden con fecha específica
    await createPurchaseOrder({
      supplierId,
      orderDate: new DateTime("2024-06-15"),
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    const result = await listPurchaseOrders({
      fromDate: new DateTime("2024-06-01"),
      toDate: new DateTime("2024-06-30"),
    });

    expect(result.orders.length).toBeGreaterThan(0);
    result.orders.forEach((o) => {
      const orderDate = o.orderDate.getTime();
      expect(orderDate).toBeGreaterThanOrEqual(
        new DateTime("2024-06-01").getTime()
      );
      expect(orderDate).toBeLessThanOrEqual(
        new DateTime("2024-06-30").getTime()
      );
    });
  });
});

describe("updatePurchaseOrderStatus service", () => {
  it("actualiza el estado de una orden de pending a approved", async () => {
    const { createPurchaseOrder, updatePurchaseOrderStatus } = await import(
      "./purchase_order"
    );

    const order = await createPurchaseOrder({
      supplierId,
      status: "pending",
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    const updated = await updatePurchaseOrderStatus(order.id, "approved");

    expect(updated.status).toBe("approved");
    expect(updated.id).toBe(order.id);
  });

  it("actualiza el estado de approved a cancelled", async () => {
    const { createPurchaseOrder, updatePurchaseOrderStatus } = await import(
      "./purchase_order"
    );

    const order = await createPurchaseOrder({
      supplierId,
      status: "approved",
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    const updated = await updatePurchaseOrderStatus(order.id, "cancelled");

    expect(updated.status).toBe("cancelled");
  });

  it("rechaza transiciones de estado no permitidas", async () => {
    const { createPurchaseOrder, updatePurchaseOrderStatus } = await import(
      "./purchase_order"
    );

    // No se puede ir de pending a received (debe pasar por approved)
    const order = await createPurchaseOrder({
      supplierId,
      status: "pending",
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    await expect(
      updatePurchaseOrderStatus(order.id, "received")
    ).rejects.toThrow(
      "No se puede cambiar el estado de 'pending' a 'received'"
    );
  });

  it("rechaza órdenes inexistentes", async () => {
    const { updatePurchaseOrderStatus } = await import("./purchase_order");

    await expect(updatePurchaseOrderStatus(999999, "approved")).rejects.toThrow(
      "Orden de compra no encontrada"
    );
  });

  it("no permite cambiar estado desde estado terminal", async () => {
    const { createPurchaseOrder, updatePurchaseOrderStatus } = await import(
      "./purchase_order"
    );

    // Crear y cancelar orden
    const order = await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 1, unitPrice: "10.00" }],
    });

    await updatePurchaseOrderStatus(order.id, "cancelled");

    // Intentar cambiar desde cancelled (estado terminal)
    await expect(
      updatePurchaseOrderStatus(order.id, "pending")
    ).rejects.toThrow(
      "No se puede cambiar el estado de 'cancelled' a 'pending'"
    );
  });
});

describe("receivePurchaseOrder service", () => {
  it("recibe una orden de compra y genera movimiento de inventario", async () => {
    const {
      createPurchaseOrder,
      updatePurchaseOrderStatus,
      receivePurchaseOrder,
    } = await import("./purchase_order");

    // Crear y aprobar orden
    const order = await createPurchaseOrder({
      supplierId,
      items: [
        { itemId, quantity: 10, unitPrice: "50.00" },
        { itemId, quantity: 5, unitPrice: "75.00" },
      ],
    });

    await updatePurchaseOrderStatus(order.id, "approved");

    // Recibir la orden
    const result = await receivePurchaseOrder({
      orderId: order.id,
      locationId,
      receivedById: employeeId,
      observation: "Recepción de prueba",
    });

    expect(result.order.status).toBe("received");
    expect(result.inventoryMovementId).toBeDefined();
    expect(result.movementNumber).toBeDefined();
    expect(result.movementNumber.length).toBeGreaterThan(0);
  });

  it("rechaza recibir una orden que no está aprobada", async () => {
    const { createPurchaseOrder, receivePurchaseOrder } = await import(
      "./purchase_order"
    );

    const order = await createPurchaseOrder({
      supplierId,
      status: "pending",
      items: [{ itemId, quantity: 5, unitPrice: "50.00" }],
    });

    await expect(
      receivePurchaseOrder({
        orderId: order.id,
        locationId,
        receivedById: employeeId,
      })
    ).rejects.toThrow(
      "Solo se pueden recibir órdenes de compra en estado 'approved'"
    );
  });

  it("rechaza recibir una orden inexistente", async () => {
    const { receivePurchaseOrder } = await import("./purchase_order");

    await expect(
      receivePurchaseOrder({
        orderId: 999999,
        locationId,
        receivedById: employeeId,
      })
    ).rejects.toThrow("Orden de compra no encontrada");
  });

  it("permite recibir con cantidades parciales", async () => {
    const {
      createPurchaseOrder,
      updatePurchaseOrderStatus,
      receivePurchaseOrder,
      getPurchaseOrderById,
    } = await import("./purchase_order");

    // Crear y aprobar orden
    const order = await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 100, unitPrice: "50.00" }],
    });

    await updatePurchaseOrderStatus(order.id, "approved");

    // Obtener el ID del orderItem
    const orderDetails = await getPurchaseOrderById(order.id);
    const orderItemId = orderDetails!.items[0].id;

    // Recibir solo 50 unidades
    const result = await receivePurchaseOrder({
      orderId: order.id,
      locationId,
      receivedById: employeeId,
      receivedItems: [{ orderItemId, receivedQuantity: 50 }],
    });

    expect(result.order.status).toBe("received");
    expect(result.inventoryMovementId).toBeDefined();
  });
});
