import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * Tests de integración para la validación de jerarquía categoría/subcategoría.
 *
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_category_hierarchy_${uuid}`,
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

describe("item service - category hierarchy validation", () => {
  // Helper para crear categoría
  async function createCategory(fullName: string) {
    const { db } = await import("#lib/db");
    const { category } = await import("#models/catalogs/category");
    const [cat] = await db
      .insert(category)
      .values({ fullName, isEnabled: true })
      .returning();
    return cat;
  }

  // Helper para crear subcategoría
  async function createSubcategory(fullName: string, categoryId: number) {
    const { db } = await import("#lib/db");
    const { subcategory } = await import("#models/catalogs/subcategory");
    const [sub] = await db
      .insert(subcategory)
      .values({ fullName, categoryId, isEnabled: true })
      .returning();
    return sub;
  }

  // Helper para crear unidad de medida
  async function createUom(fullName: string, code: string) {
    const { db } = await import("#lib/db");
    const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");
    const [record] = await db
      .insert(unitOfMeasure)
      .values({ fullName, code, isEnabled: true })
      .returning();
    return record;
  }

  describe("validateCategoryHierarchy", () => {
    it("should allow item without subcategory", async () => {
      const { upsertItem } = await import("../catalogs/item");
      const Decimal = (await import("#utils/data/Decimal")).default;

      const category = await createCategory("Electrónicos");
      const uom = await createUom("Unidad H1", "UH1");

      // Crear ítem SIN subcategoría - debe funcionar
      const result = await upsertItem({
        code: "PROD-NO-SUB-001",
        fullName: "Producto Sin Subcategoría",
        basePrice: new Decimal("100.00"),
        isEnabled: true,
        categoryId: category.id,
        // Sin subcategoryId
        good: { uomId: uom.id },
      });

      expect(result).toHaveProperty("id");
      expect(result.categoryId).toBe(category.id);
      expect(result.subcategoryId).toBeNull();
    });

    it("should allow item with valid category-subcategory relationship", async () => {
      const { upsertItem } = await import("../catalogs/item");
      const Decimal = (await import("#utils/data/Decimal")).default;

      const category = await createCategory("Ropa");
      const subcategory = await createSubcategory("Camisetas", category.id);
      const uom = await createUom("Unidad H2", "UH2");

      // Crear ítem con subcategoría que pertenece a la categoría - debe funcionar
      const result = await upsertItem({
        code: "PROD-VALID-001",
        fullName: "Camiseta Básica",
        basePrice: new Decimal("50.00"),
        isEnabled: true,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        good: { uomId: uom.id },
      });

      expect(result).toHaveProperty("id");
      expect(result.categoryId).toBe(category.id);
      expect(result.subcategoryId).toBe(subcategory.id);
    });

    it("should throw SubcategoryNotFoundError when subcategory does not exist", async () => {
      const { upsertItem, SubcategoryNotFoundError } = await import(
        "../catalogs/item"
      );
      const Decimal = (await import("#utils/data/Decimal")).default;

      const category = await createCategory("Alimentos");
      const uom = await createUom("Unidad H3", "UH3");

      // Intentar crear ítem con subcategoría inexistente
      await expect(
        upsertItem({
          code: "PROD-BAD-SUB-001",
          fullName: "Producto Subcategoría Inexistente",
          basePrice: new Decimal("30.00"),
          isEnabled: true,
          categoryId: category.id,
          subcategoryId: 999999, // Subcategoría que no existe
          good: { uomId: uom.id },
        })
      ).rejects.toThrow(SubcategoryNotFoundError);
    });

    it("should throw CategoryMismatchError when subcategory belongs to different category", async () => {
      const { upsertItem, CategoryMismatchError } = await import(
        "../catalogs/item"
      );
      const Decimal = (await import("#utils/data/Decimal")).default;

      // Crear dos categorías
      const categoryComida = await createCategory("Comida");
      const categoryCalzado = await createCategory("Calzado");

      // Crear subcategoría de Calzado
      const subcategoryZapatos = await createSubcategory(
        "Zapatos Deportivos",
        categoryCalzado.id
      );

      const uom = await createUom("Unidad H4", "UH4");

      // Intentar crear ítem de categoría "Comida" con subcategoría de "Calzado"
      await expect(
        upsertItem({
          code: "PROD-MISMATCH-001",
          fullName: "Producto Categoría Incorrecta",
          basePrice: new Decimal("75.00"),
          isEnabled: true,
          categoryId: categoryComida.id, // Comida
          subcategoryId: subcategoryZapatos.id, // Zapatos (pertenece a Calzado)
          good: { uomId: uom.id },
        })
      ).rejects.toThrow(CategoryMismatchError);
    });

    it("should validate hierarchy on update as well", async () => {
      const { upsertItem, getItemById, CategoryMismatchError } = await import(
        "../catalogs/item"
      );
      const Decimal = (await import("#utils/data/Decimal")).default;

      const categoryA = await createCategory("Categoría A");
      const categoryB = await createCategory("Categoría B");
      const subcategoryB = await createSubcategory("Sub de B", categoryB.id);
      const uom = await createUom("Unidad H5", "UH5");

      // Crear ítem válido sin subcategoría
      const created = await upsertItem({
        code: "PROD-UPDATE-001",
        fullName: "Producto para Update",
        basePrice: new Decimal("60.00"),
        isEnabled: true,
        categoryId: categoryA.id,
        good: { uomId: uom.id },
      });

      // Intentar actualizar con subcategoría de otra categoría
      await expect(
        upsertItem({
          id: created.id,
          code: "PROD-UPDATE-001",
          fullName: "Producto para Update",
          basePrice: new Decimal("60.00"),
          isEnabled: true,
          categoryId: categoryA.id, // Categoría A
          subcategoryId: subcategoryB.id, // Sub de Categoría B
          good: { uomId: uom.id },
        })
      ).rejects.toThrow(CategoryMismatchError);

      // Verificar que el ítem no fue modificado
      const unchanged = await getItemById(created.id);
      expect(unchanged?.subcategoryId).toBeNull();
    });
  });
});
