import { db } from "#lib/db";
import supplier from "#models/purchasing/supplier";
import person from "#models/core/person";
import user from "#models/core/user";
import supplier_type from "#models/purchasing/supplier_type";
import { desc, eq } from "drizzle-orm";
import type DateTime from "#utils/data/DateTime";
import { upsertUser, type IUpsertUser, type IUser } from "#svc/user";

/**
 * Lista los proveedores con sus datos de persona y tipo.
 */
export async function listSuppliers() {
  return db
    .select({
      id: supplier.id,
      userId: supplier.userId,
      supplierTypeId: supplier.supplierTypeId,
      supplierTypeName: supplier_type.name,
      registrationDate: supplier.registrationDate,
      active: supplier.active,
      firstName: person.firstName,
      lastName: person.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birthdate: person.birthdate,
    })
    .from(supplier)
    .innerJoin(person, eq(supplier.userId, person.id))
    .innerJoin(user, eq(person.id, user.id))
    .leftJoin(supplier_type, eq(supplier.supplierTypeId, supplier_type.id))
    .orderBy(desc(supplier.id));
}

/**
 * Crea o actualiza un proveedor con su usuario asociada.
 */
export async function upsertSupplier(
  data: UpsertSupplierData
): Promise<SupplierRecord> {
  const { id, user: userDto, ...supplierData } = data;

  const user = await upsertUser(userDto);

  // Upsert de proveedor
  const [supplierRecord] = await db
    .insert(supplier)
    .values({
      ...(id !== undefined && { id }),
      userId: user.id,
      supplierTypeId: supplierData.supplierTypeId,
      active: supplierData.active ?? true,
    })
    .onConflictDoUpdate({
      target: supplier.id,
      set: {
        supplierTypeId: supplierData.supplierTypeId,
        active: supplierData.active ?? true,
      },
    })
    .returning();

  return {
    ...supplierRecord,
    user: user,
  };
}

/**
 * Elimina un proveedor.
 */
export async function deleteSupplier(id: number) {
  await db.delete(supplier).where(eq(supplier.id, id));
}

/**
 * Tipados
 */
export interface UpsertSupplierData {
  id?: number;
  user: IUser;
  supplierTypeId: number;
  active?: boolean;
}

export interface SupplierRecord {
  id: number;
  userId: number;
  supplierTypeId: number;
  supplierTypeName?: string | null;
  registrationDate: DateTime;
  active: boolean;
  user: IUpsertUser;
}
