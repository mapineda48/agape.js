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
    tenants: [`vitest_documenttype_${uuid}`],
    env: "vitest",
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { db } = await import("#lib/db");
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");

  const { default: config } = await import("#lib/db/schema/config");

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

      const result = await listDocumentTypes({ activeOnly: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Verificar que CC está presente y está habilitado
      const ccDoc = result.find((d) => d.code === "CC");
      expect(ccDoc).toBeDefined();
      expect(ccDoc!.name).toBe("Cédula");
      expect(ccDoc!.isEnabled).toBe(true);
      // Verificar que todos los documentos son activos
      expect(result.every((d) => d.isEnabled)).toBe(true);
    });

    it("should return all document types when activeOnly is false", async () => {
      const { listDocumentTypes } = await import("./documentType");

      const result = await listDocumentTypes({ activeOnly: false });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should return all required fields", async () => {
      const { listDocumentTypes } = await import("./documentType");

      const result = await listDocumentTypes({ activeOnly: false });

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("isEnabled");
      expect(result[0]).toHaveProperty("appliesToPerson");
      expect(result[0]).toHaveProperty("appliesToCompany");
    });

    it("should filter by companyOnly", async () => {
      const { listDocumentTypes, upsertDocumentType } = await import(
        "./documentType"
      );

      await upsertDocumentType({
        name: "NIT Empresa",
        code: "NITEMP",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      const result = await listDocumentTypes({
        activeOnly: true,
        companyOnly: true,
      });

      expect(result.every((type) => type.appliesToCompany)).toBe(true);
      expect(result.some((type) => type.code === "NITEMP")).toBe(true);
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
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe("Tarjeta de Identidad");
      expect(result!.code).toBe("TI");
      expect(result!.isEnabled).toBe(true);
      expect(result!.appliesToPerson).toBe(true);
      expect(result!.appliesToCompany).toBe(false);
    });

    it("should return undefined when document type does not exist", async () => {
      const { getDocumentTypeById } = await import("./documentType");

      const result = await getDocumentTypeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("getDocumentTypeByCode", () => {
    it("should return a document type by code", async () => {
      const { getDocumentTypeByCode, upsertDocumentType } = await import(
        "./documentType"
      );

      await upsertDocumentType({
        name: "Cédula Extranjera",
        code: "CE",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await getDocumentTypeByCode("CE");

      expect(result).toBeDefined();
      expect(result!.code).toBe("CE");
      expect(result!.name).toBe("Cédula Extranjera");
    });

    it("should return undefined when code does not exist", async () => {
      const { getDocumentTypeByCode } = await import("./documentType");

      const result = await getDocumentTypeByCode("NONEXISTENT");

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
      expect(fromDb!.name).toBe("RUT Actualizado");
      expect(fromDb!.code).toBe("RUT2");
      expect(fromDb!.isEnabled).toBe(false);
      expect(fromDb!.appliesToPerson).toBe(true);
      expect(fromDb!.appliesToCompany).toBe(true);
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

    it("should throw error when updating non-existent document type", async () => {
      const { upsertDocumentType } = await import("./documentType");

      await expect(
        upsertDocumentType({
          id: 999999,
          name: "No Existe",
          code: "NOX",
          appliesToPerson: true,
          appliesToCompany: false,
        })
      ).rejects.toThrow("Tipo de documento con ID 999999 no encontrado");
    });
  });

  describe("toggleDocumentType", () => {
    it("should enable a disabled document type", async () => {
      const { upsertDocumentType, toggleDocumentType } = await import(
        "./documentType"
      );

      // Crear tipo de documento deshabilitado
      const [created] = await upsertDocumentType({
        name: "Tipo Toggle Test",
        code: "TTT",
        isEnabled: false,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Habilitar
      const result = await toggleDocumentType({
        id: created.id,
        isEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.documentType.isEnabled).toBe(true);
      expect(result.message).toContain("habilitado");
    });

    it("should disable a document type without users", async () => {
      const { upsertDocumentType, toggleDocumentType } = await import(
        "./documentType"
      );

      // Crear tipo de documento habilitado sin usuarios
      const [created] = await upsertDocumentType({
        name: "Tipo Sin Usuarios",
        code: "TSU",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Deshabilitar
      const result = await toggleDocumentType({
        id: created.id,
        isEnabled: false,
      });

      expect(result.success).toBe(true);
      expect(result.documentType.isEnabled).toBe(false);
      expect(result.message).toContain("deshabilitado");
    });

    it("should throw error when disabling document type with active users", async () => {
      const { upsertDocumentType, toggleDocumentType } = await import(
        "./documentType"
      );
      const { upsertUser } = await import("./user");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Tipo Con Usuario",
        code: "TCU",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario usando ese tipo de documento
      await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "TCU123456",
        person: {
          firstName: "Test",
          lastName: "User",
        },
      });

      // Intentar deshabilitar debe fallar
      await expect(
        toggleDocumentType({
          id: docType.id,
          isEnabled: false,
        })
      ).rejects.toThrow(
        /No se puede deshabilitar este tipo de documento porque hay.*usuario.*activo/
      );
    });

    it("should throw error when document type does not exist", async () => {
      const { toggleDocumentType } = await import("./documentType");

      await expect(
        toggleDocumentType({
          id: 999999,
          isEnabled: false,
        })
      ).rejects.toThrow("Tipo de documento con ID 999999 no encontrado");
    });
  });

  describe("business rules", () => {
    it("should prevent changing appliesToPerson to false when users exist", async () => {
      const { upsertDocumentType } = await import("./documentType");
      const { upsertUser } = await import("./user");

      // Crear tipo de documento para personas
      const [docType] = await upsertDocumentType({
        name: "Tipo Para Persona",
        code: "TPP",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      // Crear usuario persona usando ese tipo
      await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "TPP123",
        person: {
          firstName: "Persona",
          lastName: "Test",
        },
      });

      // Intentar quitar appliesToPerson debe fallar
      await expect(
        upsertDocumentType({
          id: docType.id,
          name: "Tipo Para Persona",
          code: "TPP",
          appliesToPerson: false, // Cambiando a false
          appliesToCompany: true,
        })
      ).rejects.toThrow(/no se puede desmarcar.*Aplica a Persona/i);
    });

    it("should prevent changing appliesToCompany to false when company users exist", async () => {
      const { upsertDocumentType } = await import("./documentType");
      const { upsertUser } = await import("./user");

      // Crear tipo de documento para empresas
      const [docType] = await upsertDocumentType({
        name: "Tipo Para Empresa",
        code: "TPE",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      // Crear usuario empresa usando ese tipo
      await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "TPE900123",
        company: {
          legalName: "Empresa Test S.A.S.",
        },
      });

      // Intentar quitar appliesToCompany debe fallar
      await expect(
        upsertDocumentType({
          id: docType.id,
          name: "Tipo Para Empresa",
          code: "TPE",
          appliesToPerson: true,
          appliesToCompany: false, // Cambiando a false
        })
      ).rejects.toThrow(/no se puede desmarcar.*Aplica a Empresa/i);
    });

    it("should allow changing appliesToPerson when no person users exist", async () => {
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento sin usuarios
      const [docType] = await upsertDocumentType({
        name: "Tipo Libre",
        code: "TLIB",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      // Cambiar appliesToPerson a false debe funcionar
      const [updated] = await upsertDocumentType({
        id: docType.id,
        name: "Tipo Libre",
        code: "TLIB",
        appliesToPerson: false,
        appliesToCompany: true,
      });

      expect(updated.appliesToPerson).toBe(false);
    });
  });
});
