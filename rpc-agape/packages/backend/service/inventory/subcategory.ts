import db from "../../models";
import type { ISubcategory } from "../../models/inventory/subcategory";

export function findAll() {
  return db.inventory.subcategory.findAll();
}

export async function deleteCategory(idCategory: number) {
  await db.inventory.subcategory.destroy({ where: { id: idCategory } });
}

let id = 0;

export function sayHello(person: { fullName: string }) {
  id++;
  return Promise.resolve(`Hello ${person.fullName} ${id}`);
}

export type { ISubcategory };
