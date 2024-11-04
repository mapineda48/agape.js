import db from "../../models";
import type { ICategory } from "../../models/inventory/category";

export function findAll() {
  return db.inventory.category.findAll();
}

export async function deleteCategory(idCategory: number) {
  await db.inventory.category.destroy({ where: { id: idCategory } });
}

export async function createCategory(fullName: string) {
  await db.inventory.category.create({ fullName, isEnabled: true });
}

let id = 0;

export function sayHello(person: { fullName: string }) {
  id++;
  return Promise.resolve(`Hello ${person.fullName} ${id}`);
}

export type { ICategory };
