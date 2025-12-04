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
    tenant: `vitest_client_${uuid}`,
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

describe("client service", () => {
  describe("getClientById", () => {
    it("should return a client by id", async () => {
      const { getClientById, upsertClient } = await import("./client");
      const { upsertDocumentType } = await import("#svc/core/documentType");
      const { upsertClientType } = await import("./clientType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula",
        code: "CC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear tipo de cliente
      const [clientTypeRecord] = await upsertClientType({
        name: "VIP",
        isEnabled: true,
      });

      // Crear cliente
      const created = await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "123456789",
          email: "john@example.com",
          phone: "1234567890",
          person: {
            firstName: "John",
            lastName: "Doe",
          },
        },
        typeId: clientTypeRecord.id,
        active: true,
      });

      const result = await getClientById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.firstName).toBe("John");
      expect(result?.lastName).toBe("Doe");
      expect(result?.email).toBe("john@example.com");
      expect(result?.typeName).toBe("VIP");
      expect(result?.active).toBe(true);
    });

    it("should return undefined when client does not exist", async () => {
      const { getClientById } = await import("./client");

      const result = await getClientById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("listClients", () => {
    it("should return paginated clients", async () => {
      const { listClients, upsertClient } = await import("./client");
      const { upsertDocumentType } = await import("#svc/core/documentType");
      const { upsertClientType } = await import("./clientType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Pasaporte",
        code: "PA",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear tipo de cliente
      const [clientTypeRecord] = await upsertClientType({
        name: "Regular",
        isEnabled: true,
      });

      // Crear varios clientes
      await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "PA111",
          email: "client1@example.com",
          person: { firstName: "Alice", lastName: "Smith" },
        },
        typeId: clientTypeRecord.id,
        active: true,
      });

      await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "PA222",
          email: "client2@example.com",
          person: { firstName: "Bob", lastName: "Johnson" },
        },
        typeId: clientTypeRecord.id,
        active: true,
      });

      const result = await listClients({
        pageIndex: 0,
        pageSize: 10,
        includeTotalCount: true,
      });

      expect(result.clients).toBeInstanceOf(Array);
      expect(result.clients.length).toBeGreaterThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
    });

    it("should filter clients by name", async () => {
      const { listClients } = await import("./client");

      const result = await listClients({
        fullName: "Alice",
      });

      expect(result.clients).toBeInstanceOf(Array);
      expect(result.clients.every((c) => c.firstName === "Alice")).toBe(true);
    });

    it("should filter clients by active status", async () => {
      const { listClients, upsertClient } = await import("./client");
      const { upsertDocumentType } = await import("#svc/core/documentType");
      const { upsertClientType } = await import("./clientType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "DNI",
        code: "DNI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear tipo de cliente
      const [clientTypeRecord] = await upsertClientType({
        name: "Inactive Test",
        isEnabled: true,
      });

      // Crear cliente inactivo
      await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "DNI999",
          email: "inactive@example.com",
          person: { firstName: "Inactive", lastName: "Client" },
        },
        typeId: clientTypeRecord.id,
        active: false,
      });

      const activeResult = await listClients({ isActive: true });
      const inactiveResult = await listClients({ isActive: false });

      expect(activeResult.clients.every((c) => c.active === true)).toBe(true);
      expect(inactiveResult.clients.every((c) => c.active === false)).toBe(
        true
      );
    });

    it("should return all required fields", async () => {
      const { listClients } = await import("./client");

      const result = await listClients();

      expect(result.clients[0]).toHaveProperty("id");
      expect(result.clients[0]).toHaveProperty("firstName");
      expect(result.clients[0]).toHaveProperty("lastName");
      expect(result.clients[0]).toHaveProperty("email");
      expect(result.clients[0]).toHaveProperty("phone");
      expect(result.clients[0]).toHaveProperty("typeId");
      expect(result.clients[0]).toHaveProperty("typeName");
      expect(result.clients[0]).toHaveProperty("photoUrl");
      expect(result.clients[0]).toHaveProperty("active");
      expect(result.clients[0]).toHaveProperty("createdAt");
    });
  });

  describe("upsertClient", () => {
    it("should create a new client", async () => {
      const { upsertClient } = await import("./client");
      const { upsertDocumentType } = await import("#svc/core/documentType");
      const { upsertClientType } = await import("./clientType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "TI",
        code: "TI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear tipo de cliente
      const [clientTypeRecord] = await upsertClientType({
        name: "Enterprise",
        isEnabled: true,
      });

      const result = await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "TI12345",
          email: "newclient@example.com",
          phone: "5551234567",
          address: "123 Main St",
          person: {
            firstName: "New",
            lastName: "Client",
          },
        },
        typeId: clientTypeRecord.id,
        active: true,
      });

      expect(result).toHaveProperty("id");
      expect(result.active).toBe(true);
      expect(result.typeId).toBe(clientTypeRecord.id);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("newclient@example.com");
    });

    it("should update an existing client", async () => {
      const { upsertClient, getClientById } = await import("./client");
      const { upsertDocumentType } = await import("#svc/core/documentType");
      const { upsertClientType } = await import("./clientType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "LC",
        code: "LC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear tipos de cliente
      const [type1] = await upsertClientType({
        name: "Type1",
        isEnabled: true,
      });
      const [type2] = await upsertClientType({
        name: "Type2",
        isEnabled: true,
      });

      // Crear cliente
      const created = await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "LC12345",
          email: "original@example.com",
          person: { firstName: "Original", lastName: "Name" },
        },
        typeId: type1.id,
        active: true,
      });

      // Actualizar cliente
      const updated = await upsertClient({
        id: created.id,
        user: {
          id: created.user.id,
          documentTypeId: docType.id,
          documentNumber: "LC12345",
          email: "updated@example.com",
          person: { firstName: "Updated", lastName: "Name" },
        },
        typeId: type2.id,
        active: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.typeId).toBe(type2.id);
      expect(updated.active).toBe(false);
      expect(updated.user.email).toBe("updated@example.com");

      // Verificar en la base de datos
      const fromDb = await getClientById(created.id);
      expect(fromDb?.active).toBe(false);
      expect(fromDb?.email).toBe("updated@example.com");
    });

    it("should create client with default active status", async () => {
      const { upsertClient } = await import("./client");
      const { upsertDocumentType } = await import("#svc/core/documentType");
      const { upsertClientType } = await import("./clientType");

      const [docType] = await upsertDocumentType({
        name: "EXT",
        code: "EXT",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const [clientTypeRecord] = await upsertClientType({
        name: "Default",
        isEnabled: true,
      });

      const result = await upsertClient({
        user: {
          documentTypeId: docType.id,
          documentNumber: "EXT12345",
          person: { firstName: "Default", lastName: "Active" },
        },
        typeId: clientTypeRecord.id,
        // No se especifica active, debería ser true por defecto
      });

      expect(result.active).toBe(true);
    });
  });
});
