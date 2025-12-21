import DateTime from "#utils/data/DateTime";
import Decimal from "decimal.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests para las nuevas funcionalidades de estado de movimientos:
 * - Estados Draft → Posted → Cancelled
 * - postInventoryMovement
 * - cancelInventoryMovement
 */

// IDs de setup que se inicializan en beforeAll
let inventoryDocTypeId: number;
let movementTypeEntryId: number;
let movementTypeExitId: number;
let itemId: number;
let locationId: number;
let userId: number;
let seriesId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_movement_status_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  // 1. Crear tipo de documento de negocio para movimientos
  const { upsertDocumentType } = await import("#svc/numbering/documentType");
  const docType = await upsertDocumentType({
    code: "INV_MOV_STATUS",
    name: "Movimiento de Inventario Status Test",
    isEnabled: true,
  });
  inventoryDocTypeId = docType.id;

  // 2. Crear serie de numeración
  const { upsertDocumentSeries } = await import(
    "#svc/numbering/documentSeries"
  );
  const series = await upsertDocumentSeries({
    documentTypeId: inventoryDocTypeId,
    seriesCode: "MOV-ST-2025",
    startNumber: 1,
    endNumber: 999999,
    validFrom: new DateTime("2025-01-01"),
    validTo: null,
    isActive: true,
    isDefault: true,
    prefix: "MOV-ST-",
    suffix: null,
  });
  seriesId = series.id;

  // 3. Crear tipos de movimiento
  const { upsertMovementType } = await import("#svc/inventory/movementType");
  const [entryType] = await upsertMovementType({
    name: "Entrada Test Status",
    factor: 1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: inventoryDocTypeId,
  });
  movementTypeEntryId = entryType.id;

  const [exitType] = await upsertMovementType({
    name: "Salida Test Status",
    factor: -1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: inventoryDocTypeId,
  });
  movementTypeExitId = exitType.id;

  // 4. Crear categoría con subcategoría
  const { upsertCategory, upsertSubcategory } = await import(
    "#svc/catalogs/category"
  );
  const [cat] = await upsertCategory({
    fullName: "Categoría Test Status",
    isEnabled: true,
  });

  const [subcat] = await upsertSubcategory({
    fullName: "Subcategoría Test Status",
    categoryId: cat.id,
    isEnabled: true,
  });

  // 5. Crear ítem
  const { db } = await import("#lib/db");
  const { item } = await import("#models/catalogs/item");
  const { inventoryItem } = await import("#models/inventory/item");
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");

  await db
    .insert(unitOfMeasure)
    .values({
      id: 1,
      code: "UN",
      fullName: "Unidad",
      isEnabled: true,
    })
    .onConflictDoNothing();

  const [createdItem] = await db
    .insert(item)
    .values({
      code: "ITEM-STATUS-TEST-001",
      fullName: "Ítem Test Status",
      slogan: "Test",
      description: "Ítem para tests de status",
      type: "good",
      isEnabled: true,
      rating: 5,
      basePrice: new Decimal("100.00"),
      categoryId: cat.id,
      subcategoryId: subcat.id,
      images: [],
    })
    .returning();
  itemId = createdItem.id;

  await db.insert(inventoryItem).values({
    itemId: createdItem.id,
    uomId: 1,
  });

  // 6. Crear ubicación
  const { upsertLocation } = await import("#svc/inventory/location");
  const [loc] = await upsertLocation({
    name: "Bodega Test Status",
    code: "BOD-STATUS",
    isEnabled: true,
  });
  locationId = loc.id;

  // 7. Crear usuario/empleado
  const { user } = await import("#models/core/user");
  const { documentType: coreDocType } = await import(
    "#models/core/documentType"
  );

  const [idDocType] = await db
    .insert(coreDocType)
    .values({
      code: "CC-STATUS",
      name: "Cédula Status Test",
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
      documentNumber: "STATUS12345",
    })
    .returning();

  const { default: employee } = await import("#models/hr/employee");
  const { default: person } = await import("#models/core/person");

  await db.insert(person).values({
    id: createdUser.id,
    firstName: "Status",
    lastName: "Test",
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
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("Inventory Movement Status", () => {
  describe("createInventoryMovement", () => {
    it("should create movement in draft status by default", async () => {
      const { createInventoryMovement, getInventoryMovement } = await import(
        "./movement"
      );

      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ itemId, locationId, quantity: 10 }],
      });

      expect(result.status).toBe("draft");

      const movement = await getInventoryMovement(result.movementId);
      expect(movement?.status).toBe("draft");
    });

    it("should NOT affect stock when created in draft", async () => {
      const { createInventoryMovement } = await import("./movement");
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { and, eq } = await import("drizzle-orm");

      // Verificar stock antes
      const [stockBefore] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityBefore = stockBefore?.quantity
        ? Number(stockBefore.quantity)
        : 0;

      // Crear movimiento en draft
      await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ itemId, locationId, quantity: 50 }],
      });

      // Verificar stock después - NO debe haber cambiado
      const [stockAfter] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityAfter = stockAfter?.quantity
        ? Number(stockAfter.quantity)
        : 0;

      expect(quantityAfter).toBe(quantityBefore);
    });

    it("should create and post in one operation with autoPost=true", async () => {
      const { createInventoryMovement, getInventoryMovement } = await import(
        "./movement"
      );
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { and, eq } = await import("drizzle-orm");

      // Verificar stock antes
      const [stockBefore] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityBefore = stockBefore?.quantity
        ? Number(stockBefore.quantity)
        : 0;

      // Crear movimiento con autoPost
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 100, unitCost: new Decimal("10.00") },
        ],
        autoPost: true,
      });

      expect(result.status).toBe("posted");

      // Verificar stock después - DEBE haber aumentado
      const [stockAfter] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityAfter = stockAfter?.quantity
        ? Number(stockAfter.quantity)
        : 0;

      expect(quantityAfter).toBe(quantityBefore + 100);
    });
  });

  describe("postInventoryMovement", () => {
    it("should change status from draft to posted", async () => {
      const {
        createInventoryMovement,
        postInventoryMovement,
        getInventoryMovement,
      } = await import("./movement");

      // Crear en draft
      const createResult = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 25, unitCost: new Decimal("5.00") },
        ],
      });

      expect(createResult.status).toBe("draft");

      // Postear
      const postResult = await postInventoryMovement(createResult.movementId);

      expect(postResult.previousStatus).toBe("draft");
      expect(postResult.newStatus).toBe("posted");

      // Verificar estado
      const movement = await getInventoryMovement(createResult.movementId);
      expect(movement?.status).toBe("posted");
    });

    it("should affect stock when posted", async () => {
      const { createInventoryMovement, postInventoryMovement } = await import(
        "./movement"
      );
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { and, eq } = await import("drizzle-orm");

      // Verificar stock antes
      const [stockBefore] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityBefore = stockBefore?.quantity
        ? Number(stockBefore.quantity)
        : 0;

      // Crear en draft
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 75, unitCost: new Decimal("8.00") },
        ],
      });

      // Postear
      await postInventoryMovement(result.movementId);

      // Verificar stock - DEBE haber aumentado
      const [stockAfter] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityAfter = stockAfter?.quantity
        ? Number(stockAfter.quantity)
        : 0;

      expect(quantityAfter).toBe(quantityBefore + 75);
    });

    it("should throw error when trying to post non-draft movement", async () => {
      const { createInventoryMovement, postInventoryMovement } = await import(
        "./movement"
      );

      // Crear y postear
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 10, unitCost: new Decimal("1.00") },
        ],
        autoPost: true,
      });

      // Intentar postear de nuevo
      await expect(postInventoryMovement(result.movementId)).rejects.toThrow(
        /solo se pueden postear movimientos en estado 'draft'/i
      );
    });
  });

  describe("cancelInventoryMovement", () => {
    it("should cancel draft movement without reversal", async () => {
      const {
        createInventoryMovement,
        cancelInventoryMovement,
        getInventoryMovement,
      } = await import("./movement");

      // Crear en draft
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ itemId, locationId, quantity: 10 }],
      });

      // Cancelar
      const cancelResult = await cancelInventoryMovement(result.movementId);

      expect(cancelResult.previousStatus).toBe("draft");
      expect(cancelResult.reversingMovementId).toBeUndefined(); // No reversal for draft

      // Verificar estado
      const movement = await getInventoryMovement(result.movementId);
      expect(movement?.status).toBe("cancelled");
    });

    it("should cancel posted movement with reversal", async () => {
      const {
        createInventoryMovement,
        cancelInventoryMovement,
        getInventoryMovement,
      } = await import("./movement");

      // Crear y postear
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 30, unitCost: new Decimal("2.00") },
        ],
        autoPost: true,
      });

      // Cancelar
      const cancelResult = await cancelInventoryMovement(
        result.movementId,
        "Test cancellation"
      );

      expect(cancelResult.previousStatus).toBe("posted");
      expect(cancelResult.reversingMovementId).toBeDefined();
      expect(cancelResult.reversingDocumentNumber).toBeDefined();

      // Verificar estado del original
      const original = await getInventoryMovement(result.movementId);
      expect(original?.status).toBe("cancelled");
      expect(original?.reversingMovementId).toBe(
        cancelResult.reversingMovementId
      );

      // Verificar reversión
      const reversal = await getInventoryMovement(
        cancelResult.reversingMovementId!
      );
      expect(reversal?.status).toBe("posted");
      expect(reversal?.reversedMovementId).toBe(result.movementId);
    });

    it("should reverse stock effect when cancelling posted entry", async () => {
      const { createInventoryMovement, cancelInventoryMovement } = await import(
        "./movement"
      );
      const { db } = await import("#lib/db");
      const { stock } = await import("#models/inventory/stock");
      const { and, eq } = await import("drizzle-orm");

      // Verificar stock antes
      const [stockBefore] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      const quantityBefore = stockBefore?.quantity
        ? Number(stockBefore.quantity)
        : 0;

      // Crear, postear y cancelar
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [
          { itemId, locationId, quantity: 200, unitCost: new Decimal("3.00") },
        ],
        autoPost: true,
      });

      // Stock debe haber aumentado
      const [stockAfterPost] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      expect(Number(stockAfterPost?.quantity ?? 0)).toBe(quantityBefore + 200);

      // Cancelar
      await cancelInventoryMovement(result.movementId);

      // Stock debe haber vuelto al valor original
      const [stockAfterCancel] = await db
        .select()
        .from(stock)
        .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

      expect(Number(stockAfterCancel?.quantity ?? 0)).toBe(quantityBefore);
    });

    it("should throw error when cancelling already cancelled movement", async () => {
      const { createInventoryMovement, cancelInventoryMovement } = await import(
        "./movement"
      );

      // Crear y cancelar
      const result = await createInventoryMovement({
        movementTypeId: movementTypeEntryId,
        movementDate: new DateTime(),
        userId,
        details: [{ itemId, locationId, quantity: 5 }],
      });

      await cancelInventoryMovement(result.movementId);

      // Intentar cancelar de nuevo
      await expect(
        cancelInventoryMovement(result.movementId)
      ).rejects.toThrow(/ya está cancelado/i);
    });
  });
});
