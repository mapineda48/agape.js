import { db } from "#lib/db";
import { stock } from "#models/inventory/stock";
import { stockLot } from "#models/inventory/stock_lot";
import { inventoryLot } from "#models/inventory/lot";
import { item } from "#models/catalogs/item";
import { category } from "#models/catalogs/category";
import { inventoryMovementDetail } from "#models/inventory/movement_detail";
import { inventoryMovement } from "#models/inventory/movement";
import { eq, and, sql, desc, count } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";

export interface ListStockValuationParams {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
    includeTotalCount?: boolean;
}

export async function listStockValuation(params: ListStockValuationParams) {
    // 1. Get Items with Stock (Aggregated)
    // We filter items that have ANY stock in 'inventory_stock' table with quantity != 0
    const conditions = [sql`${stock.quantity} > 0`];

    if (params.search) {
        conditions.push(sql`${item.fullName} ILIKE ${"%" + params.search + "%"}`);
    }

    if (params.categoryId) {
        conditions.push(eq(item.categoryId, params.categoryId));
    }

    const where = and(...conditions);

    const pageIndex = params.pageIndex ?? 0;
    const pageSize = params.pageSize ?? 20;

    const query = db
        .select({
            itemId: item.id,
            itemCode: item.code,
            itemName: item.fullName,
            categoryName: category.fullName,
            totalQuantity: sql<string>`sum(${stock.quantity})`, // Sum across locations if any
        })
        .from(stock)
        .innerJoin(item, eq(stock.itemId, item.id))
        .leftJoin(category, eq(item.categoryId, category.id))
        .where(where)
        .groupBy(item.id, item.code, item.fullName, category.fullName)
        .limit(pageSize)
        .offset(pageIndex * pageSize);

    const resultItems = await query;

    let totalCount: number | undefined;
    if (params.includeTotalCount) {
        // Count distinct items that match
        // Correcting total count query to count distinct items
        const result = await db.execute(sql`
        SELECT COUNT(DISTINCT ${stock.itemId}) as count
        FROM ${stock}
        INNER JOIN ${item} ON ${stock.itemId} = ${item.id}
        WHERE ${sql.join(conditions, sql` AND `)}
     `);

        const distinctCount = result.rows[0];

        totalCount = Number(distinctCount.count);
    }

    // 2. Hydrate with Lot details
    // For each item, fetching its lots and their estimated cost
    const fullItems = await Promise.all(
        resultItems.map(async (row) => {
            // Fetch Lots for this item that have stock
            const lots = await db
                .select({
                    lotId: stockLot.lotId,
                    lotNumber: inventoryLot.lotNumber,
                    expirationDate: inventoryLot.expirationDate,
                    quantity: stockLot.quantity,
                })
                .from(stockLot)
                .innerJoin(inventoryLot, eq(stockLot.lotId, inventoryLot.id))
                .where(
                    and(
                        eq(stockLot.itemId, row.itemId),
                        sql`${stockLot.quantity} > 0` // Only lots with positive stock
                    )
                );

            // Calculate cost for each lot
            const lotsWithCost = await Promise.all(
                lots.map(async (lot) => {
                    // Find latest incoming movement for this lot to determine cost
                    const [lastMovement] = await db
                        .select({
                            unitCost: inventoryMovementDetail.unitCost,
                        })
                        .from(inventoryMovementDetail)
                        .innerJoin(inventoryMovement, eq(inventoryMovementDetail.movementId, inventoryMovement.id))
                        .where(
                            and(
                                eq(inventoryMovementDetail.itemId, row.itemId),
                                eq(inventoryMovementDetail.lotId, lot.lotId),
                                sql`${inventoryMovementDetail.unitCost} IS NOT NULL`
                            )
                        )
                        .orderBy(desc(inventoryMovement.movementDate), desc(inventoryMovement.id))
                        .limit(1);

                    const unitCost = new Decimal(lastMovement?.unitCost ?? 0);
                    const quantity = new Decimal(lot.quantity);
                    const totalCost = unitCost.times(quantity);

                    return {
                        ...lot,
                        unitCost: unitCost.toNumber(),
                        totalCost: totalCost.toNumber(),
                        // We can resolve dates to string here or keep as Date object. Client expects check.
                    };
                })
            );

            const totalValue = lotsWithCost.reduce(
                (acc, l) => acc.add(new Decimal(l.totalCost)),
                new Decimal(0)
            );

            return {
                ...row,
                totalQuantity: new Decimal(row.totalQuantity).toNumber(),
                totalValue: totalValue.toNumber(),
                lots: lotsWithCost,
            };
        })
    );

    return {
        items: fullItems,
        totalCount: totalCount ?? 0,
    };
}
