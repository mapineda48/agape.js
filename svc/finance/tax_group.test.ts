import { afterAll, describe, it, expect, beforeAll } from "vitest";
import Decimal from "decimal.js";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

let taxId1: number;
let taxId2: number;
let taxGroupId1: number;
let productWithTaxGroupId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_tax_group_${uuid}`,
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

describe("TaxService", () => {
  describe("upsertTax", () => {
    it("should create a new tax with uppercase code", async () => {
      const { upsertTax } = await import("./tax_group");

      const [tax] = await upsertTax({
        code: "iva19",
        fullName: "IVA 19%",
        description: "Impuesto al Valor Agregado",
        rate: new Decimal("19.00"),
      });

      taxId1 = tax.id;

      expect(tax).toHaveProperty("id");
      expect(tax.code).toBe("IVA19");
      expect(tax.rate.toString()).toBe("19");
      expect(tax.isEnabled).toBe(true);
    });

    it("should create another tax", async () => {
      const { upsertTax } = await import("./tax_group");

      const [tax] = await upsertTax({
        code: "exe",
        fullName: "Exento",
        rate: new Decimal("0.00"),
      });

      taxId2 = tax.id;

      expect(tax.code).toBe("EXE");
      expect(tax.rate.toString()).toBe("0");
    });

    it("should update an existing tax", async () => {
      const { upsertTax, getTaxById } = await import("./tax_group");

      const [updated] = await upsertTax({
        id: taxId1,
        code: "IVA19",
        fullName: "IVA 19% (General)",
        rate: new Decimal("19.00"),
        description: "Impuesto General",
      });

      expect(updated.id).toBe(taxId1);
      expect(updated.fullName).toBe("IVA 19% (General)");

      const fromDb = await getTaxById(taxId1);
      expect(fromDb?.description).toBe("Impuesto General");
    });

    it("should throw error when updating non-existent tax", async () => {
      const { upsertTax } = await import("./tax_group");

      await expect(
        upsertTax({
          id: 999999,
          code: "XX",
          fullName: "No Existe",
          rate: new Decimal("0"),
        })
      ).rejects.toThrow(/no encontrado|not found/i);
    });
  });

  describe("listTaxes", () => {
    it("should return only enabled taxes when activeOnly is true", async () => {
      const { listTaxes, upsertTax } = await import("./tax_group");

      // Crear impuesto deshabilitado
      await upsertTax({
        code: "INACT",
        fullName: "Inactivo",
        rate: new Decimal("0"),
        isEnabled: false,
      });

      const result = await listTaxes({ activeOnly: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.every((t) => t.isEnabled)).toBe(true);
    });

    it("should return all taxes when activeOnly is false", async () => {
      const { listTaxes } = await import("./tax_group");

      const result = await listTaxes({ activeOnly: false });

      expect(result.some((t) => !t.isEnabled)).toBe(true);
    });
  });
});

describe("TaxGroupService", () => {
  describe("upsertTaxGroup", () => {
    it("should create a new tax group with taxes", async () => {
      const { upsertTaxGroup } = await import("./tax_group");

      const [group] = await upsertTaxGroup({
        code: "gravado19",
        fullName: "Productos Gravados 19%",
        description: "Impuestos para productos gravados",
        taxIds: [taxId1],
      });

      taxGroupId1 = group.id;

      expect(group).toHaveProperty("id");
      expect(group.code).toBe("GRAVADO19");
      expect(group.taxes).toHaveLength(1);
      expect(group.taxes[0].id).toBe(taxId1);
      expect(group.totalRate.toString()).toBe("19");
    });

    it("should throw error when creating group without taxes", async () => {
      const { upsertTaxGroup } = await import("./tax_group");

      await expect(
        upsertTaxGroup({
          code: "EMPTY",
          fullName: "Grupo Vacío",
          taxIds: [],
        })
      ).rejects.toThrow(/al menos un impuesto/i);
    });

    it("should throw error when taxIds do not exist", async () => {
      const { upsertTaxGroup } = await import("./tax_group");

      await expect(
        upsertTaxGroup({
          code: "INVALID",
          fullName: "Grupo Inválido",
          taxIds: [999999],
        })
      ).rejects.toThrow(/no existen/i);
    });

    it("should throw error when using disabled taxes", async () => {
      const { upsertTaxGroup, upsertTax } = await import("./tax_group");

      const [disabledTax] = await upsertTax({
        code: "DISABLED",
        fullName: "Impuesto Deshabilitado",
        rate: new Decimal("5"),
        isEnabled: false,
      });

      await expect(
        upsertTaxGroup({
          code: "WITHDISABLED",
          fullName: "Con Impuesto Deshabilitado",
          taxIds: [disabledTax.id],
        })
      ).rejects.toThrow(/deshabilitados/i);
    });

    it("should update a tax group and replace taxes", async () => {
      const { upsertTaxGroup, getTaxGroupById } = await import("./tax_group");

      // Actualizar para tener ambos impuestos
      const [updated] = await upsertTaxGroup({
        id: taxGroupId1,
        code: "GRAVADO19",
        fullName: "Productos Gravados 19% + Exento",
        taxIds: [taxId1, taxId2],
      });

      expect(updated.taxes).toHaveLength(2);
      expect(updated.totalRate.toString()).toBe("19"); // 19 + 0 = 19

      // Verificar que se reemplazaron
      const fromDb = await getTaxGroupById(taxGroupId1);
      expect(fromDb?.taxes).toHaveLength(2);
    });
  });

  describe("listTaxGroups", () => {
    it("should return groups with taxes when includeTaxes is true", async () => {
      const { listTaxGroups } = await import("./tax_group");

      const result = await listTaxGroups({
        activeOnly: false,
        includeTaxes: true,
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty("taxes");
      expect(result[0]).toHaveProperty("totalRate");
    });

    it("should return only active groups when activeOnly is true", async () => {
      const { listTaxGroups } = await import("./tax_group");

      const result = await listTaxGroups({ activeOnly: true });

      expect(result.every((g) => g.isEnabled)).toBe(true);
    });
  });

  describe("getTaxGroupById", () => {
    it("should return a tax group with taxes", async () => {
      const { getTaxGroupById } = await import("./tax_group");

      const result = await getTaxGroupById(taxGroupId1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(taxGroupId1);
      expect(result!.taxes.length).toBeGreaterThanOrEqual(1);
    });

    it("should return undefined for non-existent id", async () => {
      const { getTaxGroupById } = await import("./tax_group");

      const result = await getTaxGroupById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("toggleTaxGroup", () => {
    it("should enable a disabled group", async () => {
      const { upsertTaxGroup, toggleTaxGroup } = await import("./tax_group");

      const [created] = await upsertTaxGroup({
        code: "TOGGLE",
        fullName: "Para Toggle",
        taxIds: [taxId2],
        isEnabled: false,
      });

      const result = await toggleTaxGroup({
        id: created.id,
        isEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.taxGroup.isEnabled).toBe(true);
    });

    it("should disable a group without products", async () => {
      const { upsertTaxGroup, toggleTaxGroup } = await import("./tax_group");

      const [created] = await upsertTaxGroup({
        code: "TODISABLE",
        fullName: "Para Deshabilitar",
        taxIds: [taxId2],
        isEnabled: true,
      });

      const result = await toggleTaxGroup({
        id: created.id,
        isEnabled: false,
      });

      expect(result.success).toBe(true);
      expect(result.taxGroup.isEnabled).toBe(false);
    });

    it("should throw error when disabling group used by products", async () => {
      const { upsertTaxGroup, toggleTaxGroup } = await import("./tax_group");
      const { db } = await import("#lib/db");
      const { item } = await import("#models/catalogs/item");

      // Crear grupo para productos
      const [group] = await upsertTaxGroup({
        code: "FORPRODUCT",
        fullName: "Para Productos",
        taxIds: [taxId1],
        isEnabled: true,
      });

      // Crear producto con este grupo
      const [product] = await db
        .insert(item)
        .values({
          code: `PROD-TAX-${Date.now()}`,
          fullName: "Producto con Grupo de Impuestos",
          type: "good",
          isEnabled: true,
          basePrice: new Decimal("100.00"),
          images: [],
          taxGroupId: group.id,
        })
        .returning();

      productWithTaxGroupId = product.id;

      // Intentar deshabilitar
      await expect(
        toggleTaxGroup({ id: group.id, isEnabled: false })
      ).rejects.toThrow(/producto.*usándolo|no se puede deshabilitar/i);
    });

    it("should throw error when toggling non-existent group", async () => {
      const { toggleTaxGroup } = await import("./tax_group");

      await expect(
        toggleTaxGroup({ id: 999999, isEnabled: false })
      ).rejects.toThrow(/no encontrado|not found/i);
    });
  });

  describe("getTaxGroupUsageInfo", () => {
    it("should return usage info for group", async () => {
      const { getTaxGroupUsageInfo } = await import("./tax_group");

      const usageInfo = await getTaxGroupUsageInfo(taxGroupId1);

      expect(usageInfo).toHaveProperty("productsCount");
      expect(usageInfo).toHaveProperty("canDisable");
      expect(typeof usageInfo.canDisable).toBe("boolean");
    });
  });
});
