import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests para el servicio de ítems de inventario.
 * Este archivo prueba la re-exportación desde svc/catalogs/item
 * usando la nueva estructura con inferencia de tipo (good/service).
 */

// IDs de setup
let categoryId: number;
let subcategoryId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_inv_item_${uuid}`],
    env: "vitest",
    skipSeeds: true,
  });

  // Crear unidades de medida requeridas para goods
  const { db } = await import("#lib/db");
  const unitOfMeasure = await import("#models/inventory/unit_of_measure");
  await db.insert(unitOfMeasure.default).values([
    { id: 1, code: "UN", fullName: "Unidad", isEnabled: true },
    { id: 2, code: "KG", fullName: "Kilogramo", isEnabled: true },
  ]);

  // Crear categoría con subcategoría para los tests
  const { upsertCategory, upsertSubcategory } = await import(
    "#svc/catalogs/category"
  );
  const [cat] = await upsertCategory({
    fullName: "Inventario Test Category",
    isEnabled: true,
  });
  categoryId = cat.id;

  const [subcat] = await upsertSubcategory({
    fullName: "Inventario Test Subcategory",
    categoryId: cat.id,
    isEnabled: true,
  });
  subcategoryId = subcat.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("inventory item service (re-export from catalogs)", () => {
  describe("getItemById", () => {
    it("should return a good item by id", async () => {
      const { getItemById, upsertItem } = await import("./item");

      const created = await upsertItem({
        code: "INV-GOOD-001",
        fullName: "Producto Inventario",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        categoryId,
        subcategoryId,
        images: [],
        good: {
          uomId: 1,
          minStock: new Decimal("10"),
        },
      });

      const result = await getItemById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.code).toBe("INV-GOOD-001");
      expect(result?.type).toBe("good");
    });

    it("should return a service item by id", async () => {
      const { getItemById, upsertItem } = await import("./item");

      const created = await upsertItem({
        code: "INV-SVC-001",
        fullName: "Servicio Inventario",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        images: [],
        service: {
          durationMinutes: 60,
          isRecurring: false,
        },
      });

      const result = await getItemById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.type).toBe("service");
    });

    it("should return undefined for non existent ids", async () => {
      const { getItemById } = await import("./item");

      const result = await getItemById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("getItemByCode", () => {
    it("should return an item by code", async () => {
      const { getItemByCode, upsertItem } = await import("./item");

      await upsertItem({
        code: "INV-UNIQUE-CODE",
        fullName: "Item por Código",
        basePrice: new Decimal("75.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
        },
      });

      const result = await getItemByCode("INV-UNIQUE-CODE");

      expect(result).toBeDefined();
      expect(result?.code).toBe("INV-UNIQUE-CODE");
    });

    it("should return undefined for non existent code", async () => {
      const { getItemByCode } = await import("./item");

      const result = await getItemByCode("NON-EXISTENT-CODE-XYZ");

      expect(result).toBeUndefined();
    });
  });

  describe("listItems", () => {
    it("should return items with pagination", async () => {
      const { listItems, upsertItem } = await import("./item");

      await upsertItem({
        code: "INV-LIST-001",
        fullName: "Item Lista 1",
        basePrice: new Decimal("29.99"),
        isEnabled: true,
        categoryId,
        images: [],
        good: { uomId: 1 },
      });

      await upsertItem({
        code: "INV-LIST-002",
        fullName: "Item Lista 2",
        basePrice: new Decimal("49.99"),
        isEnabled: true,
        categoryId,
        images: [],
        good: { uomId: 1 },
      });

      const result = await listItems({ pageSize: 10 });

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by fullName", async () => {
      const { listItems, upsertItem } = await import("./item");

      await upsertItem({
        code: "INV-FILTER-NAME-001",
        fullName: "Producto Especial Búsqueda",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: { uomId: 1 },
      });

      const result = await listItems({ fullName: "Especial" });

      expect(result.items.some((p) => p.fullName.includes("Especial"))).toBe(
        true
      );
    });

    it("should filter by code", async () => {
      const { listItems, upsertItem } = await import("./item");

      await upsertItem({
        code: "INV-FILTER-CODE-XYZ",
        fullName: "Filter Code Test",
        basePrice: new Decimal("10.00"),
        isEnabled: true,
        images: [],
        good: { uomId: 1 },
      });

      const result = await listItems({ code: "FILTER-CODE" });

      expect(result.items.some((p) => p.code.includes("FILTER-CODE"))).toBe(
        true
      );
    });

    it("should filter by isEnabled", async () => {
      const { listItems, upsertItem } = await import("./item");

      await upsertItem({
        code: "INV-DISABLED-001",
        fullName: "Item Deshabilitado",
        basePrice: new Decimal("10.00"),
        isEnabled: false,
        images: [],
        good: { uomId: 1 },
      });

      const result = await listItems({ isEnabled: false });

      expect(result.items.some((p) => !p.isEnabled)).toBe(true);
    });

    it("should filter by type", async () => {
      const { listItems } = await import("./item");

      const goods = await listItems({ type: "good" });
      const services = await listItems({ type: "service" });

      expect(goods.items.every((p) => p.type === "good")).toBe(true);
      expect(services.items.every((p) => p.type === "service")).toBe(true);
    });

    it("should include totalCount when requested", async () => {
      const { listItems } = await import("./item");

      const result = await listItems({ includeTotalCount: true });

      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe("number");
    });

    it("should not include totalCount by default", async () => {
      const { listItems } = await import("./item");

      const result = await listItems({});

      expect(result.totalCount).toBeUndefined();
    });

    it("should return items with category name", async () => {
      const { listItems, upsertItem } = await import("./item");

      await upsertItem({
        code: "INV-CAT-NAME-001",
        fullName: "Item con Categoría",
        basePrice: new Decimal("10.00"),
        isEnabled: true,
        categoryId,
        images: [],
        good: { uomId: 1 },
      });

      const result = await listItems({ code: "INV-CAT-NAME" });

      expect(result.items[0]).toHaveProperty("category");
      expect(result.items[0].category).toBe("Inventario Test Category");
    });
  });

  describe("upsertItem - Create", () => {
    it("should create a good item when id is missing", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const created = await upsertItem({
        code: "INV-CREATE-GOOD-001",
        fullName: "Nuevo Bien Físico",
        slogan: "El mejor producto",
        description: "Descripción del producto",
        basePrice: new Decimal("199.99"),
        isEnabled: true,
        rating: 5,
        categoryId,
        subcategoryId,
        images: [],
        good: {
          uomId: 1,
          minStock: new Decimal("5"),
          maxStock: new Decimal("50"),
          reorderPoint: new Decimal("10"),
        },
      });

      expect(created).toHaveProperty("id");
      expect(created.code).toBe("INV-CREATE-GOOD-001");
      expect(created).toHaveProperty("good");
      expect(created.good?.uomId).toBe(1);

      const fromDb = await getItemById(created.id);
      expect(fromDb?.type).toBe("good");
    });

    it("should create a service item when id is missing", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const created = await upsertItem({
        code: "INV-CREATE-SVC-001",
        fullName: "Nuevo Servicio",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        service: {
          durationMinutes: 90,
          isRecurring: true,
        },
      });

      expect(created).toHaveProperty("id");
      expect(created.code).toBe("INV-CREATE-SVC-001");
      expect(created).toHaveProperty("service");
      expect(created.service?.durationMinutes).toBe(90);
      expect(created.service?.isRecurring).toBe(true);

      const fromDb = await getItemById(created.id);
      expect(fromDb?.type).toBe("service");
    });
  });

  describe("upsertItem - Update", () => {
    it("should update an existing good item", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const created = await upsertItem({
        code: "INV-UPDATE-001",
        fullName: "Original",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
          minStock: new Decimal("10"),
        },
      });

      const updated = await upsertItem({
        id: created.id,
        code: "INV-UPDATE-001",
        fullName: "Actualizado",
        basePrice: new Decimal("150.00"),
        isEnabled: false,
        images: [],
        good: {
          uomId: 2,
          minStock: new Decimal("20"),
          maxStock: new Decimal("200"),
        },
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Actualizado");
      expect(updated.isEnabled).toBe(false);
      expect(updated.good?.uomId).toBe(2);

      const fromDb = await getItemById(created.id);
      expect(fromDb?.fullName).toBe("Actualizado");
    });

    it("should update an existing service item", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const created = await upsertItem({
        code: "INV-UPDATE-SVC-001",
        fullName: "Servicio Original",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        images: [],
        service: {
          durationMinutes: 30,
          isRecurring: false,
        },
      });

      const updated = await upsertItem({
        id: created.id,
        code: "INV-UPDATE-SVC-001",
        fullName: "Servicio Actualizado",
        basePrice: new Decimal("75.00"),
        isEnabled: true,
        images: [],
        service: {
          durationMinutes: 60,
          isRecurring: true,
        },
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Servicio Actualizado");
      expect(updated.service?.durationMinutes).toBe(60);
      expect(updated.service?.isRecurring).toBe(true);

      const fromDb = await getItemById(created.id);
      expect(fromDb?.fullName).toBe("Servicio Actualizado");
    });
  });

  describe("upsertItem - Validation", () => {
    it("should throw error when neither good nor service is provided", async () => {
      const { upsertItem } = await import("./item");

      await expect(
        upsertItem({
          code: "INV-INVALID-001",
          fullName: "Item Inválido",
          basePrice: new Decimal("100.00"),
          isEnabled: true,
          images: [],
        } as any)
      ).rejects.toThrow(
        "Item must be either a good or a service. Please provide either 'good' or 'service' data."
      );
    });

    it("should throw error when both good and service are provided", async () => {
      const { upsertItem } = await import("./item");

      await expect(
        upsertItem({
          code: "INV-INVALID-002",
          fullName: "Item Mixto",
          basePrice: new Decimal("100.00"),
          isEnabled: true,
          images: [],
          good: { uomId: 1 },
          service: { isRecurring: false },
        } as any)
      ).rejects.toThrow(
        "Item cannot be both a good and a service. Provide only 'good' or 'service', not both."
      );
    });
  });

  describe("item type extensions", () => {
    it("should persist good data in inventory_item table", async () => {
      const { upsertItem } = await import("./item");
      const { db } = await import("#lib/db");
      const { inventoryItem } = await import("#models/inventory/item");
      const { eq } = await import("drizzle-orm");

      const created = await upsertItem({
        code: "INV-GOOD-EXT-001",
        fullName: "Good con Extension",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
          minStock: new Decimal("10"),
          maxStock: new Decimal("100"),
          reorderPoint: new Decimal("20"),
        },
      });

      // Verificar que se creó el registro en inventory_item
      const [goodRecord] = await db
        .select()
        .from(inventoryItem)
        .where(eq(inventoryItem.itemId, created.id));

      expect(goodRecord).toBeDefined();
      expect(goodRecord.uomId).toBe(1);
      expect(Number(goodRecord.minStock)).toBe(10);
      expect(Number(goodRecord.maxStock)).toBe(100);
    });

    it("should persist service data in catalogs_service table", async () => {
      const { upsertItem } = await import("./item");
      const { db } = await import("#lib/db");
      const { service } = await import("#models/catalogs/service");
      const { eq } = await import("drizzle-orm");

      const created = await upsertItem({
        code: "INV-SVC-EXT-001",
        fullName: "Service con Extension",
        basePrice: new Decimal("200.00"),
        isEnabled: true,
        images: [],
        service: {
          durationMinutes: 60,
          isRecurring: true,
        },
      });

      // Verificar que se creó el registro en catalogs_service
      const [serviceRecord] = await db
        .select()
        .from(service)
        .where(eq(service.itemId, created.id));

      expect(serviceRecord).toBeDefined();
      expect(serviceRecord.durationMinutes).toBe(60);
      expect(serviceRecord.isRecurring).toBe(true);
    });
  });
});
