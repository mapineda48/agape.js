import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();
  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_hr_job_position_${uuid}`],
    env: "vitest",
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

describe("JobPosition Service", () => {
  describe("upsertJobPosition", () => {
    it("should create a new job position", async () => {
      const { upsertJobPosition } = await import("./job_position");

      const created = await upsertJobPosition({
        code: "JP001",
        name: "Job Position 1",
        description: "Test Job Position",
        level: 1,
        isActive: true,
      });

      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.code).toBe("JP001");
    });

    it("should update an existing job position", async () => {
      const { upsertJobPosition } = await import("./job_position");

      const created = await upsertJobPosition({
        code: "JP002",
        name: "Job Position 2",
        isActive: true,
      });

      const updated = await upsertJobPosition({
        id: created.id,
        code: "JP002",
        name: "Job Position 2 Updated",
        isActive: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Job Position 2 Updated");
      expect(updated.isActive).toBe(false);
    });
  });

  describe("getJobPositionById", () => {
    it("should return a job position by ID", async () => {
      const { upsertJobPosition, getJobPositionById } = await import(
        "./job_position"
      );

      const created = await upsertJobPosition({
        code: "JP003",
        name: "Job Position 3",
        isActive: true,
      });

      const found = await getJobPositionById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe("listJobPositions", () => {
    it("should list job positions with filters", async () => {
      const { upsertJobPosition, listJobPositions } = await import(
        "./job_position"
      );

      await upsertJobPosition({
        code: "LISTJP001",
        name: "List Job A",
        isActive: true,
      });

      await upsertJobPosition({
        code: "LISTJP002",
        name: "List Job B",
        isActive: false,
      });

      const all = await listJobPositions({ includeTotalCount: true });
      expect(all.jobPositions.length).toBeGreaterThanOrEqual(2);

      const active = await listJobPositions({ isActive: true });
      expect(active.jobPositions.some((j) => j.code === "LISTJP001")).toBe(
        true
      );
      expect(active.jobPositions.some((j) => j.code === "LISTJP002")).toBe(
        false
      );
    });
  });
});
