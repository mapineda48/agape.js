import { afterAll, describe, it, expect, beforeAll } from "vitest";
import Decimal from "decimal.js";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

let uomId1: number;
let uomId2: number;
let itemWithUomId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_uom_${uuid}`,
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

describe("UnitOfMeasureService", () => {
  describe("upsertUnitOfMeasure", () => {
    it("should create a new UOM with normalized code (uppercase, no spaces)", async () => {
      const { upsertUnitOfMeasure } = await import("./unit_of_measure");

      const [uom] = await upsertUnitOfMeasure({
        code: "  kg  ",
        fullName: "Kilogramo",
        description: "Unidad de masa",
      });

      uomId1 = uom.id;

      expect(uom).toHaveProperty("id");
      expect(uom.code).toBe("KG"); // Normalizado
      expect(uom.fullName).toBe("Kilogramo");
      expect(uom.isEnabled).toBe(true);
    });

    it("should create another UOM", async () => {
      const { upsertUnitOfMeasure } = await import("./unit_of_measure");

      const [uom] = await upsertUnitOfMeasure({
        code: "un",
        fullName: "Unidad",
      });

      uomId2 = uom.id;

      expect(uom.code).toBe("UN");
    });

    it("should update an existing UOM", async () => {
      const { upsertUnitOfMeasure, getUnitOfMeasureById } = await import(
        "./unit_of_measure"
      );

      const [updated] = await upsertUnitOfMeasure({
        id: uomId1,
        code: "KG",
        fullName: "Kilogramo (kg)",
        description: "Unidad de masa del SI",
      });

      expect(updated.id).toBe(uomId1);
      expect(updated.fullName).toBe("Kilogramo (kg)");
      expect(updated.description).toBe("Unidad de masa del SI");

      // Verificar en BD
      const fromDb = await getUnitOfMeasureById(uomId1);
      expect(fromDb?.fullName).toBe("Kilogramo (kg)");
    });

    it("should throw error on semantic duplicity (same name, different code)", async () => {
      const { upsertUnitOfMeasure } = await import("./unit_of_measure");

      await expect(
        upsertUnitOfMeasure({
          code: "KILO",
          fullName: "Kilogramo (kg)", // Ya existe con código KG
        })
      ).rejects.toThrow(/mismo nombre.*código diferente|Ya existe/i);
    });

    it("should throw error when updating non-existent UOM", async () => {
      const { upsertUnitOfMeasure } = await import("./unit_of_measure");

      await expect(
        upsertUnitOfMeasure({
          id: 999999,
          code: "XX",
          fullName: "No Existe",
        })
      ).rejects.toThrow(/no encontrada|not found/i);
    });
  });

  describe("listUnitOfMeasures", () => {
    it("should return only enabled UOMs when activeOnly is true", async () => {
      const { listUnitOfMeasures, upsertUnitOfMeasure } = await import(
        "./unit_of_measure"
      );

      // Crear UOM deshabilitada
      await upsertUnitOfMeasure({
        code: "INACT",
        fullName: "Inactiva",
        isEnabled: false,
      });

      const result = await listUnitOfMeasures({ activeOnly: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.every((u) => u.isEnabled)).toBe(true);
    });

    it("should return all UOMs when activeOnly is false", async () => {
      const { listUnitOfMeasures } = await import("./unit_of_measure");

      const result = await listUnitOfMeasures({ activeOnly: false });

      expect(result).toBeInstanceOf(Array);
      expect(result.some((u) => !u.isEnabled)).toBe(true);
    });

    it("should filter by code", async () => {
      const { listUnitOfMeasures } = await import("./unit_of_measure");

      const result = await listUnitOfMeasures({
        activeOnly: false,
        code: "KG",
      });

      expect(result.every((u) => u.code.includes("KG"))).toBe(true);
    });

    it("should include usage info when requested", async () => {
      const { listUnitOfMeasures } = await import("./unit_of_measure");

      const result = await listUnitOfMeasures({
        activeOnly: false,
        includeUsageInfo: true,
      });

      expect(result[0]).toHaveProperty("itemsCount");
      expect(result[0]).toHaveProperty("conversionsCount");
    });
  });

  describe("getUnitOfMeasureById", () => {
    it("should return a UOM by id", async () => {
      const { getUnitOfMeasureById } = await import("./unit_of_measure");

      const result = await getUnitOfMeasureById(uomId1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(uomId1);
      expect(result!.code).toBe("KG");
    });

    it("should return undefined for non-existent id", async () => {
      const { getUnitOfMeasureById } = await import("./unit_of_measure");

      const result = await getUnitOfMeasureById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("getUnitOfMeasureByCode", () => {
    it("should return a UOM by code (normalized)", async () => {
      const { getUnitOfMeasureByCode } = await import("./unit_of_measure");

      const result = await getUnitOfMeasureByCode("  kg  "); // Should normalize

      expect(result).toBeDefined();
      expect(result!.code).toBe("KG");
    });

    it("should return undefined for non-existent code", async () => {
      const { getUnitOfMeasureByCode } = await import("./unit_of_measure");

      const result = await getUnitOfMeasureByCode("NOEXISTE");

      expect(result).toBeUndefined();
    });
  });

  describe("toggleUnitOfMeasure", () => {
    it("should enable a disabled UOM", async () => {
      const { upsertUnitOfMeasure, toggleUnitOfMeasure } = await import(
        "./unit_of_measure"
      );

      const [created] = await upsertUnitOfMeasure({
        code: "LT",
        fullName: "Litro",
        isEnabled: false,
      });

      const result = await toggleUnitOfMeasure({
        id: created.id,
        isEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.unitOfMeasure.isEnabled).toBe(true);
      expect(result.message).toMatch(/habilitada/i);
    });

    it("should disable a UOM without usage", async () => {
      const { upsertUnitOfMeasure, toggleUnitOfMeasure } = await import(
        "./unit_of_measure"
      );

      const [created] = await upsertUnitOfMeasure({
        code: "MT",
        fullName: "Metro",
        isEnabled: true,
      });

      const result = await toggleUnitOfMeasure({
        id: created.id,
        isEnabled: false,
      });

      expect(result.success).toBe(true);
      expect(result.unitOfMeasure.isEnabled).toBe(false);
      expect(result.message).toMatch(/deshabilitada/i);
    });

    it("should throw error when disabling UOM used by inventory items", async () => {
      const { upsertUnitOfMeasure, toggleUnitOfMeasure } = await import(
        "./unit_of_measure"
      );
      const { db } = await import("#lib/db");
      const { item } = await import("#models/catalogs/item");
      const { inventoryItem } = await import("#models/inventory/item");

      // Crear UOM
      const [uom] = await upsertUnitOfMeasure({
        code: "CJ",
        fullName: "Caja",
        isEnabled: true,
      });

      // Crear ítem de catálogo
      const [catalogItem] = await db
        .insert(item)
        .values({
          code: `UOM-TEST-${Date.now()}`,
          fullName: "Producto Test UOM",
          type: "good",
          isEnabled: true,
          basePrice: new Decimal("10.00"),
          images: [],
        })
        .returning();

      itemWithUomId = catalogItem.id;

      // Crear ítem de inventario con esta UOM
      await db.insert(inventoryItem).values({
        itemId: catalogItem.id,
        uomId: uom.id,
      });

      // Intentar deshabilitar
      await expect(
        toggleUnitOfMeasure({ id: uom.id, isEnabled: false })
      ).rejects.toThrow(/producto.*usándola|no se puede deshabilitar/i);
    });

    it("should throw error when disabling UOM used in active conversions", async () => {
      const { upsertUnitOfMeasure, toggleUnitOfMeasure } = await import(
        "./unit_of_measure"
      );
      const { db } = await import("#lib/db");
      const { item } = await import("#models/catalogs/item");
      const { inventoryItem } = await import("#models/inventory/item");
      const { itemUom } = await import("#models/inventory/item_uom");

      // Crear dos UOMs
      const [uomBase] = await upsertUnitOfMeasure({
        code: "PZ",
        fullName: "Pieza",
        isEnabled: true,
      });

      const [uomConv] = await upsertUnitOfMeasure({
        code: "DOC",
        fullName: "Docena",
        isEnabled: true,
      });

      // Crear ítem de catálogo
      const [catalogItem] = await db
        .insert(item)
        .values({
          code: `CONV-TEST-${Date.now()}`,
          fullName: "Producto Test Conversión",
          type: "good",
          isEnabled: true,
          basePrice: new Decimal("5.00"),
          images: [],
        })
        .returning();

      // Crear ítem de inventario con UOM base
      await db.insert(inventoryItem).values({
        itemId: catalogItem.id,
        uomId: uomBase.id,
      });

      // Crear conversión activa usando la UOM de conversión
      await db.insert(itemUom).values({
        itemId: catalogItem.id,
        uomId: uomConv.id,
        conversionFactor: new Decimal("12"),
        isEnabled: true,
      });

      // Intentar deshabilitar la UOM de conversión
      await expect(
        toggleUnitOfMeasure({ id: uomConv.id, isEnabled: false })
      ).rejects.toThrow(/regla.*conversión|no se puede deshabilitar/i);
    });

    it("should throw error when toggling non-existent UOM", async () => {
      const { toggleUnitOfMeasure } = await import("./unit_of_measure");

      await expect(
        toggleUnitOfMeasure({ id: 999999, isEnabled: false })
      ).rejects.toThrow(/no encontrada|not found/i);
    });
  });

  describe("getUnitOfMeasureUsageInfo", () => {
    it("should return usage info for UOM", async () => {
      const { getUnitOfMeasureUsageInfo } = await import("./unit_of_measure");

      const usageInfo = await getUnitOfMeasureUsageInfo(uomId1);

      expect(usageInfo).toHaveProperty("inventoryItemsCount");
      expect(usageInfo).toHaveProperty("activeConversionsCount");
      expect(usageInfo).toHaveProperty("canDisable");
      expect(typeof usageInfo.canDisable).toBe("boolean");
    });
  });
});
