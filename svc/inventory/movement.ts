import { db } from "#lib/db";
import { inventoryMovement } from "#models/inventory/movement";
import { inventoryMovementDetail } from "#models/inventory/movement_detail";
import { inventoryMovementType } from "#models/inventory/movement_type";
import { documentType } from "#models/numbering/document_type";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";
import type DateTime from "#utils/data/DateTime";
import { eq, desc, and, gte, lte, like, count, sql } from "drizzle-orm";
import type Decimal from "decimal.js";
import { item } from "#models/catalogs/item";
import { location } from "#models/inventory/location";

/**
 * Input para crear un movimiento de inventario.
 */
interface CreateInventoryMovementInput {
  /** ID del tipo de movimiento */
  movementTypeId: number;
  /** Fecha del movimiento */
  movementDate: DateTime;
  /** Observación opcional */
  observation?: string | null;
  /** ID del usuario que realiza el movimiento */
  userId: number;
  /** Tipo de documento origen (opcional) */
  sourceDocumentType?: string | null;
  /** ID del documento origen (opcional) */
  sourceDocumentId?: number | null;
  /** Detalles del movimiento */
  details: Array<{
    /** ID del ítem (debe existir en inventory_item) */
    itemId: number;
    /** ID de la ubicación (opcional) */
    locationId?: number | null;
    /** Cantidad del movimiento (debe ser positiva) */
    quantity: number;
    /** Costo unitario en el momento del movimiento (opcional) */
    unitCost?: Decimal | null;
  }>;
}

/**
 * Crea un movimiento de inventario y asigna número de documento
 * usando el motor de numeración.
 *
 * El flujo es:
 * 1. Validar tipo de movimiento y documento de negocio
 * 2. Obtener número del motor de numeración (con UUID temporal como externalDocumentId)
 * 3. Insertar movimiento con la numeración asignada
 * 4. Insertar detalles
 * 5. Actualizar el externalDocumentId en document_sequence con el ID real
 *
 * @param input Datos para crear el movimiento
 * @returns El movimiento creado con su numeración
 * @throws Error si el tipo de movimiento no existe o está deshabilitado
 * @throws Error si no hay detalles o las cantidades son inválidas
 * @throws Error si la fecha es futura
 * @throws Error si hay stock insuficiente para movimientos de salida
 */
export async function createInventoryMovement(
  input: CreateInventoryMovementInput
) {
  return await db.transaction(async (tx) => {
    // D.12: Validar que haya al menos un detalle
    if (!input.details || input.details.length === 0) {
      throw new Error("El movimiento debe tener al menos un detalle");
    }

    // D.13: Validar que las cantidades sean mayores a cero
    const invalidQuantity = input.details.find((d) => d.quantity <= 0);
    if (invalidQuantity) {
      throw new Error("La cantidad de cada detalle debe ser mayor a cero");
    }

    // E.17: No permitir movimientos con fecha futura
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual
    if (input.movementDate.getTime() > today.getTime()) {
      throw new Error("No se permiten movimientos con fecha futura");
    }

    // 1. Tipo de movimiento (para saber qué tipo de documento usar)
    const [movementType] = await tx
      .select()
      .from(inventoryMovementType)
      .where(eq(inventoryMovementType.id, input.movementTypeId));

    if (!movementType) {
      throw new Error("Tipo de movimiento de inventario no encontrado");
    }

    // B.6: Validar que el tipo de movimiento esté habilitado
    if (!movementType.isEnabled) {
      throw new Error("El tipo de movimiento de inventario está deshabilitado");
    }

    // E.19: Para movimientos de salida (factor = -1) que afectan stock, validar stock suficiente
    if (movementType.factor === -1 && movementType.affectsStock) {
      const { stock } = await import("#models/inventory/stock");
      const { and, sql } = await import("drizzle-orm");

      for (const detail of input.details) {
        // Buscar stock disponible para este ítem y ubicación
        const [currentStock] = await tx
          .select({ quantity: stock.quantity })
          .from(stock)
          .where(
            and(
              eq(stock.itemId, detail.itemId),
              detail.locationId
                ? eq(stock.locationId, detail.locationId)
                : sql`${stock.locationId} IS NULL`
            )
          );

        const availableQty = currentStock?.quantity ?? 0;

        if (availableQty < detail.quantity) {
          throw new Error(
            `Stock insuficiente para el ítem ${detail.itemId}. Disponible: ${availableQty}, Requerido: ${detail.quantity}`
          );
        }
      }
    }

    // 2. Obtener el tipo de documento de negocio asociado
    const [docType] = await tx
      .select()
      .from(documentType)
      .where(eq(documentType.id, movementType.documentTypeId));

    if (!docType) {
      throw new Error(
        "Tipo de documento de negocio no configurado para este tipo de movimiento"
      );
    }

    // 3. Generar UUID temporal para el externalDocumentId
    const tempExternalId = crypto.randomUUID();

    // 4. Pedir número al motor de numeración (usando tx)
    // Usamos UUID temporal porque aún no tenemos el ID del movimiento
    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: docType.code,
      today: input.movementDate,
      externalDocumentType: "inventory_movement",
      externalDocumentId: tempExternalId,
    });

    // 5. Insertar el movimiento CON la numeración correcta
    const [movement] = await tx
      .insert(inventoryMovement)
      .values({
        movementTypeId: input.movementTypeId,
        movementDate: input.movementDate,
        observation: input.observation ?? null,
        userId: input.userId,
        sourceDocumentType: input.sourceDocumentType ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        documentSeriesId: numbering.seriesId,
        documentNumber: numbering.assignedNumber,
        documentNumberFull: numbering.fullNumber,
      })
      .returning();

    // 6. Actualizar el externalDocumentId en document_sequence con el ID real del movimiento
    const { documentSequence } = await import(
      "#models/numbering/document_sequence"
    );
    const { and } = await import("drizzle-orm");
    await tx
      .update(documentSequence)
      .set({ externalDocumentId: movement.id.toString() })
      .where(
        and(
          eq(documentSequence.seriesId, numbering.seriesId),
          eq(documentSequence.assignedNumber, numbering.assignedNumber)
        )
      );

    // 7. Insertar detalles
    await tx.insert(inventoryMovementDetail).values(
      input.details.map((d) => ({
        movementId: movement.id,
        itemId: d.itemId,
        locationId: d.locationId,
        quantity: d.quantity,
        unitCost: d.unitCost,
      }))
    );

    return movement;
  });
}

/**
 * Parámetros para listar movimientos de inventario
 */
export interface ListInventoryMovementsParams {
  pageIndex: number;
  pageSize: number;
  movementTypeId?: number;
  startDate?: DateTime;
  endDate?: DateTime;
  documentNumber?: string;
  includeTotalCount?: boolean;
}

/**
 * Lista movimientos de inventario con paginación y filtros
 */
export async function listInventoryMovements(
  params: ListInventoryMovementsParams
) {
  const conditions = [];

  if (params.movementTypeId) {
    conditions.push(
      eq(inventoryMovement.movementTypeId, params.movementTypeId)
    );
  }

  if (params.startDate) {
    conditions.push(gte(inventoryMovement.movementDate, params.startDate));
  }

  if (params.endDate) {
    conditions.push(lte(inventoryMovement.movementDate, params.endDate));
  }

  if (params.documentNumber) {
    conditions.push(
      like(inventoryMovement.documentNumberFull, `%${params.documentNumber}%`)
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select({
      id: inventoryMovement.id,
      movementDate: inventoryMovement.movementDate,
      documentNumberFull: inventoryMovement.documentNumberFull,
      observation: inventoryMovement.observation,
      movementType: inventoryMovementType.name,
    })
    .from(inventoryMovement)
    .innerJoin(
      inventoryMovementType,
      eq(inventoryMovement.movementTypeId, inventoryMovementType.id)
    )
    .where(where)
    .orderBy(desc(inventoryMovement.movementDate), desc(inventoryMovement.id))
    .limit(params.pageSize)
    .offset(params.pageIndex * params.pageSize);

  let totalCount = 0;
  if (params.includeTotalCount) {
    const [result] = await db
      .select({ count: count() })
      .from(inventoryMovement)
      .where(where);
    totalCount = result?.count ?? 0;
  }

  return {
    items,
    totalCount,
  };
}

/**
 * Obtiene un movimiento de inventario por ID con sus detalles
 */
export async function getInventoryMovement(id: number) {
  const [movement] = await db
    .select({
      id: inventoryMovement.id,
      movementTypeId: inventoryMovement.movementTypeId,
      movementDate: inventoryMovement.movementDate,
      observation: inventoryMovement.observation,
      userId: inventoryMovement.userId,
      documentNumberFull: inventoryMovement.documentNumberFull,
      documentSeriesId: inventoryMovement.documentSeriesId,
      documentNumber: inventoryMovement.documentNumber,
      // Include type info if needed
      movementTypeName: inventoryMovementType.name,
      movementTypeFactor: inventoryMovementType.factor,
    })
    .from(inventoryMovement)
    .innerJoin(
      inventoryMovementType,
      eq(inventoryMovement.movementTypeId, inventoryMovementType.id)
    )
    .where(eq(inventoryMovement.id, id));

  if (!movement) {
    return null;
  }

  const details = await db
    .select({
      id: inventoryMovementDetail.id,
      itemId: inventoryMovementDetail.itemId,
      locationId: inventoryMovementDetail.locationId,
      quantity: inventoryMovementDetail.quantity,
      unitCost: inventoryMovementDetail.unitCost,
      itemName: item.fullName,
      itemCode: item.code,
      locationName: location.name,
    })
    .from(inventoryMovementDetail)
    .innerJoin(item, eq(inventoryMovementDetail.itemId, item.id))
    .leftJoin(location, eq(inventoryMovementDetail.locationId, location.id))
    .where(eq(inventoryMovementDetail.movementId, id));

  return {
    ...movement,
    details,
  };
}
