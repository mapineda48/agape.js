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
    tenant: `vitest_user_${uuid}`,
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

describe("user service", () => {
  describe("getUserById", () => {
    it("should return a user person by id", async () => {
      const { getUserById, upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula",
        code: "CC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario persona
      const created = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "123456789",
        email: "john@example.com",
        phone: "1234567890",
        person: {
          firstName: "John",
          lastName: "Doe",
        },
      });

      const result = await getUserById(created.id);

      if (!result) {
        throw new Error("User should exist");
      }

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.documentNumber).toBe("123456789");
      expect(result.email).toBe("john@example.com");
      // El tipo ahora es el valor del enum ("person") en lugar de "P"
      expect(result.type).toBe("person");
    });

    it("should return a user company by id", async () => {
      const { getUserById, upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "NIT",
        code: "NIT",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      // Crear usuario compañía
      const created = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "900123456",
        email: "info@company.com",
        company: {
          legalName: "Acme Corporation",
          tradeName: "Acme",
        },
      });

      const result = await getUserById(created.id);

      if (!result) {
        throw new Error("User should exist");
      }

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.documentNumber).toBe("900123456");
      // El tipo ahora es el valor del enum ("company") en lugar de "C"
      expect(result.type).toBe("company");
    });

    it("should return undefined when user does not exist", async () => {
      const { getUserById } = await import("./user");

      const result = await getUserById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertUser - Create", () => {
    it("should create a new user person", async () => {
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Tarjeta de Identidad",
        code: "TI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "987654321",
        email: "jane@example.com",
        phone: "9876543210",
        address: "123 Main St",
        person: {
          firstName: "Jane",
          lastName: "Smith",
        },
      });

      expect(result).toHaveProperty("id");
      expect(result.documentNumber).toBe("987654321");
      expect(result.email).toBe("jane@example.com");
      expect(result.isActive).toBe(true);
      expect(result).toHaveProperty("person");
      expect(result.person.firstName).toBe("Jane");
      expect(result.person.lastName).toBe("Smith");
    });

    it("should create a new user company", async () => {
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "RUT",
        code: "RUT",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      const result = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "800123456",
        email: "contact@business.com",
        phone: "5551234567",
        company: {
          legalName: "Business Solutions LLC",
          tradeName: "BizSolutions",
        },
      });

      expect(result).toHaveProperty("id");
      expect(result.documentNumber).toBe("800123456");
      expect(result).toHaveProperty("company");
      expect(result.company.legalName).toBe("Business Solutions LLC");
      expect(result.company.tradeName).toBe("BizSolutions");
    });

    it("should create user with optional fields omitted", async () => {
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "Pasaporte",
        code: "PA",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "AB123456",
        person: {
          firstName: "Bob",
          lastName: "Johnson",
        },
      });

      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.address).toBeNull();
    });

    it("should throw error when neither person nor company is provided", async () => {
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "Licencia",
        code: "LC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      await expect(
        upsertUser({
          documentTypeId: docType.id,
          documentNumber: "LC123456",
        } as any)
      ).rejects.toThrow(
        "User must be either a person or a company. Please provide either 'person' or 'company' data."
      );
    });

    it("should throw error when both person and company are provided", async () => {
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "Documento Mixto",
        code: "MX",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      await expect(
        upsertUser({
          documentTypeId: docType.id,
          documentNumber: "MX123456",
          person: {
            firstName: "John",
            lastName: "Doe",
          },
          company: {
            legalName: "Acme Corp",
          },
        } as any)
      ).rejects.toThrow(
        "User cannot be both a person and a company. Provide only 'person' or 'company', not both."
      );
    });

    it("should infer type as 'person' when person property is present", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "Cedula Extranjera",
        code: "CE",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "CE123456",
        person: {
          firstName: "Maria",
          lastName: "Garcia",
        },
      });

      // Verificar que el tipo fue inferido correctamente
      const fromDb = await getUserById(result.id);
      expect(fromDb?.type).toBe("person");
    });

    it("should infer type as 'company' when company property is present", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "NIT Empresarial",
        code: "NE",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      const result = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "900999888",
        company: {
          legalName: "Tech Solutions SAS",
          tradeName: "TechSol",
        },
      });

      // Verificar que el tipo fue inferido correctamente
      const fromDb = await getUserById(result.id);
      expect(fromDb?.type).toBe("company");
    });
  });

  describe("upsertUser - Update", () => {
    it("should update an existing user person", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "DNI",
        code: "DNI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const created = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "11111111",
        email: "original@example.com",
        person: {
          firstName: "Original",
          lastName: "Name",
        },
      });

      // Actualizar usuario
      const updated = await upsertUser({
        id: created.id,
        documentTypeId: docType.id,
        documentNumber: "11111111",
        email: "updated@example.com",
        phone: "5559999999",
        person: {
          firstName: "Updated",
          lastName: "Name",
        },
      });

      expect(updated.id).toBe(created.id);
      expect(updated.email).toBe("updated@example.com");
      expect(updated.phone).toBe("5559999999");
      expect(updated.person?.firstName).toBe("Updated");

      // Verificar que se actualizó en la base de datos
      const fromDb = await getUserById(created.id);

      if (!fromDb) {
        throw new Error("User should exist");
      }

      expect(fromDb).toBeDefined();

      expect(fromDb.email).toBe("updated@example.com");
      expect(fromDb.phone).toBe("5559999999");
    });

    it("should update an existing user company", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "EIN",
        code: "EIN",
        isEnabled: true,
        appliesToPerson: false,
        appliesToCompany: true,
      });

      // Crear usuario
      const created = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "22-3333333",
        email: "old@company.com",
        company: {
          legalName: "Old Company Name Inc",
        },
      });

      // Actualizar usuario
      const updated = await upsertUser({
        id: created.id,
        documentTypeId: docType.id,
        documentNumber: "22-3333333",
        email: "new@company.com",
        company: {
          legalName: "New Company Name Inc",
          tradeName: "NewCo",
        },
      });

      expect(updated.id).toBe(created.id);
      expect(updated.email).toBe("new@company.com");
      expect(updated.company?.legalName).toBe("New Company Name Inc");
      expect(updated.company?.tradeName).toBe("NewCo");

      // Verificar que se actualizó en la base de datos
      const fromDb = await getUserById(created.id);

      if (!fromDb) {
        throw new Error("User should exist");
      }

      expect(fromDb).toBeDefined();
      expect(fromDb.email).toBe("new@company.com");
    });

    it("should update user status to inactive", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "ID",
        code: "ID",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const created = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "ID123",
        person: {
          firstName: "Test",
          lastName: "User",
        },
      });

      expect(created.isActive).toBe(true);

      // Actualizar a inactivo
      const updated = await upsertUser({
        id: created.id,
        documentTypeId: docType.id,
        documentNumber: "ID123",
        isActive: false,
        person: {
          firstName: "Test",
          lastName: "User",
        },
      });

      expect(updated.isActive).toBe(false);

      // Verificar
      const fromDb = await getUserById(created.id);
      if (!fromDb) {
        throw new Error("User should exist");
      }

      expect(fromDb).toBeDefined();
      expect(fromDb.isActive).toBe(false);
    });

    it("should maintain correct type after update", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "CURP",
        code: "CURP",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario persona
      const created = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "CURP123456",
        person: {
          firstName: "Carlos",
          lastName: "Rodriguez",
        },
      });

      // Verificar tipo inicial
      let fromDb = await getUserById(created.id);
      expect(fromDb?.type).toBe("person");

      // Actualizar usuario (el tipo debe mantenerse como person)
      await upsertUser({
        id: created.id,
        documentTypeId: docType.id,
        documentNumber: "CURP123456",
        email: "carlos@example.com",
        person: {
          firstName: "Carlos Alberto",
          lastName: "Rodriguez",
        },
      });

      // Verificar que el tipo se mantiene
      fromDb = await getUserById(created.id);
      expect(fromDb?.type).toBe("person");
    });
  });

  describe("UserType enum validation", () => {
    it("should only allow valid enum values from USER_TYPE_VALUES", async () => {
      const { USER_TYPE_VALUES } = await import("#models/core/user");

      expect(USER_TYPE_VALUES).toContain("person");
      expect(USER_TYPE_VALUES).toContain("company");
      expect(USER_TYPE_VALUES).toHaveLength(2);
    });

    it("should store the exact enum value in the database", async () => {
      const { upsertUser, getUserById } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "RFC",
        code: "RFC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      // Crear persona
      const personUser = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "RFC001",
        person: {
          firstName: "Ana",
          lastName: "Martinez",
        },
      });

      // Crear compañía
      const companyUser = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "RFC002",
        company: {
          legalName: "Empresa SA",
        },
      });

      // Verificar valores exactos almacenados
      const personFromDb = await getUserById(personUser.id);
      const companyFromDb = await getUserById(companyUser.id);

      expect(personFromDb?.type).toBe("person");
      expect(companyFromDb?.type).toBe("company");
    });

    it("should not allow null values for entity properties when creating", async () => {
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("./documentType");

      const [docType] = await upsertDocumentType({
        name: "SSN",
        code: "SSN",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: true,
      });

      // Intentar con person: null
      await expect(
        upsertUser({
          documentTypeId: docType.id,
          documentNumber: "SSN123",
          person: null,
        } as any)
      ).rejects.toThrow(
        "User must be either a person or a company. Please provide either 'person' or 'company' data."
      );

      // Intentar con company: null
      await expect(
        upsertUser({
          documentTypeId: docType.id,
          documentNumber: "SSN456",
          company: null,
        } as any)
      ).rejects.toThrow(
        "User must be either a person or a company. Please provide either 'person' or 'company' data."
      );
    });
  });
});
