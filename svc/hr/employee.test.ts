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
    tenant: `vitest_employee_${uuid}`,
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

describe("employee service", () => {
  describe("getEmployeeById", () => {
    it("should return an employee by id", async () => {
      const { getEmployeeById, upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula",
        code: "CC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear empleado
      const created = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "123456789",
          email: "juan@example.com",
          phone: "1234567890",
          address: "Calle 123",
          person: {
            firstName: "Juan",
            lastName: "Pérez",
          },
        },
        isActive: true,
      });

      const result = await getEmployeeById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.firstName).toBe("Juan");
      expect(result?.lastName).toBe("Pérez");
      expect(result?.email).toBe("juan@example.com");
      expect(result?.isActive).toBe(true);
    });

    it("should return undefined when employee does not exist", async () => {
      const { getEmployeeById } = await import("./employee");

      const result = await getEmployeeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("listEmployees", () => {
    it("should return paginated employees", async () => {
      const { listEmployees, upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Pasaporte",
        code: "PA",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear varios empleados
      await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "PA111",
          email: "employee1@example.com",
          person: { firstName: "Alice", lastName: "Smith" },
        },
        isActive: true,
      });

      await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "PA222",
          email: "employee2@example.com",
          person: { firstName: "Bob", lastName: "Johnson" },
        },
        isActive: true,
      });

      const result = await listEmployees({
        pageIndex: 0,
        pageSize: 10,
        includeTotalCount: true,
      });

      expect(result.employees).toBeInstanceOf(Array);
      expect(result.employees.length).toBeGreaterThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
    });

    it("should filter employees by name", async () => {
      const { listEmployees } = await import("./employee");

      const result = await listEmployees({
        fullName: "Alice",
      });

      expect(result.employees).toBeInstanceOf(Array);
      expect(result.employees.every((e) => e.firstName === "Alice")).toBe(true);
    });

    it("should filter employees by active status", async () => {
      const { listEmployees, upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "DNI",
        code: "DNI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear empleado inactivo
      await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "DNI999",
          email: "inactive@example.com",
          person: { firstName: "Inactive", lastName: "Employee" },
        },
        isActive: false,
      });

      const activeResult = await listEmployees({ isActive: true });
      const inactiveResult = await listEmployees({ isActive: false });

      expect(activeResult.employees.every((e) => e.isActive === true)).toBe(
        true
      );
      expect(inactiveResult.employees.every((e) => e.isActive === false)).toBe(
        true
      );
    });

    it("should return all required fields", async () => {
      const { listEmployees } = await import("./employee");

      const result = await listEmployees();

      expect(result.employees[0]).toHaveProperty("id");
      expect(result.employees[0]).toHaveProperty("userId");
      expect(result.employees[0]).toHaveProperty("firstName");
      expect(result.employees[0]).toHaveProperty("lastName");
      expect(result.employees[0]).toHaveProperty("email");
      expect(result.employees[0]).toHaveProperty("phone");
      expect(result.employees[0]).toHaveProperty("hireDate");
      expect(result.employees[0]).toHaveProperty("isActive");
      expect(result.employees[0]).toHaveProperty("avatarUrl");
      expect(result.employees[0]).toHaveProperty("createdAt");
    });
  });

  describe("upsertEmployee", () => {
    it("should create a new employee", async () => {
      const { upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "TI",
        code: "TI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "TI12345",
          email: "newemployee@example.com",
          phone: "5551234567",
          address: "123 Main St",
          person: {
            firstName: "New",
            lastName: "Employee",
          },
        },
        isActive: true,
        hireDate: new Date("2023-01-15"),
      });

      expect(result).toHaveProperty("id");
      expect(result.isActive).toBe(true);
      expect(result.user).toBeDefined();
    });

    it("should update an existing employee", async () => {
      const { upsertEmployee, getEmployeeById } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "LC",
        code: "LC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear empleado
      const created = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "LC12345",
          email: "original@example.com",
          person: { firstName: "Original", lastName: "Name" },
        },
        isActive: true,
      });

      // Actualizar empleado
      const updated = await upsertEmployee({
        id: created.id,
        user: {
          id: created.user.id,
          documentTypeId: docType.id,
          documentNumber: "LC12345",
          email: "updated@example.com",
          person: { firstName: "Updated", lastName: "Name" },
        },
        isActive: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.isActive).toBe(false);

      // Verificar en la base de datos
      const fromDb = await getEmployeeById(created.id);
      expect(fromDb?.isActive).toBe(false);
      expect(fromDb?.email).toBe("updated@example.com");
      expect(fromDb?.firstName).toBe("Updated");
    });

    it("should create employee with default active status", async () => {
      const { upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      const [docType] = await upsertDocumentType({
        name: "EXT",
        code: "EXT",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "EXT12345",
          person: { firstName: "Default", lastName: "Active" },
        },
        // No se especifica isActive, debería ser true por defecto
      });

      expect(result.isActive).toBe(true);
    });

    it("should throw error when person data is missing", async () => {
      const { upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      const [docType] = await upsertDocumentType({
        name: "ERR",
        code: "ERR",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      await expect(
        upsertEmployee({
          user: {
            documentTypeId: docType.id,
            documentNumber: "ERR12345",
            // Missing person data
          },
          isActive: true,
        } as any)
      ).rejects.toThrow("Los empleados deben tener información personal");
    });

    it("should set hireDate to current date by default", async () => {
      const { upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      const [docType] = await upsertDocumentType({
        name: "HD",
        code: "HD",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const before = new Date();

      const result = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "HD12345",
          person: { firstName: "Hire", lastName: "Date" },
        },
      });

      const after = new Date();

      // hireDate debería estar entre before y after
      const hireDate = new Date(result.hireDate as any);
      expect(hireDate.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 1000
      );
      expect(hireDate.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });
  });
});
