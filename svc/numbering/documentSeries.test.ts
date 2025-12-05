import DateTime from "#utils/data/DateTime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_numbering_series_${uuid}`,
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

describe("documentSeries service", () => {
  // Helper para crear un tipo de documento
  async function createDocumentType(code: string) {
    const { upsertDocumentType } = await import("./documentType");
    return upsertDocumentType({
      code,
      name: `Test Type ${code}`,
      isEnabled: true,
    });
  }

  /**
   * B.4: No permitir startNumber > endNumber
   */
  describe("upsertDocumentSeries validations", () => {
    it("should not allow startNumber > endNumber", async () => {
      const { upsertDocumentSeries, DocumentSeriesValidationError } =
        await import("./documentSeries");

      const docType = await createDocumentType("B4");

      await expect(
        upsertDocumentSeries({
          documentTypeId: docType.id,
          seriesCode: "B4-001",
          startNumber: 100,
          endNumber: 50,
          validFrom: new DateTime("2025-01-01"),
          isActive: true,
        })
      ).rejects.toThrow(DocumentSeriesValidationError);
    });

    /**
     * B.5: Inicializar currentNumber correctamente
     */
    it("should initialize currentNumber to startNumber - 1", async () => {
      const { upsertDocumentSeries } = await import("./documentSeries");

      const docType = await createDocumentType("B5");

      const series = await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "B5-001",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      expect(series.currentNumber).toBe(0);
    });

    it("should initialize currentNumber to 99 when startNumber is 100", async () => {
      const { upsertDocumentSeries } = await import("./documentSeries");

      const docType = await createDocumentType("B5B");

      const series = await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "B5B-001",
        startNumber: 100,
        endNumber: 999,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      expect(series.currentNumber).toBe(99);
    });

    /**
     * B.6: No permitir validFrom > validTo
     */
    it("should not allow validFrom > validTo", async () => {
      const { upsertDocumentSeries, DocumentSeriesValidationError } =
        await import("./documentSeries");

      const docType = await createDocumentType("B6");

      await expect(
        upsertDocumentSeries({
          documentTypeId: docType.id,
          seriesCode: "B6-001",
          startNumber: 1,
          endNumber: 100,
          validFrom: new DateTime("2025-02-01"),
          validTo: new DateTime("2025-01-31"),
          isActive: true,
        })
      ).rejects.toThrow(DocumentSeriesValidationError);
    });

    /**
     * B.7: Permitir validTo = null como vigencia abierta
     */
    it("should allow validTo = null (open-ended validity)", async () => {
      const { upsertDocumentSeries } = await import("./documentSeries");

      const docType = await createDocumentType("B7");

      const series = await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "B7-001",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        validTo: null,
        isActive: true,
      });

      expect(series.validTo).toBeNull();
    });

    /**
     * B.8: No permitir seriesCode duplicado dentro del mismo documentType
     */
    it("should not allow duplicate seriesCode within same documentType", async () => {
      const { upsertDocumentSeries } = await import("./documentSeries");

      const docType = await createDocumentType("B8");

      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "F001",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      await expect(
        upsertDocumentSeries({
          documentTypeId: docType.id,
          seriesCode: "F001",
          startNumber: 101,
          endNumber: 200,
          validFrom: new DateTime("2025-01-01"),
          isActive: true,
        })
      ).rejects.toThrow();
    });

    /**
     * B.9: Permitir reusar seriesCode en otro documentType
     */
    it("should allow same seriesCode in different documentType", async () => {
      const { upsertDocumentSeries } = await import("./documentSeries");

      const docType1 = await createDocumentType("B9A");
      const docType2 = await createDocumentType("B9B");

      const series1 = await upsertDocumentSeries({
        documentTypeId: docType1.id,
        seriesCode: "SHARED",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      const series2 = await upsertDocumentSeries({
        documentTypeId: docType2.id,
        seriesCode: "SHARED",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      expect(series1.id).not.toBe(series2.id);
      expect(series1.seriesCode).toBe("SHARED");
      expect(series2.seriesCode).toBe("SHARED");
    });
  });

  describe("getAvailableSeriesForDocument", () => {
    /**
     * B.10: Solo series activas deben considerarse para numerar
     */
    it("should only return active series", async () => {
      const { upsertDocumentSeries, getAvailableSeriesForDocument } =
        await import("./documentSeries");

      const docType = await createDocumentType("B10");

      // Crear serie activa
      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "ACTIVE",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      // Crear serie inactiva
      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "INACTIVE",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: false,
      });

      const available = await getAvailableSeriesForDocument(
        docType.id,
        new DateTime("2025-06-01")
      );

      expect(available.some((s) => s.seriesCode === "ACTIVE")).toBe(true);
      expect(available.some((s) => s.seriesCode === "INACTIVE")).toBe(false);
    });

    /**
     * B.11: Solo series dentro de vigencia deben considerarse para numerar
     */
    it("should only return series within validity period", async () => {
      const { upsertDocumentSeries, getAvailableSeriesForDocument } =
        await import("./documentSeries");

      const docType = await createDocumentType("B11");

      // Serie expirada
      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "EXPIRED",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        validTo: new DateTime("2025-02-28"),
        isActive: true,
      });

      // Serie vigente
      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "CURRENT",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-03-01"),
        validTo: null,
        isActive: true,
      });

      // Consultar para el 1 de marzo
      const available = await getAvailableSeriesForDocument(
        docType.id,
        new DateTime("2025-03-01")
      );

      expect(available.some((s) => s.seriesCode === "EXPIRED")).toBe(false);
      expect(available.some((s) => s.seriesCode === "CURRENT")).toBe(true);
    });
  });

  describe("listDocumentSeries", () => {
    it("should filter by documentTypeId", async () => {
      const { upsertDocumentSeries, listDocumentSeries } = await import(
        "./documentSeries"
      );

      const docType1 = await createDocumentType("LIST1");
      const docType2 = await createDocumentType("LIST2");

      await upsertDocumentSeries({
        documentTypeId: docType1.id,
        seriesCode: "LIST1-001",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      await upsertDocumentSeries({
        documentTypeId: docType2.id,
        seriesCode: "LIST2-001",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      const series1 = await listDocumentSeries({ documentTypeId: docType1.id });
      const series2 = await listDocumentSeries({ documentTypeId: docType2.id });

      expect(series1.every((s) => s.documentTypeId === docType1.id)).toBe(true);
      expect(series2.every((s) => s.documentTypeId === docType2.id)).toBe(true);
    });

    it("should filter by activeOnly", async () => {
      const { upsertDocumentSeries, listDocumentSeries } = await import(
        "./documentSeries"
      );

      const docType = await createDocumentType("LISTACT");

      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "ACTIVE-LIST",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
      });

      await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "INACTIVE-LIST",
        startNumber: 101,
        endNumber: 200,
        validFrom: new DateTime("2025-01-01"),
        isActive: false,
      });

      const active = await listDocumentSeries({
        documentTypeId: docType.id,
        activeOnly: true,
      });
      const all = await listDocumentSeries({
        documentTypeId: docType.id,
        activeOnly: false,
      });

      expect(active.some((s) => s.seriesCode === "INACTIVE-LIST")).toBe(false);
      expect(all.some((s) => s.seriesCode === "INACTIVE-LIST")).toBe(true);
    });
  });

  /**
   * B.13: Solo una serie por defecto por tipo de documento
   */
  describe("default series handling", () => {
    it("should ensure only one default series per document type", async () => {
      const { upsertDocumentSeries, listDocumentSeries } = await import(
        "./documentSeries"
      );

      const docType = await createDocumentType("B13");

      // Crear primera serie por defecto
      const first = await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "DEFAULT1",
        startNumber: 1,
        endNumber: 100,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
        isDefault: true,
      });

      expect(first.isDefault).toBe(true);

      // Crear segunda serie por defecto (debería desmarcar la primera)
      const second = await upsertDocumentSeries({
        documentTypeId: docType.id,
        seriesCode: "DEFAULT2",
        startNumber: 101,
        endNumber: 200,
        validFrom: new DateTime("2025-01-01"),
        isActive: true,
        isDefault: true,
      });

      expect(second.isDefault).toBe(true);

      // Verificar que solo hay una por defecto
      const allSeries = await listDocumentSeries({
        documentTypeId: docType.id,
        activeOnly: false,
      });

      const defaultSeries = allSeries.filter((s) => s.isDefault);
      expect(defaultSeries.length).toBe(1);
      expect(defaultSeries[0].id).toBe(second.id);
    });
  });
});
