import { db } from "#lib/db";
import supplierType, {
  type NewSupplierType,
} from "#models/purchasing/supplier_type";
import { desc, eq } from "drizzle-orm";

/**
 * Lista todos los tipos de proveedor ordenados por ID descendente.
 * @permission purchasing.supplier_type.read
 */
export async function listSupplierTypes() {
  return db.select().from(supplierType).orderBy(desc(supplierType.id));
}

/**
 * Obtiene un tipo de proveedor por ID.
 * @permission purchasing.supplier_type.read
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
 * @permission purchasing.supplier_type.manage
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
 * @permission purchasing.supplier_type.manage
 */
export async function deleteSupplierType(id: number) {
  await db.delete(supplierType).where(eq(supplierType.id, id));
}

// Alias para compatibilidad con código existente
/** @permission purchasing.supplier_type.read */
export const getSupplierType = getSupplierTypeById;
/** @permission purchasing.supplier_type.manage */
export async function createSupplierType(payload: { name: string }) {
  const [record] = await upsertSupplierType(payload as NewSupplierType);
  return record;
}
/** @permission purchasing.supplier_type.manage */
export async function updateSupplierType(
  id: number,
  payload: { name: string }
) {
  const [record] = await upsertSupplierType({ id, ...payload });
  return record;
}
