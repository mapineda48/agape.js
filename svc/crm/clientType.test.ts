import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID(); // Es muy importante iniciar siempre un id único para evitar conflictos por concurrencia

  // 1. Inicializar la DB
  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_clienttype_${uuid}`,
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

describe("clientType service", () => {
  describe("listClientTypes", () => {
    it("should return only enabled client types when activeOnly is true", async () => {
      const { listClientTypes, upsertClientType } = await import(
        "./clientType"
      );

      // Crear tipos de cliente de prueba
      await upsertClientType({
        name: "VIP",
        isEnabled: true,
      });
      await upsertClientType({
        name: "Regular",
        isEnabled: false,
      });

      const result = await listClientTypes(true);

      expect(result).toBeInstanceOf(Array);
      // Ensure all results are enabled
      expect(result.every((ct) => ct.isEnabled === true)).toBe(true);
      // Ensure VIP (which is enabled) is in results
      expect(result.some((ct) => ct.name === "VIP")).toBe(true);
      // Ensure Regular (which is disabled) is NOT in results
      expect(result.some((ct) => ct.name === "Regular")).toBe(false);
    });

    it("should return all client types when activeOnly is false", async () => {
      const { listClientTypes } = await import("./clientType");

      const result = await listClientTypes(false);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should return all required fields", async () => {
      const { listClientTypes } = await import("./clientType");

      const result = await listClientTypes(false);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("isEnabled");
    });

    it("should return results ordered by id descending", async () => {
      const { listClientTypes } = await import("./clientType");

      const result = await listClientTypes(false);

      // Verificar que está ordenado por id descendente
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].id).toBeGreaterThan(result[i + 1].id);
      }
    });
  });

  describe("getClientTypeById", () => {
    it("should return a client type by id", async () => {
      const { getClientTypeById, upsertClientType } = await import(
        "./clientType"
      );

      const [created] = await upsertClientType({
        name: "Wholesale",
        isEnabled: true,
      });

      const result = await getClientTypeById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe("Wholesale");
      expect(result!.isEnabled).toBe(true);
    });

    it("should return undefined when client type does not exist", async () => {
      const { getClientTypeById } = await import("./clientType");

      const result = await getClientTypeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertClientType", () => {
    it("should create a new client type when id is not provided", async () => {
      const { upsertClientType } = await import("./clientType");

      const result = await upsertClientType({
        name: "Enterprise",
        isEnabled: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0].name).toBe("Enterprise");
      expect(result[0].isEnabled).toBe(true);
    });

    it("should update an existing client type when id is provided", async () => {
      const { upsertClientType, getClientTypeById } = await import(
        "./clientType"
      );

      // Crear tipo
      const [created] = await upsertClientType({
        name: "Original",
        isEnabled: true,
      });

      // Actualizar tipo
      const [updated] = await upsertClientType({
        id: created.id,
        name: "Updated",
        isEnabled: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Updated");
      expect(updated.isEnabled).toBe(false);

      // Verificar que se actualizó en la base de datos
      const fromDb = await getClientTypeById(created.id);
      expect(fromDb!.name).toBe("Updated");
      expect(fromDb!.isEnabled).toBe(false);
    });

    it("should handle creating client type with isEnabled false", async () => {
      const { upsertClientType } = await import("./clientType");

      const result = await upsertClientType({
        name: "Disabled Type",
        isEnabled: false,
      });

      expect(result[0].isEnabled).toBe(false);
    });
  });

  describe("deleteClientType", () => {
    it("should delete a client type by id", async () => {
      const { deleteClientType, upsertClientType, getClientTypeById } =
        await import("./clientType");

      // Crear tipo
      const [created] = await upsertClientType({
        name: "To Delete",
        isEnabled: true,
      });

      // Verificar que existe
      const beforeDelete = await getClientTypeById(created.id);
      expect(beforeDelete).toBeDefined();

      // Eliminar
      await deleteClientType(created.id);

      // Verificar que fue eliminado
      const afterDelete = await getClientTypeById(created.id);
      expect(afterDelete).toBeUndefined();
    });

    it("should not throw when deleting non-existent client type", async () => {
      const { deleteClientType } = await import("./clientType");

      // No debe lanzar error
      await expect(deleteClientType(999999)).resolves.not.toThrow();
    });
  });
});
