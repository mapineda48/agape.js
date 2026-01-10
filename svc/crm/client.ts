import { db } from "#lib/db";
import client from "#models/crm/client";
import person from "#models/core/person";
import company from "#models/core/company";
import { user } from "#models/core/user";
import clientType from "#models/crm/client_type";
import { priceList } from "#models/catalogs/price_list";
import { paymentTerms } from "#models/finance/payment_terms";
import employee from "#models/hr/employee";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, sql, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { upsertUser, type IUser } from "#svc/core/user";
import { upsertContactMethod, listContactMethods } from "#svc/core/contactMethod";
import { createUserAddressWithAddress } from "#svc/core/address";
import Decimal from "#utils/data/Decimal";
import type {
  ClientDto,
  GetClientByIdResult,
  ListClientsParams,
  ListClientsResult,
  UpsertClientPayload,
  ClientRecord,
  ClientListItem,
} from "#utils/dto/crm/client";

// Alias para la tabla person del vendedor (ya que person se usa para el cliente)
const salespersonPerson = alias(person, "salesperson_person");

/**
 * Obtiene un cliente por su ID con todos los datos relacionados.
 *
 * @param id - Identificador único del cliente
 * @returns Cliente con datos de persona y tipo, o undefined si no existe
 * @permission crm.client.read
 * *
 */
export async function getClientById(id: number): Promise<ClientDto> {
  const [match] = await db
    .select({
      id: client.id,
      typeId: client.typeId,
      active: client.active,
      photo: client.photoUrl,
      clientCode: client.clientCode,
      // Campos comerciales
      priceListId: client.priceListId,
      paymentTermsId: client.paymentTermsId,
      creditLimit: client.creditLimit,
      creditDays: client.creditDays,
      salespersonId: client.salespersonId,

      user: {
        id: user.id,
        documentTypeId: user.documentTypeId,
        documentNumber: user.documentNumber,
        countryCode: user.countryCode,
        languageCode: user.languageCode,
        currencyCode: user.currencyCode,
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

  if (!match) {
    return undefined as unknown as ClientDto;
  }

  // Traer los contactos del cliente
  const contactMethods = await listContactMethods({
    userId: id,
    isActive: true,
  });

  // Convertir los contactos al formato IClientContactInfo
  const contacts = {
    email: contactMethods.find((c) => c.type === "email" && c.isPrimary)?.value,
    phone: contactMethods.find((c) => c.type === "phone" && c.isPrimary)?.value,
    mobile: contactMethods.find((c) => c.type === "mobile" && c.isPrimary)?.value,
    whatsapp: contactMethods.find((c) => c.type === "whatsapp" && c.isPrimary)?.value,
  };

  return {
    ...match,
    contacts,
  } as ClientDto;
}

/**
 * Busca un cliente por tipo y número de documento para validar duplicados.
 * @permission crm.client.read
 */
export async function getClientByDocument(
  documentTypeId: number,
  documentNumber: string
): Promise<ClientDto | null> {
  const [match] = await db
    .select({
      id: client.id,
      typeId: client.typeId,
      active: client.active,
      photo: client.photoUrl,
      clientCode: client.clientCode,
      // Campos comerciales
      priceListId: client.priceListId,
      paymentTermsId: client.paymentTermsId,
      creditLimit: client.creditLimit,
      creditDays: client.creditDays,
      salespersonId: client.salespersonId,

      user: {
        id: user.id,
        documentTypeId: user.documentTypeId,
        documentNumber: user.documentNumber,
        countryCode: user.countryCode,
        languageCode: user.languageCode,
        currencyCode: user.currencyCode,
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
    .where(
      and(
        eq(user.documentTypeId, documentTypeId),
        eq(user.documentNumber, documentNumber)
      )
    );

  return (match as ClientDto) ?? null;
}

/**
 * Lista clientes con filtros opcionales y paginación.
 *
 * @param params - Parámetros de búsqueda y paginación
 * @returns Lista de clientes y opcionalmente el total de registros
 * @permission crm.client.read
 * *
 */
export async function listClients(
  params: ListClientsParams = {}
): Promise<ListClientsResult> {
  const {
    fullName,
    isActive,
    typeId,
    salespersonId,
    priceListId,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (fullName) {
    // Buscar en nombre y apellido de persona o razón social/nombre comercial de empresa
    conditions.push(
      sql`(
        CONCAT(${person.firstName}, ' ', ${person.lastName
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

  if (salespersonId !== undefined) {
    conditions.push(eq(client.salespersonId, salespersonId));
  }

  if (priceListId !== undefined) {
    conditions.push(eq(client.priceListId, priceListId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Consulta de clientes con datos de persona, tipo y campos comerciales
  const queryClients = db
    .select({
      id: client.id,
      userId: client.id,
      clientCode: client.clientCode,
      firstName: person.firstName,
      lastName: person.lastName,
      legalName: company.legalName,
      tradeName: company.tradeName,
      birthdate: person.birthdate,
      typeId: client.typeId,
      typeName: clientType.name,
      photoUrl: client.photoUrl,
      active: client.active,
      documentNumber: user.documentNumber,
      // Campos comerciales
      priceListId: client.priceListId,
      priceListName: priceList.fullName,
      paymentTermsId: client.paymentTermsId,
      paymentTermsName: paymentTerms.fullName,
      creditLimit: client.creditLimit,
      creditDays: client.creditDays,
      salespersonId: client.salespersonId,
      // Nombre del vendedor usando alias de la tabla person
      salespersonName: sql<string | null>`CONCAT(${salespersonPerson.firstName}, ' ', ${salespersonPerson.lastName})`,
      // Contacto principal (placeholder - se llenará después si es necesario)
      primaryEmail: sql<string | null>`NULL`,
      primaryPhone: sql<string | null>`NULL`,
      // Timestamps
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    .from(client)
    .innerJoin(user, eq(client.id, user.id))
    .leftJoin(person, eq(client.id, person.id))
    .leftJoin(company, eq(client.id, company.id))
    .leftJoin(clientType, eq(client.typeId, clientType.id))
    .leftJoin(priceList, eq(client.priceListId, priceList.id))
    .leftJoin(paymentTerms, eq(client.paymentTermsId, paymentTerms.id))
    // JOIN con employee y luego con el alias de person para obtener el nombre del vendedor
    .leftJoin(employee, eq(client.salespersonId, employee.id))
    .leftJoin(salespersonPerson, eq(employee.id, salespersonPerson.id))
    .where(whereClause)
    .orderBy(desc(client.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  // Si no se necesita el conteo total, retornar solo clientes
  if (!includeTotalCount) {
    const clients = await queryClients;
    return { clients: clients as ClientListItem[] };
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

  return { clients: clients as ClientListItem[], totalCount };
}

/**
 * Crea o actualiza un cliente junto con los datos de usuario.
 *
 * Si `id` está presente, actualiza el cliente existente.
 * Si no tiene `id`, crea un nuevo cliente.
 *
 * Maneja automáticamente:
 * - Datos de usuario (persona o empresa)
 * - Foto del cliente
 * - Campos comerciales (lista de precios, condiciones de pago, etc.)
 * - Métodos de contacto (email, teléfono, móvil)
 * - Direcciones (facturación, envío)
 *
 * @param payload - Datos del cliente a insertar o actualizar
 * @returns El cliente creado o actualizado con sus datos relacionados
 * @permission crm.client.manage
 * *
 */
export async function upsertClient(
  payload: UpsertClientPayload
): Promise<ClientRecord> {
  const {
    id,
    photo,
    user: userDto,
    contacts,
    addresses,
    creditLimit,
    ...clientData
  } = payload;

  // Paso 1: Upsert del usuario (persona o compañía)
  const userRecord = await upsertUser(userDto as any);

  // Convertir creditLimit a Decimal si es necesario
  let creditLimitDecimal: Decimal | null = null;
  if (creditLimit !== undefined && creditLimit !== null) {
    creditLimitDecimal =
      creditLimit instanceof Decimal
        ? creditLimit
        : new Decimal(String(creditLimit));
  }

  // Paso 2: Upsert del registro de cliente con campos comerciales
  const [clientRecord] = await db
    .insert(client)
    .values({
      id: userRecord.id,
      typeId: clientData.typeId,
      active: clientData.active ?? true,
      clientCode: clientData.clientCode ?? null,
      priceListId: clientData.priceListId ?? null,
      paymentTermsId: clientData.paymentTermsId ?? null,
      creditLimit: creditLimitDecimal,
      creditDays: clientData.creditDays ?? null,
      salespersonId: clientData.salespersonId ?? null,
      photoUrl: null,
    })
    .onConflictDoUpdate({
      target: client.id,
      set: {
        typeId: clientData.typeId,
        active: clientData.active ?? true,
        clientCode: clientData.clientCode ?? null,
        priceListId: clientData.priceListId ?? null,
        paymentTermsId: clientData.paymentTermsId ?? null,
        creditLimit: creditLimitDecimal,
        creditDays: clientData.creditDays ?? null,
        salespersonId: clientData.salespersonId ?? null,
      },
    })
    .returning();

  // Paso 3: Manejar métodos de contacto si se proporcionan
  if (contacts) {
    const contactPromises: Promise<any>[] = [];

    if (contacts.email) {
      contactPromises.push(
        upsertContactMethod({
          userId: userRecord.id,
          type: "email",
          value: contacts.email,
          isPrimary: true,
          label: "Principal",
        })
      );
    }

    if (contacts.phone) {
      contactPromises.push(
        upsertContactMethod({
          userId: userRecord.id,
          type: "phone",
          value: contacts.phone,
          isPrimary: true,
          label: "Principal",
        })
      );
    }

    if (contacts.mobile) {
      contactPromises.push(
        upsertContactMethod({
          userId: userRecord.id,
          type: "mobile",
          value: contacts.mobile,
          isPrimary: true,
          label: "Principal",
        })
      );
    }

    if (contacts.whatsapp && contacts.whatsapp !== contacts.mobile) {
      contactPromises.push(
        upsertContactMethod({
          userId: userRecord.id,
          type: "whatsapp",
          value: contacts.whatsapp,
          isPrimary: true,
          label: "Principal",
        })
      );
    }

    await Promise.all(contactPromises);
  }

  // Paso 4: Manejar direcciones si se proporcionan
  if (addresses && addresses.length > 0) {
    const addressPromises = addresses.map((addr) =>
      createUserAddressWithAddress({
        userId: userRecord.id,
        type: addr.type,
        isDefault: addr.isDefault,
        label: addr.label,
        address: addr.address,
      })
    );

    await Promise.all(addressPromises);
  }

  // Paso 5: Manejar subida de foto si se proporciona
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
  GetClientByDocumentResult,
  IClientAddress,
} from "#utils/dto/crm/client";

