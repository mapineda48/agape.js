import { db } from "#lib/db";
import { desc, eq } from "drizzle-orm";
import { category } from "#models/inventory/category";
import { subcategory } from "#models/inventory/subcategory";
import CacheMananger from "#lib/services/cache/CacheManager";

type CategoryWithSubs = {
    id: number;
    fullName: string;
    isEnabled: boolean;
    subcategories: {
        id: number;
        fullName: string;
        isEnabled: boolean;
    }[];
};

export const findAll = CacheMananger.cacheRpc("findAllCategory", async () => {
    // 1) select + leftJoin
    const rows = await db
        .select({
            catId: category.id,
            catName: category.fullName,
            catEn: category.isEnabled,
            subId: subcategory.id,
            subName: subcategory.fullName,
            subEn: subcategory.isEnabled,
        })
        .from(category)
        .leftJoin(subcategory, eq(subcategory.categoryId, category.id))
        .orderBy(desc(category.id), desc(subcategory.id));

    // 2) plegar resultados en estructura anidada
    const map = new Map<number, CategoryWithSubs>();
    for (const row of rows) {
        let cat = map.get(row.catId);
        if (!cat) {
            cat = {
                id: row.catId,
                fullName: row.catName,
                isEnabled: row.catEn,
                subcategories: [],
            };
            map.set(row.catId, cat);
        }
        if (row.subId !== null) {
            cat.subcategories.push({
                id: row.subId,
                fullName: row.subName!,
                isEnabled: row.subEn!,
            });
        }
    }

    return Array.from(map.values()) as CategoryWithSubs[];
})

export async function upsert({ id, subcategories, ...payload }: Category) {
    // 1) Upsert de la categoría
    const [catRecord] = await db
        .insert(category)
        .values({
            // si id es undefined, lo omitimos y se insertará nuevo
            ...(id !== undefined && { id }),
            fullName: payload.fullName,
            isEnabled: payload.isEnabled
        })
        .onConflictDoUpdate({
            target: category.id,
            set: {
                fullName: payload.fullName,
                isEnabled: payload.isEnabled
            },
        })
        .returning(); // devuelve el registro insertado/actualizadoo

    const categoryId = catRecord.id;

    if (!subcategories) return catRecord;

    // 2) Upsert de cada subcategoría
    await Promise.all(
        subcategories.map(async ({ id: subId, fullName, isEnabled }) => {
            await db
                .insert(subcategory)
                .values({
                    ...(subId !== undefined && { id: subId }),
                    fullName,
                    isEnabled,
                    categoryId,
                })
                .onConflictDoUpdate({
                    target: subcategory.id,
                    set: {
                        fullName,
                        isEnabled,
                        categoryId,
                    },
                });
        })
    );

    return catRecord;
}

export async function insertUpdate(categories: Category[]) {
    await Promise.all(categories.map(upsert));
    await CacheMananger.remove("findAllCategory");
    return findAll()
}


export interface Category {
    id: number,
    fullName: string,
    isEnabled: boolean,
    subcategories: {
        id: number,
        fullName: string,
        isEnabled: boolean
    }[]
}