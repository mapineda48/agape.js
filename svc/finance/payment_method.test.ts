import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();
  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_fin_pm_${uuid}`,
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

describe("PaymentMethod Service", () => {
  describe("upsertPaymentMethod", () => {
    it("should create a new payment method", async () => {
      const { upsertPaymentMethod } = await import("./payment_method");

      const created = await upsertPaymentMethod({
        code: "CASH",
        fullName: "Cash",
        description: "Cash payment",
        requiresReference: false,
        requiresBankAccount: false,
        isEnabled: true,
      });

      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.code).toBe("CASH");
    });

    it("should update an existing payment method", async () => {
      const { upsertPaymentMethod } = await import("./payment_method");

      const created = await upsertPaymentMethod({
        code: "CARD",
        fullName: "Credit Card",
        requiresReference: true,
        requiresBankAccount: true,
        isEnabled: true,
      });

      const updated = await upsertPaymentMethod({
        id: created.id,
        code: "CARD",
        fullName: "Debit/Credit Card",
        isEnabled: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Debit/Credit Card");
      expect(updated.isEnabled).toBe(false);
    });
  });

  describe("getPaymentMethodById", () => {
    it("should return a payment method by ID", async () => {
      const { upsertPaymentMethod, getPaymentMethodById } = await import(
        "./payment_method"
      );

      const created = await upsertPaymentMethod({
        code: "CHECK",
        fullName: "Check",
        requiresReference: true,
        requiresBankAccount: false,
        isEnabled: true,
      });

      const found = await getPaymentMethodById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe("listPaymentMethods", () => {
    it("should list payment methods with filters", async () => {
      const { upsertPaymentMethod, listPaymentMethods } = await import(
        "./payment_method"
      );

      await upsertPaymentMethod({
        code: "LIST1",
        fullName: "List PM 1",
        requiresReference: false,
        requiresBankAccount: false,
        isEnabled: true,
      });

      await upsertPaymentMethod({
        code: "LIST2",
        fullName: "List PM 2",
        requiresReference: false,
        requiresBankAccount: false,
        isEnabled: false,
      });

      const all = await listPaymentMethods({ includeTotalCount: true });
      expect(all.paymentMethods.length).toBeGreaterThanOrEqual(2);

      const active = await listPaymentMethods({ isEnabled: true });
      expect(active.paymentMethods.some((p) => p.code === "LIST1")).toBe(true);
      expect(active.paymentMethods.some((p) => p.code === "LIST2")).toBe(false);
    });
  });
});
