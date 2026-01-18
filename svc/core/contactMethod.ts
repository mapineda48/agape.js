import { db } from "#lib/db";
import { contactMethod } from "#models/contactMethod";
import { and, eq, ne } from "drizzle-orm";
import type {
  IContactMethod,
  IContactMethodRecord,
  ListContactMethodsParams,
  ContactMethodType,
} from "#utils/dto/core/contactMethod";

// ============================================================================
// Errores de Negocio
// ============================================================================

/**
 * Error cuando el método de contacto no existe.
 */
export class ContactMethodNotFoundError extends Error {
  constructor(id: number) {
    super(`El método de contacto con ID ${id} no existe.`);
    this.name = "ContactMethodNotFoundError";
  }
}

// ============================================================================
// Funciones de Servicio
// ============================================================================

/**
 * Lista los métodos de contacto de un usuario.
 *
 * @param params - Parámetros de filtrado
 * @returns Lista de métodos de contacto del usuario
 * @permission core.contact_method.read
 */
export async function listContactMethods(
  params: ListContactMethodsParams
): Promise<IContactMethodRecord[]> {
  const { userId, type, isActive, isPrimary } = params;

  const conditions = [eq(contactMethod.userId, userId)];

  if (type !== undefined) {
    conditions.push(eq(contactMethod.type, type));
  }

  if (isActive !== undefined) {
    conditions.push(eq(contactMethod.isActive, isActive));
  }

  if (isPrimary !== undefined) {
    conditions.push(eq(contactMethod.isPrimary, isPrimary));
  }

  const results = await db
    .select()
    .from(contactMethod)
    .where(and(...conditions))
    .orderBy(contactMethod.type, contactMethod.isPrimary);

  return results as IContactMethodRecord[];
}

/**
 * Obtiene un método de contacto por su ID.
 *
 * @param id - Identificador único del método de contacto
 * @returns Método de contacto o undefined
 * @permission core.contact_method.read
 */
export async function getContactMethodById(
  id: number
): Promise<IContactMethodRecord | undefined> {
  const [record] = await db
    .select()
    .from(contactMethod)
    .where(eq(contactMethod.id, id));

  return record as IContactMethodRecord | undefined;
}

/**
 * Crea o actualiza un método de contacto.
 *
 * **Lógica de "Single Primary"**: Al marcar un contacto como principal (isPrimary: true),
 * automáticamente desmarca los demás del mismo usuario y tipo.
 *
 * @param payload - Datos del método de contacto
 * @returns Método de contacto creado o actualizado
 * @permission core.contact_method.manage
 */
export async function upsertContactMethod(
  payload: Omit<IContactMethod, "id">
): Promise<IContactMethodRecord> {
  const data = payload;

  return await db.transaction(async (tx) => {
    // Buscar si ya existe un registro con el mismo (userId, type, value)
    const [existingByValue] = await tx
      .select()
      .from(contactMethod)
      .where(
        and(
          eq(contactMethod.userId, data.userId),
          eq(contactMethod.type, data.type),
          eq(contactMethod.value, data.value)
        )
      );

    // Lógica de "Single Primary":
    // Si isPrimary = true, desmarcar los demás del mismo usuario y tipo
    if (data.isPrimary) {
      const conditions = [
        eq(contactMethod.userId, data.userId),
        eq(contactMethod.type, data.type),
      ];

      // Excluir el registro que vamos a actualizar
      if (existingByValue) {
        conditions.push(ne(contactMethod.id, existingByValue.id));
      }

      await tx
        .update(contactMethod)
        .set({ isPrimary: false })
        .where(and(...conditions));
    }

    // Si ya existe un registro con el mismo valor → actualizarlo
    if (existingByValue) {
      const [record] = await tx
        .update(contactMethod)
        .set({
          isPrimary: data.isPrimary ?? existingByValue.isPrimary,
          label: data.label ?? existingByValue.label,
          isVerified: data.isVerified ?? existingByValue.isVerified,
          isActive: data.isActive ?? true, // Reactivar si estaba inactivo
          notes: data.notes ?? existingByValue.notes,
        })
        .where(eq(contactMethod.id, existingByValue.id))
        .returning();

      return record as IContactMethodRecord;
    }

    // Si no existe → insertar nuevo
    const [record] = await tx
      .insert(contactMethod)
      .values({
        userId: data.userId,
        type: data.type,
        value: data.value,
        isPrimary: data.isPrimary ?? false,
        label: data.label ?? null,
        isVerified: data.isVerified ?? false,
        isActive: data.isActive ?? true,
        notes: data.notes ?? null,
      })
      .returning();

    return record as IContactMethodRecord;
  });
}

/**
 * Elimina un método de contacto.
 *
 * @param id - ID del método de contacto a eliminar
 * @permission core.contact_method.manage
 */
export async function deleteContactMethod(id: number): Promise<void> {
  const result = await db
    .delete(contactMethod)
    .where(eq(contactMethod.id, id))
    .returning({ id: contactMethod.id });

  if (result.length === 0) {
    throw new ContactMethodNotFoundError(id);
  }
}

/**
 * Guarda múltiples métodos de contacto para un usuario de forma atómica.
 * Útil para guardar desde formulario de cliente.
 *
 * @param userId - ID del usuario
 * @param contacts - Lista de contactos a guardar (crea o actualiza)
 * @returns Lista de contactos guardados
 * @permission core.contact_method.manage
 */
export async function saveUserContactMethods(
  userId: number,
  contacts: Omit<IContactMethod, "userId">[]
): Promise<IContactMethodRecord[]> {
  return await db.transaction(async (tx) => {
    const results: IContactMethodRecord[] = [];

    for (const contact of contacts) {
      const data = { ...contact, userId };

      // Lógica de "Single Primary"
      if (data.isPrimary) {
        const conditions = [
          eq(contactMethod.userId, userId),
          eq(contactMethod.type, data.type),
        ];

        if (typeof data.id === "number") {
          conditions.push(ne(contactMethod.id, data.id));
        }

        await tx
          .update(contactMethod)
          .set({ isPrimary: false })
          .where(and(...conditions));
      }

      let record: IContactMethodRecord;

      if (typeof data.id !== "number") {
        // Insertar
        const [inserted] = await tx
          .insert(contactMethod)
          .values({
            userId: data.userId,
            type: data.type,
            value: data.value,
            isPrimary: data.isPrimary ?? false,
            label: data.label ?? null,
            isVerified: data.isVerified ?? false,
            isActive: data.isActive ?? true,
            notes: data.notes ?? null,
          })
          .returning();

        record = inserted as IContactMethodRecord;
      } else {
        // Actualizar
        const [updated] = await tx
          .update(contactMethod)
          .set({
            type: data.type,
            value: data.value,
            isPrimary: data.isPrimary,
            label: data.label ?? null,
            isVerified: data.isVerified,
            isActive: data.isActive,
            notes: data.notes ?? null,
          })
          .where(eq(contactMethod.id, data.id))
          .returning();

        record = updated as IContactMethodRecord;
      }

      results.push(record);
    }

    return results;
  });
}

// Re-exportar DTOs compartidos con frontend
export type {
  IContactMethod,
  IContactMethodRecord,
  ListContactMethodsParams,
  ContactMethodType,
  IClientContactInfo,
} from "#utils/dto/core/contactMethod";

export { CONTACT_METHOD_TYPE_VALUES } from "#utils/dto/core/contactMethod";
