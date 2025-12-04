import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID(); // Es muy importante inciar siempre un id unico para evitar conflictos por concurrencia

  // 1. Inicializas la DB
  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_documenttype_${uuid}`,
    dev: false,
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { db } = await import("#lib/db");
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");

  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("documentType service", () => {
  describe("listDocumentTypes", () => {
    it("should return only enabled document types when activeOnly is true", async () => {
      const { listDocumentTypes, upsertDocumentType } = await import(
        "./documentType"
      );

      // Crear documentos de prueba
      await upsertDocumentType({
        name: "Cédula",
        code: "CC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });
      await upsertDocumentType({
        name: "Pasaporte",
        code: "PA",
        isEnabled: false,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await listDocumentTypes(true);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Cédula");
      expect(result[0].isEnabled).toBe(true);
    });

    it("should return all document types when activeOnly is false", async () => {
      const { listDocumentTypes } = await import("./documentType");

      const result = await listDocumentTypes(false);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should return all required fields", async () => {
      const { listDocumentTypes } = await import("./documentType");

      const result = await listDocumentTypes(false);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("isEnabled");
      expect(result[0]).toHaveProperty("appliesToPerson");
      expect(result[0]).toHaveProperty("appliesToCompany");
    });
  });

  describe("listPersonDocumentTypes", () => {
    it("should return only enabled person document types when activeOnly is true", async () => {
      const { listPersonDocumentTypes, upsertDocumentType } = await import(
        "./documentType"
      );

      await upsertDocumentType({
        name: "Documento Persona Activo",
        code: "DPA",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      await upsertDocumentType({
        name: "Documento Persona Inactivo",
        code: "DPI",
        isEnabled: false,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      await upsertDocumentType({
        name: "Documento Empresa",
        code: "DEM",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      const result = await listPersonDocumentTypes(true);

      expect(result).toBeInstanceOf(Array);
      expect(result.every((type) => type.appliesToPerson)).toBe(true);
      expect(result.every((type) => type.isEnabled)).toBe(true);
      expect(result.some((type) => type.code === "DPA")).toBe(true);
      expect(result.some((type) => type.code === "DEM")).toBe(false);
    });

    it("should include inactive person document types when activeOnly is false", async () => {
      const { listPersonDocumentTypes } = await import("./documentType");

      const result = await listPersonDocumentTypes(false);

      expect(result).toBeInstanceOf(Array);
      expect(result.every((type) => type.appliesToPerson)).toBe(true);
      expect(result.some((type) => type.code === "DPI")).toBe(true);
    });
  });

  describe("getDocumentTypeById", () => {
    it("should return a document type by id", async () => {
      const { getDocumentTypeById, upsertDocumentType } = await import(
        "./documentType"
      );

      const [created] = await upsertDocumentType({
        name: "Tarjeta de Identidad",
        code: "TI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await getDocumentTypeById(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.name).toBe("Tarjeta de Identidad");
      expect(result.code).toBe("TI");
      expect(result.isEnabled).toBe(true);
      expect(result.appliesToPerson).toBe(true);
      expect(result.appliesToCompany).toBe(false);
    });

    it("should return undefined when document type does not exist", async () => {
      const { getDocumentTypeById } = await import("./documentType");

      const result = await getDocumentTypeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertDocumentType", () => {
    it("should create a new document type when id is not provided", async () => {
      const { upsertDocumentType } = await import("./documentType");

      const result = await upsertDocumentType({
        name: "NIT",
        code: "NIT",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0].name).toBe("NIT");
      expect(result[0].code).toBe("NIT");
      expect(result[0].isEnabled).toBe(true);
      expect(result[0].appliesToPerson).toBe(false);
      expect(result[0].appliesToCompany).toBe(true);
    });

    it("should update an existing document type when id is provided", async () => {
      const { upsertDocumentType, getDocumentTypeById } = await import(
        "./documentType"
      );

      // Crear documento
      const [created] = await upsertDocumentType({
        name: "RUT",
        code: "RUT",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      // Actualizar documento
      const [updated] = await upsertDocumentType({
        id: created.id,
        name: "RUT Actualizado",
        code: "RUT2",
        isEnabled: false,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("RUT Actualizado");
      expect(updated.code).toBe("RUT2");
      expect(updated.isEnabled).toBe(false);
      expect(updated.appliesToPerson).toBe(true);
      expect(updated.appliesToCompany).toBe(true);

      // Verificar que se actualizó en la base de datos
      const fromDb = await getDocumentTypeById(created.id);
      expect(fromDb.name).toBe("RUT Actualizado");
      expect(fromDb.code).toBe("RUT2");
      expect(fromDb.isEnabled).toBe(false);
      expect(fromDb.appliesToPerson).toBe(true);
      expect(fromDb.appliesToCompany).toBe(true);
    });

    it("should handle creating document type with isEnabled false", async () => {
      const { upsertDocumentType } = await import("./documentType");

      const result = await upsertDocumentType({
        name: "Licencia de Conducción",
        code: "LC",
        isEnabled: false,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      expect(result[0].isEnabled).toBe(false);
    });

    it("should handle document types that apply to both person and company", async () => {
      const { upsertDocumentType } = await import("./documentType");

      const result = await upsertDocumentType({
        name: "Documento Universal",
        code: "DU",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      expect(result[0].appliesToPerson).toBe(true);
      expect(result[0].appliesToCompany).toBe(true);
    });
  });
});
