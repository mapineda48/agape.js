import { db } from "#lib/db";
import client from "#models/crm/client";
import person from "#models/core/person";
import { eq, and, sql, count } from "drizzle-orm";

// Obtener un cliente por ID
export async function getClient(id: number): Promise<ClientDTO | null> {
  const [match] = await db.select().from(client).where(eq(client.id, id));
  return match ? toClientDTO(match) : null;
}

// Crear un nuevo cliente
export async function createClient(data: NewClientDTO): Promise<ClientDTO> {
  const [created] = await db.insert(client).values({
    ...data,
    active: data.active ?? true,
  }).returning();
  return toClientDTO(created);
}

// Actualizar un cliente existente
export async function updateClient(data: UpdateClientDTO): Promise<ClientDTO | null> {
  const [updated] = await db.update(client)
    .set({
      ...data,
    })
    .where(eq(client.id, data.id))
    .returning();
  return updated ? toClientDTO(updated) : null;
}

// Eliminar un cliente
export async function deleteClient(id: number): Promise<boolean> {
  const result = await db.delete(client).where(eq(client.id, id));
  return (result?.rowCount ?? 0) > 0;
}

// Listar clientes con filtros y paginación
export async function getClients(params: GetClientsParams): Promise<GetClientsResult> {
  const {
    fullName,
    typeId,
    active,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];
  if (fullName) {
    conditions.push(
      sql`${person.firstName} || ' ' || ${person.lastName} ILIKE ${`%${fullName}%`}`
    );
  }
  if (typeId !== undefined) {
    conditions.push(eq(client.typeId, typeId));
  }
  if (active !== undefined) {
    conditions.push(eq(client.active, active));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Consulta principal
  const queryClients = db
    .select({
      id: client.id,
      personId: client.personId,
      typeId: client.typeId,
      active: client.active,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    .from(client)
    .innerJoin(person, eq(client.personId, person.id))
    .where(whereClause)
    .orderBy(client.id)
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  if (!includeTotalCount) {
    const clients = await queryClients;
    return {
      clients: clients.map(toClientDTO),
    };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(client)
    .where(whereClause);

  const [clients, [{ totalCount }]] = await Promise.all([queryClients, queryCount]);
  return {
    clients: clients.map(toClientDTO),
    totalCount,
  };
}

// Utilidad para mapear a DTO
function toClientDTO(row: any): ClientDTO {
  return {
    id: row.id,
    personId: row.personId,
    typeId: row.typeId,
    active: row.active,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

/**
 * Types
 */
// DTOs para el CRUD de clientes

export interface ClientDTO {
  id: number;
  personId: number;
  typeId?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewClientDTO {
  personId: number;
  typeId?: number;
  active?: boolean;
}

export interface UpdateClientDTO {
  id: number;
  typeId?: number;
  active?: boolean;
}

export interface GetClientsParams {
  fullName?: string;
  typeId?: number;
  active?: boolean;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface GetClientsResult {
  clients: ClientDTO[];
  totalCount?: number;
}
