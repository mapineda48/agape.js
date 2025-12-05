import { db } from "#lib/db";
import {
  documentType,
  type NewDocumentType,
  type DocumentType,
} from "#models/numbering/document_type";
import { eq } from "drizzle-orm";

/**
 * Lista los tipos de documento de negocio.
 *
 * @param enabledOnly - Si true, retorna solo tipos habilitados (default: true)
 * @returns Lista de tipos de documento
 *
 * @example
 * ```ts
 * // Listar solo tipos habilitados
 * const types = await listDocumentTypes();
 *
 * // Listar todos los tipos
 * const allTypes = await listDocumentTypes(false);
 * ```
 */
export async function listDocumentTypes(
  enabledOnly = true
): Promise<DocumentType[]> {
  const query = db.select().from(documentType);

  if (enabledOnly) {
    return query.where(eq(documentType.isEnabled, true));
  }

  return query;
}

/**
 * Obtiene un tipo de documento por su ID.
 *
 * @param id - Identificador único del tipo de documento
 * @returns Tipo de documento encontrado o undefined
 */
export async function getDocumentTypeById(
  id: number
): Promise<DocumentType | undefined> {
  const [record] = await db
    .select()
    .from(documentType)
    .where(eq(documentType.id, id));
  return record;
}

/**
 * Obtiene un tipo de documento por su código.
 *
 * @param code - Código único del tipo de documento (ej: "FAC", "VTA")
 * @returns Tipo de documento encontrado o undefined
 */
export async function getDocumentTypeByCode(
  code: string
): Promise<DocumentType | undefined> {
  const [record] = await db
    .select()
    .from(documentType)
    .where(eq(documentType.code, code));
  return record;
}

/**
 * Crea o actualiza un tipo de documento de negocio.
 *
 * Si el payload incluye `id`, actualiza el registro existente.
 * Si no incluye `id`, crea un nuevo registro.
 *
 * @param payload - Datos del tipo de documento
 * @returns Tipo de documento creado o actualizado
 *
 * @example
 * ```ts
 * // Crear nuevo tipo
 * const newType = await upsertDocumentType({
 *   code: "FAC",
 *   name: "Factura",
 *   module: "billing",
 *   isEnabled: true,
 * });
 *
 * // Actualizar tipo existente
 * const updated = await upsertDocumentType({
 *   id: 1,
 *   code: "FAC",
 *   name: "Factura Actualizada",
 *   isEnabled: false,
 * });
 * ```
 */
export async function upsertDocumentType(
  payload: NewDocumentType
): Promise<DocumentType> {
  const { id, ...dto } = payload;

  if (typeof id !== "number") {
    const [record] = await db.insert(documentType).values(dto).returning();
    return record;
  }

  const [record] = await db
    .update(documentType)
    .set(dto)
    .where(eq(documentType.id, id))
    .returning();

  return record;
}
