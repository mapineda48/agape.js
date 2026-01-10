import { db } from "#lib/db";
import {
  documentSeries,
  type NewDocumentSeries,
  type DocumentSeries,
} from "#models/numbering/document_series";
export type { DocumentSeries, NewDocumentSeries };
import DateTime from "#utils/data/DateTime";
import { and, eq, sql } from "drizzle-orm";

/**
 * Error de validación para series de documentos.
 */
export class DocumentSeriesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentSeriesValidationError";
  }
}

/**
 * Lista las series de documentos.
 *
 * @param options - Opciones de filtrado
 * @param options.documentTypeId - Filtrar por tipo de documento
 * @param options.activeOnly - Si true, retorna solo series activas (default: true)
 * @returns Lista de series de documentos
 * @permission numbering.series.read
 */
export async function listDocumentSeries(
  options: {
    documentTypeId?: number;
    activeOnly?: boolean;
  } = {}
): Promise<DocumentSeries[]> {
  const { documentTypeId, activeOnly = true } = options;

  const conditions = [];

  if (activeOnly) {
    conditions.push(eq(documentSeries.isActive, true));
  }

  if (typeof documentTypeId === "number") {
    conditions.push(eq(documentSeries.documentTypeId, documentTypeId));
  }

  const query = db.select().from(documentSeries);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * Obtiene una serie de documento por su ID.
 *
 * @param id - Identificador único de la serie
 * @returns Serie encontrada o undefined
 * @permission numbering.series.read
 */
export async function getDocumentSeriesById(
  id: number
): Promise<DocumentSeries | undefined> {
  const [record] = await db
    .select()
    .from(documentSeries)
    .where(eq(documentSeries.id, id));
  return record;
}

/**
 * Valida los datos de una serie antes de insertar/actualizar.
 *
 * @param payload - Datos de la serie a validar
 * @throws DocumentSeriesValidationError si la validación falla
 */
function validateDocumentSeries(
  payload: Omit<NewDocumentSeries, "currentNumber">
): void {
  // B.4: startNumber <= endNumber
  if (payload.startNumber > payload.endNumber) {
    throw new DocumentSeriesValidationError(
      `startNumber (${payload.startNumber}) no puede ser mayor que endNumber (${payload.endNumber})`
    );
  }

  // B.6: validFrom <= validTo (si validTo no es null)
  if (payload.validTo !== null && payload.validTo !== undefined) {
    const validFrom = new DateTime(payload.validFrom);
    const validTo = new DateTime(payload.validTo);

    if (validFrom > validTo) {
      throw new DocumentSeriesValidationError(
        `validFrom (${payload.validFrom.toISOString()}) no puede ser mayor que validTo (${payload.validTo.toISOString()})`
      );
    }
  }
}

/**
 * Crea o actualiza una serie de documento.
 *
 * Valida las siguientes reglas de dominio:
 * - startNumber <= endNumber
 * - validFrom <= validTo (o validTo puede ser null)
 * - currentNumber se inicializa automáticamente como startNumber - 1
 *
 * @param payload - Datos de la serie
 * @returns Serie creada o actualizada
 * @throws DocumentSeriesValidationError si la validación falla
 * @permission numbering.series.manage
 *
 * @example
 * ```ts
 * const series = await upsertDocumentSeries({
 *   documentTypeId: 1,
 *   seriesCode: "F001",
 *   prefix: "FAC-",
 *   startNumber: 1,
 *   endNumber: 999999,
 *   validFrom: new DateTime("2025-01-01"),
 *   isActive: true,
 *   isDefault: true,
 * });
 * ```
 */
export async function upsertDocumentSeries(
  payload: Omit<NewDocumentSeries, "currentNumber">
): Promise<DocumentSeries> {
  validateDocumentSeries(payload);

  const { id, ...dto } = payload as NewDocumentSeries;

  // B.5: Inicializar currentNumber correctamente
  // Solo en creación (sin id) y si no viene ya definido
  if (typeof id !== "number" && dto.currentNumber === undefined) {
    dto.currentNumber = dto.startNumber - 1;
  }

  if (typeof id !== "number") {
    // B.13: Validar solo una serie por defecto por tipo
    if (dto.isDefault === true) {
      await ensureSingleDefault(dto.documentTypeId, null);
    }

    const [record] = await db.insert(documentSeries).values(dto).returning();
    return record;
  }

  // B.13: Validar solo una serie por defecto por tipo (excluyendo la serie actual)
  if (dto.isDefault === true) {
    await ensureSingleDefault(dto.documentTypeId, id);
  }

  const [record] = await db
    .update(documentSeries)
    .set(dto)
    .where(eq(documentSeries.id, id))
    .returning();

  return record;
}

/**
 * Asegura que solo haya una serie por defecto por tipo de documento.
 * Si hay otra serie por defecto, la desmarca.
 *
 * @param documentTypeId - ID del tipo de documento
 * @param excludeSeriesId - ID de la serie a excluir (null para creación)
 */
async function ensureSingleDefault(
  documentTypeId: number,
  excludeSeriesId: number | null
): Promise<void> {
  const conditions = [
    eq(documentSeries.documentTypeId, documentTypeId),
    eq(documentSeries.isDefault, true),
  ];

  if (excludeSeriesId !== null) {
    conditions.push(sql`${documentSeries.id} != ${excludeSeriesId}`);
  }

  // Desmarcar cualquier otra serie por defecto
  await db
    .update(documentSeries)
    .set({ isDefault: false })
    .where(and(...conditions));
}

/**
 * Obtiene las series disponibles para numerar un tipo de documento.
 *
 * @param documentTypeId - ID del tipo de documento
 * @param today - Fecha de referencia para la vigencia (default: hoy)
 * @returns Series activas y vigentes ordenadas por prioridad
 * @permission numbering.series.read
 */
export async function getAvailableSeriesForDocument(
  documentTypeId: number,
  today: DateTime = new DateTime()
): Promise<DocumentSeries[]> {
  // Formatear fecha para comparación SQL
  const dateStr = today.toISOString().split("T")[0];

  const series = await db
    .select()
    .from(documentSeries)
    .where(
      and(
        eq(documentSeries.documentTypeId, documentTypeId),
        eq(documentSeries.isActive, true),
        sql`${documentSeries.validFrom} <= ${dateStr}`,
        sql`(${documentSeries.validTo} IS NULL OR ${documentSeries.validTo} >= ${dateStr})`
      )
    )
    .orderBy(
      sql`${documentSeries.isDefault} DESC`,
      sql`${documentSeries.validFrom} ASC`
    );

  return series;
}
