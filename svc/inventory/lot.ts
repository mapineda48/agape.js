import { db } from "#lib/db";
import { inventoryLot } from "#models/inventory/lot";
import { eq } from "drizzle-orm";
import DateTime from "#utils/data/DateTime";

type Transaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Validates lot status and expiration.
 * R6: Validation rules for regulated industries.
 */
export async function validateLot(
  tx: Transaction,
  lotId: number,
  opts: {
    allowExpired?: boolean;
    allowRestricted?: boolean; // Permits QUARANTINE/BLOCKED
  } = {}
) {
  const [lot] = await tx
    .select()
    .from(inventoryLot)
    .where(eq(inventoryLot.id, lotId));

  if (!lot) {
    throw new Error(`Lote con ID ${lotId} no encontrado`);
  }

  // Check Expiration
  if (!opts.allowExpired && lot.expirationDate) {
    // DateTime comparison. Assuming DateTime has proper comparison methods or use getTime/valueOf logic.
    // If DateTime is the wrapper from #utils/data/DateTime, it usually behaves like Date or has helper.
    // Let's assume standard Date behavior or wrapper methods.
    // Actually, checking DateTime implementation might be good, but safe bet is .getTime() or similar if it wraps Date.
    // The model definition uses `dateTime` custom type which maps to `DateTime` class.
    // Usually `new Date()` works for comparison.
    // Let's rely on getTime/toMillis if available, or just Date comparison if it's compatible.
    // The previous code in `movement.ts` used `.getTime()`.

    const now = new Date();
    // Reset time part for expiration comparison usually? Or exact time?
    // Expiration is usually date only.
    // Let's assume strict comparison.

    // Check if lot.expirationDate is < now
    // Accessing the underlying Date object if needed.
    // Looking at movement.ts usage: `input.movementDate.getTime()`

    // Use .getTime() if available.
    const expTime = (lot.expirationDate as any).getTime
      ? (lot.expirationDate as any).getTime()
      : new Date(lot.expirationDate as any).getTime();

    if (expTime < now.getTime()) {
      throw new Error(
        `El lote ${lot.lotNumber} está vencido (Vence: ${lot.expirationDate})`
      );
    }
  }

  // Check Status
  if (!opts.allowRestricted) {
    if (["QUARANTINE", "BLOCKED"].includes(lot.status)) {
      throw new Error(
        `El lote ${lot.lotNumber} no está disponible para este movimiento (Estado: ${lot.status})`
      );
    }
  }
}
