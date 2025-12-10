import { db } from "#lib/db";
import { company } from "#models/core/company";
import person from "#models/core/person";
import { user } from "#models/core/user";
import supplier from "#models/purchasing/supplier";
import supplierType from "#models/purchasing/supplier_type";
import { upsertUser, type IUser, type IUpsertUser } from "#svc/core/user";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type DateTime from "#utils/data/DateTime";

// Re-export DTOs from shared module
export type {
  ListSuppliersParams,
  ListSuppliersResult,
  SupplierListItem,
  UpsertSupplierPayload,
  SupplierRecord,
  SupplierDetails,
} from "#utils/dto/purchasing/supplier";

import type {
  ListSuppliersParams,
  ListSuppliersResult,
} from "#utils/dto/purchasing/supplier";

/**
 * Obtiene un proveedor por su ID con los datos de contacto y tipo.
 */
export async function getSupplierById(id: number) {
  const [record] = await db
    .select({
      id: supplier.id,
      userId: supplier.id,
      firstName: person.firstName,
      lastName: person.lastName,
      legalName: company.legalName,
      tradeName: company.tradeName,
      birthdate: person.birthdate,
      supplierTypeId: supplier.supplierTypeId,
      supplierTypeName: supplierType.name,
      registrationDate: supplier.registrationDate,
      active: supplier.active,
      documentTypeId: user.documentTypeId,
      documentNumber: user.documentNumber,
    })
    .from(supplier)
    .innerJoin(user, eq(supplier.id, user.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .leftJoin(supplierType, eq(supplier.supplierTypeId, supplierType.id))
    .where(eq(supplier.id, id));

  return record;
}

/**
 * Lista proveedores con filtros opcionales y paginación.
 */
export async function listSuppliers(
  params: ListSuppliersParams = {}
): Promise<ListSuppliersResult> {
  const {
    fullName,
    isActive,
    supplierTypeId,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (fullName) {
    const search = `%${fullName}%`;
    conditions.push(
      sql`(CONCAT(${person.firstName} || '', ' ', ${person.lastName} || '') ILIKE ${search} OR ${company.legalName} ILIKE ${search} OR ${company.tradeName} ILIKE ${search})`
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(supplier.active, isActive));
  }

  if (supplierTypeId !== undefined) {
    conditions.push(eq(supplier.supplierTypeId, supplierTypeId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const querySuppliers = db
    .select({
      id: supplier.id,
      userId: supplier.id,
      firstName: person.firstName,
      lastName: person.lastName,
      legalName: company.legalName,
      tradeName: company.tradeName,
      birthdate: person.birthdate,
      supplierTypeId: supplier.supplierTypeId,
      supplierTypeName: supplierType.name,
      registrationDate: supplier.registrationDate,
      active: supplier.active,
      documentTypeId: user.documentTypeId,
      documentNumber: user.documentNumber,
    })
    .from(supplier)
    .innerJoin(user, eq(supplier.id, user.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .leftJoin(supplierType, eq(supplier.supplierTypeId, supplierType.id))
    .where(whereClause)
    .orderBy(desc(supplier.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  if (!includeTotalCount) {
    const suppliers = await querySuppliers;
    return { suppliers };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(supplier)
    .innerJoin(user, eq(supplier.id, user.id))
    .leftJoin(person, eq(supplier.id, person.id))
    .leftJoin(company, eq(supplier.id, company.id))
    .where(whereClause);

  const [suppliers, [{ totalCount }]] = await Promise.all([
    querySuppliers,
    queryCount,
  ]);

  return { suppliers, totalCount };
}

/**
 * Crea o actualiza un proveedor junto con el usuario asociado.
 */
export async function upsertSupplier(
  payload: UpsertSupplierPayload
): Promise<SupplierRecord> {
  const { id, user: userDto, ...supplierData } = payload;

  const userRecord = await upsertUser(userDto);

  if (id && id !== userRecord.id) {
    throw new Error(
      "Supplier ID must match the associated user ID when updating."
    );
  }

  const supplierId = id ?? userRecord.id;

  const [supplierRecord] = await db
    .insert(supplier)
    .values({
      id: supplierId,
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
    user: userRecord as any,
  };
}

/**
 * Elimina un proveedor.
 */
export async function deleteSupplier(id: number) {
  await db.delete(supplier).where(eq(supplier.id, id));
}

// Local types that use internal service types
interface UpsertSupplierPayload {
  id?: number;
  user: IUser;
  supplierTypeId: number;
  active?: boolean;
}

interface SupplierRecord {
  id: number;
  supplierTypeId: number;
  registrationDate: DateTime;
  active: boolean;
  user: IUpsertUser;
}
