import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import DateTime from "#utils/data/DateTime";

let itemId: number;
let locationId: number;
let lotId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_stock_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  const { db } = await import("#lib/db");
  const { item } = await import("#models/catalogs/item");
  const { inventoryItem } = await import("#models/inventory/item");
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");
  const { location } = await import("#models/inventory/location");
  const { inventoryLot } = await import("#models/inventory/lot");

  // Create UOM
  await db.insert(unitOfMeasure).values({
    id: 1,
    code: "UN",
    fullName: "Unidad",
    isEnabled: true,
  });

  // Create Item
  const [createdItem] = await db
    .insert(item)
    .values({
      code: "STOCK-ITEM",
      fullName: "Stock Item Test",
      type: "good",
      isEnabled: true,
      basePrice: new Decimal("10.00"),
      images: [],
    })
    .returning();
  itemId = createdItem.id;

  await db.insert(inventoryItem).values({
    itemId,
    uomId: 1,
  });

  // Create Location
  const [createdLoc] = await db
    .insert(location)
    .values({
      name: "Stock Location",
      code: "LOC-STOCK",
      type: "WAREHOUSE",
      isEnabled: true,
    })
    .returning();
  locationId = createdLoc.id;

  // Create Lot
  const [createdLot] = await db
    .insert(inventoryLot)
    .values({
      itemId,
      lotNumber: "LOT-001",
      receivedDate: new DateTime(),
      status: "ACTIVE",
    })
    .returning();
  lotId = createdLot.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("StockService", () => {
  it("should update aggregate stock (Input)", async () => {
    const { updateStock } = await import("./stock");
    const { db } = await import("#lib/db");
    const { stock } = await import("#models/inventory/stock");
    const { eq, and } = await import("drizzle-orm");

    await db.transaction(async (tx) => {
      await updateStock(tx, itemId, locationId, 100);
    });

    const [agg] = await db
      .select()
      .from(stock)
      .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

    expect(agg).toBeDefined();
    expect(new Decimal(agg.quantity).toNumber()).toBe(100);
  });

  it("should update aggregate stock (Output)", async () => {
    const { updateStock } = await import("./stock");
    const { db } = await import("#lib/db");
    const { stock } = await import("#models/inventory/stock");
    const { eq, and } = await import("drizzle-orm");

    await db.transaction(async (tx) => {
      await updateStock(tx, itemId, locationId, -20);
    });

    const [agg] = await db
      .select()
      .from(stock)
      .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

    expect(new Decimal(agg.quantity).toNumber()).toBe(80);
  });

  it("should validate enough stock", async () => {
    const { validateStockAvailability } = await import("./stock");
    const { db } = await import("#lib/db");

    await expect(
      db.transaction(async (tx) => {
        await validateStockAvailability(tx, itemId, locationId, 80);
      })
    ).resolves.not.toThrow();
  });

  it("should throw if insufficient stock", async () => {
    const { validateStockAvailability } = await import("./stock");
    const { db } = await import("#lib/db");

    await expect(
      db.transaction(async (tx) => {
        await validateStockAvailability(tx, itemId, locationId, 81);
      })
    ).rejects.toThrow(/Stock insuficiente/);
  });

  it("should update detailed lot stock", async () => {
    const { updateStock } = await import("./stock");
    const { db } = await import("#lib/db");
    const { stockLot } = await import("#models/inventory/stock_lot");
    const { eq, and } = await import("drizzle-orm");

    await db.transaction(async (tx) => {
      // Add 50 to lot
      await updateStock(tx, itemId, locationId, 50, lotId);
    });

    const [lotStk] = await db
      .select()
      .from(stockLot)
      .where(
        and(
          eq(stockLot.itemId, itemId),
          eq(stockLot.locationId, locationId),
          eq(stockLot.lotId, lotId)
        )
      );

    // Should also update aggregate
    const { stock } = await import("#models/inventory/stock");
    const [agg] = await db
      .select()
      .from(stock)
      .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));

    // Previous 80 + 50 = 130
    expect(new Decimal(agg.quantity).toNumber()).toBe(130);
    expect(new Decimal(lotStk.quantity).toNumber()).toBe(50);
  });

  it("should validate lot stock availability", async () => {
    const { validateStockAvailability } = await import("./stock");
    const { db } = await import("#lib/db");

    // Lot has 50
    await expect(
      db.transaction(async (tx) => {
        await validateStockAvailability(tx, itemId, locationId, 50, lotId);
      })
    ).resolves.not.toThrow();

    await expect(
      db.transaction(async (tx) => {
        await validateStockAvailability(tx, itemId, locationId, 51, lotId);
      })
    ).rejects.toThrow(/Stock insuficiente \(Lote\)/);
  });
});
