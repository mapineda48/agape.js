import { afterAll, describe, it, expect, beforeAll } from "vitest";
import Decimal from "decimal.js";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

let currencyId1: number; // COP
let currencyId2: number; // USD
let currencyId3: number; // EUR (para deshabilitar)

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_currency_${uuid}`,
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

describe("CurrencyService", () => {
  describe("upsertCurrency", () => {
    it("should create a new currency with normalized code (uppercase)", async () => {
      const { upsertCurrency } = await import("./currency");

      const [currency] = await upsertCurrency({
        code: "cop",
        fullName: "Peso Colombiano",
        symbol: "$",
      });

      currencyId1 = currency.id;

      expect(currency).toHaveProperty("id");
      expect(currency.code).toBe("COP");
      expect(currency.fullName).toBe("Peso Colombiano");
      expect(currency.symbol).toBe("$");
      expect(currency.isBase).toBe(false); // Nunca se crea como base directamente
      expect(currency.isEnabled).toBe(true);
    });

    it("should create another currency", async () => {
      const { upsertCurrency } = await import("./currency");

      const [currency] = await upsertCurrency({
        code: "usd",
        fullName: "Dólar Estadounidense",
        symbol: "$",
        exchangeRate: new Decimal("4000"),
      });

      currencyId2 = currency.id;

      expect(currency.code).toBe("USD");
      expect(currency.exchangeRate.toString()).toBe("4000");
    });

    it("should create a third currency (for toggle tests)", async () => {
      const { upsertCurrency } = await import("./currency");

      const [currency] = await upsertCurrency({
        code: "eur",
        fullName: "Euro",
        symbol: "€",
        exchangeRate: new Decimal("4200"),
      });

      currencyId3 = currency.id;

      expect(currency.code).toBe("EUR");
    });

    it("should update an existing currency", async () => {
      const { upsertCurrency, getCurrencyById } = await import("./currency");

      const [updated] = await upsertCurrency({
        id: currencyId2,
        code: "USD",
        fullName: "US Dollar",
        symbol: "US$",
        exchangeRate: new Decimal("4100"),
      });

      expect(updated.id).toBe(currencyId2);
      expect(updated.fullName).toBe("US Dollar");
      expect(updated.symbol).toBe("US$");
      expect(updated.exchangeRate.toString()).toBe("4100");

      const fromDb = await getCurrencyById(currencyId2);
      expect(fromDb?.fullName).toBe("US Dollar");
    });

    it("should throw error when updating non-existent currency", async () => {
      const { upsertCurrency } = await import("./currency");

      await expect(
        upsertCurrency({
          id: 999999,
          code: "XXX",
          fullName: "No Existe",
        })
      ).rejects.toThrow(/no encontrada|not found/i);
    });
  });

  describe("setBaseCurrency", () => {
    it("should set a currency as base", async () => {
      const { setBaseCurrency, getCurrencyById } = await import("./currency");

      const result = await setBaseCurrency({ id: currencyId1 });

      expect(result.success).toBe(true);
      expect(result.newBaseCurrency.id).toBe(currencyId1);
      expect(result.newBaseCurrency.isBase).toBe(true);
      expect(result.newBaseCurrency.exchangeRate.toString()).toBe("1");
      expect(result.previousBaseCurrency).toBeUndefined(); // No había base anterior

      // Verificar en BD
      const fromDb = await getCurrencyById(currencyId1);
      expect(fromDb?.isBase).toBe(true);
    });

    it("should change base currency and update previous one", async () => {
      const { setBaseCurrency, getCurrencyById } = await import("./currency");

      const result = await setBaseCurrency({ id: currencyId2 });

      expect(result.success).toBe(true);
      expect(result.newBaseCurrency.code).toBe("USD");
      expect(result.newBaseCurrency.isBase).toBe(true);
      expect(result.previousBaseCurrency).toBeDefined();
      expect(result.previousBaseCurrency?.code).toBe("COP");

      // Verificar que COP ya no es base
      const copFromDb = await getCurrencyById(currencyId1);
      expect(copFromDb?.isBase).toBe(false);
    });

    it("should reject setting disabled currency as base", async () => {
      const { setBaseCurrency, toggleCurrency } = await import("./currency");

      // Deshabilitar EUR primero
      await toggleCurrency({ id: currencyId3, isEnabled: false });

      // Intentar establecer EUR como base
      await expect(setBaseCurrency({ id: currencyId3 })).rejects.toThrow(
        /deshabilitada|debe habilitarla/i
      );
    });

    it("should return success if currency is already base", async () => {
      const { setBaseCurrency } = await import("./currency");

      const result = await setBaseCurrency({ id: currencyId2 });

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/ya es la moneda base/i);
    });

    it("should throw error when setting non-existent currency as base", async () => {
      const { setBaseCurrency } = await import("./currency");

      await expect(setBaseCurrency({ id: 999999 })).rejects.toThrow(
        /no encontrada|not found/i
      );
    });
  });

  describe("toggleCurrency", () => {
    it("should enable a disabled currency", async () => {
      const { toggleCurrency, getCurrencyById } = await import("./currency");

      const result = await toggleCurrency({
        id: currencyId3,
        isEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.currency.isEnabled).toBe(true);
      expect(result.message).toMatch(/habilitada/i);

      const fromDb = await getCurrencyById(currencyId3);
      expect(fromDb?.isEnabled).toBe(true);
    });

    it("should disable a currency without usage", async () => {
      const { toggleCurrency } = await import("./currency");

      const result = await toggleCurrency({
        id: currencyId3,
        isEnabled: false,
      });

      expect(result.success).toBe(true);
      expect(result.currency.isEnabled).toBe(false);
      expect(result.message).toMatch(/deshabilitada/i);
    });

    it("should reject disabling the base currency", async () => {
      const { toggleCurrency } = await import("./currency");

      // currencyId2 (USD) es la moneda base actual
      await expect(
        toggleCurrency({ id: currencyId2, isEnabled: false })
      ).rejects.toThrow(/moneda base|establecer otra/i);
    });

    it("should throw error when toggling non-existent currency", async () => {
      const { toggleCurrency } = await import("./currency");

      await expect(
        toggleCurrency({ id: 999999, isEnabled: false })
      ).rejects.toThrow(/no encontrada|not found/i);
    });
  });

  describe("listCurrencies", () => {
    it("should return only enabled currencies when activeOnly is true", async () => {
      const { listCurrencies } = await import("./currency");

      const result = await listCurrencies({ activeOnly: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.every((c) => c.isEnabled)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2); // COP y USD
    });

    it("should return all currencies when activeOnly is false", async () => {
      const { listCurrencies } = await import("./currency");

      const result = await listCurrencies({ activeOnly: false });

      expect(result).toBeInstanceOf(Array);
      expect(result.some((c) => !c.isEnabled)).toBe(true); // EUR está deshabilitado
    });

    it("should order by isBase DESC (base currency first)", async () => {
      const { listCurrencies } = await import("./currency");

      const result = await listCurrencies({ activeOnly: false });

      // La moneda base (USD) debe estar primero
      expect(result[0].isBase).toBe(true);
    });

    it("should filter by code", async () => {
      const { listCurrencies } = await import("./currency");

      const result = await listCurrencies({
        activeOnly: false,
        code: "USD",
      });

      expect(result.length).toBe(1);
      expect(result[0].code).toBe("USD");
    });
  });

  describe("getCurrencyByCode", () => {
    it("should return a currency by normalized code", async () => {
      const { getCurrencyByCode } = await import("./currency");

      const result = await getCurrencyByCode("  cop  ");

      expect(result).toBeDefined();
      expect(result?.code).toBe("COP");
    });

    it("should return undefined for non-existent code", async () => {
      const { getCurrencyByCode } = await import("./currency");

      const result = await getCurrencyByCode("XXX");

      expect(result).toBeUndefined();
    });
  });

  describe("getBaseCurrency", () => {
    it("should return the current base currency", async () => {
      const { getBaseCurrency } = await import("./currency");

      const result = await getBaseCurrency();

      expect(result).toBeDefined();
      expect(result?.isBase).toBe(true);
      expect(result?.code).toBe("USD"); // USD fue establecida como base
    });
  });

  describe("getCurrencyUsageInfo", () => {
    it("should return usage info for a currency", async () => {
      const { getCurrencyUsageInfo } = await import("./currency");

      const usageInfo = await getCurrencyUsageInfo(currencyId1);

      expect(usageInfo).toHaveProperty("salesInvoicesCount");
      expect(usageInfo).toHaveProperty("purchaseInvoicesCount");
      expect(usageInfo).toHaveProperty("ordersCount");
      expect(usageInfo).toHaveProperty("canDisable");
      expect(typeof usageInfo.canDisable).toBe("boolean");
    });

    it("should indicate base currency cannot be disabled", async () => {
      const { getCurrencyUsageInfo } = await import("./currency");

      const usageInfo = await getCurrencyUsageInfo(currencyId2); // USD es base

      expect(usageInfo.canDisable).toBe(false);
      expect(usageInfo.reason).toMatch(/moneda base/i);
    });

    it("should throw error for non-existent currency", async () => {
      const { getCurrencyUsageInfo } = await import("./currency");

      await expect(getCurrencyUsageInfo(999999)).rejects.toThrow(
        /no encontrada|not found/i
      );
    });
  });
});
