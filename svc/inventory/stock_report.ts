import { db } from "#lib/db";
import { inventoryCostLayer } from "#models/inventory/cost_layer";
import { inventoryLot } from "#models/inventory/lot";
import { item } from "#models/catalogs/item";
import { category } from "#models/catalogs/category";
import { inventoryMovement } from "#models/inventory/movement";
import { eq, and, sql, desc } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";

export interface ListStockValuationParams {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
    includeTotalCount?: boolean;
}

export interface StockValuationItem {
    itemId: number;
    itemCode: string;
    itemName: string;
    categoryName: string | null;
    totalQuantity: number;
    totalValue: number;
    layers: {
        layerId: number;
        lotId: number | null;
        lotNumber: string | null;
        expirationDate: Date | null;
        lotStatus: string | null;
        quantity: number;
        unitCost: number;
        totalCost: number;
        createdAt: Date;
        sourceDocumentId: number | null;
        sourceDocumentNumber: string | null;
    }[];
}

/** @permission inventory.stock.read */
export async function listStockValuation(params: ListStockValuationParams) {
    const conditions = [sql`${inventoryCostLayer.remainingQuantity} > 0`];

    if (params.search) {
        conditions.push(sql`${item.fullName} ILIKE ${"%" + params.search + "%"}`);
    }

    if (params.categoryId) {
        conditions.push(eq(item.categoryId, params.categoryId));
    }

    const where = and(...conditions);
    const pageIndex = params.pageIndex ?? 0;
    const pageSize = params.pageSize ?? 20;

    // 1. Get Distinct Items that have active cost layers
    const itemsQuery = db
        .select({
            itemId: item.id,
            itemCode: item.code,
            itemName: item.fullName,
            categoryName: category.fullName,
        })
        .from(inventoryCostLayer)
        .innerJoin(item, eq(inventoryCostLayer.itemId, item.id))
        .leftJoin(category, eq(item.categoryId, category.id))
        .where(where)
        .groupBy(item.id, item.code, item.fullName, category.fullName)
        .orderBy(item.fullName)
        .limit(pageSize)
        .offset(pageIndex * pageSize);

    const resultItems = await itemsQuery;

    let totalCount: number | undefined;
    if (params.includeTotalCount) {
        const countResult = await db.execute(sql`
            SELECT COUNT(DISTINCT ${inventoryCostLayer.itemId}) as count
            FROM ${inventoryCostLayer}
            INNER JOIN ${item} ON ${inventoryCostLayer.itemId} = ${item.id}
            WHERE ${sql.join(conditions, sql` AND `)}
        `);
        totalCount = Number(countResult.rows[0].count);
    }

    // 2. Fetch all layers for the selected items
    const itemIds = resultItems.map(i => i.itemId);
    if (itemIds.length === 0) {
        return { items: [], totalCount: 0 };
    }

    const layers = await db
        .select({
            id: inventoryCostLayer.id,
            itemId: inventoryCostLayer.itemId,
            lotId: inventoryCostLayer.lotId,
            lotNumber: inventoryLot.lotNumber,
            expirationDate: inventoryLot.expirationDate,
            lotStatus: inventoryLot.status,
            remainingQuantity: inventoryCostLayer.remainingQuantity,
            unitCost: inventoryCostLayer.unitCost,
            createdAt: inventoryCostLayer.createdAt,
            sourceMovementId: inventoryCostLayer.sourceMovementId,
            documentNumber: inventoryMovement.documentNumberFull,
        })
        .from(inventoryCostLayer)
        .leftJoin(inventoryLot, eq(inventoryCostLayer.lotId, inventoryLot.id))
        .leftJoin(inventoryMovement, eq(inventoryCostLayer.sourceMovementId, inventoryMovement.id))
        .where(
            and(
                sql`${inventoryCostLayer.itemId} IN (${sql.join(itemIds, sql`, `)})`,
                sql`${inventoryCostLayer.remainingQuantity} > 0`
            )
        )
        .orderBy(desc(inventoryCostLayer.createdAt));

    // 3. Assemble the final structure
    const fullItems: StockValuationItem[] = resultItems.map((row) => {
        const itemLayers = layers.filter(l => l.itemId === row.itemId);

        const mappedLayers = itemLayers.map(l => {
            const qty = new Decimal(l.remainingQuantity);
            const cost = new Decimal(l.unitCost);
            const total = qty.times(cost);

            return {
                layerId: l.id,
                lotId: l.lotId,
                lotNumber: l.lotNumber,
                expirationDate: l.expirationDate ? new Date(l.expirationDate as any) : null,
                lotStatus: l.lotStatus,
                quantity: qty.toNumber(),
                unitCost: cost.toNumber(),
                totalCost: total.toNumber(),
                createdAt: new Date(l.createdAt as any),
                sourceDocumentId: l.sourceMovementId,
                sourceDocumentNumber: l.documentNumber,
            };
        });

        const totalQuantity = mappedLayers.reduce((acc, l) => acc + l.quantity, 0);
        const totalValue = mappedLayers.reduce((acc, l) => acc + l.totalCost, 0);

        return {
            ...row,
            totalQuantity,
            totalValue,
            layers: mappedLayers,
        };
    });

    return {
        items: fullItems,
        totalCount: totalCount ?? 0,
    };
}

/** @permission inventory.stock.read */
export async function getStockMetrics() {
    const result = await db.execute(sql`
        SELECT 
            COALESCE(SUM(${inventoryCostLayer.remainingQuantity} * ${inventoryCostLayer.unitCost}), 0) as total_value,
            COUNT(DISTINCT ${inventoryCostLayer.itemId}) as total_items,
            COALESCE(SUM(CASE WHEN ${inventoryLot.status} = 'QUARANTINE' THEN ${inventoryCostLayer.remainingQuantity} * ${inventoryCostLayer.unitCost} ELSE 0 END), 0) as quarantine_value,
            COALESCE(SUM(CASE WHEN ${inventoryLot.expirationDate} < CURRENT_DATE THEN ${inventoryCostLayer.remainingQuantity} ELSE 0 END), 0) as expired_qty
        FROM ${inventoryCostLayer}
        LEFT JOIN ${inventoryLot} ON ${inventoryCostLayer.lotId} = ${inventoryLot.id}
        WHERE ${inventoryCostLayer.remainingQuantity} > 0
    `);

    const metrics = result.rows[0];
    return {
        totalValue: Number(metrics.total_value),
        totalItems: Number(metrics.total_items),
        quarantineValue: Number(metrics.quarantine_value),
        expiredQty: Number(metrics.expired_qty),
    };
}
