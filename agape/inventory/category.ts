import db from "../../models";
import { ICategory } from "../../models/inventory/category";
import { ISubcategory } from "../../models/inventory/subcategory";

export async function findAll() {
    const records: unknown = await db.inventory.category.findAll({
        attributes: ["id", "fullName", "isEnabled"],
        include: [
            {
                model: db.inventory.subcategory,
                as: "subcategories",
                attributes: ["id", "fullName", "isEnabled"],
            }
        ],
        order: [["id", "DESC"]]
    });

    return records as Category[]
}

export async function upsert({ subcategories, ...category }: Category) {
    const [record, created] = await db.inventory.category.upsert(category);

    if (!created) {

        console.log("updated!!!")
        record.set(category);


        await record.save()
    }

    await Promise.all(subcategories.map(async ({ fullName, isEnabled, id }) => {
        const subcategory: Omit<ISubcategory, "createdAt" | "updatedAt"> = {
            fullName,
            isEnabled,
            id,
            categoryId: record.getDataValue("id")
        }

        await db.inventory.subcategory.upsert(subcategory);
    }));
}

export async function insertUpdate(categories: Category[]) {
    await Promise.all(categories.map(upsert));

    return findAll()
}

/**
 * Types
 */



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