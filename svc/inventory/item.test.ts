import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests para el servicio de ítems de inventario.
 * Cubre CRUD de ítems, filtros, paginación y manejo de extensiones (stock/service).
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_item_${uuid}`,
    dev: false,
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("item service", () => {
  // Helper para crear una categoría de prueba
  async function createTestCategory(
    categoryName: string,
    subcategoryName: string
  ) {
    const { upsertCategory } = await import("./category");
    return upsertCategory({
      fullName: categoryName,
      isEnabled: true,
      subcategories: [{ fullName: subcategoryName, isEnabled: true }],
    });
  }

  describe("getItemById", () => {
    it("should return an item by id", async () => {
      const { getItemById, upsertItem } = await import("./item");

      const category = await createTestCategory(
        "Test Category",
        "Test Subcategory"
      );

      const created = await upsertItem({
        code: "LAPTOP-001",
        fullName: "Laptop Gaming",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("999.99"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        slogan: "Best Laptop",
        images: [],
      });

      const result = await getItemById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.fullName).toBe("Laptop Gaming");
      expect(result?.code).toBe("LAPTOP-001");
      expect(result?.isEnabled).toBe(true);
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

      const category = await createTestCategory(
        "Code Test Category",
        "Code Test Subcategory"
      );

      await upsertItem({
        code: "UNIQUE-CODE-001",
        fullName: "Item by Code",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("50.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const result = await getItemByCode("UNIQUE-CODE-001");

      expect(result).toBeDefined();
      expect(result?.code).toBe("UNIQUE-CODE-001");
      expect(result?.fullName).toBe("Item by Code");
    });

    it("should return undefined for non existent code", async () => {
      const { getItemByCode } = await import("./item");

      const result = await getItemByCode("NON-EXISTENT-CODE");

      expect(result).toBeUndefined();
    });
  });

  describe("listItems", () => {
    it("should return items with pagination", async () => {
      const { listItems, upsertItem } = await import("./item");

      const category = await createTestCategory(
        "Electronics",
        "Electronics Subcategory"
      );

      await upsertItem({
        code: "MOUSE-001",
        fullName: "Mouse Gamer",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("29.99"),
        slogan: "Best Mouse",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
      });

      await upsertItem({
        code: "KEYBOARD-001",
        fullName: "Keyboard Mechanical",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("49.99"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        slogan: "Best Keyboard",
        images: [],
      });

      const result = await listItems({ pageSize: 10 });

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by fullName", async () => {
      const { listItems } = await import("./item");

      const result = await listItems({ fullName: "Mouse" });

      expect(result.items.every((p) => p.fullName.includes("Mouse"))).toBe(
        true
      );
    });

    it("should filter by code", async () => {
      const { listItems, upsertItem } = await import("./item");

      const category = await createTestCategory(
        "Code Filter Category",
        "Code Filter Subcategory"
      );

      await upsertItem({
        code: "FILTER-TEST-001",
        fullName: "Filter Test Item",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("10.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const result = await listItems({ code: "FILTER-TEST" });

      expect(result.items.every((p) => p.code.includes("FILTER-TEST"))).toBe(
        true
      );
    });

    it("should filter by isEnabled", async () => {
      const { listItems, upsertItem } = await import("./item");

      const category = await createTestCategory(
        "Disabled Category",
        "Disabled Subcategory"
      );

      await upsertItem({
        code: "DISABLED-001",
        fullName: "Disabled Item",
        itemType: "good",
        isEnabled: false,
        basePrice: new Decimal("10.00"),
        slogan: "Disabled Item",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const result = await listItems({ isEnabled: false });

      expect(result.items.some((p) => !p.isEnabled)).toBe(true);
    });

    it("should filter by itemType", async () => {
      const { listItems, upsertItem } = await import("./item");

      const category = await createTestCategory(
        "Service Category",
        "Service Subcategory"
      );

      await upsertItem({
        code: "SERVICE-001",
        fullName: "Consulting Service",
        itemType: "service",
        isEnabled: true,
        basePrice: new Decimal("100.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
      });

      const result = await listItems({ itemType: "service" });

      expect(result.items.every((p) => p.itemType === "service")).toBe(true);
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

      const category = await createTestCategory(
        "Cat Name Test",
        "Cat Name Sub"
      );

      await upsertItem({
        code: "CAT-NAME-TEST",
        fullName: "Cat Name Test Item",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("10.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const result = await listItems({ code: "CAT-NAME-TEST" });

      expect(result.items[0]).toHaveProperty("category");
      expect(result.items[0].category).toBe("Cat Name Test");
    });
  });

  describe("upsertItem", () => {
    it("should create an item when id is missing", async () => {
      const { upsertItem } = await import("./item");

      const category = await createTestCategory("New Items", "New Subcategory");

      const created = await upsertItem({
        code: "NEW-ITEM-001",
        fullName: "New Item",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("199.99"),
        slogan: "New Item",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
      });

      expect(created).toHaveProperty("id");
      expect(created.fullName).toBe("New Item");
      expect(created.code).toBe("NEW-ITEM-001");
      expect(created.isEnabled).toBe(true);
    });

    it("should update an existing item when id is provided", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const category = await createTestCategory(
        "Update Category",
        "Update Subcategory"
      );

      const created = await upsertItem({
        code: "UPDATE-TEST-001",
        fullName: "Original",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("100.00"),
        slogan: "Original",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const updated = await upsertItem({
        id: created.id,
        code: "UPDATE-TEST-001",
        fullName: "Updated",
        itemType: "good",
        isEnabled: false,
        basePrice: new Decimal("150.00"),
        slogan: "Updated",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        images: [],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Updated");
      expect(updated.isEnabled).toBe(false);

      const fromDb = await getItemById(created.id);
      expect(fromDb?.fullName).toBe("Updated");
    });

    it("should create item with string images", async () => {
      const { upsertItem } = await import("./item");

      const category = await createTestCategory(
        "Images Category",
        "Images Subcategory"
      );

      const created = await upsertItem({
        code: "IMAGES-TEST-001",
        fullName: "Item with Images",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("299.99"),
        slogan: "Item with Images",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      });

      expect(created.images).toBeInstanceOf(Array);
      expect((created.images as string[]).length).toBe(2);
    });

    it("should create item with different types", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const category = await createTestCategory(
        "Types Category",
        "Types Subcategory"
      );

      // Crear item tipo 'service'
      const service = await upsertItem({
        code: "SERVICE-TYPE-001",
        fullName: "Consulting Service",
        itemType: "service",
        isEnabled: true,
        basePrice: new Decimal("500.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
      });

      expect(service.itemType).toBe("service");

      // Crear item tipo 'bundle'
      const bundle = await upsertItem({
        code: "BUNDLE-001",
        fullName: "Starter Kit",
        itemType: "bundle",
        isEnabled: true,
        basePrice: new Decimal("199.99"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        images: [],
      });

      expect(bundle.itemType).toBe("bundle");

      // Crear item tipo 'charge'
      const charge = await upsertItem({
        code: "CHARGE-001",
        fullName: "Shipping Fee",
        itemType: "charge",
        isEnabled: true,
        basePrice: new Decimal("10.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 0,
        images: [],
      });

      expect(charge.itemType).toBe("charge");
    });
  });

  describe("item type extensions", () => {
    it("should handle stockData for goods", async () => {
      const { upsertItem } = await import("./item");
      const { db } = await import("#lib/db");
      const { inventoryItemStock } = await import(
        "#models/inventory/item_stock"
      );
      const { eq } = await import("drizzle-orm");

      const category = await createTestCategory(
        "Stock Category",
        "Stock Subcategory"
      );

      const created = await upsertItem({
        code: "STOCK-TEST-001",
        fullName: "Item with Stock",
        itemType: "good",
        isEnabled: true,
        basePrice: new Decimal("50.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
        stockData: {
          uomId: 1,
          trackStock: true,
          minStock: new Decimal("10"),
          maxStock: new Decimal("100"),
          reorderPoint: new Decimal("20"),
        },
      });

      // Verificar que se creó el registro de stock
      const [stockRecord] = await db
        .select()
        .from(inventoryItemStock)
        .where(eq(inventoryItemStock.itemId, created.id));

      expect(stockRecord).toBeDefined();
      expect(stockRecord.trackStock).toBe(true);
      expect(Number(stockRecord.minStock)).toBe(10);
      expect(Number(stockRecord.maxStock)).toBe(100);
    });

    it("should handle serviceData for services", async () => {
      const { upsertItem } = await import("./item");
      const { db } = await import("#lib/db");
      const { inventoryItemService } = await import(
        "#models/inventory/item_service"
      );
      const { eq } = await import("drizzle-orm");

      const category = await createTestCategory(
        "Service Ext Category",
        "Service Ext Subcategory"
      );

      const created = await upsertItem({
        code: "SERVICE-EXT-001",
        fullName: "Service with Extension",
        itemType: "service",
        isEnabled: true,
        basePrice: new Decimal("200.00"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
        serviceData: {
          durationMinutes: 60,
          isRecurring: true,
        },
      });

      // Verificar que se creó el registro de servicio
      const [serviceRecord] = await db
        .select()
        .from(inventoryItemService)
        .where(eq(inventoryItemService.itemId, created.id));

      expect(serviceRecord).toBeDefined();
      expect(serviceRecord.durationMinutes).toBe(60);
      expect(serviceRecord.isRecurring).toBe(true);
    });
  });
});
