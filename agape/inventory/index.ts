import db from "../../models";
import { ICategory } from "../../models/inventory/category";

export async function sayHelloWorld(message: string) {
    return Promise.resolve(`Hello ${message}`);
}


export async function createCategory(fullName: string, isEnabled: boolean) {
    const model = await db.inventory.category.create({
        fullName, 
        isEnabled
    });

    return model.get() as ICategory
}