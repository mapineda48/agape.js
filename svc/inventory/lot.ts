import { db } from "#lib/db";
import { inventoryLot } from "#models/inventory/lot";
import { inventoryItem } from "#models/inventory/item";
import { eq, and } from "drizzle-orm";
import DateTime from "#utils/data/DateTime";

type Transaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * DTO para crear un lote nuevo.
 */
export interface CreateLotInput {
  itemId: number;
  lotNumber: string;
  serialNumber?: string | null;
  manufacturingDate?: DateTime | null;
  expirationDate?: DateTime | null;
  receivedDate?: DateTime;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  notes?: string | null;
}

/**
 * Resultado de buscar o crear un lote.
 */
export interface FindOrCreateLotResult {
  lotId: number;
  lotNumber: string;
  wasCreated: boolean;
}

/**
 * Verifica si un ítem requiere lote obligatorio.
 * @returns true si el ítem requiere lote, false si no lo requiere o no existe en inventory_item
 */
export async function isLotRequiredForItem(
  tx: Transaction,
  itemId: number
): Promise<boolean> {
  const [invItem] = await tx
    .select({ requiresLot: inventoryItem.requiresLot })
    .from(inventoryItem)
    .where(eq(inventoryItem.itemId, itemId));

  return invItem?.requiresLot ?? false;
}

/**
 * Busca un lote existente por número para un ítem específico.
 * @returns El lote si existe, null si no existe
 */
export async function getLotByNumber(
  tx: Transaction,
  itemId: number,
  lotNumber: string
): Promise<{ id: number; lotNumber: string; status: string } | null> {
  const [lot] = await tx
    .select({
      id: inventoryLot.id,
      lotNumber: inventoryLot.lotNumber,
      status: inventoryLot.status,
    })
    .from(inventoryLot)
    .where(
      and(
        eq(inventoryLot.itemId, itemId),
        eq(inventoryLot.lotNumber, lotNumber)
      )
    );

  return lot ?? null;
}

/**
 * Obtiene un lote por ID.
 */
export async function getLotById(tx: Transaction, lotId: number) {
  const [lot] = await tx
    .select()
    .from(inventoryLot)
    .where(eq(inventoryLot.id, lotId));

  return lot ?? null;
}

/**
 * Crea un nuevo lote.
 */
export async function createLot(
  tx: Transaction,
  input: CreateLotInput
): Promise<{ id: number; lotNumber: string }> {
  const [lot] = await tx
    .insert(inventoryLot)
    .values({
      itemId: input.itemId,
      lotNumber: input.lotNumber,
      serialNumber: input.serialNumber,
      manufacturingDate: input.manufacturingDate,
      expirationDate: input.expirationDate,
      receivedDate: input.receivedDate ?? new DateTime(),
      sourceDocumentType: input.sourceDocumentType,
      sourceDocumentId: input.sourceDocumentId,
      notes: input.notes,
      status: "ACTIVE",
      isEnabled: true,
    })
    .returning({ id: inventoryLot.id, lotNumber: inventoryLot.lotNumber });

  return lot;
}

/**
 * Busca un lote por número. Si no existe, lo crea.
 * Esto resuelve la tensión lotNumber (string) vs lotId (number).
 */
export async function findOrCreateLot(
  tx: Transaction,
  input: CreateLotInput
): Promise<FindOrCreateLotResult> {
  // 1. Buscar lote existente
  const existing = await getLotByNumber(tx, input.itemId, input.lotNumber);

  if (existing) {
    return {
      lotId: existing.id,
      lotNumber: existing.lotNumber,
      wasCreated: false,
    };
  }

  // 2. Crear nuevo lote
  const created = await createLot(tx, input);
  return {
    lotId: created.id,
    lotNumber: created.lotNumber,
    wasCreated: true,
  };
}

/**
 * Valida lote obligatorio para un ítem.
 * UC-11: Si ítem requiere lote → lote obligatorio
 *        Si no requiere lote → lote opcional
 */
export async function validateLotRequirement(
  tx: Transaction,
  itemId: number,
  lotId: number | null | undefined,
  lotNumber: string | null | undefined
): Promise<void> {
  const requiresLot = await isLotRequiredForItem(tx, itemId);

  if (requiresLot && !lotId && !lotNumber) {
    throw new Error(
      `El ítem ${itemId} requiere número de lote obligatorio para movimientos de inventario`
    );
  }
}

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
  const lot = await getLotById(tx, lotId);

  if (!lot) {
    throw new Error(`Lote con ID ${lotId} no encontrado`);
  }

  // Check Expiration
  if (!opts.allowExpired && lot.expirationDate) {
    const now = new Date();
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

  return lot;
}
