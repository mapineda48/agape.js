import { db } from "#lib/db";
import supplier from "#models/purchasing/supplier";
import person from "#models/core/person";
import supplier_type from "#models/purchasing/supplier_type";
import { desc, eq } from "drizzle-orm";
import type DateTime from "#utils/data/DateTime";

/**
 * Lista los proveedores con sus datos de persona y tipo.
 */
export async function listSuppliers() {
  return db
    .select({
      id: supplier.id,
      personId: supplier.personId,
      supplierTypeId: supplier.supplierTypeId,
      supplierTypeName: supplier_type.name,
      registrationDate: supplier.registrationDate,
      active: supplier.active,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      address: person.address,
      birthdate: person.birthdate,
    })
    .from(supplier)
    .innerJoin(person, eq(supplier.personId, person.id))
    .leftJoin(supplier_type, eq(supplier.supplierTypeId, supplier_type.id))
    .orderBy(desc(supplier.id));
}

/**
 * Crea o actualiza un proveedor con su persona asociada.
 */
export async function upsertSupplier(
  data: UpsertSupplierData
): Promise<SupplierRecord> {
  const { id, person: personData, ...supplierData } = data;

  // Upsert de persona
  let personRecord;
  if (personData.id) {
    [personRecord] = await db
      .update(person)
      .set(personData)
      .where(eq(person.id, personData.id))
      .returning();
  } else {
    [personRecord] = await db.insert(person).values(personData).returning();
  }

  // Upsert de proveedor
  const [supplierRecord] = await db
    .insert(supplier)
    .values({
      ...(id !== undefined && { id }),
      personId: personRecord.id,
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
    person: personRecord,
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
  person: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    birthdate: DateTime;
  };
  supplierTypeId: number;
  active?: boolean;
}

export interface SupplierRecord {
  id: number;
  personId: number;
  supplierTypeId: number;
  supplierTypeName?: string | null;
  registrationDate: DateTime;
  active: boolean;
  person?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    birthdate: DateTime;
  };
}
