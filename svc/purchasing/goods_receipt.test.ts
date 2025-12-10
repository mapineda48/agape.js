import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let supplierId: number;
let itemId: number;
let locationId: number;
let employeeId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_goods_receipt_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  const { upsertDocumentType } = await import("#svc/core/documentType");
  const { upsertSupplierType } = await import("./supplier_type");
  const { upsertSupplier } = await import("./supplier");
  const { upsertCategory } = await import("#svc/inventory/category");
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
  const { GOODS_RECEIPT_DOCUMENT_TYPE_CODE } = await import("./goods_receipt");

  // Document Type for Person
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

  // Supplier
  const [supplierType] = await upsertSupplierType({ name: "Proveedor Test" });
  const supplier = await upsertSupplier({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `SUP-${uuid.slice(0, 6)}`,
      email: "supplier-gr@example.com",
      person: { firstName: "Proveedor", lastName: "GR" },
    },
    supplierTypeId: supplierType.id,
    active: true,
  });
  supplierId = supplier.id;

  // Inventory Setup
  const category = await upsertCategory({ fullName: "Cat", isEnabled: true });
  const item = await upsertItem({
    code: `ITM-GR-${uuid.slice(0, 6)}`,
    fullName: "Item GR Test",
    isEnabled: true,
    basePrice: new Decimal("100.00"),
    categoryId: category.id,
    good: { uomId: 1 },
  });
  itemId = item.id;

  const [loc] = await upsertLocation({
    name: "Bodega GR",
    code: `BOD-${uuid.slice(0, 3)}`,
    isEnabled: true,
  });
  locationId = loc.id;

  const emp = await upsertEmployee({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `EMP-GR-${uuid.slice(0, 6)}`,
      email: "emp-gr@example.com",
      person: { firstName: "Receiver", lastName: "Test" },
    },
    isActive: true,
  });
  employeeId = emp.id;

  // Document Types and Series
  // 1. PO
  const poDocType = await upsertBusinessDocType({
    code: PURCHASE_ORDER_DOCUMENT_TYPE_CODE,
    name: "Orden de Compra",
    isEnabled: true,
  });
  await upsertDocumentSeries({
    documentTypeId: poDocType.id,
    seriesCode: ` PO-S-${uuid.slice(0, 6)}`,
    prefix: "OC-",
    startNumber: 1,
    endNumber: 99999,
    isActive: true,
    isDefault: true,
    validFrom: new DateTime("2020-01-01"),
    validTo: new DateTime("2030-01-01"),
  });

  // 2. GR
  const grDocType = await upsertBusinessDocType({
    code: GOODS_RECEIPT_DOCUMENT_TYPE_CODE,
    name: "Recepción Mercancía",
    isEnabled: true,
  });
  await upsertDocumentSeries({
    documentTypeId: grDocType.id,
    seriesCode: `GR-S-${uuid.slice(0, 6)}`,
    prefix: "GR-",
    startNumber: 1,
    endNumber: 99999,
    isActive: true,
    isDefault: true,
    validFrom: new DateTime("2020-01-01"),
    validTo: new DateTime("2030-01-01"),
  });

  // 3. Inventory Movement (required for post)
  const invDocType = await upsertBusinessDocType({
    code: `INV-${uuid.slice(0, 6)}`,
    name: "Entrada Inv",
    isEnabled: true,
  });
  await upsertDocumentSeries({
    documentTypeId: invDocType.id,
    seriesCode: `INV-S-${uuid.slice(0, 6)}`,
    prefix: "INV-",
    startNumber: 1,
    endNumber: 99999,
    isActive: true,
    isDefault: true,
    validFrom: new DateTime("2020-01-01"),
    validTo: new DateTime("2030-01-01"),
  });
  await upsertMovementType({
    name: "Entrada Compra",
    factor: 1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: invDocType.id,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");
  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("GoodsReceiptService", () => {
  it("crea un borrador de recepción desde una OC aprobada", async () => {
    const { createPurchaseOrder, updatePurchaseOrderStatus } = await import(
      "./purchase_order"
    );
    const { createGoodsReceipt } = await import("./goods_receipt");

    // 1. Crear OC
    let po = await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 10, unitPrice: "100.00" }],
    });
    // Aprobar
    po = await updatePurchaseOrderStatus(po.id, "approved");

    // 2. Crear GR borrador con recepción PARCIAL
    const gr = await createGoodsReceipt({
      supplierId,
      purchaseOrderId: po.id,
      receivedByUserId: employeeId,
      items: [{ itemId, quantity: 4, locationId }],
    });

    expect(gr.id).toBeDefined();
    expect(gr.status).toBe("draft");
    expect(gr.purchaseOrderId).toBe(po.id);
    expect(gr.items[0].quantity).toBe(4);
    expect(gr.items[0].unitCost.toNumber()).toBe(100); // Heredado de OC
  });

  it("bloquea recepción si excede la cantidad ordenada (R3 - Overage)", async () => {
    const { createPurchaseOrder, updatePurchaseOrderStatus } = await import(
      "./purchase_order"
    );
    const { createGoodsReceipt } = await import("./goods_receipt");

    let po = await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 10, unitPrice: "100.00" }],
    });
    po = await updatePurchaseOrderStatus(po.id, "approved");

    // Intentar recibir 11
    await expect(
      createGoodsReceipt({
        supplierId,
        purchaseOrderId: po.id,
        receivedByUserId: employeeId,
        items: [{ itemId, quantity: 11, locationId }],
      })
    ).rejects.toThrow(/Exceso de recepción/);
  });

  it("postea recepción, crea movimiento y CIERRA OC si está completo (R4, R5)", async () => {
    const {
      createPurchaseOrder,
      updatePurchaseOrderStatus,
      getPurchaseOrderById,
    } = await import("./purchase_order");
    const { createGoodsReceipt, postGoodsReceipt } = await import(
      "./goods_receipt"
    );

    // 1. Crear OC con cantidad 10
    let po = await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 10, unitPrice: "100.00" }],
    });
    po = await updatePurchaseOrderStatus(po.id, "approved");

    // 2. Crear GR por cantidad completa 10
    const grDraft = await createGoodsReceipt({
      supplierId,
      purchaseOrderId: po.id,
      receivedByUserId: employeeId,
      items: [{ itemId, quantity: 10, locationId }],
    });

    // 3. Postear
    const result = await postGoodsReceipt(grDraft.id);

    expect(result.inventoryMovementId).toBeDefined();
    expect(result.isPurchaseOrderClosed).toBe(true);

    // 4. Verificar estado OC
    const updatedPo = await getPurchaseOrderById(po.id);
    expect(updatedPo?.status).toBe("received");
  });

  it("postea recepción parcial y mantiene OC abierta", async () => {
    const {
      createPurchaseOrder,
      updatePurchaseOrderStatus,
      getPurchaseOrderById,
    } = await import("./purchase_order");
    const { createGoodsReceipt, postGoodsReceipt } = await import(
      "./goods_receipt"
    );

    let po = await createPurchaseOrder({
      supplierId,
      items: [{ itemId, quantity: 10, unitPrice: "100.00" }],
    });
    po = await updatePurchaseOrderStatus(po.id, "approved");

    // 1. Recibir 6
    const gr1 = await createGoodsReceipt({
      supplierId,
      purchaseOrderId: po.id,
      receivedByUserId: employeeId,
      items: [{ itemId, quantity: 6, locationId }],
    });
    const res1 = await postGoodsReceipt(gr1.id);

    expect(res1.isPurchaseOrderClosed).toBe(false); // Aún faltan 4

    // Verificar OC sigue approved
    let updatedPo = await getPurchaseOrderById(po.id);
    expect(updatedPo?.status).toBe("approved");

    // 2. Intentar recibir 5 ahora (6+5=11 > 10) -> Overage Check
    // OJO: createGoodsReceipt mira lo "posted". Como ya posteamos 6, quedan 4.
    await expect(
      createGoodsReceipt({
        supplierId,
        purchaseOrderId: po.id,
        receivedByUserId: employeeId,
        items: [{ itemId, quantity: 5, locationId }],
      })
    ).rejects.toThrow(/Exceso de recepción/);

    // 3. Recibir los 4 restantes
    const gr2 = await createGoodsReceipt({
      supplierId,
      purchaseOrderId: po.id,
      receivedByUserId: employeeId,
      items: [{ itemId, quantity: 4, locationId }],
    });
    const res2 = await postGoodsReceipt(gr2.id);

    expect(res2.isPurchaseOrderClosed).toBe(true);
    updatedPo = await getPurchaseOrderById(po.id);
    expect(updatedPo?.status).toBe("received");
  });
});
