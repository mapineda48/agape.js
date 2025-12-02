import { db } from "#lib/db";
import client from "#models/crm/client";
import person from "#models/core/person";
import client_type from "#models/crm/client_type";
import { and, count, eq, sql } from "drizzle-orm";

export default async function getClients(
  params: GetClientsParams
): Promise<GetClientsResult> {
  const {
    fullName,
    isActive,
    typeId,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (fullName) {
    // Search in person's first name and last name
    conditions.push(
      sql`CONCAT(${person.firstName}, ' ', ${
        person.lastName
      }) ILIKE ${`%${fullName}%`}`
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(client.active, isActive));
  }

  if (typeId !== undefined) {
    conditions.push(eq(client.typeId, typeId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Query clients with person and type info
  const queryClients = db
    .select({
      id: client.id,
      personId: client.personId,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      address: person.address,
      birthdate: person.birthdate,
      typeId: client.typeId,
      typeName: client_type.name,
      photoUrl: client.photoUrl,
      active: client.active,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    .from(client)
    .innerJoin(person, eq(client.personId, person.id))
    .leftJoin(client_type, eq(client.typeId, client_type.id))
    .where(whereClause)
    .orderBy(client.id)
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  // If no total count needed, return only clients
  if (!includeTotalCount) {
    const clients = await queryClients;
    return {
      clients,
    };
  }

  // Count query
  const queryCount = db
    .select({ totalCount: count() })
    .from(client)
    .innerJoin(person, eq(client.personId, person.id))
    .where(whereClause);

  // Execute both queries in parallel
  const [clients, [{ totalCount }]] = await Promise.all([
    queryClients,
    queryCount,
  ]);

  return {
    clients,
    totalCount,
  };
}

/**
 * Types
 */

export interface GetClientsParams {
  fullName?: string;
  isActive?: boolean;
  typeId?: number;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface GetClient {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  birthdate: Date;
  typeId: number | null;
  typeName: string | null;
  photoUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface GetClientsResult {
  clients: GetClient[];
  totalCount?: number;
}
