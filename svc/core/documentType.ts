import { db } from "#lib/db";
import { documentType, type NewDocumentType } from "#models/core/documentType";
import { and, eq } from "drizzle-orm";

function buildDocumentTypeQuery({
  activeOnly,
  personOnly,
}: {
  activeOnly?: boolean;
  personOnly?: boolean;
}) {
  const condition =
    activeOnly && personOnly
      ? and(
          eq(documentType.isEnabled, true),
          eq(documentType.appliesToPerson, true)
        )
      : activeOnly
      ? eq(documentType.isEnabled, true)
      : personOnly
      ? eq(documentType.appliesToPerson, true)
      : undefined;

  const query = db.select().from(documentType);

  return condition ? query.where(condition) : query;
}

/**
 * Obtiene la lista de tipos de documento.
 * @param activeOnly Si es true, retorna solo los activos
 * @returns Lista de tipos de documento.
 */
export async function listDocumentTypes(activeOnly = true) {
  const query = buildDocumentTypeQuery({ activeOnly });

  return await query;
}

/**
 * Obtiene la lista de tipos de documento que aplican para personas naturales.
 * @param activeOnly Si es true, retorna solo los activos
 * @returns Lista de tipos de documento para personas.
 */
export async function listPersonDocumentTypes(activeOnly = true) {
  const query = buildDocumentTypeQuery({ activeOnly, personOnly: true });
  return await query;
}

export async function getDocumentTypeById(id: number) {
  const [record] = await db
    .select()
    .from(documentType)
    .where(eq(documentType.id, id));
  return record;
}

/**
 * Inserta o actualiza un tipo de documento.
 * @param payload Datos del tipo de documento a insertar o actualizar.
 * @returns El tipo de documento insertado o actualizado.
 */
export async function upsertDocumentType(payload: NewDocumentType) {
  const { id, ...documentTypeDto } = payload;

  if (typeof id !== "number") {
    return db.insert(documentType).values(documentTypeDto).returning();
  }

  return db
    .update(documentType)
    .set(documentTypeDto)
    .where(eq(documentType.id, id))
    .returning();
}

// ============================================================================
// Types
// ============================================================================

/**
 * Tipo de documento individual de la listado.
 */
export type DocumentType = Awaited<
  ReturnType<typeof listDocumentTypes>
>[number];

/**
 * Tipo de documento retornado por getDocumentTypeById.
 */
export type DocumentTypeRecord = NonNullable<
  Awaited<ReturnType<typeof getDocumentTypeById>>
>;

/**
 * Re-exportación del tipo para creación/actualización.
 */
export type { NewDocumentType };
