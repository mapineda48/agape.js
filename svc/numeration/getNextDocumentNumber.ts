import { db } from "#lib/db";
import { documentType } from "#models/numeration/document_type";
import { documentSeries } from "#models/numeration/document_series";
import { documentSequence } from "#models/numeration/document_sequence";
import { and, eq, lt, lte, gte, isNull, or, sql } from "drizzle-orm";
import DateTime from "#utils/data/DateTime";

// Errores
export class DocumentTypeNotFoundError extends Error {
  constructor(code: string) {
    super(`Tipo de documento no encontrado: ${code}`);
    this.name = "DocumentTypeNotFoundError";
  }
}

export class DocumentTypeDisabledError extends Error {
  constructor(code: string) {
    super(`Tipo de documento deshabilitado: ${code}`);
    this.name = "DocumentTypeDisabledError";
  }
}

export class NoSeriesAvailableError extends Error {
  constructor(documentTypeCode: string) {
    super(
      `No hay series disponibles para el tipo de documento: ${documentTypeCode}`
    );
    this.name = "NoSeriesAvailableError";
  }
}

export class SeriesExhaustedError extends Error {
  constructor(seriesId: number) {
    super(`No hay más números disponibles en la serie: ${seriesId}`);
    this.name = "SeriesExhaustedError";
  }
}

export interface GetNextDocumentNumberParams {
  documentTypeCode: string;
  today?: DateTime;
  externalDocumentType: string;
  externalDocumentId: string;
}

export interface DocumentNumberResult {
  seriesId: number;
  assignedNumber: number;
  fullNumber: string;
}

/**
 * Tipo mínimo que necesitamos de Drizzle, sirve tanto para `db` como para `tx`.
 */
type NumberingTx = {
  select: typeof db.select;
  update: typeof db.update;
  insert: typeof db.insert;
};

/**
 * Core de numeración que asume que ya estás dentro de una transacción.
 * Se puede usar tanto con `db` como con un `tx` de `db.transaction`.
 */
async function getNextDocumentNumberCore(
  tx: NumberingTx,
  params: GetNextDocumentNumberParams
): Promise<DocumentNumberResult> {
  const {
    documentTypeCode,
    today = new DateTime(),
    externalDocumentType,
    externalDocumentId,
  } = params;

  const todayDate = today;

  // 1. Buscar tipo de documento por código
  const [docType] = await tx
    .select()
    .from(documentType)
    .where(eq(documentType.code, documentTypeCode));

  if (!docType) {
    throw new DocumentTypeNotFoundError(documentTypeCode);
  }

  // 2. Validar que el tipo esté habilitado
  if (!docType.isEnabled) {
    throw new DocumentTypeDisabledError(documentTypeCode);
  }

  // 3. Seleccionar la serie disponible, con FOR UPDATE
  const [lockedSeries] = await tx
    .select({
      id: documentSeries.id,
      documentTypeId: documentSeries.documentTypeId,
      isActive: documentSeries.isActive,
      isDefault: documentSeries.isDefault,
      validFrom: documentSeries.validFrom,
      validTo: documentSeries.validTo,
      startNumber: documentSeries.startNumber,
      endNumber: documentSeries.endNumber,
      currentNumber: documentSeries.currentNumber,
      prefix: documentSeries.prefix,
      suffix: documentSeries.suffix,
    })
    .from(documentSeries)
    .where(
      and(
        eq(documentSeries.documentTypeId, docType.id),
        eq(documentSeries.isActive, true),
        // validFrom <= today
        lte(documentSeries.validFrom, todayDate),
        // validTo is null OR validTo >= today
        or(
          isNull(documentSeries.validTo),
          gte(documentSeries.validTo, todayDate)
        ),
        // currentNumber < endNumber
        lt(documentSeries.currentNumber, documentSeries.endNumber)
      )
    )
    .orderBy(
      // isDefault DESC, luego validFrom ASC
      sql`${documentSeries.isDefault} DESC`,
      documentSeries.validFrom
    )
    .limit(1)
    .for("update");

  if (!lockedSeries) {
    throw new NoSeriesAvailableError(documentTypeCode);
  }

  const currentNumber = Number(lockedSeries.currentNumber);
  const endNumber = Number(lockedSeries.endNumber);

  // 4. Validar que aún haya números disponibles
  if (currentNumber >= endNumber) {
    throw new SeriesExhaustedError(lockedSeries.id);
  }

  const nextNumber = currentNumber + 1;

  // 5. Actualizar currentNumber
  await tx
    .update(documentSeries)
    .set({ currentNumber: nextNumber })
    .where(eq(documentSeries.id, lockedSeries.id));

  // 6. Insertar registro de auditoría
  await tx.insert(documentSequence).values({
    seriesId: lockedSeries.id,
    assignedNumber: nextNumber,
    externalDocumentType,
    externalDocumentId,
    assignedDate: todayDate,
  });

  // 7. Construir número completo
  const prefix = lockedSeries.prefix ?? "";
  const suffix = lockedSeries.suffix ?? "";
  const fullNumber = `${prefix}${nextNumber}${suffix}`;

  return {
    seriesId: lockedSeries.id,
    assignedNumber: nextNumber,
    fullNumber,
  };
}

/**
 * Versión "clásica": maneja su propia transacción.
 */
export async function getNextDocumentNumber(
  params: GetNextDocumentNumberParams
): Promise<DocumentNumberResult> {
  return db.transaction(async (tx) => {
    return getNextDocumentNumberCore(tx as NumberingTx, params);
  });
}

/**
 * Versión para usar DENTRO de una transacción existente.
 * Ejemplo:
 *   await db.transaction(async (tx) => {
 *     const num = await getNextDocumentNumberTx(tx, {...});
 *     ...
 *   });
 */
export async function getNextDocumentNumberTx(
  tx: NumberingTx,
  params: GetNextDocumentNumberParams
): Promise<DocumentNumberResult> {
  return getNextDocumentNumberCore(tx, params);
}
