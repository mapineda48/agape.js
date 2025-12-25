import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_suppliertype_${uuid}`,
    env: "vitest",
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

describe("supplierType service", () => {
  describe("listSupplierTypes", () => {
    it("should return supplier types ordered by id desc", async () => {
      const { listSupplierTypes, upsertSupplierType } = await import(
        "./supplier_type"
      );

      await upsertSupplierType({ name: "Local" });
      await upsertSupplierType({ name: "International" });

      const result = await listSupplierTypes();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].id).toBeGreaterThan(result[i + 1].id);
      }
    });

    it("should return records with required fields", async () => {
      const { listSupplierTypes } = await import("./supplier_type");

      const result = await listSupplierTypes();

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    });
  });

  describe("getSupplierTypeById", () => {
    it("should return a supplier type by id", async () => {
      const { getSupplierTypeById, upsertSupplierType } = await import(
        "./supplier_type"
      );

      const [created] = await upsertSupplierType({ name: "Wholesale" });

      const result = await getSupplierTypeById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe("Wholesale");
    });

    it("should return undefined for non existent ids", async () => {
      const { getSupplierTypeById } = await import("./supplier_type");

      const result = await getSupplierTypeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertSupplierType", () => {
    it("should create a supplier type when id is missing", async () => {
      const { upsertSupplierType } = await import("./supplier_type");

      const [created] = await upsertSupplierType({ name: "Distribution" });

      expect(created).toHaveProperty("id");
      expect(created.name).toBe("Distribution");
    });

    it("should update an existing supplier type when id is provided", async () => {
      const { upsertSupplierType, getSupplierTypeById } = await import(
        "./supplier_type"
      );

      const [created] = await upsertSupplierType({ name: "Original" });

      const [updated] = await upsertSupplierType({
        id: created.id,
        name: "Updated",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Updated");

      const fromDb = await getSupplierTypeById(created.id);
      expect(fromDb?.name).toBe("Updated");
    });
  });

  describe("deleteSupplierType", () => {
    it("should delete a supplier type by id", async () => {
      const { deleteSupplierType, upsertSupplierType, getSupplierTypeById } =
        await import("./supplier_type");

      const [created] = await upsertSupplierType({ name: "ToDelete" });

      const before = await getSupplierTypeById(created.id);
      expect(before).toBeDefined();

      await deleteSupplierType(created.id);

      const after = await getSupplierTypeById(created.id);
      expect(after).toBeUndefined();
    });

    it("should not throw when deleting a non existing supplier type", async () => {
      const { deleteSupplierType } = await import("./supplier_type");

      await expect(deleteSupplierType(999999)).resolves.not.toThrow();
    });
  });
});
