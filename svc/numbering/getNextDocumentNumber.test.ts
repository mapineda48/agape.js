import DateTime from "#utils/data/DateTime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_numbering_main_${uuid}`],
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

describe("getNextDocumentNumber service", () => {
  // Helpers
  async function createDocumentType(code: string, isEnabled = true) {
    const { upsertDocumentType } = await import("./documentType");
    return upsertDocumentType({
      code,
      name: `Test Type ${code}`,
      isEnabled,
    });
  }

  async function createSeries(
    documentTypeId: number,
    options: {
      seriesCode: string;
      startNumber?: number;
      endNumber?: number;
      validFrom?: DateTime;
      validTo?: DateTime | null;
      isActive?: boolean;
      isDefault?: boolean;
      prefix?: string | null;
      suffix?: string | null;
    }
  ) {
    const { upsertDocumentSeries } = await import("./documentSeries");
    return upsertDocumentSeries({
      documentTypeId,
      seriesCode: options.seriesCode,
      startNumber: options.startNumber ?? 1,
      endNumber: options.endNumber ?? 999999,
      validFrom: options.validFrom ?? new DateTime("2025-01-01"),
      validTo: options.validTo ?? null,
      isActive: options.isActive ?? true,
      isDefault: options.isDefault ?? false,
      prefix: options.prefix ?? null,
      suffix: options.suffix ?? null,
    });
  }

  /**
   * C1. Selección de serie
   */
  describe("series selection", () => {
    /**
     * C.14: Seleccionar la serie por defecto cuando hay varias vigentes
     */
    it("should select the default series when multiple are available", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("C14");

      // Serie no default
      await createSeries(docType.id, {
        seriesCode: "C14-A",
        isDefault: false,
      });

      // Serie default
      const defaultSeries = await createSeries(docType.id, {
        seriesCode: "C14-B",
        isDefault: true,
      });

      const result = await getNextDocumentNumber({
        documentTypeCode: "C14",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      expect(result.seriesId).toBe(defaultSeries.id);
    });

    /**
     * C.15: Seleccionar la serie por fecha de vigencia
     */
    it("should select series by validity date", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("C15");

      // Serie A: vigente desde enero
      const seriesA = await createSeries(docType.id, {
        seriesCode: "C15-A",
        validFrom: new DateTime("2025-01-01"),
      });

      // Serie B: vigente desde junio
      await createSeries(docType.id, {
        seriesCode: "C15-B",
        validFrom: new DateTime("2025-06-01"),
      });

      // Consultar en marzo (solo A es vigente)
      const result = await getNextDocumentNumber({
        documentTypeCode: "C15",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-03-01"),
      });

      expect(result.seriesId).toBe(seriesA.id);
    });

    /**
     * C.16: Error cuando no existe el documentType
     */
    it("should throw error when document type does not exist", async () => {
      const { getNextDocumentNumber, DocumentTypeNotFoundError } = await import(
        "./getNextDocumentNumber"
      );

      await expect(
        getNextDocumentNumber({
          documentTypeCode: "NO_EXISTE",
          externalDocumentType: "test",
          externalDocumentId: "test-1",
        })
      ).rejects.toThrow(DocumentTypeNotFoundError);
    });

    /**
     * C.17: Error cuando no hay series disponibles
     */
    it("should throw error when no series are available", async () => {
      const { getNextDocumentNumber, NoSeriesAvailableError } = await import(
        "./getNextDocumentNumber"
      );

      const docType = await createDocumentType("C17");

      // Crear serie inactiva
      await createSeries(docType.id, {
        seriesCode: "C17-INACTIVE",
        isActive: false,
      });

      await expect(
        getNextDocumentNumber({
          documentTypeCode: "C17",
          externalDocumentType: "test",
          externalDocumentId: "test-1",
          today: new DateTime("2025-06-01"),
        })
      ).rejects.toThrow(NoSeriesAvailableError);
    });
  });

  /**
   * C2. Asignación básica del número
   */
  describe("number assignment", () => {
    /**
     * C.18: Asignar el primer número igual a startNumber
     */
    it("should assign first number equal to startNumber", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("C18");

      await createSeries(docType.id, {
        seriesCode: "C18-001",
        startNumber: 100,
        endNumber: 999,
      });

      const result = await getNextDocumentNumber({
        documentTypeCode: "C18",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      expect(result.assignedNumber).toBe(100);
    });

    /**
     * C.19: Incrementar correctamente en llamadas sucesivas
     */
    it("should increment correctly on successive calls", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("C19");

      await createSeries(docType.id, {
        seriesCode: "C19-001",
        startNumber: 1,
        endNumber: 999,
      });

      const result1 = await getNextDocumentNumber({
        documentTypeCode: "C19",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      const result2 = await getNextDocumentNumber({
        documentTypeCode: "C19",
        externalDocumentType: "test",
        externalDocumentId: "test-2",
        today: new DateTime("2025-06-01"),
      });

      const result3 = await getNextDocumentNumber({
        documentTypeCode: "C19",
        externalDocumentType: "test",
        externalDocumentId: "test-3",
        today: new DateTime("2025-06-01"),
      });

      expect(result1.assignedNumber).toBe(1);
      expect(result2.assignedNumber).toBe(2);
      expect(result3.assignedNumber).toBe(3);
    });

    /**
     * C.20: Respetar prefijo y sufijo en fullNumber
     */
    it("should include prefix and suffix in fullNumber", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("C20");

      await createSeries(docType.id, {
        seriesCode: "C20-001",
        startNumber: 123,
        endNumber: 999,
        prefix: "FAC-",
        suffix: "-2025",
      });

      const result = await getNextDocumentNumber({
        documentTypeCode: "C20",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      expect(result.fullNumber).toBe("FAC-123-2025");
    });

    /**
     * C.21: Respetar formato cuando no hay prefijo ni sufijo
     */
    it("should format correctly without prefix or suffix", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("C21");

      await createSeries(docType.id, {
        seriesCode: "C21-001",
        startNumber: 50,
        endNumber: 999,
        prefix: null,
        suffix: null,
      });

      const result = await getNextDocumentNumber({
        documentTypeCode: "C21",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      expect(result.fullNumber).toBe("50");
    });
  });

  /**
   * C3. Rango y fin de serie
   */
  describe("range and series exhaustion", () => {
    /**
     * C.22: Lanzar error cuando la serie se queda sin números
     */
    it("should throw error when series is exhausted", async () => {
      const { getNextDocumentNumber, NoSeriesAvailableError } = await import(
        "./getNextDocumentNumber"
      );
      const { upsertDocumentSeries } = await import("./documentSeries");

      const docType = await createDocumentType("C22");

      // Crear serie con rango muy pequeño
      const series = await createSeries(docType.id, {
        seriesCode: "C22-001",
        startNumber: 1,
        endNumber: 2,
      });

      // Consumir ambos números
      await getNextDocumentNumber({
        documentTypeCode: "C22",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      await getNextDocumentNumber({
        documentTypeCode: "C22",
        externalDocumentType: "test",
        externalDocumentId: "test-2",
        today: new DateTime("2025-06-01"),
      });

      // El tercero debe fallar
      await expect(
        getNextDocumentNumber({
          documentTypeCode: "C22",
          externalDocumentType: "test",
          externalDocumentId: "test-3",
          today: new DateTime("2025-06-01"),
        })
      ).rejects.toThrow(NoSeriesAvailableError);
    });

    /**
     * B.12: No permitir que currentNumber se desborde del rango
     */
    it("should not allow currentNumber to exceed endNumber", async () => {
      const { getNextDocumentNumber, NoSeriesAvailableError } = await import(
        "./getNextDocumentNumber"
      );

      const docType = await createDocumentType("B12");

      await createSeries(docType.id, {
        seriesCode: "B12-001",
        startNumber: 1,
        endNumber: 1, // Solo un número disponible
      });

      // Primer número (debería funcionar)
      const result = await getNextDocumentNumber({
        documentTypeCode: "B12",
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        today: new DateTime("2025-06-01"),
      });

      expect(result.assignedNumber).toBe(1);

      // Segundo número (debería fallar)
      await expect(
        getNextDocumentNumber({
          documentTypeCode: "B12",
          externalDocumentType: "test",
          externalDocumentId: "test-2",
          today: new DateTime("2025-06-01"),
        })
      ).rejects.toThrow(NoSeriesAvailableError);
    });
  });

  /**
   * D. Pruebas sobre document_sequence (auditoría)
   */
  describe("document_sequence auditing", () => {
    /**
     * D.24: Registrar un document_sequence por cada número asignado
     */
    it("should create document_sequence record for each assignment", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");
      const { db } = await import("#lib/db");
      const { documentSequence } = await import(
        "#models/numbering/document_sequence"
      );
      const { eq, and } = await import("drizzle-orm");

      const docType = await createDocumentType("D24");

      const series = await createSeries(docType.id, {
        seriesCode: "D24-001",
      });

      const result = await getNextDocumentNumber({
        documentTypeCode: "D24",
        externalDocumentType: "invoice",
        externalDocumentId: "inv-123",
        today: new DateTime("2025-06-15"),
      });

      // Verificar registro en document_sequence
      const [record] = await db
        .select()
        .from(documentSequence)
        .where(
          and(
            eq(documentSequence.seriesId, series.id),
            eq(documentSequence.assignedNumber, result.assignedNumber)
          )
        );

      expect(record).toBeDefined();
      expect(record.externalDocumentType).toBe("invoice");
      expect(record.externalDocumentId).toBe("inv-123");
    });

    /**
     * D.25: Garantizar unicidad (seriesId, assignedNumber)
     * Este test verifica que el constraint único existe
     */
    it("should enforce uniqueness of (seriesId, assignedNumber)", async () => {
      const { db } = await import("#lib/db");
      const { documentSequence } = await import(
        "#models/numbering/document_sequence"
      );

      const docType = await createDocumentType("D25");

      const series = await createSeries(docType.id, {
        seriesCode: "D25-001",
      });

      // Insertar un registro
      await db.insert(documentSequence).values({
        seriesId: series.id,
        assignedNumber: 100,
        externalDocumentType: "test",
        externalDocumentId: "test-1",
        assignedDate: new DateTime(),
      });

      // Intentar insertar otro con mismo (seriesId, assignedNumber)
      await expect(
        db.insert(documentSequence).values({
          seriesId: series.id,
          assignedNumber: 100,
          externalDocumentType: "test",
          externalDocumentId: "test-2",
          assignedDate: new DateTime(),
        })
      ).rejects.toThrow();
    });

    /**
     * D.26: Permitir mismo externalDocumentId en distintas series
     */
    it("should allow same externalDocumentId in different series", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType1 = await createDocumentType("D26A");
      const docType2 = await createDocumentType("D26B");

      await createSeries(docType1.id, { seriesCode: "D26A-001" });
      await createSeries(docType2.id, { seriesCode: "D26B-001" });

      // Usar el mismo externalDocumentId en ambas series
      const result1 = await getNextDocumentNumber({
        documentTypeCode: "D26A",
        externalDocumentType: "invoice",
        externalDocumentId: "same-doc-id",
        today: new DateTime("2025-06-01"),
      });

      const result2 = await getNextDocumentNumber({
        documentTypeCode: "D26B",
        externalDocumentType: "invoice",
        externalDocumentId: "same-doc-id",
        today: new DateTime("2025-06-01"),
      });

      expect(result1.assignedNumber).toBeDefined();
      expect(result2.assignedNumber).toBeDefined();
    });

    /**
     * D.27: Permitir distintos números para el mismo documento externo
     */
    it("should allow different numbers for the same external document", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType1 = await createDocumentType("D27A");
      const docType2 = await createDocumentType("D27B");

      await createSeries(docType1.id, { seriesCode: "D27A-001" });
      await createSeries(docType2.id, { seriesCode: "D27B-001" });

      // El mismo externalDocumentId genera números en diferentes tipos
      const result1 = await getNextDocumentNumber({
        documentTypeCode: "D27A",
        externalDocumentType: "movement",
        externalDocumentId: "mov-100",
        today: new DateTime("2025-06-01"),
      });

      const result2 = await getNextDocumentNumber({
        documentTypeCode: "D27B",
        externalDocumentType: "movement",
        externalDocumentId: "mov-100",
        today: new DateTime("2025-06-01"),
      });

      // Ambos tienen números asignados (pueden ser iguales pero de diferentes series)
      expect(result1.assignedNumber).toBe(1);
      expect(result2.assignedNumber).toBe(1);
      expect(result1.seriesId).not.toBe(result2.seriesId);
    });
  });

  /**
   * E. Concurrencia
   */
  describe("concurrency", () => {
    /**
     * E.28: Dos llamadas concurrentes nunca reciben el mismo número
     */
    it("should never assign same number to concurrent calls", async () => {
      const { getNextDocumentNumber } = await import("./getNextDocumentNumber");

      const docType = await createDocumentType("E28");

      await createSeries(docType.id, {
        seriesCode: "E28-001",
        startNumber: 1,
        endNumber: 1000,
      });

      // Ejecutar 10 llamadas concurrentes
      const promises = Array.from({ length: 10 }, (_, i) =>
        getNextDocumentNumber({
          documentTypeCode: "E28",
          externalDocumentType: "test",
          externalDocumentId: `concurrent-${i}`,
          today: new DateTime("2025-06-01"),
        })
      );

      const results = await Promise.all(promises);

      // Verificar que todos los números son únicos
      const numbers = results.map((r) => r.assignedNumber);
      const uniqueNumbers = new Set(numbers);

      expect(uniqueNumbers.size).toBe(10);

      // Verificar que los números son consecutivos (1-10)
      const sorted = numbers.sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    /**
     * E.29: Las llamadas concurrentes respetan el límite del endNumber
     */
    it("should respect endNumber limit in concurrent calls", async () => {
      const { getNextDocumentNumber, NoSeriesAvailableError } = await import(
        "./getNextDocumentNumber"
      );

      const docType = await createDocumentType("E29");

      await createSeries(docType.id, {
        seriesCode: "E29-001",
        startNumber: 1,
        endNumber: 2, // Solo 2 números disponibles
      });

      // Ejecutar 3 llamadas concurrentes (solo 2 deberían tener éxito)
      const promises = Array.from({ length: 3 }, (_, i) =>
        getNextDocumentNumber({
          documentTypeCode: "E29",
          externalDocumentType: "test",
          externalDocumentId: `limit-${i}`,
          today: new DateTime("2025-06-01"),
        }).catch((e) => e)
      );

      const results = await Promise.all(promises);

      // Contar éxitos y errores
      const successes = results.filter((r) => !(r instanceof Error));
      const errors = results.filter((r) => r instanceof NoSeriesAvailableError);

      expect(successes.length).toBe(2);
      expect(errors.length).toBe(1);

      // Verificar que los números asignados son 1 y 2
      const numbers = successes.map((r: any) => r.assignedNumber).sort();
      expect(numbers).toEqual([1, 2]);
    });
  });

  /**
   * F. Reglas adicionales de negocio
   */
  describe("business rules", () => {
    /**
     * F.30: No permitir numerar si el business_document_type está deshabilitado
     */
    it("should not allow numbering if document type is disabled", async () => {
      const { getNextDocumentNumber, DocumentTypeDisabledError } = await import(
        "./getNextDocumentNumber"
      );

      // Crear tipo deshabilitado
      const docType = await createDocumentType("F30", false);

      await createSeries(docType.id, {
        seriesCode: "F30-001",
      });

      await expect(
        getNextDocumentNumber({
          documentTypeCode: "F30",
          externalDocumentType: "test",
          externalDocumentId: "test-1",
          today: new DateTime("2025-06-01"),
        })
      ).rejects.toThrow(DocumentTypeDisabledError);
    });
  });
});
