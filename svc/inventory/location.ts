import { db } from "#lib/db";
import location from "#models/inventory/location";
import { desc, eq } from "drizzle-orm";

export async function listLocations() {
  return db.select().from(location).orderBy(desc(location.id));
}

export async function upsertLocation(data: {
  id?: number;
  name: string;
  isEnabled: boolean;
}) {
  const [record] = await db
    .insert(location)
    .values({
      ...(data.id !== undefined && { id: data.id }),
      name: data.name,
      isEnabled: data.isEnabled,
    })
    .onConflictDoUpdate({
      target: location.id,
      set: {
        name: data.name,
        isEnabled: data.isEnabled,
      },
    })
    .returning();

  return record;
}

export async function deleteLocation(id: number) {
  await db.delete(location).where(eq(location.id, id));
}
