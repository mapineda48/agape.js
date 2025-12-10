import { db } from "#lib/db";
import { stock } from "#models/inventory/stock";
import { stockLot } from "#models/inventory/stock_lot";
import { eq, and, sql } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";

// Helper type for Transaction
type Transaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Validates real availability (ATP) blocking the row.
 * R1: Available = quantity - reserved_quantity.
 * Checks both aggregate and detailed stock if lotId is provided.
 */
export async function validateStockAvailability(
  tx: Transaction,
  itemId: number,
  locationId: number,
  quantity: number,
  lotId?: number | null
): Promise<void> {
  const reqQty = new Decimal(quantity);

  // 1. Validate Aggregate Stock
  const [aggregate] = await tx
    .select({
      quantity: stock.quantity,
      reserved: stock.reservedQuantity,
    })
    .from(stock)
    .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)))
    .for("update"); // Block row to prevent race conditions

  const aggQty = new Decimal(aggregate?.quantity ?? 0);
  const aggRes = new Decimal(aggregate?.reserved ?? 0);
  const aggAvail = aggQty.minus(aggRes);

  if (aggAvail.lessThan(reqQty)) {
    throw new Error(
      `Stock insuficiente (Agregado). Disponible: ${aggAvail}, Solicitado: ${reqQty}`
    );
  }

  // 2. Validate Lot Stock (if applicable)
  if (lotId) {
    const [lotStk] = await tx
      .select({
        quantity: stockLot.quantity,
        reserved: stockLot.reservedQuantity,
      })
      .from(stockLot)
      .where(
        and(
          eq(stockLot.itemId, itemId),
          eq(stockLot.locationId, locationId),
          eq(stockLot.lotId, lotId)
        )
      )
      .for("update");

    const lQty = new Decimal(lotStk?.quantity ?? 0);
    const lRes = new Decimal(lotStk?.reserved ?? 0);
    const lAvail = lQty.minus(lRes);

    if (lAvail.lessThan(reqQty)) {
      throw new Error(
        `Stock insuficiente (Lote). Disponible: ${lAvail}, Solicitado: ${reqQty}`
      );
    }
  }
}

/**
 * Updates stock (Aggregate and Detail) maintaining synchronization.
 * R7: Sync Aggregate vs Detail
 */
export async function updateStock(
  tx: Transaction,
  itemId: number,
  locationId: number,
  delta: number, // Positive for inputs, Negative for outputs
  lotId?: number | null
): Promise<void> {
  const deltaDecimal = new Decimal(delta);

  // 1. Update Aggregate Stock
  const [existingAggregate] = await tx
    .select()
    .from(stock)
    .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)))
    .for("update");

  if (existingAggregate) {
    await tx
      .update(stock)
      .set({
        quantity: sql`${stock.quantity} + ${deltaDecimal.toString()}`,
      })
      .where(and(eq(stock.itemId, itemId), eq(stock.locationId, locationId)));
  } else {
    // If it's an output (negative) and row doesn't exist, it's an error (should be caught by validate but safety first)
    if (deltaDecimal.isNegative()) {
      throw new Error(
        `Inconsistencia: Intentando restar stock de un registro inexistente (Item: ${itemId}, Loc: ${locationId})`
      );
    }
    // New Entry
    await tx.insert(stock).values({
      itemId,
      locationId,
      quantity: deltaDecimal,
      reservedQuantity: new Decimal(0),
    });
  }

  // 2. Update Lot Stock (if applicable)
  if (lotId) {
    const [existingLot] = await tx
      .select()
      .from(stockLot)
      .where(
        and(
          eq(stockLot.itemId, itemId),
          eq(stockLot.locationId, locationId),
          eq(stockLot.lotId, lotId)
        )
      )
      .for("update");

    if (existingLot) {
      await tx
        .update(stockLot)
        .set({
          quantity: sql`${stockLot.quantity} + ${deltaDecimal.toString()}`,
        })
        .where(
          and(
            eq(stockLot.itemId, itemId),
            eq(stockLot.locationId, locationId),
            eq(stockLot.lotId, lotId)
          )
        );
    } else {
      if (deltaDecimal.isNegative()) {
        throw new Error(
          `Inconsistencia: Intentando restar stock de lote inexistente (Item: ${itemId}, Loc: ${locationId}, Lot: ${lotId})`
        );
      }
      await tx.insert(stockLot).values({
        itemId,
        locationId,
        lotId,
        quantity: deltaDecimal.toString(),
        reservedQuantity: "0",
      });
    }
  }
}
