import DateTime from "#utils/data/DateTime";
import Decimal from "decimal.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests para el servicio de movimientos de inventario.
 * Cubre creación, validaciones, integración con numeración, y transaccionalidad.
 */

// IDs de setup que se inicializan en beforeAll
let inventoryDocTypeId: number;
let movementTypeEntryId: number;
let movementTypeExitId: number;
let disabledMovementTypeId: number;
let productId: number;
let productId2: number;
let categoryId: number;
let locationId: number;
let userId: number;
let seriesId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_movement_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  // 1. Crear tipo de documento de negocio para movimientos
  const { upsertDocumentType } = await import("#svc/numeration/documentType");
  const docType = await upsertDocumentType({
    code: "INV_MOV",
    name: "Movimiento de Inventario",
    isEnabled: true,
  });
  inventoryDocTypeId = docType.id;

  // 2. Crear serie de numeración
  const { upsertDocumentSeries } = await import(
    "#svc/numeration/documentSeries"
  );
  const series = await upsertDocumentSeries({
    documentTypeId: inventoryDocTypeId,
    seriesCode: "MOV-2025",
    startNumber: 1,
    endNumber: 999999,
    validFrom: new DateTime("2025-01-01"),
    validTo: null,
    isActive: true,
    isDefault: true,
    prefix: "MOV-",
    suffix: null,
  });
  seriesId = series.id;

  // 3. Crear tipos de movimiento
  const { upsertMovementType } = await import("#svc/inventory/movementType");
  const [entryType] = await upsertMovementType({
    name: "Entrada por Compra",
    factor: 1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: inventoryDocTypeId,
  });
  movementTypeEntryId = entryType.id;

  const [exitType] = await upsertMovementType({
    name: "Salida por Venta",
    factor: -1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: inventoryDocTypeId,
  });
  movementTypeExitId = exitType.id;

  const [disabledType] = await upsertMovementType({
    name: "Tipo Deshabilitado",
    factor: 1,
    affectsStock: true,
    isEnabled: false,
    documentTypeId: inventoryDocTypeId,
  });
  disabledMovementTypeId = disabledType.id;

  // 4. Crear categoría con subcategoría
  const { upsertCategory } = await import("#svc/inventory/category");
  const cat = await upsertCategory({
    fullName: "Categoría Test",
    isEnabled: true,
    subcategories: [{ fullName: "Subcategoría Test", isEnabled: true }],
  });
  categoryId = cat.id;
  const subcatId = cat.subcategories[0].id ?? 0;

  // 5. Crear productos directamente en DB (el modelo tiene campos diferentes al DTO de upsertProduct)
  const { db } = await import("#lib/db");
  const { product } = await import("#models/inventory/product");
  const [createdProduct1] = await db
    .insert(product)
    .values({
      fullName: "Producto Test 1",
      slogan: "Test Slogan 1",
      description: "Producto para tests",
      isActive: true,
      rating: 5,
      price: new Decimal("100.00"),
      categoryId,
      subcategoryId: subcatId,
      images: [],
    })
    .returning();
  productId = createdProduct1.id;

  const [createdProduct2] = await db
    .insert(product)
    .values({
      fullName: "Producto Test 2",
      slogan: "Test Slogan 2",
      description: "Producto para tests 2",
      isActive: true,
      rating: 4,
      price: new Decimal("200.00"),
      categoryId,
      subcategoryId: subcatId,
      images: [],
    })
    .returning();
  productId2 = createdProduct2.id;

  // 6. Crear ubicación
  const { upsertLocation } = await import("#svc/inventory/location");
  const [loc] = await upsertLocation({
    name: "Bodega Principal",
    isEnabled: true,
  });
  locationId = loc.id;

  // 7. Crear usuario (necesitamos crear user primero)
  const { user } = await import("#models/core/user");
  const { documentType: coreDocType } = await import(
    "#models/core/documentType"
  );

  // Crear tipo de documento de identidad
  const [idDocType] = await db
    .insert(coreDocType)
    .values({
      code: "CC",
      name: "Cédula de Ciudadanía",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    })
    .returning();

  // Crear usuario base
  const [createdUser] = await db
    .insert(user)
    .values({
      type: "P",
      documentTypeId: idDocType.id,
      documentNumber: "12345678",
      email: "test@example.com",
    })
    .returning();

  // Crear empleado
  const { default: employee } = await import("#models/staff/employee");
  const { default: person } = await import("#models/core/person");

  await db.insert(person).values({
    id: createdUser.id,
    firstName: "Test",
    lastName: "User",
  });

  await db.insert(employee).values({
    id: createdUser.id,
    hireDate: new DateTime(),
    avatarUrl: "https://example.com/avatar.png",
  });

  userId = createdUser.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("createInventoryMovement service", () => {
  /**
   * Basic creation
   */
  describe("Basic creation", () => {
    it("should create a valid movement with one detail", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { eq } = await import("drizzle-orm");

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        observation: "Entrada de mercancía",
        userId,
        details: [
          {
            productId,
            locationId,
            quantity: 10,
            unitCost: new Decimal("100.00"),
          },
        ],
      });

      // Verificar campos del movimiento
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.documentSeriesId).toBe(seriesId);
      expect(result.documentNumber).toBe(1);
      expect(result.documentNumberFull).toBe("MOV-1");

      // Verificar que se insertó una fila en inventory_movement_detail
      const details = await db
        .select()
        .from(inventoryMovementDetail)
        .where(eq(inventoryMovementDetail.movementId, result.id));

      expect(details.length).toBe(1);
      expect(details[0].productId).toBe(productId);
      expect(details[0].quantity).toBe(10);
    });

    it("should create movement with multiple details", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { eq } = await import("drizzle-orm");

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        observation: "Entrada múltiple",
        userId,
        details: [
          { productId, locationId, quantity: 5 },
          { productId: productId2, locationId, quantity: 10 },
        ],
      });

      // Verificar que se insertaron 2 detalles
      const details = await db
        .select()
        .from(inventoryMovementDetail)
        .where(eq(inventoryMovementDetail.movementId, result.id));

      expect(details.length).toBe(2);
      expect(details.every((d) => d.movementId === result.id)).toBe(true);
    });

    it("should allow null observation", async () => {
      const { createInventoryMovement } = await import("./movement");

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        // observation not provided
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      expect(result.observation).toBeNull();
    });

    it("should allow null source document fields", async () => {
      const { createInventoryMovement } = await import("./movement");

      // Sin documento origen
      const result1 = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      expect(result1.sourceDocumentType).toBeNull();
      expect(result1.sourceDocumentId).toBeNull();

      // Con documento origen
      const result2 = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        sourceDocumentType: "purchase_order",
        sourceDocumentId: 12345,
        details: [{ productId, locationId, quantity: 1 }],
      });

      expect(result2.sourceDocumentType).toBe("purchase_order");
      expect(result2.sourceDocumentId).toBe(12345);
    });
  });

  /**
   * Movement type validations
   */
  describe("Movement type validations", () => {
    it("should throw error when movement type does not exist", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      await expect(
        createInventoryMovement({
          movementTypeId: 999999,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: 1 }],
        })
      ).rejects.toThrow("Tipo de movimiento de inventario no encontrado");

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should throw error when movement type is disabled", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      // Usar el tipo de movimiento deshabilitado creado en beforeAll
      await expect(
        createInventoryMovement({
          movementTypeId: disabledMovementTypeId,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: 1 }],
        })
      ).rejects.toThrow(
        "El tipo de movimiento de inventario está deshabilitado"
      );

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    // Skipped - La FK constraint de movement_type.documentTypeId ya impide
    // crear un tipo de movimiento con documentTypeId inválido a nivel de DB.
    // No es posible crear el escenario de test porque la integridad referencial
    // lo previene correctamente.
    it.skip("should throw error when movement type has invalid documentTypeId", async () => {
      // Este escenario no puede ocurrir porque:
      // - La FK en inventory_movement_type.document_type_id impide insertar
      //   un tipo de movimiento que referencie un document_type inexistente.
      // - Esto es correcto desde el punto de vista de integridad de datos.
    });

    it("should propagate numeration errors and not leave orphan movements", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { upsertDocumentType } = await import(
        "#svc/numeration/documentType"
      );
      const { upsertMovementType } = await import(
        "#svc/inventory/movementType"
      );
      const { count, eq } = await import("drizzle-orm");
      const { inventoryMovementType } = await import(
        "#models/inventory/movement_type"
      );

      // Crear un tipo de documento DESHABILITADO
      const disabledDocType = await upsertDocumentType({
        code: "INV_DISABLED",
        name: "Documento Deshabilitado",
        isEnabled: false, // Deshabilitado!
      });

      // Crear tipo de movimiento que apunta al documento deshabilitado
      const [mvtTypeWithDisabledDoc] = await upsertMovementType({
        name: "Movimiento Doc Deshabilitado",
        factor: 1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: disabledDocType.id,
      });

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      // Debe fallar porque el documento de negocio está deshabilitado
      await expect(
        createInventoryMovement({
          movementTypeId: mvtTypeWithDisabledDoc.id,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: 1 }],
        })
      ).rejects.toThrow(); // DocumentTypeDisabledError propagado

      // Verificar que NO quedó un movimiento huérfano
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);

      // Limpiar
      await db
        .delete(inventoryMovementType)
        .where(eq(inventoryMovementType.id, mvtTypeWithDisabledDoc.id));
    });
  });

  /**
   * C. Integración con numeración
   */
  describe("Numeration integration", () => {
    it("should call getNextDocumentNumberTx with correct parameters", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { documentSequence } = await import(
        "#models/numeration/document_sequence"
      );
      const { desc } = await import("drizzle-orm");

      const movementDate = new DateTime("2025-06-15");

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate,
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      // Verificar que se creó un registro en document_sequence con los parámetros correctos
      const [sequence] = await db
        .select()
        .from(documentSequence)
        .orderBy(desc(documentSequence.id))
        .limit(1);

      // Verificar los parámetros correctos
      expect(sequence.seriesId).toBe(seriesId);
      expect(sequence.externalDocumentType).toBe("inventory_movement");
      expect(sequence.externalDocumentId).toBe(result.id.toString());
      // La fecha asignada debe coincidir con la movementDate
      expect(sequence.assignedDate.toISOString().slice(0, 10)).toBe(
        movementDate.toISOString().slice(0, 10)
      );
    });

    it("should persist numbering values correctly in movement", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { documentSeries } = await import(
        "#models/numeration/document_series"
      );
      const { eq } = await import("drizzle-orm");

      // Obtener el estado actual de la serie
      const [seriesBefore] = await db
        .select()
        .from(documentSeries)
        .where(eq(documentSeries.id, seriesId));

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      // Verificar que los valores de numeración están persistidos correctamente
      const [movement] = await db
        .select()
        .from(inventoryMovement)
        .where(eq(inventoryMovement.id, result.id));

      expect(movement.documentSeriesId).toBe(seriesId);
      expect(movement.documentNumber).toBeGreaterThan(0);
      // El fullNumber debe tener el formato correcto (prefix + number)
      expect(movement.documentNumberFull).toBe(
        `${seriesBefore.prefix ?? ""}${movement.documentNumber}${
          seriesBefore.suffix ?? ""
        }`
      );
    });

    it("should rollback transaction if error after numbering", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { documentSeries } = await import(
        "#models/numeration/document_series"
      );
      const { documentSequence } = await import(
        "#models/numeration/document_sequence"
      );
      const { count, eq } = await import("drizzle-orm");

      // Obtener estado ANTES del intento
      const [{ movementCountBefore }] = await db
        .select({ movementCountBefore: count() })
        .from(inventoryMovement);

      const [{ sequenceCountBefore }] = await db
        .select({ sequenceCountBefore: count() })
        .from(documentSequence);

      const [seriesBefore] = await db
        .select()
        .from(documentSeries)
        .where(eq(documentSeries.id, seriesId));

      // Intentar crear movimiento con productId inválido (FK violation)
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            {
              productId: 999999, // <-- ID inválido, causará FK violation
              locationId,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow();

      // Verificar rollback completo:
      // 1. No debe haber nuevo movimiento
      const [{ movementCountAfter }] = await db
        .select({ movementCountAfter: count() })
        .from(inventoryMovement);
      expect(movementCountAfter).toBe(movementCountBefore);

      // 2. No debe haber nueva secuencia (porque la tx hizo rollback)
      const [{ sequenceCountAfter }] = await db
        .select({ sequenceCountAfter: count() })
        .from(documentSequence);
      expect(sequenceCountAfter).toBe(sequenceCountBefore);

      // 3. El currentNumber de la serie NO debe haber aumentado
      const [seriesAfter] = await db
        .select()
        .from(documentSeries)
        .where(eq(documentSeries.id, seriesId));
      expect(seriesAfter.currentNumber).toBe(seriesBefore.currentNumber);
    });
  });

  /**
   * Detail validations
   */
  describe("Detail validations", () => {
    it("should throw error when details array is empty", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [], // <-- Sin detalles
        })
      ).rejects.toThrow("El movimiento debe tener al menos un detalle");

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should throw error when quantity is zero", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: 0 }], // <-- Cantidad cero
        })
      ).rejects.toThrow("La cantidad de cada detalle debe ser mayor a cero");

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should throw error when quantity is negative", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: -5 }], // <-- Cantidad negativa
        })
      ).rejects.toThrow("La cantidad de cada detalle debe ser mayor a cero");

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should rollback when product does not exist (FK violation)", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      // Intentar crear movimiento con productId inválido
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            { productId: 999999, locationId, quantity: 1 }, // <-- Producto inexistente
          ],
        })
      ).rejects.toThrow();

      // Verificar que no quedó movimiento parcial
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    // D.15: Skip - El modelo permite locationId null, por lo que no hay validación obligatoria.
    // Si en el futuro se requiere validar ubicación para movimientos que afectan stock,
    // se puede agregar esa validación al servicio.
    it.skip("should validate locationId when affectsStock is true", async () => {
      // Este escenario depende de reglas de negocio específicas.
      // Si se implementa, validaría que locationId no sea null cuando movementType.affectsStock = true.
    });

    it("should persist unitCost when provided", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { eq } = await import("drizzle-orm");

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          {
            productId,
            locationId,
            quantity: 5,
            unitCost: new Decimal("123.45"),
          },
        ],
      });

      const [detail] = await db
        .select()
        .from(inventoryMovementDetail)
        .where(eq(inventoryMovementDetail.movementId, result.id));

      expect(detail.unitCost).toBeDefined();
      // Verificar que el valor se persistió correctamente
      expect(Number(detail.unitCost)).toBeCloseTo(123.45, 2);
    });

    it("should allow null unitCost", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { eq } = await import("drizzle-orm");

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          {
            productId,
            locationId,
            quantity: 5,
            // unitCost not provided
          },
        ],
      });

      const [detail] = await db
        .select()
        .from(inventoryMovementDetail)
        .where(eq(inventoryMovementDetail.movementId, result.id));

      expect(detail.unitCost).toBeNull();
    });
  });

  /**
   * E. Business rules
   */
  describe("Business rules", () => {
    it("should throw error when movementDate is in the future", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      // Crear fecha en el futuro (mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(tomorrow),
          userId,
          details: [{ productId, locationId, quantity: 1 }],
        })
      ).rejects.toThrow("No se permiten movimientos con fecha futura");

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should allow movementDate for today", async () => {
      const { createInventoryMovement } = await import("./movement");

      // Fecha de hoy
      const today = new DateTime();

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: today,
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("should allow movementDate in the past", async () => {
      const { createInventoryMovement } = await import("./movement");

      // Fecha en el pasado (hace 30 días)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(pastDate),
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    // E.18: Skip - La validación de affectsStock depende de reglas de negocio específicas.
    // Si en el futuro se requiere que ciertos contextos exijan affectsStock = true,
    // se puede agregar la validación correspondiente.
    it.skip("should validate affectsStock in specific contexts", async () => {
      // Este escenario depende de reglas de negocio no definidas actualmente.
      // Por ejemplo: "Solo permitir tipos que afectan stock para entradas/salidas"
    });

    it("should throw error when insufficient stock for exit movement", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { stock } = await import("#models/inventory/stock");
      const { count, eq, and } = await import("drizzle-orm");

      // Limpiar stock previo para este producto/ubicación
      await db
        .delete(stock)
        .where(
          and(eq(stock.productId, productId), eq(stock.locationId, locationId))
        );

      // Crear stock con cantidad insuficiente (5 unidades)
      await db.insert(stock).values({
        productId,
        locationId,
        quantity: 5,
      });

      // Contar movimientos antes
      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      // Intentar crear movimiento de salida con cantidad mayor al stock
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeExitId, // factor = -1, affectsStock = true
          movementDate: new DateTime(),
          userId,
          details: [
            { productId, locationId, quantity: 10 }, // Pide 10, solo hay 5
          ],
        })
      ).rejects.toThrow(/Stock insuficiente/);

      // Verificar que no quedó ningún registro
      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should allow exit movement when sufficient stock", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { eq, and } = await import("drizzle-orm");

      // Limpiar y crear stock suficiente (100 unidades)
      await db
        .delete(stock)
        .where(
          and(eq(stock.productId, productId), eq(stock.locationId, locationId))
        );

      await db.insert(stock).values({
        productId,
        locationId,
        quantity: 100,
      });

      // Crear movimiento de salida con cantidad válida
      const result = await createInventoryMovement({
        movementTypeId: movementTypeExitId, // factor = -1, affectsStock = true
        movementDate: new DateTime(),
        userId,
        details: [
          { productId, locationId, quantity: 50 }, // Pide 50, hay 100
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("should not validate stock for entry movements", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { eq, and } = await import("drizzle-orm");

      // Limpiar stock (sin stock existente)
      await db
        .delete(stock)
        .where(
          and(eq(stock.productId, productId), eq(stock.locationId, locationId))
        );

      // Crear movimiento de ENTRADA sin stock previo - debe funcionar
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId, // factor = 1, affectsStock = true
        movementDate: new DateTime(),
        userId,
        details: [
          { productId, locationId, quantity: 100 }, // Entrada de 100 unidades
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });

  /**
   * F. Integridad transaccional
   */
  describe("Transactional integrity", () => {
    it("should rollback header and numeration when detail FK fails", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { documentSeries } = await import(
        "#models/numeration/document_series"
      );
      const { documentSequence } = await import(
        "#models/numeration/document_sequence"
      );
      const { count, eq } = await import("drizzle-orm");

      // Obtener estado ANTES
      const [{ movementCountBefore }] = await db
        .select({ movementCountBefore: count() })
        .from(inventoryMovement);

      const [{ detailCountBefore }] = await db
        .select({ detailCountBefore: count() })
        .from(inventoryMovementDetail);

      const [{ sequenceCountBefore }] = await db
        .select({ sequenceCountBefore: count() })
        .from(documentSequence);

      const [seriesBefore] = await db
        .select()
        .from(documentSeries)
        .where(eq(documentSeries.id, seriesId));

      // Intentar crear movimiento con productId inválido
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            { productId: 999999, locationId, quantity: 1 }, // FK error
          ],
        })
      ).rejects.toThrow();

      // Verificar rollback completo
      const [{ movementCountAfter }] = await db
        .select({ movementCountAfter: count() })
        .from(inventoryMovement);
      expect(movementCountAfter).toBe(movementCountBefore);

      const [{ detailCountAfter }] = await db
        .select({ detailCountAfter: count() })
        .from(inventoryMovementDetail);
      expect(detailCountAfter).toBe(detailCountBefore);

      const [{ sequenceCountAfter }] = await db
        .select({ sequenceCountAfter: count() })
        .from(documentSequence);
      expect(sequenceCountAfter).toBe(sequenceCountBefore);

      const [seriesAfter] = await db
        .select()
        .from(documentSeries)
        .where(eq(documentSeries.id, seriesId));
      expect(seriesAfter.currentNumber).toBe(seriesBefore.currentNumber);
    });

    it("should rollback when numeration fails", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { upsertDocumentType } = await import(
        "#svc/numeration/documentType"
      );
      const { upsertMovementType } = await import(
        "#svc/inventory/movementType"
      );
      const { inventoryMovementType } = await import(
        "#models/inventory/movement_type"
      );
      const { count, eq } = await import("drizzle-orm");

      // Crear tipo de documento SIN serie (causará NoSeriesAvailableError)
      const docTypeNoSeries = await upsertDocumentType({
        code: "INV_NO_SERIES",
        name: "Documento Sin Serie",
        isEnabled: true,
      });

      // Crear tipo de movimiento que usa ese documento
      const [mvtTypeNoSeries] = await upsertMovementType({
        name: "Movimiento Sin Serie",
        factor: 1,
        affectsStock: true,
        isEnabled: true,
        documentTypeId: docTypeNoSeries.id,
      });

      // Obtener estado ANTES
      const [{ movementCountBefore }] = await db
        .select({ movementCountBefore: count() })
        .from(inventoryMovement);

      const [{ detailCountBefore }] = await db
        .select({ detailCountBefore: count() })
        .from(inventoryMovementDetail);

      // Intentar crear movimiento (fallará en numeración)
      await expect(
        createInventoryMovement({
          movementTypeId: mvtTypeNoSeries.id,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: 1 }],
        })
      ).rejects.toThrow(); // NoSeriesAvailableError

      // Verificar que NO se creó movimiento ni detalles
      const [{ movementCountAfter }] = await db
        .select({ movementCountAfter: count() })
        .from(inventoryMovement);
      expect(movementCountAfter).toBe(movementCountBefore);

      const [{ detailCountAfter }] = await db
        .select({ detailCountAfter: count() })
        .from(inventoryMovementDetail);
      expect(detailCountAfter).toBe(detailCountBefore);

      // Limpiar
      await db
        .delete(inventoryMovementType)
        .where(eq(inventoryMovementType.id, mvtTypeNoSeries.id));
    });

    it("should never reuse same document number for two movements", async () => {
      const { createInventoryMovement } = await import("./movement");

      const result1 = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      const result2 = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ productId, locationId, quantity: 1 }],
      });

      expect(result1.documentNumber).not.toBe(result2.documentNumber);
      expect(result2.documentNumber).toBeGreaterThan(result1.documentNumber);
    });
  });

  /**
   * Concurrencia
   */
  describe("Concurrency", () => {
    it("should assign unique numbers to concurrent movements", async () => {
      const { createInventoryMovement } = await import("./movement");

      // Ejecutar 5 movimientos concurrentes
      const promises = Array.from({ length: 5 }, (_, i) =>
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ productId, locationId, quantity: i + 1 }],
        })
      );

      const results = await Promise.all(promises);

      // Todos deben tener números únicos
      const numbers = results.map((r) => r.documentNumber);
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(5);

      // Verificar que todos son consecutivos
      const sorted = [...numbers].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]).toBe(sorted[i - 1] + 1);
      }
    });
  });
});
