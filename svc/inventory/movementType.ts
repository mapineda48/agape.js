import { db } from "#lib/db";
import movementType, {
  type NewInventoryMovementType,
} from "#models/inventory/movement_type";
import { desc, eq } from "drizzle-orm";

/**
 * Lista todos los tipos de movimiento de inventario.
 * @param activeOnly Si es true, retorna solo los tipos activos
 * @returns Lista de tipos de movimiento ordenados por ID descendente
 * @permission inventory.movement_type.read
 */
export async function listMovementTypes(activeOnly = true) {
  const query = db.select().from(movementType).orderBy(desc(movementType.id));

  if (activeOnly) {
    return query.where(eq(movementType.isEnabled, true));
  }

  return query;
}

/**
 * Obtiene un tipo de movimiento por su ID.
 * @param id Identificador único del tipo de movimiento
 * @returns Tipo de movimiento encontrado o undefined si no existe
 * @permission inventory.movement_type.read
 */
export async function getMovementTypeById(id: number) {
  const [record] = await db
    .select()
    .from(movementType)
    .where(eq(movementType.id, id));

  return record;
}

/**
 * Inserta o actualiza un tipo de movimiento de inventario.
 * @param payload Datos del tipo de movimiento a insertar o actualizar
 * @returns El tipo de movimiento insertado o actualizado
 * @permission inventory.movement_type.manage
 */
export async function upsertMovementType(payload: NewInventoryMovementType) {
  const { id, ...data } = payload;

  if (typeof id !== "number") {
    return db.insert(movementType).values(data).returning();
  }

  return db
    .update(movementType)
    .set(data)
    .where(eq(movementType.id, id))
    .returning();
}
