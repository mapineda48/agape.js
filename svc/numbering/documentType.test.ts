import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_numbering_doctype_${uuid}`,
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

describe("documentType service (numbering)", () => {
  /**
   * A.1: Crear tipo de documento válido
   */
  describe("upsertDocumentType", () => {
    it("should create a valid document type", async () => {
      const { upsertDocumentType, getDocumentTypeById } = await import(
        "./documentType"
      );

      const created = await upsertDocumentType({
        code: "FAC",
        name: "Factura",
        module: "billing",
        isEnabled: true,
      });

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.code).toBe("FAC");
      expect(created.name).toBe("Factura");
      expect(created.module).toBe("billing");
      expect(created.isEnabled).toBe(true);

      // Verificar que se puede leer
      const fetched = await getDocumentTypeById(created.id);
      expect(fetched).toBeDefined();
      expect(fetched?.code).toBe("FAC");
    });

    /**
     * A.2: No permitir tipos con code duplicado
     */
    it("should not allow duplicate code", async () => {
      const { upsertDocumentType } = await import("./documentType");

      // Primero crear uno válido
      await upsertDocumentType({
        code: "DUP",
        name: "Documento Duplicado",
        isEnabled: true,
      });

      // Intentar crear otro con el mismo código
      await expect(
        upsertDocumentType({
          code: "DUP",
          name: "Otro Documento",
          isEnabled: true,
        })
      ).rejects.toThrow();
    });

    /**
     * A.3: Permitir deshabilitar un tipo de documento
     */
    it("should allow disabling a document type", async () => {
      const { upsertDocumentType, getDocumentTypeById } = await import(
        "./documentType"
      );

      // Crear tipo habilitado
      const created = await upsertDocumentType({
        code: "DIS",
        name: "Tipo a Deshabilitar",
        isEnabled: true,
      });

      expect(created.isEnabled).toBe(true);

      // Deshabilitar
      const updated = await upsertDocumentType({
        id: created.id,
        code: created.code,
        name: created.name,
        isEnabled: false,
      });

      expect(updated.isEnabled).toBe(false);

      // Verificar en BD
      const fetched = await getDocumentTypeById(created.id);
      expect(fetched?.isEnabled).toBe(false);
    });
  });

  describe("listDocumentTypes", () => {
    it("should return only enabled types by default", async () => {
      const { listDocumentTypes, upsertDocumentType } = await import(
        "./documentType"
      );

      // Crear uno habilitado
      await upsertDocumentType({
        code: "ENA",
        name: "Habilitado",
        isEnabled: true,
      });

      // Crear uno deshabilitado
      await upsertDocumentType({
        code: "DISA",
        name: "Deshabilitado",
        isEnabled: false,
      });

      const enabled = await listDocumentTypes();
      const all = await listDocumentTypes(false);

      // El habilitado debe estar en ambas listas
      expect(enabled.some((t) => t.code === "ENA")).toBe(true);
      expect(all.some((t) => t.code === "ENA")).toBe(true);

      // El deshabilitado solo en la lista completa
      expect(enabled.some((t) => t.code === "DISA")).toBe(false);
      expect(all.some((t) => t.code === "DISA")).toBe(true);
    });
  });

  describe("getDocumentTypeByCode", () => {
    it("should return a document type by code", async () => {
      const { getDocumentTypeByCode, upsertDocumentType } = await import(
        "./documentType"
      );

      await upsertDocumentType({
        code: "GBC",
        name: "Get By Code Test",
        isEnabled: true,
      });

      const result = await getDocumentTypeByCode("GBC");

      expect(result).toBeDefined();
      expect(result?.code).toBe("GBC");
      expect(result?.name).toBe("Get By Code Test");
    });

    it("should return undefined for non-existent code", async () => {
      const { getDocumentTypeByCode } = await import("./documentType");

      const result = await getDocumentTypeByCode("NONEXISTENT");

      expect(result).toBeUndefined();
    });
  });
});
