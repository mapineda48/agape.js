import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
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
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("category service", () => {
  describe("listCategories", () => {
    it("should return only enabled categories when activeOnly is true", async () => {
      const { listCategories, upsertCategory } = await import("./category");

      await upsertCategory({
        fullName: "Electrónicos",
        isEnabled: true,
      });
      await upsertCategory({
        fullName: "Inactiva",
        isEnabled: false,
      });

      const result = await listCategories(true);

      expect(result).toBeInstanceOf(Array);
      expect(result.every((cat) => cat.isEnabled)).toBe(true);
    });

    it("should return all categories when activeOnly is false", async () => {
      const { listCategories } = await import("./category");

      const result = await listCategories(false);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((cat) => !cat.isEnabled)).toBe(true);
    });

    it("should return categories ordered by id desc", async () => {
      const { listCategories } = await import("./category");

      const result = await listCategories(false);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].id).toBeGreaterThan(result[i + 1].id);
      }
    });

    it("should return records with required fields and subcategories array", async () => {
      const { listCategories } = await import("./category");

      const result = await listCategories(false);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("fullName");
      expect(result[0]).toHaveProperty("isEnabled");
      expect(result[0]).toHaveProperty("subcategories");
      expect(result[0].subcategories).toBeInstanceOf(Array);
    });
  });

  describe("getCategoryById", () => {
    it("should return a category by id", async () => {
      const { getCategoryById, upsertCategory } = await import("./category");

      const created = await upsertCategory({
        fullName: "Ropa",
        isEnabled: true,
      });

      const result = await getCategoryById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.fullName).toBe("Ropa");
      expect(result?.isEnabled).toBe(true);
    });

    it("should return undefined for non existent ids", async () => {
      const { getCategoryById } = await import("./category");

      const result = await getCategoryById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertCategory", () => {
    it("should create a category when id is missing", async () => {
      const { upsertCategory } = await import("./category");

      const created = await upsertCategory({
        fullName: "Alimentos",
        isEnabled: true,
      });

      expect(created).toHaveProperty("id");
      expect(created.fullName).toBe("Alimentos");
      expect(created.isEnabled).toBe(true);
    });

    it("should update an existing category when id is provided", async () => {
      const { upsertCategory, getCategoryById } = await import("./category");

      const created = await upsertCategory({
        fullName: "Original",
        isEnabled: true,
      });

      const updated = await upsertCategory({
        id: created.id,
        fullName: "Actualizada",
        isEnabled: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Actualizada");
      expect(updated.isEnabled).toBe(false);

      const fromDb = await getCategoryById(created.id);
      expect(fromDb?.fullName).toBe("Actualizada");
    });

    it("should create category with subcategories", async () => {
      const { upsertCategory, listCategories } = await import("./category");

      await upsertCategory({
        fullName: "Hardware",
        isEnabled: true,
        subcategories: [
          { fullName: "Procesadores", isEnabled: true },
          { fullName: "Memorias", isEnabled: true },
        ],
      });

      const categories = await listCategories(false);
      const hardware = categories.find((c) => c.fullName === "Hardware");

      expect(hardware).toBeDefined();
      expect(hardware?.subcategories.length).toBe(2);
      expect(
        hardware?.subcategories.some((s) => s.fullName === "Procesadores")
      ).toBe(true);
      expect(
        hardware?.subcategories.some((s) => s.fullName === "Memorias")
      ).toBe(true);
    });

    it("should update existing subcategories", async () => {
      const { upsertCategory, listCategories } = await import("./category");

      // Crear categoría con subcategoría
      await upsertCategory({
        fullName: "Software",
        isEnabled: true,
        subcategories: [{ fullName: "Aplicaciones", isEnabled: true }],
      });

      let categories = await listCategories(false);
      const software = categories.find((c) => c.fullName === "Software");
      const subId = software?.subcategories[0]?.id;

      expect(subId).toBeDefined();

      // Actualizar subcategoría
      await upsertCategory({
        id: software!.id,
        fullName: "Software",
        isEnabled: true,
        subcategories: [
          { id: subId, fullName: "Aplicaciones Móviles", isEnabled: false },
        ],
      });

      categories = await listCategories(false);
      const updated = categories.find((c) => c.fullName === "Software");

      expect(updated?.subcategories[0]?.fullName).toBe("Aplicaciones Móviles");
      expect(updated?.subcategories[0]?.isEnabled).toBe(false);
    });
  });
});
