import { afterAll, beforeAll, describe, expect, it } from "vitest";
import DateTime from "#utils/data/DateTime";

let itemId: number;
let expiredLotId: number;
let quarantineLotId: number;
let goodLotId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_lot_${uuid}`,
    dev: false,
    skipSeeds: true,
  });

  const { db } = await import("#lib/db");
  const { item } = await import("#models/catalogs/item");
  const { inventoryItem } = await import("#models/inventory/item");
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");
  const { inventoryLot } = await import("#models/inventory/lot");

  await db
    .insert(unitOfMeasure)
    .values({ id: 1, code: "UN", fullName: "Unidad", isEnabled: true });

  const [createdItem] = await db
    .insert(item)
    .values({
      code: "LOT-ITEM",
      fullName: "Lot Item Test",
      type: "good",
      isEnabled: true,
      basePrice: "10.00",
      images: [],
    })
    .returning();
  itemId = createdItem.id;
  await db.insert(inventoryItem).values({ itemId, uomId: 1 });

  // Expired Lot
  const yesterday = new DateTime();
  yesterday.setDate(yesterday.getDate() - 1);
  const [expLot] = await db
    .insert(inventoryLot)
    .values({
      itemId,
      lotNumber: "EXP-001",
      receivedDate: new DateTime(),
      expirationDate: yesterday,
      status: "ACTIVE",
    })
    .returning();
  expiredLotId = expLot.id;

  // Quarantine Lot
  const [quarLot] = await db
    .insert(inventoryLot)
    .values({
      itemId,
      lotNumber: "QUA-001",
      receivedDate: new DateTime(),
      status: "QUARANTINE",
    })
    .returning();
  quarantineLotId = quarLot.id;

  // Good Lot
  const [gdLot] = await db
    .insert(inventoryLot)
    .values({
      itemId,
      lotNumber: "GOOD-001",
      receivedDate: new DateTime(),
      status: "ACTIVE",
    })
    .returning();
  goodLotId = gdLot.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");
  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("LotService", () => {
  it("should allow valid lot", async () => {
    const { validateLot } = await import("./lot");
    const { db } = await import("#lib/db");
    await expect(
      db.transaction((tx) => validateLot(tx, goodLotId))
    ).resolves.not.toThrow();
  });

  it("should reject expired lot", async () => {
    const { validateLot } = await import("./lot");
    const { db } = await import("#lib/db");
    await expect(
      db.transaction((tx) => validateLot(tx, expiredLotId))
    ).rejects.toThrow(/vencido/);
  });

  it("should allow expired lot if flag is true", async () => {
    const { validateLot } = await import("./lot");
    const { db } = await import("#lib/db");
    await expect(
      db.transaction((tx) =>
        validateLot(tx, expiredLotId, { allowExpired: true })
      )
    ).resolves.not.toThrow();
  });

  it("should reject quarantined lot", async () => {
    const { validateLot } = await import("./lot");
    const { db } = await import("#lib/db");
    await expect(
      db.transaction((tx) => validateLot(tx, quarantineLotId))
    ).rejects.toThrow(/no está disponible/);
  });

  it("should allow quarantined lot if flag is true", async () => {
    const { validateLot } = await import("./lot");
    const { db } = await import("#lib/db");
    await expect(
      db.transaction((tx) =>
        validateLot(tx, quarantineLotId, { allowRestricted: true })
      )
    ).resolves.not.toThrow();
  });
});
