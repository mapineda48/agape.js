import { db } from "#lib/db";
import supplier_type from "#models/purchasing/supplier_type";
import { desc, eq } from "drizzle-orm";

/**
 * Lista todos los tipos de proveedor ordenados por ID descendente
 */
export async function listSupplierTypes() {
  return db.select().from(supplier_type).orderBy(desc(supplier_type.id));
}

/**
 * Obtiene un tipo de proveedor por ID
 */
export async function getSupplierType(id: number) {
  const [record] = await db
    .select()
    .from(supplier_type)
    .where(eq(supplier_type.id, id));

  return record;
}

/**
 * Crea un nuevo tipo de proveedor
 */
export async function createSupplierType(data: { name: string }) {
  const [record] = await db
    .insert(supplier_type)
    .values({
      name: data.name,
    })
    .returning();

  return record;
}

/**
 * Actualiza un tipo de proveedor existente
 */
export async function updateSupplierType(
  id: number,
  data: { name: string }
) {
  const [record] = await db
    .update(supplier_type)
    .set({
      name: data.name,
    })
    .where(eq(supplier_type.id, id))
    .returning();

  return record;
}

/**
 * Elimina un tipo de proveedor por ID
 */
export async function deleteSupplierType(id: number) {
  await db.delete(supplier_type).where(eq(supplier_type.id, id));
}
