import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

let priceListId1: number;
let priceListId2: number;
let defaultPriceListId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_price_list_${uuid}`],
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

describe("PriceListService", () => {
  describe("upsertPriceList", () => {
    it("should create a new price list with uppercase code", async () => {
      const { upsertPriceList } = await import("./price_list");

      const [list] = await upsertPriceList({
        code: "retail",
        fullName: "Precio Retail",
        description: "Lista de precios para clientes finales",
      });

      priceListId1 = list.id;

      expect(list).toHaveProperty("id");
      expect(list.code).toBe("RETAIL");
      expect(list.fullName).toBe("Precio Retail");
      expect(list.isEnabled).toBe(true);
      expect(list.isDefault).toBe(false);
    });

    it("should create another price list", async () => {
      const { upsertPriceList } = await import("./price_list");

      const [list] = await upsertPriceList({
        code: "mayorista",
        fullName: "Precio Mayorista",
      });

      priceListId2 = list.id;

      expect(list.code).toBe("MAYORISTA");
    });

    it("should set isDefault and remove from others", async () => {
      const { upsertPriceList, getPriceListById } = await import(
        "./price_list"
      );

      // Crear lista default
      const [defaultList] = await upsertPriceList({
        code: "DEFAULT",
        fullName: "Lista por Defecto",
        isDefault: true,
      });

      defaultPriceListId = defaultList.id;

      expect(defaultList.isDefault).toBe(true);

      // Verificar que las otras no son default
      const retail = await getPriceListById(priceListId1);
      expect(retail?.isDefault).toBe(false);
    });

    it("should update an existing price list", async () => {
      const { upsertPriceList, getPriceListById } = await import(
        "./price_list"
      );

      const [updated] = await upsertPriceList({
        id: priceListId1,
        code: "RETAIL",
        fullName: "Precio Retail Actualizado",
        description: "Descripción actualizada",
      });

      expect(updated.id).toBe(priceListId1);
      expect(updated.fullName).toBe("Precio Retail Actualizado");

      const fromDb = await getPriceListById(priceListId1);
      expect(fromDb?.description).toBe("Descripción actualizada");
    });

    it("should move default flag when updating with isDefault=true", async () => {
      const { upsertPriceList, getPriceListById } = await import(
        "./price_list"
      );

      // Mover default a retail
      const [updated] = await upsertPriceList({
        id: priceListId1,
        code: "RETAIL",
        fullName: "Precio Retail Actualizado",
        isDefault: true,
      });

      expect(updated.isDefault).toBe(true);

      // Verificar que la anterior ya no es default
      const previousDefault = await getPriceListById(defaultPriceListId);
      expect(previousDefault?.isDefault).toBe(false);

      // Restaurar para otros tests
      await upsertPriceList({
        id: defaultPriceListId,
        code: "DEFAULT",
        fullName: "Lista por Defecto",
        isDefault: true,
      });
    });

    it("should throw error when updating non-existent list", async () => {
      const { upsertPriceList } = await import("./price_list");

      await expect(
        upsertPriceList({
          id: 999999,
          code: "XX",
          fullName: "No Existe",
        })
      ).rejects.toThrow(/no encontrada|not found/i);
    });
  });

  describe("listPriceLists", () => {
    it("should return only enabled lists when activeOnly is true", async () => {
      const { listPriceLists, upsertPriceList } = await import("./price_list");

      // Crear lista deshabilitada
      await upsertPriceList({
        code: "INACTIVA",
        fullName: "Lista Inactiva",
        isEnabled: false,
      });

      const result = await listPriceLists({ activeOnly: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.every((l) => l.isEnabled)).toBe(true);
    });

    it("should return all lists when activeOnly is false", async () => {
      const { listPriceLists } = await import("./price_list");

      const result = await listPriceLists({ activeOnly: false });

      expect(result.some((l) => !l.isEnabled)).toBe(true);
    });

    it("should include usage info when requested", async () => {
      const { listPriceLists } = await import("./price_list");

      const result = await listPriceLists({
        activeOnly: false,
        includeUsageInfo: true,
      });

      expect(result[0]).toHaveProperty("itemsCount");
      expect(result[0]).toHaveProperty("clientsCount");
    });
  });

  describe("getPriceListById", () => {
    it("should return a price list by id", async () => {
      const { getPriceListById } = await import("./price_list");

      const result = await getPriceListById(priceListId1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(priceListId1);
    });

    it("should return undefined for non-existent id", async () => {
      const { getPriceListById } = await import("./price_list");

      const result = await getPriceListById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("getDefaultPriceList", () => {
    it("should return the default price list", async () => {
      const { getDefaultPriceList } = await import("./price_list");

      const result = await getDefaultPriceList();

      expect(result).toBeDefined();
      expect(result!.isDefault).toBe(true);
    });
  });

  describe("setDefaultPriceList", () => {
    it("should set a new default and return previous", async () => {
      const { setDefaultPriceList, getPriceListById, upsertPriceList } =
        await import("./price_list");

      // Asegurar que defaultPriceListId es default
      await upsertPriceList({
        id: defaultPriceListId,
        code: "DEFAULT",
        fullName: "Lista por Defecto",
        isDefault: true,
      });

      const result = await setDefaultPriceList({ id: priceListId2 });

      expect(result.success).toBe(true);
      expect(result.priceList.id).toBe(priceListId2);
      expect(result.priceList.isDefault).toBe(true);
      expect(result.previousDefault?.id).toBe(defaultPriceListId);

      // Verificar en BD
      const oldDefault = await getPriceListById(defaultPriceListId);
      expect(oldDefault?.isDefault).toBe(false);

      // Restaurar
      await setDefaultPriceList({ id: defaultPriceListId });
    });

    it("should return success if already default", async () => {
      const { setDefaultPriceList } = await import("./price_list");

      const result = await setDefaultPriceList({ id: defaultPriceListId });

      expect(result.success).toBe(true);
      expect(result.priceList.id).toBe(defaultPriceListId);
      expect(result.message).toMatch(/ya es/i);
    });

    it("should throw error for non-existent list", async () => {
      const { setDefaultPriceList } = await import("./price_list");

      await expect(setDefaultPriceList({ id: 999999 })).rejects.toThrow(
        /no encontrada|not found/i
      );
    });

    it("should throw error for disabled list", async () => {
      const { setDefaultPriceList, upsertPriceList } = await import(
        "./price_list"
      );

      const [disabled] = await upsertPriceList({
        code: "FORDISABLE",
        fullName: "Para Deshabilitar",
        isEnabled: false,
      });

      await expect(setDefaultPriceList({ id: disabled.id })).rejects.toThrow(
        /deshabilitada/i
      );
    });
  });

  describe("togglePriceList", () => {
    it("should enable a disabled list", async () => {
      const { togglePriceList, upsertPriceList } = await import("./price_list");

      const [created] = await upsertPriceList({
        code: "TOENABLE",
        fullName: "Para Habilitar",
        isEnabled: false,
      });

      const result = await togglePriceList({
        id: created.id,
        isEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.priceList.isEnabled).toBe(true);
    });

    it("should disable a non-default list", async () => {
      const { togglePriceList } = await import("./price_list");

      const result = await togglePriceList({
        id: priceListId2,
        isEnabled: false,
      });

      expect(result.success).toBe(true);
      expect(result.priceList.isEnabled).toBe(false);
    });

    it("should throw error when disabling the default list", async () => {
      const { togglePriceList } = await import("./price_list");

      await expect(
        togglePriceList({ id: defaultPriceListId, isEnabled: false })
      ).rejects.toThrow(/lista.*por defecto|no se puede deshabilitar/i);
    });

    it("should throw error for non-existent list", async () => {
      const { togglePriceList } = await import("./price_list");

      await expect(
        togglePriceList({ id: 999999, isEnabled: false })
      ).rejects.toThrow(/no encontrada|not found/i);
    });
  });

  describe("getPriceListUsageInfo", () => {
    it("should return usage info for list", async () => {
      const { getPriceListUsageInfo } = await import("./price_list");

      const usageInfo = await getPriceListUsageInfo(priceListId1);

      expect(usageInfo).toHaveProperty("itemsWithPriceCount");
      expect(usageInfo).toHaveProperty("clientsCount");
      expect(usageInfo).toHaveProperty("isDefault");
      expect(usageInfo).toHaveProperty("canDisable");
    });

    it("should indicate default list cannot be disabled", async () => {
      const { getPriceListUsageInfo } = await import("./price_list");

      const usageInfo = await getPriceListUsageInfo(defaultPriceListId);

      expect(usageInfo.isDefault).toBe(true);
      expect(usageInfo.canDisable).toBe(false);
      expect(usageInfo.reason).toMatch(/por defecto/i);
    });
  });
});
