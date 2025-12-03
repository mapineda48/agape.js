import { db } from "#lib/db";
import client from "#models/crm/client";
import person from "#models/core/person";
import party, { user } from "#models/core/user";
import client_type from "#models/crm/client_type";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { eq } from "drizzle-orm";
import type DateTime from "#utils/data/DateTime";
import { upsertUser, type IUpsertUser, type IUser } from "#svc/user";

export async function getClient(id: number) {
  const [match] = await db
    .select({
      id: client.id,
      userId: client.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birthdate: person.birthdate,
      typeId: client.typeId,
      typeName: client_type.name,
      photoUrl: client.photoUrl,
      active: client.active,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    .from(client)
    .innerJoin(user, eq(client.id, user.id))
    .innerJoin(person, eq(client.id, person.id))
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
  const { id, photo, user: userDto, ...clientData } = data;

  const user = await upsertUser(userDto);

  // Step 3: Upsert client record
  const [clientRecord] = await db
    .insert(client)
    .values({
      ...(id !== undefined && { id }),
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

  // Step 4: Handle photo upload if provided
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
      user: user,
    };
  }

  return {
    ...clientRecord,
    user: user,
  };
}

/**
 * Types
 */

export interface UpsertClientData {
  id?: number;
  user: IUser;
  typeId: number;
  active: boolean;
  photo?: string | File;
}

export interface ClientRecord {
  id: number;
  typeId: number | null;
  photoUrl: string | null;
  active: boolean;
  createdAt: DateTime;
  updatedAt: DateTime | null;
  user: IUpsertUser;
}

export type { UpsertClientData as NewClient };
