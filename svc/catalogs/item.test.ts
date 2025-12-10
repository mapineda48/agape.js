import { afterAll, describe, it, expect, beforeAll } from "vitest";
import Decimal from "#utils/data/Decimal";

/**
 * Tests para el servicio de ítems del catálogo.
 * Cubre creación, actualización, validaciones de tipo, y el patrón de herencia.
 */

// IDs de setup que se inicializan en beforeAll
let categoryId: number;
let subcategoryId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_catalogs_item_${uuid}`,
    dev: false,
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
  const { upsertCategory } = await import("#svc/inventory/category");
  const cat = await upsertCategory({
    fullName: "Categoría Test",
    isEnabled: true,
    subcategories: [{ fullName: "Subcategoría Test", isEnabled: true }],
  });
  categoryId = cat.id;
  subcategoryId = cat.subcategories[0]?.id ?? 0;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("catalogs item service", () => {
  describe("getItemById", () => {
    it("should return a good item by id", async () => {
      const { getItemById, upsertItem } = await import("./item");

      const created = await upsertItem({
        code: "GOOD-001",
        fullName: "Producto Test",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        categoryId,
        subcategoryId,
        images: [],
        good: {
          uomId: 1,
          minStock: new Decimal("10"),
          maxStock: new Decimal("100"),
          reorderPoint: new Decimal("20"),
        },
      });

      const result = await getItemById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.code).toBe("GOOD-001");
      expect(result?.type).toBe("good");
    });

    it("should return a service item by id", async () => {
      const { getItemById, upsertItem } = await import("./item");

      const created = await upsertItem({
        code: "SVC-001",
        fullName: "Servicio Test",
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
      expect(result?.code).toBe("SVC-001");
      expect(result?.type).toBe("service");
    });

    it("should return undefined when item does not exist", async () => {
      const { getItemById } = await import("./item");

      const result = await getItemById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("getItemByCode", () => {
    it("should return item by code", async () => {
      const { getItemByCode, upsertItem } = await import("./item");

      await upsertItem({
        code: "CODE-TEST-001",
        fullName: "Producto por Código",
        basePrice: new Decimal("75.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
        },
      });

      const result = await getItemByCode("CODE-TEST-001");

      expect(result).toBeDefined();
      expect(result?.code).toBe("CODE-TEST-001");
    });

    it("should return undefined when code does not exist", async () => {
      const { getItemByCode } = await import("./item");

      const result = await getItemByCode("NONEXISTENT-CODE");

      expect(result).toBeUndefined();
    });
  });

  describe("upsertItem - Create Good", () => {
    it("should create a new good item", async () => {
      const { upsertItem } = await import("./item");

      const result = await upsertItem({
        code: "GOOD-CREATE-001",
        fullName: "Nuevo Bien Físico",
        slogan: "El mejor producto",
        description: "Descripción del producto",
        basePrice: new Decimal("150.00"),
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

      expect(result).toHaveProperty("id");
      expect(result.code).toBe("GOOD-CREATE-001");
      expect(result.fullName).toBe("Nuevo Bien Físico");
      expect(result.isEnabled).toBe(true);
      expect(result).toHaveProperty("good");
      expect(result.good?.uomId).toBe(1);
      expect(Number(result.good?.minStock)).toBe(5);
    });

    it("should infer type as 'good' when good property is present", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const result = await upsertItem({
        code: "GOOD-INFER-001",
        fullName: "Inferencia Good",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
        },
      });

      const fromDb = await getItemById(result.id);
      expect(fromDb?.type).toBe("good");
    });

    it("should create good item with optional fields omitted", async () => {
      const { upsertItem } = await import("./item");

      const result = await upsertItem({
        code: "GOOD-MINIMAL-001",
        fullName: "Bien Mínimo",
        basePrice: new Decimal("10.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
        },
      });

      expect(result.slogan).toBeNull();
      expect(result.description).toBeNull();
      expect(result.categoryId).toBeNull();
      expect(result.good?.minStock).toBeNull();
      expect(result.good?.maxStock).toBeNull();
    });
  });

  describe("upsertItem - Create Service", () => {
    it("should create a new service item", async () => {
      const { upsertItem } = await import("./item");

      const result = await upsertItem({
        code: "SVC-CREATE-001",
        fullName: "Nuevo Servicio",
        slogan: "El mejor servicio",
        description: "Descripción del servicio",
        basePrice: new Decimal("200.00"),
        isEnabled: true,
        rating: 4,
        categoryId,
        images: [],
        service: {
          durationMinutes: 120,
          isRecurring: true,
        },
      });

      expect(result).toHaveProperty("id");
      expect(result.code).toBe("SVC-CREATE-001");
      expect(result.fullName).toBe("Nuevo Servicio");
      expect(result).toHaveProperty("service");
      expect(result.service?.durationMinutes).toBe(120);
      expect(result.service?.isRecurring).toBe(true);
    });

    it("should infer type as 'service' when service property is present", async () => {
      const { upsertItem, getItemById } = await import("./item");

      const result = await upsertItem({
        code: "SVC-INFER-001",
        fullName: "Inferencia Service",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        images: [],
        service: {
          isRecurring: false,
        },
      });

      const fromDb = await getItemById(result.id);
      expect(fromDb?.type).toBe("service");
    });

    it("should create service item with default values", async () => {
      const { upsertItem } = await import("./item");

      const result = await upsertItem({
        code: "SVC-MINIMAL-001",
        fullName: "Servicio Mínimo",
        basePrice: new Decimal("25.00"),
        isEnabled: true,
        images: [],
        service: {},
      });

      expect(result.service?.durationMinutes).toBeNull();
      expect(result.service?.isRecurring).toBe(false);
    });
  });

  describe("upsertItem - Update", () => {
    it("should update an existing good item", async () => {
      const { upsertItem, getItemById } = await import("./item");

      // Crear
      const created = await upsertItem({
        code: "GOOD-UPDATE-001",
        fullName: "Bien Original",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
          minStock: new Decimal("10"),
        },
      });

      // Actualizar
      const updated = await upsertItem({
        id: created.id,
        code: "GOOD-UPDATE-001",
        fullName: "Bien Actualizado",
        basePrice: new Decimal("150.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 2,
          minStock: new Decimal("20"),
          maxStock: new Decimal("200"),
        },
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Bien Actualizado");
      expect(Number(updated.basePrice)).toBeCloseTo(150, 2);
      expect(updated.good?.uomId).toBe(2);
      expect(Number(updated.good?.minStock)).toBe(20);

      // Verificar en DB
      const fromDb = await getItemById(created.id);
      expect(fromDb?.fullName).toBe("Bien Actualizado");
    });

    it("should update an existing service item", async () => {
      const { upsertItem, getItemById } = await import("./item");

      // Crear
      const created = await upsertItem({
        code: "SVC-UPDATE-001",
        fullName: "Servicio Original",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        images: [],
        service: {
          durationMinutes: 30,
          isRecurring: false,
        },
      });

      // Actualizar
      const updated = await upsertItem({
        id: created.id,
        code: "SVC-UPDATE-001",
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

      // Verificar en DB
      const fromDb = await getItemById(created.id);
      expect(fromDb?.fullName).toBe("Servicio Actualizado");
    });

    it("should update item status to disabled", async () => {
      const { upsertItem, getItemById } = await import("./item");

      // Crear
      const created = await upsertItem({
        code: "ITEM-DISABLE-001",
        fullName: "Item a Deshabilitar",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
        },
      });

      expect(created.isEnabled).toBe(true);

      // Deshabilitar
      const updated = await upsertItem({
        id: created.id,
        code: "ITEM-DISABLE-001",
        fullName: "Item a Deshabilitar",
        basePrice: new Decimal("100.00"),
        isEnabled: false,
        images: [],
        good: {
          uomId: 1,
        },
      });

      expect(updated.isEnabled).toBe(false);

      const fromDb = await getItemById(created.id);
      expect(fromDb?.isEnabled).toBe(false);
    });
  });

  describe("upsertItem - Validation", () => {
    it("should throw error when neither good nor service is provided", async () => {
      const { upsertItem } = await import("./item");

      await expect(
        upsertItem({
          code: "INVALID-001",
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
          code: "INVALID-002",
          fullName: "Item Mixto",
          basePrice: new Decimal("100.00"),
          isEnabled: true,
          images: [],
          good: {
            uomId: 1,
          },
          service: {
            isRecurring: false,
          },
        } as any)
      ).rejects.toThrow(
        "Item cannot be both a good and a service. Provide only 'good' or 'service', not both."
      );
    });

    it("should not allow null values for entity properties when creating", async () => {
      const { upsertItem } = await import("./item");

      // Intentar con good: null
      await expect(
        upsertItem({
          code: "NULL-GOOD-001",
          fullName: "Good Null",
          basePrice: new Decimal("100.00"),
          isEnabled: true,
          images: [],
          good: null,
        } as any)
      ).rejects.toThrow(
        "Item must be either a good or a service. Please provide either 'good' or 'service' data."
      );

      // Intentar con service: null
      await expect(
        upsertItem({
          code: "NULL-SVC-001",
          fullName: "Service Null",
          basePrice: new Decimal("100.00"),
          isEnabled: true,
          images: [],
          service: null,
        } as any)
      ).rejects.toThrow(
        "Item must be either a good or a service. Please provide either 'good' or 'service' data."
      );
    });
  });

  describe("ItemType enum validation", () => {
    it("should only allow valid enum values from ITEM_TYPE_VALUES", async () => {
      const { ITEM_TYPE_VALUES } = await import("#models/catalogs/item");

      expect(ITEM_TYPE_VALUES).toContain("good");
      expect(ITEM_TYPE_VALUES).toContain("service");
      expect(ITEM_TYPE_VALUES).toHaveLength(2);
    });

    it("should store the exact enum value in the database", async () => {
      const { upsertItem, getItemById } = await import("./item");

      // Crear good
      const goodItem = await upsertItem({
        code: "ENUM-GOOD-001",
        fullName: "Enum Good Test",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: {
          uomId: 1,
        },
      });

      // Crear service
      const serviceItem = await upsertItem({
        code: "ENUM-SVC-001",
        fullName: "Enum Service Test",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        images: [],
        service: {
          isRecurring: true,
        },
      });

      // Verificar valores exactos almacenados
      const goodFromDb = await getItemById(goodItem.id);
      const serviceFromDb = await getItemById(serviceItem.id);

      expect(goodFromDb?.type).toBe("good");
      expect(serviceFromDb?.type).toBe("service");
    });
  });

  describe("listItems", () => {
    it("should list items with default pagination", async () => {
      const { listItems } = await import("./item");

      const result = await listItems();

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should filter items by isEnabled", async () => {
      const { listItems, upsertItem } = await import("./item");

      // Crear item habilitado
      await upsertItem({
        code: "LIST-ENABLED-001",
        fullName: "Item Habilitado",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: { uomId: 1 },
      });

      // Crear item deshabilitado
      await upsertItem({
        code: "LIST-DISABLED-001",
        fullName: "Item Deshabilitado",
        basePrice: new Decimal("100.00"),
        isEnabled: false,
        images: [],
        good: { uomId: 1 },
      });

      const enabledItems = await listItems({ isEnabled: true });
      const disabledItems = await listItems({ isEnabled: false });

      expect(enabledItems.items.every((i) => i.isEnabled)).toBe(true);
      expect(disabledItems.items.every((i) => !i.isEnabled)).toBe(true);
    });

    it("should filter items by type", async () => {
      const { listItems } = await import("./item");

      const goods = await listItems({ type: "good" });
      const services = await listItems({ type: "service" });

      expect(goods.items.every((i) => i.type === "good")).toBe(true);
      expect(services.items.every((i) => i.type === "service")).toBe(true);
    });

    it("should include total count when requested", async () => {
      const { listItems } = await import("./item");

      const result = await listItems({ includeTotalCount: true });

      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe("number");
    });

    it("should support pagination", async () => {
      const { listItems } = await import("./item");

      const page0 = await listItems({ pageIndex: 0, pageSize: 5 });
      const page1 = await listItems({ pageIndex: 1, pageSize: 5 });

      expect(page0.items.length).toBeLessThanOrEqual(5);
      expect(page1.items.length).toBeLessThanOrEqual(5);

      // Los IDs de página 0 deben ser diferentes a los de página 1 (si hay suficientes)
      if (page0.items.length > 0 && page1.items.length > 0) {
        const page0Ids = page0.items.map((i) => i.id);
        const page1Ids = page1.items.map((i) => i.id);
        expect(page0Ids).not.toEqual(expect.arrayContaining(page1Ids));
      }
    });

    it("should filter by fullName with ILIKE", async () => {
      const { listItems, upsertItem } = await import("./item");

      await upsertItem({
        code: "SEARCH-NAME-001",
        fullName: "Producto Especial Único",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        images: [],
        good: { uomId: 1 },
      });

      const result = await listItems({ fullName: "Especial" });

      expect(result.items.some((i) => i.fullName.includes("Especial"))).toBe(
        true
      );
    });
  });
});
