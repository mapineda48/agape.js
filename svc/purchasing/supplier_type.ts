import { db } from "#lib/db";
import supplierType, {
  type NewSupplierType,
} from "#models/purchasing/supplier_type";
import { desc, eq } from "drizzle-orm";

/**
 * Lista todos los tipos de proveedor ordenados por ID descendente.
 */
export async function listSupplierTypes() {
  return db.select().from(supplierType).orderBy(desc(supplierType.id));
}

/**
 * Obtiene un tipo de proveedor por ID.
 */
export async function getSupplierTypeById(id: number) {
  const [record] = await db
    .select()
    .from(supplierType)
    .where(eq(supplierType.id, id));

  return record;
}

/**
 * Inserta o actualiza un tipo de proveedor.
 */
export async function upsertSupplierType(payload: NewSupplierType) {
  const { id, ...data } = payload;

  if (typeof id !== "number") {
    return db.insert(supplierType).values(data).returning();
  }

  return db
    .update(supplierType)
    .set(data)
    .where(eq(supplierType.id, id))
    .returning();
}

/**
 * Elimina un tipo de proveedor por ID.
 */
export async function deleteSupplierType(id: number) {
  await db.delete(supplierType).where(eq(supplierType.id, id));
}

// Alias para compatibilidad con código existente
export const getSupplierType = getSupplierTypeById;
export async function createSupplierType(payload: { name: string }) {
  const [record] = await upsertSupplierType(payload as NewSupplierType);
  return record;
}
export async function updateSupplierType(
  id: number,
  payload: { name: string }
) {
  const [record] = await upsertSupplierType({ id, ...payload });
  return record;
}
