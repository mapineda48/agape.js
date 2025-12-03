import { db } from "#lib/db";
import movement_type from "#models/inventory/movement_type";
import { desc, eq } from "drizzle-orm";

export async function listMovementTypes() {
  return db.select().from(movement_type).orderBy(desc(movement_type.id));
}

export async function upsertMovementType(data: {
  id?: number;
  name: string;
  factor: number;
  affectsStock: boolean;
  isEnabled: boolean;
}) {
  const [record] = await db
    .insert(movement_type)
    .values({
      ...(data.id !== undefined && { id: data.id }),
      name: data.name,
      factor: data.factor,
      affectsStock: data.affectsStock,
      isEnabled: data.isEnabled,
    })
    .onConflictDoUpdate({
      target: movement_type.id,
      set: {
        name: data.name,
        factor: data.factor,
        affectsStock: data.affectsStock,
        isEnabled: data.isEnabled,
      },
    })
    .returning();

  return record;
}

export async function deleteMovementType(id: number) {
  await db.delete(movement_type).where(eq(movement_type.id, id));
}
