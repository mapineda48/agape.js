import { db } from "#lib/db";
import { inventoryMovement } from "#models/inventory/movement";
import { inventoryMovementDetail } from "#models/inventory/movement_detail";
import { inventoryMovementType } from "#models/inventory/movement_type";
import { documentType } from "#models/numbering/document_type";
import { getNextDocumentNumberTx } from "#svc/numbering/getNextDocumentNumber";
import type DateTime from "#utils/data/DateTime";
import { eq, desc, and, gte, lte, like, count, sql } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";
import { item } from "#models/catalogs/item";
import { location } from "#models/inventory/location";
import { inventoryItem } from "#models/inventory/item";
import { itemUom } from "#models/inventory/item_uom";
import * as StockService from "./stock";
import * as CostingService from "./cost_layer";
import * as LotService from "./lot";

import type {
  CreateInventoryMovementInput,
  CreateInventoryMovementDetail,
} from "#utils/dto/inventory/movement";

// Re-export DTOs
export * from "#utils/dto/inventory/movement";

/**
 * Crea un movimiento de inventario y asigna número de documento
 * usando el motor de numeración.
 *
 * Implements:
 * R1 (ATP), R2 (UOM), R3 (Period Closing), R4 (FIFO/LIFO), R5 (Layers), R6 (Lots), R7 (Sync)
 */
export async function createInventoryMovement(
  input: CreateInventoryMovementInput
) {
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
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (input.movementDate.getTime() > today.getTime()) {
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

    // 2. Process Details Logic (Stock, Cost, UOM)
    const processedDetails: Array<{
      itemId: number;
      locationId: number;
      lotId?: number | null;
      quantity: Decimal; // Normalized Base Quantity
      unitCost: Decimal;
    }> = [];

    for (const detail of input.details) {
      // Validate Location
      if (!detail.locationId) {
        throw new Error(`Ubicación requerida para el ítem ${detail.itemId}`);
      }

      // Get Inventory Item for UOM
      const [invItem] = await tx
        .select()
        .from(inventoryItem)
        .where(eq(inventoryItem.itemId, detail.itemId));
      if (!invItem) {
        throw new Error(
          `El ítem ${detail.itemId} no está configurado para inventario`
        );
      }

      // R2: Normalize UOM
      let baseQty = new Decimal(detail.quantity);
      if (detail.uomId && detail.uomId !== invItem.uomId) {
        const [conversion] = await tx
          .select()
          .from(itemUom)
          .where(
            and(
              eq(itemUom.itemId, detail.itemId),
              eq(itemUom.uomId, detail.uomId)
            )
          );

        if (!conversion) {
          throw new Error(
            `No existe conversión de UOM para el ítem ${detail.itemId}`
          );
        }
        baseQty = baseQty.times(new Decimal(conversion.conversionFactor));
      }

      // Factor: 1 (In), -1 (Out)
      const factor = movementType.factor;

      // R6: Validate Lot
      if (detail.lotId) {
        await LotService.validateLot(tx, detail.lotId, {
          allowExpired: false,
          allowRestricted: false,
        });
      }

      // R1 & R7: Stock Update
      if (movementType.affectsStock) {
        const delta = baseQty.times(factor);
        if (factor === -1) {
          // ATP Validations
          await StockService.validateStockAvailability(
            tx,
            detail.itemId,
            detail.locationId,
            baseQty.toNumber(),
            detail.lotId
          );
        }

        await StockService.updateStock(
          tx,
          detail.itemId,
          detail.locationId,
          delta.toNumber(),
          detail.lotId
        );
      }

      // R4 & R5: Costing & Layers
      let unitCost = new Decimal(0);
      if (factor === 1) {
        // INPUT
        unitCost = detail.unitCost
          ? new Decimal(detail.unitCost)
          : new Decimal(0);
      } else if (factor === -1) {
        // OUTPUT
        if (movementType.affectsStock) {
          unitCost = await CostingService.consumeLayers(tx, {
            itemId: detail.itemId,
            locationId: detail.locationId,
            quantity: baseQty.toNumber(),
            method: "FIFO",
            lotId: detail.lotId,
          });
        }
      }

      processedDetails.push({
        itemId: detail.itemId,
        locationId: detail.locationId,
        lotId: detail.lotId,
        quantity: baseQty,
        unitCost: unitCost,
      });
    }

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

    // 4. Create Details & Layers
    for (const pDetail of processedDetails) {
      // Insert Detail
      await tx.insert(inventoryMovementDetail).values({
        movementId: movement.id,
        itemId: pDetail.itemId,
        locationId: pDetail.locationId,
        lotId: pDetail.lotId,
        quantity: pDetail.quantity,
        unitCost: pDetail.unitCost,
        totalCost: pDetail.quantity.times(pDetail.unitCost),
      });

      // R5: Create Layer for Inputs
      if (movementType.factor === 1 && movementType.affectsStock) {
        await CostingService.createLayer(tx, {
          itemId: pDetail.itemId,
          locationId: pDetail.locationId,
          lotId: pDetail.lotId,
          quantity: pDetail.quantity.toNumber(),
          unitCost: pDetail.unitCost,
          movementId: movement.id,
          createdAt: input.movementDate,
        });
      }
    }

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
      employeeId: inventoryMovement.employeeId,
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
    userId: movement.employeeId, // Map employeeId back to userId for DTO compatibility if strictly needed, or just return employeeId
    details,
  };
}
