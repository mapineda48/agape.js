import { db } from "#lib/db";
import { product, type NewProduct, type Product } from "#models/inventory/product";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, like } from "drizzle-orm";
import { category } from "#models/inventory/category";

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

interface GetProductsResult {
    products: GetProduct[];
    totalCount?: number; // solo presente si includeTotalCount === true
}

export async function getProducts(params: GetProductsParams): Promise<GetProductsResult> {
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

    const products = await db
        .select({
            id: product.id,
            fullName: product.fullName,
            isActive: product.isActive,
            price: product.price,
            category: category.fullName,
            inventory: product.id, // Asegúrate de que este campo exista en tu modelo
        })
        .from(product)
        .innerJoin(category, eq(product.categoryId, category.id))
        .where(whereClause)
        .limit(pageSize)
        .offset(pageIndex * pageSize);

    let totalCount: number | undefined;

    if (includeTotalCount) {
        const [records] = await db
            .select({ count: count() })
            .from(product)
            .where(whereClause)
            .execute();

        totalCount = Number(records.count);
    }

    return {
        products,
        totalCount,
    };
}


/**
 * Inserta o actualiza un producto junto con sus imágenes (JSONB).
 * Si se proporciona `id`, hace upsert sobre la PK; si no, crea uno nuevo.
 * @param data Datos del producto
 * @returns El registro de producto insertado o actualizado
 */
export async function upsertProduct(
    data: Omit<NewProduct, "images"> & { id?: number; images: (string | File)[] }
): Promise<Product> {
    const { id, images, ...rest } = data;

    console.log(id, images, rest);

    // Upsert principal
    const [record] = await db
        .insert(product)
        .values({
            ...(id !== undefined && { id }),
            ...rest,
            images: [],
        })
        .onConflictDoUpdate({
            target: product.id,
            set: {
                ...rest
            },
        })
        .returning();

    if (areArraysEqual(record.images as string[], images) || !images.length) {
        return record;
    }

    const imgs = await Promise.all(images.map((file) => {
        if (typeof file === "string") {
            return Promise.resolve(file);
        }

        return BlobStorage.uploadFile(`inventory/product/${record.id}`, file);
    }));

    await db.update(product).set({ images: imgs }).where(eq(product.id, record.id));
    record.images = imgs;

    return record;
}

function areArraysEqual(a: string[], b: (string | File)[]) {
    // 1) Mismo número de elementos
    if (a.length !== b.length) return false;
    // 2) Cada elemento en la misma posición es idéntico
    return a.every((value, index) => value === b[index]);
}

export type { Product, NewProduct }



