import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_location_${uuid}`],
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

describe("location service", () => {
  describe("listLocations", () => {
    it("should return only enabled locations when activeOnly is true", async () => {
      const { listLocations, upsertLocation } = await import("./location");

      await upsertLocation({
        name: "Bodega Principal",
        code: "BOD-PRINCIPAL",
        isEnabled: true,
      });
      await upsertLocation({
        name: "Bodega Inactiva",
        code: "BOD-INACTIVA",
        isEnabled: false,
      });

      const result = await listLocations(true);

      expect(result).toBeInstanceOf(Array);
      expect(result.every((loc) => loc.isEnabled)).toBe(true);
    });

    it("should return all locations when activeOnly is false", async () => {
      const { listLocations } = await import("./location");

      const result = await listLocations(false);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((loc) => !loc.isEnabled)).toBe(true);
    });

    it("should return locations ordered by id desc", async () => {
      const { listLocations } = await import("./location");

      const result = await listLocations(false);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].id).toBeGreaterThan(result[i + 1].id);
      }
    });

    it("should return records with required fields", async () => {
      const { listLocations } = await import("./location");

      const result = await listLocations(false);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("isEnabled");
    });
  });

  describe("getLocationById", () => {
    it("should return a location by id", async () => {
      const { getLocationById, upsertLocation } = await import("./location");

      const [created] = await upsertLocation({
        name: "Sucursal Norte",
        code: "SUC-NORTE",
        isEnabled: true,
      });

      const result = await getLocationById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe("Sucursal Norte");
      expect(result?.code).toBe("SUC-NORTE");
      expect(result?.isEnabled).toBe(true);
    });

    it("should return undefined for non existent ids", async () => {
      const { getLocationById } = await import("./location");

      const result = await getLocationById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertLocation", () => {
    it("should create a location when id is missing", async () => {
      const { upsertLocation } = await import("./location");

      const [created] = await upsertLocation({
        name: "Almacén Central",
        code: "ALM-CENTRAL",
        isEnabled: true,
      });

      expect(created).toHaveProperty("id");
      expect(created.name).toBe("Almacén Central");
      expect(created.code).toBe("ALM-CENTRAL");
      expect(created.isEnabled).toBe(true);
    });

    it("should update an existing location when id is provided", async () => {
      const { upsertLocation, getLocationById } = await import("./location");

      const [created] = await upsertLocation({
        name: "Original",
        code: "LOC-ORIGINAL",
        isEnabled: true,
      });

      const [updated] = await upsertLocation({
        id: created.id,
        name: "Actualizado",
        code: "LOC-ACTUALIZADO",
        isEnabled: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Actualizado");
      expect(updated.isEnabled).toBe(false);

      const fromDb = await getLocationById(created.id);
      expect(fromDb?.name).toBe("Actualizado");
      expect(fromDb?.isEnabled).toBe(false);
    });

    it("should create location with isEnabled false", async () => {
      const { upsertLocation } = await import("./location");

      const [created] = await upsertLocation({
        name: "Ubicación Deshabilitada",
        code: "UBI-DISABLED",
        isEnabled: false,
      });

      expect(created.isEnabled).toBe(false);
    });
  });
});
