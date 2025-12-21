import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_category_${uuid}`,
    dev: false,
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("category service", () => {
  describe("listCategories", () => {
    it("should return only enabled categories when activeOnly is true", async () => {
      const { listCategories, upsertCategory } = await import("./category");

      // Crear categorías de prueba
      await upsertCategory({ fullName: "Categoría Activa", isEnabled: true });
      await upsertCategory({
        fullName: "Categoría Inactiva",
        isEnabled: false,
      });

      const result = await listCategories({ activeOnly: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every((c) => c.isEnabled)).toBe(true);
    });

    it("should return all categories when activeOnly is false", async () => {
      const { listCategories } = await import("./category");

      const result = await listCategories({ activeOnly: false });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((c) => !c.isEnabled)).toBe(true);
    });

    it("should include subcategory counts when requested", async () => {
      const { listCategories, upsertCategory, upsertSubcategory } =
        await import("./category");

      const [cat] = await upsertCategory({
        fullName: "Categoría Con Conteo",
        isEnabled: true,
      });

      await upsertSubcategory({
        fullName: "Subcategoría 1",
        categoryId: cat.id,
        isEnabled: true,
      });
      await upsertSubcategory({
        fullName: "Subcategoría 2",
        categoryId: cat.id,
        isEnabled: false,
      });

      const result = await listCategories({
        activeOnly: false,
        includeSubcategoryCount: true,
      });

      const found = result.find((c) => c.id === cat.id);
      expect(found).toBeDefined();
      expect(found!.activeSubcategoryCount).toBe(1);
      expect(found!.totalSubcategoryCount).toBe(2);
    });
  });

  describe("getCategoryById", () => {
    it("should return a category by id", async () => {
      const { getCategoryById, upsertCategory } = await import("./category");

      const [created] = await upsertCategory({
        fullName: "Categoría Para Buscar",
        isEnabled: true,
      });

      const result = await getCategoryById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.fullName).toBe("Categoría Para Buscar");
    });

    it("should return undefined when category does not exist", async () => {
      const { getCategoryById } = await import("./category");

      const result = await getCategoryById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertCategory", () => {
    it("should create a new category", async () => {
      const { upsertCategory } = await import("./category");

      const [result] = await upsertCategory({
        fullName: "Nueva Categoría",
        isEnabled: true,
      });

      expect(result).toHaveProperty("id");
      expect(result.fullName).toBe("Nueva Categoría");
      expect(result.isEnabled).toBe(true);
    });

    it("should update an existing category", async () => {
      const { upsertCategory, getCategoryById } = await import("./category");

      const [created] = await upsertCategory({
        fullName: "Categoría Original",
        isEnabled: true,
      });

      const [updated] = await upsertCategory({
        id: created.id,
        fullName: "Categoría Actualizada",
        isEnabled: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Categoría Actualizada");
      expect(updated.isEnabled).toBe(false);

      // Verificar en BD
      const fromDb = await getCategoryById(created.id);
      expect(fromDb!.fullName).toBe("Categoría Actualizada");
    });

    it("should throw error when updating non-existent category", async () => {
      const { upsertCategory } = await import("./category");

      await expect(
        upsertCategory({
          id: 999999,
          fullName: "No Existe",
        })
      ).rejects.toThrow("Categoría con ID 999999 no encontrada");
    });
  });

  describe("toggleCategory", () => {
    it("should enable a disabled category", async () => {
      const { upsertCategory, toggleCategory } = await import("./category");

      const [created] = await upsertCategory({
        fullName: "Categoría Toggle Test",
        isEnabled: false,
      });

      const result = await toggleCategory({ id: created.id, isEnabled: true });

      expect(result.success).toBe(true);
      expect(result.category.isEnabled).toBe(true);
    });

    it("should disable a category without active subcategories", async () => {
      const { upsertCategory, toggleCategory } = await import("./category");

      const [created] = await upsertCategory({
        fullName: "Categoría Sin Subcategorías",
        isEnabled: true,
      });

      const result = await toggleCategory({ id: created.id, isEnabled: false });

      expect(result.success).toBe(true);
      expect(result.category.isEnabled).toBe(false);
    });

    it("should throw error when disabling category with active subcategories", async () => {
      const { upsertCategory, upsertSubcategory, toggleCategory } =
        await import("./category");

      const [cat] = await upsertCategory({
        fullName: "Categoría Con Subcategorías",
        isEnabled: true,
      });

      await upsertSubcategory({
        fullName: "Subcategoría Activa",
        categoryId: cat.id,
        isEnabled: true,
      });

      await expect(
        toggleCategory({ id: cat.id, isEnabled: false })
      ).rejects.toThrow(/tiene.*subcategoría.*activa/i);
    });

    it("should cascade disable subcategories when cascade is true", async () => {
      const {
        upsertCategory,
        upsertSubcategory,
        toggleCategory,
        listSubcategories,
      } = await import("./category");

      const [cat] = await upsertCategory({
        fullName: "Categoría Cascada",
        isEnabled: true,
      });

      await upsertSubcategory({
        fullName: "Subcategoría Cascada 1",
        categoryId: cat.id,
        isEnabled: true,
      });
      await upsertSubcategory({
        fullName: "Subcategoría Cascada 2",
        categoryId: cat.id,
        isEnabled: true,
      });

      const result = await toggleCategory(
        { id: cat.id, isEnabled: false },
        true // cascade
      );

      expect(result.success).toBe(true);
      expect(result.affectedSubcategories).toBe(2);

      // Verificar que las subcategorías fueron deshabilitadas
      const subs = await listSubcategories({
        categoryId: cat.id,
        activeOnly: false,
      });
      expect(subs.every((s) => !s.isEnabled)).toBe(true);
    });
  });
});

describe("subcategory service", () => {
  describe("listSubcategories", () => {
    it("should filter by categoryId", async () => {
      const { upsertCategory, upsertSubcategory, listSubcategories } =
        await import("./category");

      const [cat1] = await upsertCategory({
        fullName: "Cat1 Para Filtro",
        isEnabled: true,
      });
      const [cat2] = await upsertCategory({
        fullName: "Cat2 Para Filtro",
        isEnabled: true,
      });

      await upsertSubcategory({
        fullName: "Sub1 de Cat1",
        categoryId: cat1.id,
        isEnabled: true,
      });
      await upsertSubcategory({
        fullName: "Sub2 de Cat2",
        categoryId: cat2.id,
        isEnabled: true,
      });

      const result = await listSubcategories({ categoryId: cat1.id });

      expect(result.every((s) => s.categoryId === cat1.id)).toBe(true);
    });
  });

  describe("upsertSubcategory", () => {
    it("should throw error when parent category does not exist", async () => {
      const { upsertSubcategory } = await import("./category");

      await expect(
        upsertSubcategory({
          fullName: "Subcategoría Huérfana",
          categoryId: 999999,
        })
      ).rejects.toThrow(/Categoría padre.*no encontrada/);
    });

    it("should throw error when parent category is disabled", async () => {
      const { upsertCategory, upsertSubcategory } = await import("./category");

      const [cat] = await upsertCategory({
        fullName: "Categoría Deshabilitada",
        isEnabled: false,
      });

      await expect(
        upsertSubcategory({
          fullName: "Subcategoría Nueva",
          categoryId: cat.id,
          isEnabled: true,
        })
      ).rejects.toThrow(/categoría deshabilitada/i);
    });

    it("should allow creating subcategory for enabled category", async () => {
      const { upsertCategory, upsertSubcategory } = await import("./category");

      const [cat] = await upsertCategory({
        fullName: "Categoría Habilitada",
        isEnabled: true,
      });

      const [sub] = await upsertSubcategory({
        fullName: "Nueva Subcategoría",
        categoryId: cat.id,
        isEnabled: true,
      });

      expect(sub).toHaveProperty("id");
      expect(sub.categoryId).toBe(cat.id);
    });
  });

  describe("toggleSubcategory", () => {
    it("should throw error when enabling subcategory of disabled category", async () => {
      const { upsertCategory, upsertSubcategory, toggleSubcategory } =
        await import("./category");

      // Crear categoría habilitada
      const [cat] = await upsertCategory({
        fullName: "Cat Para Toggle Sub",
        isEnabled: true,
      });

      // Crear subcategoría deshabilitada
      const [sub] = await upsertSubcategory({
        fullName: "Sub Para Toggle",
        categoryId: cat.id,
        isEnabled: false,
      });

      // Deshabilitar categoría manualmente (bypass reglas para test)
      const { db } = await import("#lib/db");
      const { category } = await import("#models/catalogs/category");
      const { eq } = await import("drizzle-orm");
      await db
        .update(category)
        .set({ isEnabled: false })
        .where(eq(category.id, cat.id));

      // Intentar habilitar subcategoría
      await expect(toggleSubcategory(sub.id, true)).rejects.toThrow(
        /categoría padre.*deshabilitada/i
      );
    });

    it("should allow disabling subcategory", async () => {
      const { upsertCategory, upsertSubcategory, toggleSubcategory } =
        await import("./category");

      const [cat] = await upsertCategory({
        fullName: "Cat Para Disable Sub",
        isEnabled: true,
      });

      const [sub] = await upsertSubcategory({
        fullName: "Sub Para Disable",
        categoryId: cat.id,
        isEnabled: true,
      });

      const result = await toggleSubcategory(sub.id, false);

      expect(result.isEnabled).toBe(false);
    });
  });
});
