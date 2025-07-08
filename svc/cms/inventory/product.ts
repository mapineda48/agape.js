import { db } from "#lib/db";
import { product, type NewProduct, type Product } from "#models/inventory/product";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { eq } from "drizzle-orm";


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



