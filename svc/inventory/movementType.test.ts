import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
 */

// ID del documento de negocio para movimientos de inventario
let inventoryDocumentTypeId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_movementtype_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  // Crear un tipo de documento de negocio para los tests
  const { upsertDocumentType } = await import("#svc/numeration/documentType");
  const docType = await upsertDocumentType({
    code: "INV_MOV_TEST",
    name: "Movimiento Inventario Test",
    isEnabled: true,
  });
  inventoryDocumentTypeId = docType.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("movementType service", () => {
  describe("listMovementTypes", () => {
    it("should return only enabled movement types when activeOnly is true", async () => {
      const { listMovementTypes, upsertMovementType } = await import(
        "./movementType"
      );

      await upsertMovementType({
        name: "Entrada por Compra",
        factor: 1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: inventoryDocumentTypeId,
      });
      await upsertMovementType({
        name: "Ajuste Inactivo",
        factor: 1,
        affectsStock: false,
        isEnabled: false,
        documentTypeId: inventoryDocumentTypeId,
      });

      const result = await listMovementTypes(true);

      expect(result).toBeInstanceOf(Array);
      expect(result.every((mt) => mt.isEnabled)).toBe(true);
    });

    it("should return all movement types when activeOnly is false", async () => {
      const { listMovementTypes } = await import("./movementType");

      const result = await listMovementTypes(false);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((mt) => !mt.isEnabled)).toBe(true);
    });

    it("should return movement types ordered by id desc", async () => {
      const { listMovementTypes } = await import("./movementType");

      const result = await listMovementTypes(false);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].id).toBeGreaterThan(result[i + 1].id);
      }
    });

    it("should return records with required fields", async () => {
      const { listMovementTypes } = await import("./movementType");

      const result = await listMovementTypes(false);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("factor");
      expect(result[0]).toHaveProperty("affectsStock");
      expect(result[0]).toHaveProperty("isEnabled");
      expect(result[0]).toHaveProperty("documentTypeId");
    });
  });

  describe("getMovementTypeById", () => {
    it("should return a movement type by id", async () => {
      const { getMovementTypeById, upsertMovementType } = await import(
        "./movementType"
      );

      const [created] = await upsertMovementType({
        name: "Salida por Venta",
        factor: -1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: inventoryDocumentTypeId,
      });

      const result = await getMovementTypeById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe("Salida por Venta");
      expect(result?.factor).toBe(-1);
      expect(result?.affectsStock).toBe(true);
      expect(result?.isEnabled).toBe(true);
      expect(result?.documentTypeId).toBe(inventoryDocumentTypeId);
    });

    it("should return undefined for non existent ids", async () => {
      const { getMovementTypeById } = await import("./movementType");

      const result = await getMovementTypeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertMovementType", () => {
    it("should create a movement type when id is missing", async () => {
      const { upsertMovementType } = await import("./movementType");

      const [created] = await upsertMovementType({
        name: "Devolución de Compra",
        factor: -1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: inventoryDocumentTypeId,
      });

      expect(created).toHaveProperty("id");
      expect(created.name).toBe("Devolución de Compra");
      expect(created.factor).toBe(-1);
      expect(created.affectsStock).toBe(true);
      expect(created.isEnabled).toBe(true);
      expect(created.documentTypeId).toBe(inventoryDocumentTypeId);
    });

    it("should update an existing movement type when id is provided", async () => {
      const { upsertMovementType, getMovementTypeById } = await import(
        "./movementType"
      );

      const [created] = await upsertMovementType({
        name: "Original",
        factor: 1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: inventoryDocumentTypeId,
      });

      const [updated] = await upsertMovementType({
        id: created.id,
        name: "Actualizado",
        factor: -1,
        affectsStock: false,
        isEnabled: false,
        documentTypeId: inventoryDocumentTypeId,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Actualizado");
      expect(updated.factor).toBe(-1);
      expect(updated.affectsStock).toBe(false);
      expect(updated.isEnabled).toBe(false);

      const fromDb = await getMovementTypeById(created.id);
      expect(fromDb?.name).toBe("Actualizado");
    });

    it("should create movement type with affectsStock false", async () => {
      const { upsertMovementType } = await import("./movementType");

      const [created] = await upsertMovementType({
        name: "Movimiento Administrativo",
        factor: 1,
        affectsStock: false,
        isEnabled: true,
        documentTypeId: inventoryDocumentTypeId,
      });

      expect(created.affectsStock).toBe(false);
    });
  });
});
