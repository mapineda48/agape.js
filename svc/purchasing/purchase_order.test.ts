import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let supplierId: number;
let inactiveSupplierId: number;
let productId: number;
let inactiveProductId: number;

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
  const { upsertCategory } = await import("#svc/inventory/category");
  const { upsertProduct } = await import("#svc/inventory/product");

  const [documentType] = await upsertDocumentType({
    name: `CC-${uuid.slice(0, 6)}`,
    code: `DOC-${uuid.slice(0, 6)}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: true,
  });

  const [supplierType] = await upsertSupplierType({ name: "Proveedor" });

  const activeSupplier = await upsertSupplier({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `SUP-${uuid.slice(0, 6)}`,
      email: "supplier-active@example.com",
      person: { firstName: "Proveedor", lastName: "Activo" },
    },
    supplierTypeId: supplierType.id,
    active: true,
  });

  const inactiveSupplier = await upsertSupplier({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `SUP-${uuid.slice(6, 12)}`,
      email: "supplier-inactive@example.com",
      person: { firstName: "Proveedor", lastName: "Inactivo" },
    },
    supplierTypeId: supplierType.id,
    active: false,
  });

  const category = await upsertCategory({
    fullName: "Compras",
    isEnabled: true,
    subcategories: [{ fullName: "Insumos", isEnabled: true }],
  });

  const subcategoryId = category.subcategories[0].id ?? 0;

  const activeProduct = await upsertProduct({
    fullName: "Producto Compra",
    slogan: "Producto para ordenes",
    isActive: true,
    price: new Decimal("50.00"),
    categoryId: category.id,
    subcategoryId,
    rating: 5,
    images: [],
  });

  const disabledProduct = await upsertProduct({
    fullName: "Producto Inactivo",
    slogan: "No debe usarse",
    isActive: false,
    price: new Decimal("75.00"),
    categoryId: category.id,
    subcategoryId,
    rating: 3,
    images: [],
  });

  supplierId = activeSupplier.id;
  inactiveSupplierId = inactiveSupplier.id;
  productId = activeProduct.id;
  inactiveProductId = disabledProduct.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("createPurchaseOrder service", () => {
  it("crea una orden de compra con estado pendiente por defecto", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    const order = await createPurchaseOrder({
      supplierId,
      orderDate: new DateTime("2024-01-15"),
      items: [
        { productId, quantity: 2, unitPrice: new Decimal("50.00") },
        { productId, quantity: 1, unitPrice: new Decimal("50.00") },
      ],
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe("pending");
    expect(order.items).toHaveLength(2);
    expect(order.items.every((item) => item.purchaseOrderId === order.id)).toBe(
      true
    );
  });

  it("permite definir un estado válido distinto al predeterminado", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    const order = await createPurchaseOrder({
      supplierId,
      status: "approved",
      items: [{ productId, quantity: 3, unitPrice: "99.99" }],
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
        items: [{ productId, quantity: 1, unitPrice: "10.00" }],
      })
    ).rejects.toThrow("Estado de la orden de compra inválido");
  });

  it("rechaza proveedores inactivos o inexistentes", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    await expect(
      createPurchaseOrder({
        supplierId: inactiveSupplierId,
        items: [{ productId, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow("El proveedor está inactivo");

    await expect(
      createPurchaseOrder({
        supplierId: 999999,
        items: [{ productId, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow("El proveedor no existe");
  });

  it("valida productos requeridos y activos", async () => {
    const { createPurchaseOrder } = await import("./purchase_order");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [{ productId: 999999, quantity: 1, unitPrice: "25.00" }],
      })
    ).rejects.toThrow("Uno o más productos no existen");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [
          { productId: inactiveProductId, quantity: 1, unitPrice: "25.00" },
        ],
      })
    ).rejects.toThrow(`El producto ${inactiveProductId} está inactivo`);
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
        items: [{ productId, quantity: 0, unitPrice: "10.00" }],
      })
    ).rejects.toThrow("La cantidad de cada ítem debe ser mayor a cero");

    await expect(
      createPurchaseOrder({
        supplierId,
        items: [{ productId, quantity: 1, unitPrice: "0" }],
      })
    ).rejects.toThrow("El precio unitario de cada ítem debe ser mayor a cero");
  });
});
