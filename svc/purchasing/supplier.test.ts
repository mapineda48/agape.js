import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests de integración para el servicio de proveedores.
 *
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 *
 * NOTA: El modelo user fue simplificado. Los campos de contacto (email, phone, address)
 * ahora se manejan a través de contactMethod y userAddress.
 */

let documentTypeId: number;
let defaultSupplierTypeId: number;
let alternativeSupplierTypeId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_supplier_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  const { upsertDocumentType } = await import("#svc/core/documentType");
  const { upsertSupplierType } = await import("./supplier_type");

  const [docType] = await upsertDocumentType({
    name: `Documento ${uuid.slice(0, 4)}`,
    code: `SUP-${uuid.slice(0, 4)}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: true,
  });

  const [defaultType] = await upsertSupplierType({ name: "Default Supplier" });
  const [alternativeType] = await upsertSupplierType({
    name: "Alternative Supplier",
  });

  documentTypeId = docType.id;
  defaultSupplierTypeId = defaultType.id;
  alternativeSupplierTypeId = alternativeType.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("supplier service", () => {
  describe("upsertSupplier", () => {
    it("should create a new supplier with default active status", async () => {
      const { upsertSupplier } = await import("./supplier");

      const supplier = await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber: `SUP-${crypto.randomUUID().slice(0, 6)}`,
          countryCode: "CO",
          person: { firstName: "Supplier", lastName: "One" },
        },
        supplierTypeId: defaultSupplierTypeId,
      });

      expect(supplier.id).toBeDefined();
      expect(supplier.active).toBe(true);
      expect(supplier.supplierTypeId).toBe(defaultSupplierTypeId);
      expect(supplier.user.countryCode).toBe("CO");
    });

    it("should update an existing supplier and user data", async () => {
      const { upsertSupplier, getSupplierById } = await import("./supplier");

      const documentNumber = `SUP-${crypto.randomUUID().slice(0, 6)}`;

      const created = await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber,
          person: { firstName: "Original", lastName: "Supplier" },
        },
        supplierTypeId: defaultSupplierTypeId,
        active: true,
      });

      const updated: any = await upsertSupplier({
        id: created.id,
        user: {
          id: created.user.id,
          documentTypeId,
          documentNumber,
          countryCode: "MX",
          person: { firstName: "Updated", lastName: "Vendor" },
        },
        supplierTypeId: alternativeSupplierTypeId,
        active: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.supplierTypeId).toBe(alternativeSupplierTypeId);
      expect(updated.active).toBe(false);
      expect(updated.user.countryCode).toBe("MX");
      expect(updated.user.person?.firstName).toBe("Updated");

      const fromDb = await getSupplierById(created.id);
      expect(fromDb?.supplierTypeId).toBe(alternativeSupplierTypeId);
      expect(fromDb?.firstName).toBe("Updated");
      expect(fromDb?.active).toBe(false);
    });
  });

  describe("listSuppliers", () => {
    it("should return paginated suppliers with total count when requested", async () => {
      const { upsertSupplier, listSuppliers } = await import("./supplier");

      await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber: `SUP-${crypto.randomUUID().slice(0, 6)}`,
          person: { firstName: "List", lastName: "Vendor" },
        },
        supplierTypeId: defaultSupplierTypeId,
        active: true,
      });

      const result = await listSuppliers({
        includeTotalCount: true,
        pageIndex: 0,
        pageSize: 5,
      });

      expect(result.suppliers.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThanOrEqual(result.suppliers.length);
    });

    it("should filter suppliers by name, status and type", async () => {
      const { upsertSupplier, listSuppliers } = await import("./supplier");

      await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber: `SUP-${crypto.randomUUID().slice(0, 6)}`,
          person: { firstName: "Filter", lastName: "Target" },
        },
        supplierTypeId: defaultSupplierTypeId,
        active: true,
      });

      await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber: `SUP-${crypto.randomUUID().slice(0, 6)}`,
          person: { firstName: "Inactive", lastName: "Vendor" },
        },
        supplierTypeId: alternativeSupplierTypeId,
        active: false,
      });

      const nameFilter = await listSuppliers({ fullName: "Filter" });
      expect(nameFilter.suppliers.length).toBeGreaterThan(0);
      expect(
        nameFilter.suppliers.every((supplier) =>
          (supplier.firstName ?? "").includes("Filter")
        )
      ).toBe(true);

      const inactive = await listSuppliers({ isActive: false });
      expect(inactive.suppliers.length).toBeGreaterThan(0);
      expect(
        inactive.suppliers.every((supplier) => supplier.active === false)
      ).toBe(true);

      const byType = await listSuppliers({
        supplierTypeId: alternativeSupplierTypeId,
      });
      expect(byType.suppliers.length).toBeGreaterThan(0);
      expect(
        byType.suppliers.every(
          (supplier) => supplier.supplierTypeId === alternativeSupplierTypeId
        )
      ).toBe(true);
    });
  });

  describe("getSupplierById", () => {
    it("should return supplier data when it exists", async () => {
      const { upsertSupplier, getSupplierById } = await import("./supplier");

      const created = await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber: `SUP-${crypto.randomUUID().slice(0, 6)}`,
          person: { firstName: "Lookup", lastName: "Vendor" },
        },
        supplierTypeId: defaultSupplierTypeId,
        active: true,
      });

      const result = await getSupplierById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.firstName).toBe("Lookup");
      expect(result?.supplierTypeId).toBe(defaultSupplierTypeId);
    });

    it("should return undefined when supplier does not exist", async () => {
      const { getSupplierById } = await import("./supplier");

      const result = await getSupplierById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("deleteSupplier", () => {
    it("should delete a supplier by id", async () => {
      const { deleteSupplier, upsertSupplier, getSupplierById } = await import(
        "./supplier"
      );

      const created = await upsertSupplier({
        user: {
          documentTypeId,
          documentNumber: `SUP-${crypto.randomUUID().slice(0, 6)}`,
          person: { firstName: "Delete", lastName: "Vendor" },
        },
        supplierTypeId: defaultSupplierTypeId,
        active: true,
      });

      const beforeDelete = await getSupplierById(created.id);
      expect(beforeDelete).toBeDefined();

      await deleteSupplier(created.id);

      const afterDelete = await getSupplierById(created.id);
      expect(afterDelete).toBeUndefined();
    });
  });
});
