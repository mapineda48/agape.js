import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();
  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_hr_department_${uuid}`,
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

describe("Department Service", () => {
  describe("upsertDepartment", () => {
    it("should create a new department", async () => {
      const { upsertDepartment } = await import("./department");

      const created = await upsertDepartment({
        code: "DEP001",
        name: "Department 1",
        description: "Test Department",
        isActive: true,
      });

      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.code).toBe("DEP001");
      expect(created.isActive).toBe(true);
    });

    it("should update an existing department", async () => {
      const { upsertDepartment } = await import("./department");

      const created = await upsertDepartment({
        code: "DEP002",
        name: "Department 2",
        isActive: true,
      });

      const updated = await upsertDepartment({
        id: created.id,
        code: "DEP002",
        name: "Department 2 Updated",
        isActive: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Department 2 Updated");
      expect(updated.isActive).toBe(false);
    });
  });

  describe("getDepartmentById", () => {
    it("should return a department by ID", async () => {
      const { upsertDepartment, getDepartmentById } = await import(
        "./department"
      );

      const created = await upsertDepartment({
        code: "DEP003",
        name: "Department 3",
        isActive: true,
      });

      const found = await getDepartmentById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe("listDepartments", () => {
    it("should list departments with filters", async () => {
      const { upsertDepartment, listDepartments } = await import(
        "./department"
      );

      await upsertDepartment({
        code: "LIST001",
        name: "List Dept A",
        isActive: true,
      });

      await upsertDepartment({
        code: "LIST002",
        name: "List Dept B",
        isActive: false,
      });

      const all = await listDepartments({ includeTotalCount: true });
      expect(all.departments.length).toBeGreaterThanOrEqual(2);

      const active = await listDepartments({ isActive: true });
      expect(active.departments.some((d) => d.code === "LIST001")).toBe(true);
      expect(active.departments.some((d) => d.code === "LIST002")).toBe(false);

      const byCode = await listDepartments({ code: "LIST001" });
      expect(byCode.departments.length).toBe(1);
      expect(byCode.departments[0].code).toBe("LIST001");
    });
  });
});
