import { db } from "#lib/db";
import client from "#models/crm/client";
import person from "#models/core/person";
import company from "#models/core/company";
import { user } from "#models/core/user";
import clientType from "#models/crm/client_type";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, sql, desc } from "drizzle-orm";
import { upsertUser, type IUser } from "#svc/core/user";
import type {
  ClientDto,
  GetClientByIdResult,
  ListClientsParams,
  ListClientsResult,
  UpsertClientPayload,
  ClientRecord,
} from "#utils/dto/crm/client";

/**
 * Obtiene un cliente por su ID con todos los datos relacionados.
 *
 * @param id - Identificador único del cliente
 * @returns Cliente con datos de persona y tipo, o undefined si no existe
 *
 * @example
 * ```ts
 * const client = await getClientById(1);
 * if (client) {
 *   console.log(client.firstName, client.lastName);
 * }
 * ```
 */
export async function getClientById(id: number): Promise<ClientDto> {
  const [match] = await db
    .select({
      id: client.id,
      typeId: client.typeId,
      active: client.active,
      photo: client.photoUrl,

      user: {
        id: user.id,
        documentTypeId: user.documentTypeId,
        documentNumber: user.documentNumber,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },

      person: {
        firstName: person.firstName,
        lastName: person.lastName,
        birthdate: person.birthdate,
      },
      company: {
        legalName: company.legalName,
        tradeName: company.tradeName,
      },
    })
    .from(client)
    .innerJoin(user, eq(client.id, user.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .where(eq(client.id, id));

  return match as ClientDto;
}

/**
 * Lista clientes con filtros opcionales y paginación.
 *
 * @param params - Parámetros de búsqueda y paginación
 * @returns Lista de clientes y opcionalmente el total de registros
 *
 * @example
 * ```ts
 * // Obtener primera página
 * const { clients, totalCount } = await listClients({
 *   pageIndex: 0,
 *   pageSize: 10,
 *   includeTotalCount: true,
 * });
 *
 * // Filtrar por nombre
 * const { clients } = await listClients({
 *   fullName: "John",
 *   isActive: true,
 * });
 * ```
 */
export async function listClients(
  params: ListClientsParams = {}
): Promise<ListClientsResult> {
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
    // Buscar en nombre y apellido de persona o razón social/nombre comercial de empresa
    conditions.push(
      sql`(
        CONCAT(${person.firstName}, ' ', ${
        person.lastName
      }) ILIKE ${`%${fullName}%`} OR
        ${company.legalName} ILIKE ${`%${fullName}%`} OR
        ${company.tradeName} ILIKE ${`%${fullName}%`}
      )`
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(client.active, isActive));
  }

  if (typeId !== undefined) {
    conditions.push(eq(client.typeId, typeId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Consulta de clientes con datos de persona y tipo
  const queryClients = db
    .select({
      id: client.id,
      userId: client.id,
      firstName: person.firstName,
      lastName: person.lastName,
      legalName: company.legalName,
      tradeName: company.tradeName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birthdate: person.birthdate,
      typeId: client.typeId,
      typeName: clientType.name,
      photoUrl: client.photoUrl,
      active: client.active,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    .from(client)
    .innerJoin(user, eq(client.id, user.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .leftJoin(clientType, eq(client.typeId, clientType.id))
    .where(whereClause)
    .orderBy(desc(client.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  // Si no se necesita el conteo total, retornar solo clientes
  if (!includeTotalCount) {
    const clients = await queryClients;
    return { clients };
  }

  // Consulta de conteo
  const queryCount = db
    .select({ totalCount: count() })
    .from(client)
    .innerJoin(user, eq(client.id, user.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .where(whereClause);

  // Ejecutar ambas consultas en paralelo
  const [clients, [{ totalCount }]] = await Promise.all([
    queryClients,
    queryCount,
  ]);

  return { clients, totalCount };
}

/**
 * Crea o actualiza un cliente junto con los datos de usuario.
 *
 * Si `id` está presente, actualiza el cliente existente.
 * Si no tiene `id`, crea un nuevo cliente.
 *
 * @param payload - Datos del cliente a insertar o actualizar
 * @returns El cliente creado o actualizado con sus datos relacionados
 *
 * @example
 * ```ts
 * // Crear nuevo cliente
 * const newClient = await upsertClient({
 *   user: {
 *     documentTypeId: 1,
 *     documentNumber: "123456",
 *     email: "john@example.com",
 *     person: {
 *       firstName: "John",
 *       lastName: "Doe",
 *     },
 *   },
 *   typeId: 1,
 *   active: true,
 * });
 *
 * // Actualizar cliente existente
 * const updated = await upsertClient({
 *   id: 1,
 *   user: { ... },
 *   typeId: 2,
 *   active: false,
 * });
 * ```
 */
export async function upsertClient(
  payload: UpsertClientPayload
): Promise<ClientRecord> {
  const { id, photo, user: userDto, ...clientData } = payload;

  // Paso 1: Upsert del usuario (persona o compañía)
  const userRecord = await upsertUser(userDto as any);

  // Paso 2: Upsert del registro de cliente
  const [clientRecord] = await db
    .insert(client)
    .values({
      id: userRecord.id,
      typeId: clientData.typeId,
      active: clientData.active ?? true,
      photoUrl: null,
    })
    .onConflictDoUpdate({
      target: client.id,
      set: {
        typeId: clientData.typeId,
        active: clientData.active ?? true,
      },
    })
    .returning();

  // Paso 3: Manejar subida de foto si se proporciona
  if (photo) {
    let photoUrl: string;

    if (typeof photo === "string") {
      // Mantener URL existente
      photoUrl = photo;
    } else {
      // Subir nuevo archivo al storage
      photoUrl = await BlobStorage.uploadFile(
        `crm/client/${clientRecord.id}/photo`,
        photo
      );
    }

    // Actualizar cliente con URL de la foto
    await db
      .update(client)
      .set({ photoUrl })
      .where(eq(client.id, clientRecord.id));

    return {
      ...clientRecord,
      photoUrl,
      user: userRecord as IUser,
    };
  }

  return {
    ...clientRecord,
    user: userRecord as IUser,
  };
}

// Re-exportar DTOs
export type {
  ClientDto,
  GetClientByIdResult,
  ListClientsParams,
  ListClientsResult,
  ClientListItem,
  UpsertClientPayload,
  ClientRecord,
} from "#utils/dto/crm/client";
