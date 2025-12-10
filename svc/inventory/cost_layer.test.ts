import { afterAll, beforeAll, describe, expect, it } from "vitest";
import DateTime from "#utils/data/DateTime";
import Decimal from "decimal.js";

let itemId: number;
let locationId: number;
let movementId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_cost_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  const { db } = await import("#lib/db");
  const { item } = await import("#models/catalogs/item");
  const { inventoryItem } = await import("#models/inventory/item");
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");
  const { location } = await import("#models/inventory/location");

  await db
    .insert(unitOfMeasure)
    .values({ id: 1, code: "UN", fullName: "Unidad", isEnabled: true });

  /* Fix item basePrice */
  const [createdItem] = await db
    .insert(item)
    .values({
      code: "COST-ITEM",
      fullName: "Cost Item Test",
      type: "good",
      isEnabled: true,
      basePrice: new Decimal("10.00"),
      images: [],
    })
    .returning();
  itemId = createdItem.id;
  await db.insert(inventoryItem).values({ itemId, uomId: 1 });

  const [createdLoc] = await db
    .insert(location)
    .values({
      name: "Cost Location",
      code: "LOC-COST",
      type: "WAREHOUSE",
      isEnabled: true,
    })
    .returning();
  locationId = createdLoc.id;

  // We need a dummy movement ID for the source_movement_id FK
  // But inventory_movement requires many things (series, doc type, user...)
  // Let's create minimal deps for movement
  const { upsertDocumentType } = await import("#svc/numbering/documentType");
  const dt = await upsertDocumentType({
    code: "COST-DOC",
    name: "Cost Doc",
    isEnabled: true,
  });

  const { upsertMovementType } = await import("#svc/inventory/movementType");
  const [mt] = await upsertMovementType({
    name: "Cost Mov",
    factor: 1,
    affectsStock: true,
    isEnabled: true,
    documentTypeId: dt.id,
  });

  const { user } = await import("#models/core/user");
  // User needs documentTypeId too
  /* Fix upsertDocumentType for user: Use direct DB insert for Identity Document Type */
  const { documentType: coreDocType } = await import(
    "#models/core/documentType"
  );
  const [dtUser] = await db
    .insert(coreDocType)
    .values({
      code: "C-UID",
      name: "User ID Doc",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    })
    .returning();

  const { default: person } = await import("#models/core/person");
  const { default: employee } = await import("#models/hr/employee");

  const [usr] = await db
    .insert(user)
    .values({
      type: "person",
      documentTypeId: dtUser.id,
      documentNumber: "999",
    })
    .returning();
  await db
    .insert(person)
    .values({ id: usr.id, firstName: "Test", lastName: "Cost" });
  /* Fix employee insert */
  await db
    .insert(employee)
    .values({ id: usr.id, hireDate: new DateTime(), avatarUrl: "http://test" });

  const { inventoryMovement } = await import("#models/inventory/movement");
  const { upsertDocumentSeries } = await import(
    "#svc/numbering/documentSeries"
  );
  /* Fix upsertDocumentSeries */
  const series = await upsertDocumentSeries({
    documentTypeId: dt.id,
    seriesCode: "COST",
    startNumber: 1,
    endNumber: 999,
    isActive: true,
    isDefault: true,
    validFrom: new DateTime(),
  });

  const [mov] = await db
    .insert(inventoryMovement)
    .values({
      movementTypeId: mt.id,
      movementDate: new DateTime(),
      employeeId: usr.id,
      documentSeriesId: series.id,
      documentNumber: 1,
      documentNumberFull: "COST-1",
    })
    .returning();
  movementId = mov.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");
  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("CostingService", () => {
  it("should create layers", async () => {
    const { createLayer } = await import("./cost_layer");
    const { db } = await import("#lib/db");

    await db.transaction(async (tx) => {
      // Layer 1: 10 units @ $10, 2 days ago
      const d1 = new DateTime();
      d1.setDate(d1.getDate() - 2);
      await createLayer(tx, {
        itemId,
        locationId,
        quantity: 10,
        unitCost: new Decimal(10),
        movementId,
        createdAt: d1,
      });

      // Layer 2: 10 units @ $20, 1 day ago
      const d2 = new DateTime();
      d2.setDate(d2.getDate() - 1);
      await createLayer(tx, {
        itemId,
        locationId,
        quantity: 10,
        unitCost: new Decimal(20),
        movementId,
        createdAt: d2,
      });

      // Layer 3: 10 units @ $30, today
      await createLayer(tx, {
        itemId,
        locationId,
        quantity: 10,
        unitCost: new Decimal(30),
        movementId,
        createdAt: new DateTime(),
      });
    });
  });

  it("should consume layers (FIFO)", async () => {
    const { consumeLayers } = await import("./cost_layer");
    const { db } = await import("#lib/db");

    // Consume 15 units.
    // Expect: 10 @ 10 + 5 @ 20 = 200 total cost.
    // Unit cost: 200 / 15 = 13.3333...

    let unitCost: Decimal = new Decimal(0);
    await db.transaction(async (tx) => {
      unitCost = await consumeLayers(tx, {
        itemId,
        locationId,
        quantity: 15,
        method: "FIFO",
      });
    });

    expect(unitCost.toNumber()).toBeCloseTo(13.3333, 4);
  });

  it("should consume remaining layers check", async () => {
    const { db } = await import("#lib/db");
    const { inventoryCostLayer } = await import("#models/inventory/cost_layer");
    const { asc } = await import("drizzle-orm");

    const layers = await db
      .select()
      .from(inventoryCostLayer)
      .orderBy(asc(inventoryCostLayer.createdAt));

    // Layer 1: Remaining 0
    expect(Number(layers[0].remainingQuantity)).toBe(0);
    // Layer 2: Remaining 5 (Original 10 - 5 consumed)
    expect(Number(layers[1].remainingQuantity)).toBe(5);
    // Layer 3: Remaining 10
    expect(Number(layers[2].remainingQuantity)).toBe(10);
  });

  it("should consume layers (LIFO)", async () => {
    // Note: Since LIFO takes from the NEWEST, and we have Layer 3 unused:
    // Layer 3 has 10 @ 30.
    // Consume 5. Should be @ 30.
    const { consumeLayers } = await import("./cost_layer");
    const { db } = await import("#lib/db");

    let unitCost: Decimal = new Decimal(0);
    await db.transaction(async (tx) => {
      unitCost = await consumeLayers(tx, {
        itemId,
        locationId,
        quantity: 5,
        method: "LIFO",
      });
    });

    expect(unitCost.toNumber()).toBe(30);
  });
});
