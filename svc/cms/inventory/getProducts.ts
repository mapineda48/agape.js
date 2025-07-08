import { db } from "#lib/db";
import { product } from "#models/inventory/product";
import { and, count, eq, like } from "drizzle-orm";
import { category } from "#models/inventory/category";

export default async function getProducts(params: GetProductsParams): Promise<GetProductsResult> {
    const {
        fullName,
        isActive,
        categoryId,
        includeTotalCount = false,
        pageIndex = 0,
        pageSize = 10,
    } = params;

    const conditions = [];

    if (fullName) {
        conditions.push(like(product.fullName, `%${fullName}%`));
    }

    if (isActive !== undefined) {
        conditions.push(eq(product.isActive, isActive));
    }

    if (categoryId !== undefined) {
        conditions.push(eq(product.categoryId, categoryId));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Consulta de productos
    const queryProducts = db
        .select({
            id: product.id,
            fullName: product.fullName,
            isActive: product.isActive,
            price: product.price,
            category: category.fullName,
            inventory: product.id, // Ajusta si tienes un campo real de inventario
        })
        .from(product)
        .innerJoin(category, eq(product.categoryId, category.id))
        .where(whereClause)
        .limit(pageSize)
        .offset(pageIndex * pageSize);

    // Si no se requiere totalCount, devolvemos solo los productos
    if (!includeTotalCount) {
        const products = await queryProducts;
        return {
            products,
        };
    }

    // Consulta de totalCount solo si se requiere
    const queryCount = db
        .select({ totalCount: count() })
        .from(product)
        .where(whereClause);

    // Ejecutar ambas consultas en paralelo
    // Esto mejora el rendimiento al evitar esperar una consulta antes de la otra
    // y permite que ambas se ejecuten simultáneamente.
    const [products, [{ totalCount }]] = await Promise.all([queryProducts, queryCount]);

    return {
        products,
        totalCount,
    };
}

/**
 * Types
 */

export interface GetProductsParams {
    fullName?: string;
    isActive?: boolean;
    categoryId?: number;
    includeTotalCount?: boolean; // más claro que "count"
    pageIndex?: number;
    pageSize?: number;
}

export interface GetProduct {
    id: number;
    fullName: string;
    isActive: boolean;
    price: string; // o number, según tu modelo
    category: string; // o el tipo adecuado según tu modelo
    inventory: number
}

export interface GetProductsResult {
    products: GetProduct[];
    totalCount?: number; // solo presente si includeTotalCount === true
}