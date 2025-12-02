import { db } from "#lib/db";
import client from "#models/crm/client";
import person from "#models/core/person";
import client_type from "#models/crm/client_type";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { eq } from "drizzle-orm";

export async function getClient(id: number) {
  const [match] = await db
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
      typeName: client_type.fullName,
      photoUrl: client.photoUrl,
      active: client.active,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    .from(client)
    .innerJoin(person, eq(client.personId, person.id))
    .leftJoin(client_type, eq(client.typeId, client_type.id))
    .where(eq(client.id, id));

  return match;
}

/**
 * Creates or updates a client along with person data and photo.
 * If `id` is provided, updates existing client; otherwise creates new one.
 * @param data Client and person data with optional photo
 * @returns The complete client record
 */
export async function upsertClient(
  data: UpsertClientData
): Promise<ClientRecord> {
  const { id, photo, person: personData, ...clientData } = data;

  // Step 1: Upsert person record
  let personRecord;

  if (data.personId) {
    // Update existing person
    [personRecord] = await db
      .update(person)
      .set(personData)
      .where(eq(person.id, data.personId))
      .returning();
  } else {
    // Create new person
    [personRecord] = await db.insert(person).values(personData).returning();
  }

  // Step 2: Upsert client record
  const [clientRecord] = await db
    .insert(client)
    .values({
      ...(id !== undefined && { id }),
      personId: personRecord.id,
      typeId: clientData.typeId,
      active: clientData.active ?? true,
      photoUrl: null, // Will update if photo provided
    })
    .onConflictDoUpdate({
      target: client.id,
      set: {
        typeId: clientData.typeId,
        active: clientData.active ?? true,
      },
    })
    .returning();

  // Step 3: Handle photo upload if provided
  if (photo) {
    let photoUrl: string;

    if (typeof photo === "string") {
      // Keep existing URL
      photoUrl = photo;
    } else {
      // Upload new file to storage
      photoUrl = await BlobStorage.uploadFile(
        `crm/client/${clientRecord.id}/photo`,
        photo
      );
    }

    // Update client with photo URL
    await db
      .update(client)
      .set({ photoUrl })
      .where(eq(client.id, clientRecord.id));

    return {
      ...clientRecord,
      photoUrl,
      person: personRecord,
    };
  }

  return {
    ...clientRecord,
    person: personRecord,
  };
}

/**
 * Types
 */

export interface UpsertClientData {
  id?: number;
  person: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    birthdate: Date;
  };
  typeId?: number;
  active?: boolean;
  photo?: string | File;
}

export interface ClientRecord {
  id: number;
  personId: number;
  typeId: number | null;
  photoUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  person?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    birthdate: Date;
    createdAt: Date | null;
    updateAt: Date | null;
  };
}

export type { UpsertClientData as NewClient };
