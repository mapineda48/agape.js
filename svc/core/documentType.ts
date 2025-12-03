import { db } from "#lib/db";
import { documentType } from "#models/core/documentType";
import { eq } from "drizzle-orm";

/**
 * Obtiene la lista de tipos de documento.
 * @param activeOnly Si es true, retorna solo los activos.
 * @returns Lista de tipos de documento.
 */
export async function listDocumentTypes(activeOnly = true) {
  let query = db.select().from(documentType);

  if (activeOnly) {
    query.where(eq(documentType.isEnabled, true));
  }

  return await query;
}
