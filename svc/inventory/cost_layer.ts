import { db } from "#lib/db";
import { inventoryCostLayer } from "#models/inventory/cost_layer";
import { eq, and, gt, asc, desc, type SQL } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";
import type DateTime from "#utils/data/DateTime";

type Transaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Creates a new cost layer for incoming inventory.
 * R5: Each entry creates a new layer with transaction unit cost.
 */
export async function createLayer(
  tx: Transaction,
  data: {
    itemId: number;
    locationId: number;
    lotId?: number | null;
    quantity: number;
    unitCost: Decimal;
    movementId: number;
    createdAt: DateTime;
  }
) {
  const qty = new Decimal(data.quantity);
  await tx.insert(inventoryCostLayer).values({
    itemId: data.itemId,
    locationId: data.locationId,
    lotId: data.lotId,
    originalQuantity: qty,
    remainingQuantity: qty,
    unitCost: data.unitCost,
    sourceMovementId: data.movementId,
    createdAt: data.createdAt,
  });
}

/**
 * Consumes cost layers based on FIFO/LIFO strategy.
 * R4: Consumes layers, updates remaining_quantity, converts cost.
 * @returns The weighted average unit cost of the consumed quantity.
 */
export async function consumeLayers(
  tx: Transaction,
  data: {
    itemId: number;
    locationId: number /* Note: lotId is usually not forced for consumption unless specific lot is requested. 
    But if lotId IS requested, we should probably filter by lotId too?
    The prompt says "Consultar capas disponibles for that item+location".
    If I'm moving a specific Lot, I should probably only consume layers OF that lot.
    Let's add optional lotId. */;
    lotId?: number | null;
    quantity: number;
    method: "FIFO" | "LIFO";
  }
): Promise<Decimal> {
  const conditions = [
    eq(inventoryCostLayer.itemId, data.itemId),
    eq(inventoryCostLayer.locationId, data.locationId),
    gt(inventoryCostLayer.remainingQuantity, new Decimal(0)),
  ];

  if (data.lotId !== undefined) {
    if (data.lotId === null) {
      conditions.push(sql`${inventoryCostLayer.lotId} IS NULL`);
    } else {
      conditions.push(eq(inventoryCostLayer.lotId, data.lotId));
    }
  }

  // 1. Get available layers
  const layers = await tx
    .select()
    .from(inventoryCostLayer)
    .where(and(...conditions))
    .orderBy(
      data.method === "FIFO"
        ? asc(inventoryCostLayer.createdAt)
        : desc(inventoryCostLayer.createdAt)
    )
    .for("update");

  let remainingToConsume = new Decimal(data.quantity);
  let totalCost = new Decimal(0);
  let totalConsumed = new Decimal(0);

  for (const layer of layers) {
    if (remainingToConsume.equals(0)) break;

    const layerRemaining = new Decimal(layer.remainingQuantity);
    const consumeFromLayer = Decimal.min(remainingToConsume, layerRemaining);
    const layerCost = new Decimal(layer.unitCost);

    // Accumulate cost
    totalCost = totalCost.plus(consumeFromLayer.times(layerCost));
    totalConsumed = totalConsumed.plus(consumeFromLayer);

    // Decrement layer
    const newRemaining = layerRemaining.minus(consumeFromLayer);

    await tx
      .update(inventoryCostLayer)
      .set({ remainingQuantity: newRemaining.toString() })
      .where(eq(inventoryCostLayer.id, layer.id));

    remainingToConsume = remainingToConsume.minus(consumeFromLayer);
  }

  if (remainingToConsume.greaterThan(0)) {
    throw new Error(
      `Inconsistencia de Costos: Stock suficiente pero capas insuficientes para el ítem ${data.itemId}`
    );
  }

  // Calculate weighted average unit cost
  if (totalConsumed.equals(0)) return new Decimal(0);

  // Return average cost
  return totalCost.dividedBy(totalConsumed);
}
// Need to import sql for dynamic where clause
import { sql } from "drizzle-orm";
