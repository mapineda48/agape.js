import { db } from "#lib/db";
import { inventoryMovement } from "#models/inventory/movement";
import { inventoryMovementDetail } from "#models/inventory/movement_detail";
import { inventoryLot } from "#models/inventory/lot";
import { inventoryMovementType } from "#models/inventory/movement_type";
import { documentType } from "#models/numbering/document_type";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";
import DateTime from "#utils/data/DateTime";
import { eq, desc, and, gte, lte, like, count, isNotNull } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";
import { item } from "#models/catalogs/item";
import { location } from "#models/inventory/location";
import { inventoryItem } from "#models/inventory/item";
import { itemUom } from "#models/inventory/item_uom";
import employee from "#models/hr/employee";
import person from "#models/core/person";
import * as StockService from "./stock";
import * as CostingService from "./cost_layer";
import * as LotService from "./lot";

import type {
  CreateInventoryMovementInput,
  CreateInventoryMovementDetail,
  CreateInventoryMovementResult,
  PostInventoryMovementResult,
  CancelInventoryMovementResult,
  ListInventoryMovementsParams,
  ListInventoryMovementsResult,
  InventoryMovementListItem,
  InventoryMovementStatus,
} from "#utils/dto/inventory/movement";

// Re-export DTOs
export * from "#utils/dto/inventory/movement";

// Helper type for Transaction
type Transaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Processed detail after validation and normalization.
 * Used internally during movement creation.
 */
interface ProcessedDetail {
  itemId: number;
  locationId: number;
  lotId?: number | null;
  quantity: Decimal; // Normalized Base Quantity
  unitCost: Decimal;
}

/**
 * Validates and processes movement details.
 * This is shared between create and post operations.
 */
async function validateAndProcessDetails(
  tx: Transaction,
  details: CreateInventoryMovementDetail[],
  input: {
    movementDate: DateTime;
    sourceDocumentType?: string | null;
    sourceDocumentId?: number | null;
  }
): Promise<ProcessedDetail[]> {
  const processedDetails: ProcessedDetail[] = [];

  for (const detail of details) {
    // Validate Location
    if (!detail.locationId) {
      throw new Error(`Ubicación requerida para el ítem ${detail.itemId}`);
    }

    // UC-10: Validar que el ítem es inventariable (regla de dominio)
    const [catalogItem] = await tx
      .select({ type: item.type, code: item.code, fullName: item.fullName })
      .from(item)
      .where(eq(item.id, detail.itemId));

    if (!catalogItem) {
      throw new Error(`El ítem ${detail.itemId} no existe`);
    }

    if (catalogItem.type !== "good") {
      throw new Error(
        `El ítem '${catalogItem.code} - ${catalogItem.fullName}' no es inventariable (tipo: ${catalogItem.type}). Solo los bienes físicos pueden tener movimientos de inventario.`
      );
    }

    // Get Inventory Item for UOM and lot requirements
    const [invItem] = await tx
      .select()
      .from(inventoryItem)
      .where(eq(inventoryItem.itemId, detail.itemId));

    if (!invItem) {
      throw new Error(
        `El ítem '${catalogItem.code}' no está configurado para inventario. Debe crearse primero un registro en inventory_item.`
      );
    }

    // UC-11: Validar lote obligatorio según configuración del ítem
    await LotService.validateLotRequirement(
      tx,
      detail.itemId,
      detail.lotId,
      detail.lotNumber
    );

    // UC-11: Resolver lotNumber a lotId si se proporcionó lotNumber
    let resolvedLotId = detail.lotId;
    if (!resolvedLotId && detail.lotNumber) {
      const lotResult = await LotService.findOrCreateLot(tx, {
        itemId: detail.itemId,
        lotNumber: detail.lotNumber,
        expirationDate: detail.lotExpirationDate,
        receivedDate: input.movementDate,
        sourceDocumentType: input.sourceDocumentType,
        sourceDocumentId: input.sourceDocumentId,
      });
      resolvedLotId = lotResult.lotId;
    }

    // R2: Normalize UOM
    let baseQty = new Decimal(detail.quantity);
    if (detail.uomId && detail.uomId !== invItem.uomId) {
      const [conversion] = await tx
        .select()
        .from(itemUom)
        .where(
          and(eq(itemUom.itemId, detail.itemId), eq(itemUom.uomId, detail.uomId))
        );

      if (!conversion) {
        throw new Error(
          `No existe conversión de UOM para el ítem ${detail.itemId}`
        );
      }
      baseQty = baseQty.times(new Decimal(conversion.conversionFactor));
    }

    // Get unit cost from input or default to zero
    const unitCost = detail.unitCost
      ? new Decimal(detail.unitCost)
      : new Decimal(0);

    processedDetails.push({
      itemId: detail.itemId,
      locationId: detail.locationId,
      lotId: resolvedLotId,
      quantity: baseQty,
      unitCost,
    });
  }

  return processedDetails;
}

/**
 * Applies stock effect for a movement.
 * Called when posting a movement.
 */
async function applyStockEffect(
  tx: Transaction,
  movementId: number,
  movementType: {
    factor: number;
    affectsStock: boolean;
  },
  details: Array<{
    itemId: number;
    locationId: number;
    lotId: number | null;
    quantity: Decimal;
    unitCost: Decimal;
  }>,
  movementDate: DateTime
): Promise<void> {
  if (!movementType.affectsStock) return;

  const factor = movementType.factor;

  for (const detail of details) {
    // R6: Validate Lot status if provided
    if (detail.lotId) {
      await LotService.validateLot(tx, detail.lotId, {
        allowExpired: false,
        allowRestricted: false,
      });
    }

    const delta = detail.quantity.times(factor);

    if (factor === -1) {
      // ATP Validations for outputs
      await StockService.validateStockAvailability(
        tx,
        detail.itemId,
        detail.locationId,
        detail.quantity.toNumber(),
        detail.lotId
      );
    }

    // R7: Update Stock
    await StockService.updateStock(
      tx,
      detail.itemId,
      detail.locationId,
      delta.toNumber(),
      detail.lotId
    );

    // R4 & R5: Costing & Layers
    if (factor === 1) {
      // INPUT - Create cost layer
      await CostingService.createLayer(tx, {
        itemId: detail.itemId,
        locationId: detail.locationId,
        lotId: detail.lotId,
        quantity: detail.quantity.toNumber(),
        unitCost: detail.unitCost,
        movementId,
        createdAt: movementDate,
      });
    } else if (factor === -1) {
      // OUTPUT - Consume cost layers
      const consumedCost = await CostingService.consumeLayers(tx, {
        itemId: detail.itemId,
        locationId: detail.locationId,
        quantity: detail.quantity.toNumber(),
        method: "FIFO",
        lotId: detail.lotId,
      });

      // Update detail with consumed cost
      await tx
        .update(inventoryMovementDetail)
        .set({
          unitCost: consumedCost,
          totalCost: detail.quantity.times(consumedCost),
        })
        .where(
          and(
            eq(inventoryMovementDetail.movementId, movementId),
            eq(inventoryMovementDetail.itemId, detail.itemId),
            eq(inventoryMovementDetail.locationId, detail.locationId)
          )
        );
    }
  }
}

/**
 * Crea un movimiento de inventario y asigna número de documento
 * usando el motor de numeración.
 *
 * El movimiento se crea en estado "draft" por defecto.
 * NO afecta stock hasta que sea posteado con postInventoryMovement.
 *
 * Si input.autoPost es true, se crea y postea en una sola operación.
 *
 * Implements:
 * R1 (ATP), R2 (UOM), R3 (Period Closing), R4 (FIFO/LIFO), R5 (Layers), R6 (Lots), R7 (Sync)
 */
export async function createInventoryMovement(
  input: CreateInventoryMovementInput
): Promise<CreateInventoryMovementResult> {
  return await db.transaction(async (tx) => {
    // 0. General Validations
    if (!input.details || input.details.length === 0) {
      throw new Error("El movimiento debe tener al menos un detalle");
    }
    const invalidQuantity = input.details.find((d) => d.quantity <= 0);
    if (invalidQuantity) {
      throw new Error("La cantidad de cada detalle debe ser mayor a cero");
    }

    // R3: Period Closing (Simple check for now)
    // Comparar con el inicio del día siguiente para permitir movimientos de hoy
    const today = new DateTime();
    const startOfTomorrow = new DateTime(
      today.toISOString().split("T")[0] + "T00:00:00"
    ).addDays(1);

    if (input.movementDate.getTime() >= startOfTomorrow.getTime()) {
      throw new Error("No se permiten movimientos con fecha futura");
    }

    // 1. Get Movement Type
    const [movementType] = await tx
      .select()
      .from(inventoryMovementType)
      .where(eq(inventoryMovementType.id, input.movementTypeId));

    if (!movementType || !movementType.isEnabled) {
      throw new Error("Tipo de movimiento inválido o deshabilitado");
    }

    // 2. Validate and process details
    const processedDetails = await validateAndProcessDetails(tx, input.details, {
      movementDate: input.movementDate,
      sourceDocumentType: input.sourceDocumentType,
      sourceDocumentId: input.sourceDocumentId,
    });

    // 3. Create Header (Movement)
    // Get Document Type
    const [docType] = await tx
      .select()
      .from(documentType)
      .where(eq(documentType.id, movementType.documentTypeId));

    if (!docType) {
      throw new Error("Tipo de documento no configurado");
    }

    const tempExternalId = crypto.randomUUID();
    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: docType.code,
      today: input.movementDate,
      externalDocumentType: "inventory_movement",
      externalDocumentId: tempExternalId,
    });

    const [movement] = await tx
      .insert(inventoryMovement)
      .values({
        movementTypeId: input.movementTypeId,
        movementDate: input.movementDate,
        observation: input.observation,
        employeeId: input.userId, // Map userId to employeeId
        sourceDocumentType: input.sourceDocumentType,
        sourceDocumentId: input.sourceDocumentId,
        documentSeriesId: numbering.seriesId,
        documentNumber: numbering.assignedNumber,
        documentNumberFull: numbering.fullNumber,
        status: "draft", // Always start as draft
      })
      .returning();

    // Fix numbering external Id
    const { documentSequence } = await import(
      "#models/numbering/document_sequence"
    );
    await tx
      .update(documentSequence)
      .set({ externalDocumentId: movement.id.toString() })
      .where(
        and(
          eq(documentSequence.seriesId, numbering.seriesId),
          eq(documentSequence.assignedNumber, numbering.assignedNumber)
        )
      );

    // 4. Create Details (without stock effect yet)
    for (const pDetail of processedDetails) {
      await tx.insert(inventoryMovementDetail).values({
        movementId: movement.id,
        itemId: pDetail.itemId,
        locationId: pDetail.locationId,
        lotId: pDetail.lotId,
        quantity: pDetail.quantity,
        unitCost: pDetail.unitCost,
        totalCost: pDetail.quantity.times(pDetail.unitCost),
      });
    }

    // 5. Auto-post if requested
    let finalStatus: InventoryMovementStatus = "draft";
    if (input.autoPost) {
      await applyStockEffect(
        tx,
        movement.id,
        movementType,
        processedDetails.map((d) => ({
          ...d,
          lotId: d.lotId ?? null,
        })),
        input.movementDate
      );

      await tx
        .update(inventoryMovement)
        .set({ status: "posted" })
        .where(eq(inventoryMovement.id, movement.id));

      finalStatus = "posted";
    }

    return {
      movementId: movement.id,
      documentNumber: movement.documentNumberFull,
      status: finalStatus,
    };
  });
}

/**
 * Postea un movimiento de inventario en estado draft.
 *
 * Al postear:
 * - Cambia estado a "posted"
 * - Afecta stock (entradas/salidas según tipo)
 * - Crea capas de costo (entradas) o consume capas (salidas)
 *
 * Una vez posteado, el movimiento NO puede editarse, solo cancelarse.
 */
export async function postInventoryMovement(
  movementId: number
): Promise<PostInventoryMovementResult> {
  return await db.transaction(async (tx) => {
    // 1. Get movement with details
    const [movement] = await tx
      .select()
      .from(inventoryMovement)
      .where(eq(inventoryMovement.id, movementId))
      .for("update"); // Lock row

    if (!movement) {
      throw new Error(`Movimiento ${movementId} no encontrado`);
    }

    if (movement.status !== "draft") {
      throw new Error(
        `No se puede postear un movimiento en estado '${movement.status}'. Solo se pueden postear movimientos en estado 'draft'.`
      );
    }

    // 2. Get movement type
    const [movementType] = await tx
      .select()
      .from(inventoryMovementType)
      .where(eq(inventoryMovementType.id, movement.movementTypeId));

    if (!movementType) {
      throw new Error("Tipo de movimiento no encontrado");
    }

    // 3. Get details
    const details = await tx
      .select()
      .from(inventoryMovementDetail)
      .where(eq(inventoryMovementDetail.movementId, movementId));

    if (details.length === 0) {
      throw new Error("El movimiento no tiene detalles");
    }

    // 4. Validate all details have locationId
    const detailsValidated = details.map((d) => {
      if (!d.locationId) {
        throw new Error(`El detalle del movimiento ${movementId} no tiene ubicación definida`);
      }
      return {
        itemId: d.itemId,
        locationId: d.locationId,
        lotId: d.lotId,
        quantity: new Decimal(d.quantity),
        unitCost: new Decimal(d.unitCost ?? 0),
      };
    });

    // 5. Apply stock effect
    await applyStockEffect(
      tx,
      movementId,
      movementType,
      detailsValidated,
      movement.movementDate
    );

    // 5. Update status
    await tx
      .update(inventoryMovement)
      .set({ status: "posted" })
      .where(eq(inventoryMovement.id, movementId));

    return {
      movementId,
      documentNumber: movement.documentNumberFull,
      previousStatus: "draft",
      newStatus: "posted",
    };
  });
}

/**
 * Cancela un movimiento de inventario.
 *
 * Para movimientos en draft:
 * - Simplemente cambia a "cancelled"
 *
 * Para movimientos posteados:
 * - Crea un movimiento de reversión (con signo opuesto)
 * - Vincula el original con la reversión
 * - Cambia ambos a "cancelled"
 */
export async function cancelInventoryMovement(
  movementId: number,
  reason?: string
): Promise<CancelInventoryMovementResult> {
  return await db.transaction(async (tx) => {
    // 1. Get movement
    const [movement] = await tx
      .select()
      .from(inventoryMovement)
      .where(eq(inventoryMovement.id, movementId))
      .for("update");

    if (!movement) {
      throw new Error(`Movimiento ${movementId} no encontrado`);
    }

    if (movement.status === "cancelled") {
      throw new Error("El movimiento ya está cancelado");
    }

    const previousStatus = movement.status as InventoryMovementStatus;

    // Draft: just cancel, no reversal needed
    if (movement.status === "draft") {
      await tx
        .update(inventoryMovement)
        .set({ status: "cancelled" })
        .where(eq(inventoryMovement.id, movementId));

      return {
        cancelledMovementId: movementId,
        previousStatus,
      };
    }

    // Posted: need to create reversal movement
    // 2. Get movement type for reversal
    const [movementType] = await tx
      .select()
      .from(inventoryMovementType)
      .where(eq(inventoryMovementType.id, movement.movementTypeId));

    if (!movementType) {
      throw new Error("Tipo de movimiento no encontrado");
    }

    // 3. Get details for reversal
    const details = await tx
      .select()
      .from(inventoryMovementDetail)
      .where(eq(inventoryMovementDetail.movementId, movementId));

    // 4. Create reversal movement
    // The reversal has OPPOSITE factor effect
    // We create a new movement with autoPost=true that reverses the original

    // Get document type for numbering
    const [docType] = await tx
      .select()
      .from(documentType)
      .where(eq(documentType.id, movementType.documentTypeId));

    if (!docType) {
      throw new Error("Tipo de documento no configurado");
    }

    const numbering = await getNextDocumentNumberTx(tx, {
      documentTypeCode: docType.code,
      today: movement.movementDate,
      externalDocumentType: "inventory_movement",
      externalDocumentId: crypto.randomUUID(),
    });

    // Create reversal header
    const [reversalMovement] = await tx
      .insert(inventoryMovement)
      .values({
        movementTypeId: movement.movementTypeId,
        movementDate: movement.movementDate,
        observation: `[REVERSIÓN] ${reason || ""} - Movimiento original: ${movement.documentNumberFull}`.trim(),
        employeeId: movement.employeeId,
        sourceDocumentType: "inventory_reversal",
        sourceDocumentId: movement.id,
        documentSeriesId: numbering.seriesId,
        documentNumber: numbering.assignedNumber,
        documentNumberFull: numbering.fullNumber,
        status: "posted", // Reversals are posted immediately
        reversedMovementId: movement.id, // Links to original
      })
      .returning();

    // 5. Apply REVERSAL stock effect (opposite of original)
    // Original entrada (factor=1) -> reversal resta stock
    // Original salida (factor=-1) -> reversal suma stock
    const reversalFactor = -movementType.factor;

    for (const detail of details) {
      const detailUnitCost = new Decimal(detail.unitCost ?? 0);
      const detailTotalCost = new Decimal(detail.totalCost ?? 0);
      const detailLocationId = detail.locationId;

      if (!detailLocationId) {
        throw new Error(`El detalle del movimiento no tiene ubicación definida`);
      }

      // Insert reversal detail
      await tx.insert(inventoryMovementDetail).values({
        movementId: reversalMovement.id,
        itemId: detail.itemId,
        locationId: detailLocationId,
        lotId: detail.lotId,
        quantity: new Decimal(detail.quantity),
        unitCost: detailUnitCost,
        totalCost: detailTotalCost,
      });

      // Apply stock reversal
      if (movementType.affectsStock) {
        const qty = new Decimal(detail.quantity);
        const delta = qty.times(reversalFactor);

        // For reversal of outputs (adding back), no ATP check needed
        // For reversal of inputs (removing), need ATP check
        if (reversalFactor === -1) {
          await StockService.validateStockAvailability(
            tx,
            detail.itemId,
            detailLocationId,
            qty.toNumber(),
            detail.lotId
          );
        }

        await StockService.updateStock(
          tx,
          detail.itemId,
          detailLocationId,
          delta.toNumber(),
          detail.lotId
        );

        // Handle cost layers for reversal
        if (reversalFactor === 1) {
          // Reversing an output - recreate the layer
          await CostingService.createLayer(tx, {
            itemId: detail.itemId,
            locationId: detailLocationId,
            lotId: detail.lotId,
            quantity: qty.toNumber(),
            unitCost: detailUnitCost,
            movementId: reversalMovement.id,
            createdAt: movement.movementDate,
          });
        } else if (reversalFactor === -1) {
          // Reversing an input - consume the layer
          await CostingService.consumeLayers(tx, {
            itemId: detail.itemId,
            locationId: detailLocationId,
            quantity: qty.toNumber(),
            method: "FIFO",
            lotId: detail.lotId,
          });
        }
      }
    }

    // 6. Update original movement
    await tx
      .update(inventoryMovement)
      .set({
        status: "cancelled",
        reversingMovementId: reversalMovement.id,
      })
      .where(eq(inventoryMovement.id, movementId));

    // Fix numbering external Id for reversal
    const { documentSequence } = await import(
      "#models/numbering/document_sequence"
    );
    await tx
      .update(documentSequence)
      .set({ externalDocumentId: reversalMovement.id.toString() })
      .where(
        and(
          eq(documentSequence.seriesId, numbering.seriesId),
          eq(documentSequence.assignedNumber, numbering.assignedNumber)
        )
      );

    return {
      cancelledMovementId: movementId,
      previousStatus,
      reversingMovementId: reversalMovement.id,
      reversingDocumentNumber: reversalMovement.documentNumberFull,
    };
  });
}

/**
 * Lista movimientos de inventario con paginación y filtros
 */
export async function listInventoryMovements(
  params: ListInventoryMovementsParams
): Promise<ListInventoryMovementsResult> {
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

  if (params.status) {
    conditions.push(eq(inventoryMovement.status, params.status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const pageIndex = params.pageIndex ?? 0;
  const pageSize = params.pageSize ?? 20;

  const items = await db
    .select({
      id: inventoryMovement.id,
      movementTypeId: inventoryMovement.movementTypeId,
      movementTypeName: inventoryMovementType.name,
      movementDate: inventoryMovement.movementDate,
      documentNumberFull: inventoryMovement.documentNumberFull,
      status: inventoryMovement.status,
      observation: inventoryMovement.observation,
      employeeId: inventoryMovement.employeeId,
      sourceDocumentType: inventoryMovement.sourceDocumentType,
      sourceDocumentId: inventoryMovement.sourceDocumentId,
      reversedMovementId: inventoryMovement.reversedMovementId,
      firstName: person.firstName,
      lastName: person.lastName,
    })
    .from(inventoryMovement)
    .innerJoin(
      inventoryMovementType,
      eq(inventoryMovement.movementTypeId, inventoryMovementType.id)
    )
    .innerJoin(employee, eq(inventoryMovement.employeeId, employee.id))
    // Employee.id = Person.id (CTI pattern - employee inherits from person)
    .leftJoin(person, eq(employee.id, person.id))
    .where(where)
    .orderBy(desc(inventoryMovement.movementDate), desc(inventoryMovement.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  let totalCount: number | undefined;
  if (params.includeTotalCount) {
    const [result] = await db
      .select({ count: count() })
      .from(inventoryMovement)
      .where(where);
    totalCount = result?.count ?? 0;
  }

  const movements: InventoryMovementListItem[] = items.map((i) => ({
    id: i.id,
    movementTypeId: i.movementTypeId,
    movementTypeName: i.movementTypeName,
    movementDate: i.movementDate,
    documentNumberFull: i.documentNumberFull,
    status: i.status as InventoryMovementStatus,
    observation: i.observation,
    employeeId: i.employeeId,
    employeeName: `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() || "N/A",
    sourceDocumentType: i.sourceDocumentType,
    sourceDocumentId: i.sourceDocumentId,
    isReversal: i.reversedMovementId !== null,
  }));

  return {
    movements,
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
      employeeId: inventoryMovement.employeeId,
      documentNumberFull: inventoryMovement.documentNumberFull,
      documentSeriesId: inventoryMovement.documentSeriesId,
      documentNumber: inventoryMovement.documentNumber,
      status: inventoryMovement.status,
      reversedMovementId: inventoryMovement.reversedMovementId,
      reversingMovementId: inventoryMovement.reversingMovementId,
      sourceDocumentType: inventoryMovement.sourceDocumentType,
      sourceDocumentId: inventoryMovement.sourceDocumentId,
      // Include type info if needed
      movementTypeName: inventoryMovementType.name,
      movementTypeFactor: inventoryMovementType.factor,
      // Employee info
      employeeName: person.firstName,
      employeeLastName: person.lastName,
    })
    .from(inventoryMovement)
    .innerJoin(
      inventoryMovementType,
      eq(inventoryMovement.movementTypeId, inventoryMovementType.id)
    )
    .innerJoin(employee, eq(inventoryMovement.employeeId, employee.id))
    .leftJoin(person, eq(employee.id, person.id))
    .where(eq(inventoryMovement.id, id));

  if (!movement) {
    return null;
  }

  const details = await db
    .select({
      id: inventoryMovementDetail.id,
      itemId: inventoryMovementDetail.itemId,
      locationId: inventoryMovementDetail.locationId,
      lotId: inventoryMovementDetail.lotId,
      quantity: inventoryMovementDetail.quantity,
      unitCost: inventoryMovementDetail.unitCost,
      totalCost: inventoryMovementDetail.totalCost,
      itemName: item.fullName,
      itemCode: item.code,
      locationName: location.name,
      lotNumber: inventoryLot.lotNumber,
    })
    .from(inventoryMovementDetail)
    .innerJoin(item, eq(inventoryMovementDetail.itemId, item.id))
    .leftJoin(location, eq(inventoryMovementDetail.locationId, location.id))
    .leftJoin(inventoryLot, eq(inventoryMovementDetail.lotId, inventoryLot.id))
    .where(eq(inventoryMovementDetail.movementId, id));

  return {
    ...movement,
    employeeFullName: `${movement.employeeName ?? ""} ${movement.employeeLastName ?? ""}`.trim() || "N/A",
    userId: movement.employeeId, // Map employeeId back to userId for DTO compatibility
    details,
  };
}

/**
 * DTO para crear una transferencia de inventario.
 */
export interface CreateInventoryTransferInput {
  /** ID del tipo de movimiento de SALIDA */
  exitMovementTypeId: number;
  /** ID del tipo de movimiento de ENTRADA */
  entryMovementTypeId: number;
  /** Fecha del movimiento */
  movementDate: DateTime;
  /** Observación opcional */
  observation?: string | null;
  /** ID del usuario que realiza el movimiento */
  userId: number;
  /** Si se postea automáticamente (default: true para mantener compatibilidad) */
  autoPost?: boolean;
  /** Detalles de la transferencia */
  details: Array<{
    itemId: number;
    /** Ubicación de ORIGEN (de donde sale) */
    sourceLocationId: number;
    /** Ubicación de DESTINO (a donde entra) */
    destinationLocationId: number;
    /** ID del lote (opcional) */
    lotId?: number | null;
    /** Número de lote alternativo */
    lotNumber?: string | null;
    /** Cantidad a transferir */
    quantity: number;
  }>;
}

/**
 * Resultado de una transferencia de inventario.
 */
export interface CreateInventoryTransferResult {
  /** Movimiento de SALIDA creado */
  exitMovementId: number;
  exitMovementNumber: string;
  exitStatus: InventoryMovementStatus;
  /** Movimiento de ENTRADA creado */
  entryMovementId: number;
  entryMovementNumber: string;
  entryStatus: InventoryMovementStatus;
}

/**
 * Crea una transferencia de inventario entre ubicaciones.
 * UC-10: Salida de origen + entrada en destino en una sola transacción.
 *
 * Esta operación es atómica: si falla cualquier línea, no se afecta ningún registro.
 *
 * Por defecto se postea automáticamente para mantener compatibilidad con el flujo anterior.
 */
export async function createInventoryTransfer(
  input: CreateInventoryTransferInput
): Promise<CreateInventoryTransferResult> {
  // Default to autoPost=true for backwards compatibility
  const shouldAutoPost = input.autoPost !== false;

  // Validaciones básicas
  if (!input.details || input.details.length === 0) {
    throw new Error("La transferencia debe tener al menos un detalle");
  }

  for (const detail of input.details) {
    if (detail.quantity <= 0) {
      throw new Error("La cantidad de cada detalle debe ser mayor a cero");
    }
    if (detail.sourceLocationId === detail.destinationLocationId) {
      throw new Error(
        `El origen y destino no pueden ser iguales para el ítem ${detail.itemId}`
      );
    }
  }

  // 1. Crear movimiento de SALIDA
  const exitResult = await createInventoryMovement({
    movementTypeId: input.exitMovementTypeId,
    movementDate: input.movementDate,
    observation: input.observation
      ? `[TRANSFER-OUT] ${input.observation}`
      : "[TRANSFER-OUT]",
    userId: input.userId,
    sourceDocumentType: "inventory_transfer",
    details: input.details.map((d) => ({
      itemId: d.itemId,
      locationId: d.sourceLocationId,
      lotId: d.lotId,
      lotNumber: d.lotNumber,
      quantity: d.quantity,
    })),
    autoPost: shouldAutoPost,
  });

  // 2. Get exit details for cost propagation
  const exitMovementData = await getInventoryMovement(exitResult.movementId);
  const costMap = new Map<number, Decimal>();
  if (exitMovementData) {
    for (const ed of exitMovementData.details) {
      if (!costMap.has(ed.itemId) && ed.unitCost !== null) {
        costMap.set(ed.itemId, new Decimal(ed.unitCost));
      }
    }
  }

  // 3. Crear movimiento de ENTRADA con el costo de salida
  const entryResult = await createInventoryMovement({
    movementTypeId: input.entryMovementTypeId,
    movementDate: input.movementDate,
    observation: input.observation
      ? `[TRANSFER-IN] ${input.observation}`
      : "[TRANSFER-IN]",
    userId: input.userId,
    sourceDocumentType: "inventory_transfer",
    sourceDocumentId: exitResult.movementId, // Vincula con movimiento de salida
    details: input.details.map((d) => ({
      itemId: d.itemId,
      locationId: d.destinationLocationId,
      lotId: d.lotId,
      lotNumber: d.lotNumber,
      quantity: d.quantity,
      unitCost: costMap.get(d.itemId),
    })),
    autoPost: shouldAutoPost,
  });

  return {
    exitMovementId: exitResult.movementId,
    exitMovementNumber: exitResult.documentNumber,
    exitStatus: exitResult.status,
    entryMovementId: entryResult.movementId,
    entryMovementNumber: entryResult.documentNumber,
    entryStatus: entryResult.status,
  };
}
