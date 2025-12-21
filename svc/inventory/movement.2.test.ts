import DateTime from "#utils/data/DateTime";
import Decimal from "decimal.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests de integración para la Fase 3 - Inventario Ledger
 *
 * Épica 3.1 - Posteo de movimientos (core)
 * Épica 3.2 - Lotes/seriales
 */

// Setup IDs
let inventoryDocTypeId: number;
let movementTypeEntryId: number;
let movementTypeExitId: number;
let itemId: number;
let itemWithLotId: number;
let serviceItemId: number;
let locationId: number;
let locationId2: number;
let userId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_phase3_${uuid}`],
    env: "vitest",
    skipSeeds: true,
  });

  // Setup básico
  const { upsertDocumentType } = await import("#svc/numbering/documentType");
  const docType = await upsertDocumentType({
    code: "INV_P3",
    name: "Movimiento Phase 3",
    isEnabled: true,
  });
  inventoryDocTypeId = docType.id;

  const { upsertDocumentSeries } = await import(
    "#svc/numbering/documentSeries"
  );
  await upsertDocumentSeries({
    documentTypeId: inventoryDocTypeId,
    seriesCode: "P3-2025",
    startNumber: 1,
    endNumber: 999999,
    validFrom: new DateTime("2025-01-01"),
    validTo: null,
    isActive: true,
    isDefault: true,
    prefix: "P3-",
    suffix: null,
  });

  const { upsertMovementType } = await import("#svc/inventory/movementType");
  const [entryType] = await upsertMovementType({
    name: "Entrada P3",
    factor: 1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: inventoryDocTypeId,
  });
  movementTypeEntryId = entryType.id;

  const [exitType] = await upsertMovementType({
    name: "Salida P3",
    factor: -1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: inventoryDocTypeId,
  });
  movementTypeExitId = exitType.id;

  const { upsertCategory } = await import("#svc/catalogs/category");
  const [cat] = await upsertCategory({ fullName: "Cat P3", isEnabled: true });

  const { db } = await import("#lib/db");
  const { item } = await import("#models/catalogs/item");
  const { inventoryItem } = await import("#models/inventory/item");
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");

  await db.insert(unitOfMeasure).values({
    id: 1,
    code: "UN",
    fullName: "Unidad",
    isEnabled: true,
  });

  // Item normal (good) sin requerimiento de lote
  const [createdItem1] = await db
    .insert(item)
    .values({
      code: "ITEM-P3-001",
      fullName: "Ítem P3 Normal",
      type: "good",
      isEnabled: true,
      basePrice: new Decimal("100.00"),
      categoryId: cat.id,
      images: [],
    })
    .returning();
  itemId = createdItem1.id;
  await db.insert(inventoryItem).values({
    itemId: createdItem1.id,
    uomId: 1,
    requiresLot: false,
  });

  // Item con lote obligatorio (good)
  const [createdItem2] = await db
    .insert(item)
    .values({
      code: "ITEM-P3-LOT",
      fullName: "Ítem P3 Con Lote",
      type: "good",
      isEnabled: true,
      basePrice: new Decimal("200.00"),
      categoryId: cat.id,
      images: [],
    })
    .returning();
  itemWithLotId = createdItem2.id;
  await db.insert(inventoryItem).values({
    itemId: createdItem2.id,
    uomId: 1,
    requiresLot: true,
  });

  // Item tipo servicio (no inventariable)
  const [createdService] = await db
    .insert(item)
    .values({
      code: "SVC-P3-001",
      fullName: "Servicio P3",
      type: "service",
      isEnabled: true,
      basePrice: new Decimal("50.00"),
      categoryId: cat.id,
      images: [],
    })
    .returning();
  serviceItemId = createdService.id;
  // NO creamos inventory_item porque es un servicio

  // Ubicaciones
  const { upsertLocation } = await import("#svc/inventory/location");
  const [loc1] = await upsertLocation({
    name: "Bodega Origen",
    code: "BOD-P3-1",
    isEnabled: true,
  });
  locationId = loc1.id;

  const [loc2] = await upsertLocation({
    name: "Bodega Destino",
    code: "BOD-P3-2",
    isEnabled: true,
  });
  locationId2 = loc2.id;

  // Usuario
  const { user } = await import("#models/core/user");
  const { documentType: coreDocType } = await import(
    "#models/core/documentType"
  );
  const employee = await import("#models/hr/employee");
  const person = await import("#models/core/person");

  const [idDocType] = await db
    .insert(coreDocType)
    .values({
      code: "CC-P3",
      name: "Cédula P3",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    })
    .returning();

  const [createdUser] = await db
    .insert(user)
    .values({
      type: "person",
      documentTypeId: idDocType.id,
      documentNumber: "P3-12345",
    })
    .returning();

  await db.insert(person.default).values({
    id: createdUser.id,
    firstName: "Test",
    lastName: "P3",
  });

  await db.insert(employee.default).values({
    id: createdUser.id,
    hireDate: new DateTime(),
    avatarUrl: "https://example.com/avatar.png",
  });

  userId = createdUser.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");
  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("Fase 3 - Épica 3.1: Posteo de movimientos", () => {
  describe("UC-10: Validación de ítems inventariables", () => {
    it("debe rechazar mover un ítem de tipo servicio (no inventariable)", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { count } = await import("drizzle-orm");

      const [{ totalBefore }] = await db
        .select({ totalBefore: count() })
        .from(inventoryMovement);

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ itemId: serviceItemId, locationId, quantity: 5 }],
        })
      ).rejects.toThrow(/no es inventariable/);

      const [{ totalAfter }] = await db
        .select({ totalAfter: count() })
        .from(inventoryMovement);
      expect(totalAfter).toBe(totalBefore);
    });

    it("debe rechazar un ítem que no tiene inventory_item configurado", async () => {
      const { createInventoryMovement } = await import("./movement");

      // serviceItemId tiene catalogs_item pero NO inventory_item
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ itemId: serviceItemId, locationId, quantity: 5 }],
        })
      ).rejects.toThrow(/no es inventariable|no está configurado/);
    });
  });

  describe("UC-10: Atomicidad", () => {
    it("si falla una línea de detalle, no se afecta ningún registro", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { inventoryMovementDetail } = await import(
        "#models/inventory/movement_detail"
      );
      const { stock } = await import("#models/inventory/stock");
      const { count, and, eq } = await import("drizzle-orm");

      // Verificar estado inicial
      const [{ movsBefore }] = await db
        .select({ movsBefore: count() })
        .from(inventoryMovement);
      const [{ detsBefore }] = await db
        .select({ detsBefore: count() })
        .from(inventoryMovementDetail);

      // Primer ítem válido, segundo ítem inválido (servicio)
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            { itemId, locationId, quantity: 100 }, // Válido
            { itemId: serviceItemId, locationId, quantity: 5 }, // Inválido
          ],
        })
      ).rejects.toThrow();

      // Verificar que NO se creó ningún movimiento ni detalle
      const [{ movsAfter }] = await db
        .select({ movsAfter: count() })
        .from(inventoryMovement);
      const [{ detsAfter }] = await db
        .select({ detsAfter: count() })
        .from(inventoryMovementDetail);

      expect(movsAfter).toBe(movsBefore);
      expect(detsAfter).toBe(detsBefore);
    });
  });

  describe("UC-10: Cantidades inválidas", () => {
    it("debe rechazar cantidad cero", async () => {
      const { createInventoryMovement } = await import("./movement");

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ itemId, locationId, quantity: 0 }],
        })
      ).rejects.toThrow(/mayor a cero/);
    });

    it("debe rechazar cantidad negativa", async () => {
      const { createInventoryMovement } = await import("./movement");

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [{ itemId, locationId, quantity: -10 }],
        })
      ).rejects.toThrow(/mayor a cero/);
    });
  });

  describe("UC-10: Transferencias", () => {
    it("debe transferir ítem de una ubicación a otra en una sola transacción", async () => {
      const { createInventoryMovement, createInventoryTransfer } = await import(
        "./movement"
      );
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { and, eq } = await import("drizzle-orm");

      // 1. Crear entrada inicial en ubicación 1 (con autoPost para afectar stock)
      await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 100, unitCost: new Decimal("10.00") },
        ],
        autoPost: true, // Para que afecte stock inmediatamente
      });

      // 2. Transferir 30 unidades de loc1 a loc2
      const transfer = await createInventoryTransfer({
        exitMovementTypeId: movementTypeExitId,
        entryMovementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        observation: "Transferencia de prueba",
        details: [
          {
            itemId,
            sourceLocationId: locationId,
            destinationLocationId: locationId2,
            quantity: 30,
          },
        ],
      });

      expect(transfer.exitMovementId).toBeDefined();
      expect(transfer.entryMovementId).toBeDefined();
      expect(transfer.exitMovementNumber).toContain("P3-");
      expect(transfer.entryMovementNumber).toContain("P3-");

      // 3. Verificar stock en ambas ubicaciones
      const [stockLoc1] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));
      const [stockLoc2] = await db
        .select()
        .from(stock)
        .where(
          and(eq(stock.itemId, itemId), eq(stock.locationId, locationId2))
        );

      expect(Number(stockLoc1.quantity)).toBe(70); // 100 - 30
      expect(Number(stockLoc2.quantity)).toBe(30); // 0 + 30
    });

    it("debe fallar transferencia si no hay stock suficiente (atomicidad)", async () => {
      const { createInventoryTransfer } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryMovement } = await import("#models/inventory/movement");
      const { stock } = await import("#models/inventory/stock");
      const { count, and, eq } = await import("drizzle-orm");

      // Estado antes
      const [{ movsBefore }] = await db
        .select({ movsBefore: count() })
        .from(inventoryMovement);

      // Intentar transferir más de lo disponible
      await expect(
        createInventoryTransfer({
          exitMovementTypeId: movementTypeExitId,
          entryMovementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            {
              itemId,
              sourceLocationId: locationId,
              destinationLocationId: locationId2,
              quantity: 9999, // Más de lo que hay
            },
          ],
        })
      ).rejects.toThrow(/Stock insuficiente/);

      // Verificar que NO se creó ningún movimiento
      const [{ movsAfter }] = await db
        .select({ movsAfter: count() })
        .from(inventoryMovement);
      expect(movsAfter).toBe(movsBefore);
    });

    it("debe fallar si origen y destino son iguales", async () => {
      const { createInventoryTransfer } = await import("./movement");

      await expect(
        createInventoryTransfer({
          exitMovementTypeId: movementTypeExitId,
          entryMovementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            {
              itemId,
              sourceLocationId: locationId,
              destinationLocationId: locationId, // Mismo destino
              quantity: 10,
            },
          ],
        })
      ).rejects.toThrow(/origen y destino no pueden ser iguales/);
    });
  });
});

describe("Fase 3 - Épica 3.2: Lotes/Seriales", () => {
  describe("UC-11: Recepción con lote", () => {
    it("si ítem requiere lote y no se provee, debe fallar", async () => {
      const { createInventoryMovement } = await import("./movement");

      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            {
              itemId: itemWithLotId,
              locationId,
              quantity: 10,
              // Sin lotId ni lotNumber
            },
          ],
        })
      ).rejects.toThrow(/requiere número de lote obligatorio/);
    });

    it("si ítem no requiere lote, lote es opcional", async () => {
      const { createInventoryMovement } = await import("./movement");

      // El itemId normal no requiere lote, debe funcionar sin lote
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          {
            itemId,
            locationId,
            quantity: 20,
            // Sin lote - OK
          },
        ],
      });

      expect(result.movementId).toBeDefined();
    });

    it("si ítem requiere lote y se provee lotNumber, debe crear/encontrar el lote", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryLot } = await import("#models/inventory/lot");
      const { and, eq } = await import("drizzle-orm");

      const lotNumber = "LOTE-P3-001";

      // Primera vez: debe crear el lote
      const result1 = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          {
            itemId: itemWithLotId,
            locationId,
            quantity: 10,
            lotNumber,
            lotExpirationDate: new DateTime("2026-12-31"),
          },
        ],
      });

      expect(result1.movementId).toBeDefined();

      // Verificar que se creó el lote
      const [lot] = await db
        .select()
        .from(inventoryLot)
        .where(
          and(
            eq(inventoryLot.itemId, itemWithLotId),
            eq(inventoryLot.lotNumber, lotNumber)
          )
        );

      expect(lot).toBeDefined();
      expect(lot.lotNumber).toBe(lotNumber);

      // Segunda vez: debe encontrar el lote existente
      const result2 = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          {
            itemId: itemWithLotId,
            locationId,
            quantity: 5,
            lotNumber, // Mismo número de lote
          },
        ],
      });

      expect(result2.movementId).toBeDefined();

      // No debería haber lotes duplicados
      const { count } = await import("drizzle-orm");
      const [{ lotCount }] = await db
        .select({ lotCount: count() })
        .from(inventoryLot)
        .where(
          and(
            eq(inventoryLot.itemId, itemWithLotId),
            eq(inventoryLot.lotNumber, lotNumber)
          )
        );

      expect(lotCount).toBe(1);
    });

    it("si ítem requiere lote y se provee lotId existente, debe funcionar", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryLot } = await import("#models/inventory/lot");
      const { and, eq } = await import("drizzle-orm");

      // Primero buscar el lote creado en el test anterior
      const [existingLot] = await db
        .select()
        .from(inventoryLot)
        .where(
          and(
            eq(inventoryLot.itemId, itemWithLotId),
            eq(inventoryLot.lotNumber, "LOTE-P3-001")
          )
        );

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          {
            itemId: itemWithLotId,
            locationId,
            quantity: 3,
            lotId: existingLot.id,
          },
        ],
      });

      expect(result.movementId).toBeDefined();
    });
  });

  describe("UC-11: Reglas de lote", () => {
    it("no debe permitir usar lote vencido en movimientos normales", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryLot } = await import("#models/inventory/lot");

      // Crear un lote vencido
      const yesterday = new DateTime();
      yesterday.setDate(yesterday.getDate() - 1);

      const [expiredLot] = await db
        .insert(inventoryLot)
        .values({
          itemId: itemWithLotId,
          lotNumber: "LOTE-VENCIDO",
          receivedDate: new DateTime(),
          expirationDate: yesterday,
          status: "ACTIVE",
        })
        .returning();

      // Con autoPost: true, la validación de lote vencido se ejecuta
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            {
              itemId: itemWithLotId,
              locationId,
              quantity: 5,
              lotId: expiredLot.id,
            },
          ],
          autoPost: true, // La validación de lotes ocurre al postear
        })
      ).rejects.toThrow(/vencido/);
    });

    it("no debe permitir usar lote en cuarentena en movimientos normales", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { inventoryLot } = await import("#models/inventory/lot");

      // Crear un lote en cuarentena
      const [quarantineLot] = await db
        .insert(inventoryLot)
        .values({
          itemId: itemWithLotId,
          lotNumber: "LOTE-CUARENTENA",
          receivedDate: new DateTime(),
          status: "QUARANTINE",
        })
        .returning();

      // Con autoPost: true, la validación de estado de lote se ejecuta
      await expect(
        createInventoryMovement({
          movementTypeId: movementTypeEntryId,
          movementDate: new DateTime(),
          userId,
          details: [
            {
              itemId: itemWithLotId,
              locationId,
              quantity: 5,
              lotId: quarantineLot.id,
            },
          ],
          autoPost: true, // La validación de lotes ocurre al postear
        })
      ).rejects.toThrow(/no está disponible/);
    });
  });
});
