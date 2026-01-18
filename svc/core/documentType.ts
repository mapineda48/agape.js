/**
 * Servicio de Tipos de Documento de Identidad (Identity Document Type)
 *
 * Gestiona el catálogo de tipos de documento de identificación personal
 * y empresarial (CC, NIT, PAS, CE, etc.).
 *
 * **Reglas de negocio:**
 * 1. No se puede deshabilitar un tipo de documento si hay usuarios activos usándolo.
 * 2. No se puede cambiar `appliesToPerson=false` si hay usuarios tipo persona usándolo.
 * 3. No se puede cambiar `appliesToCompany=false` si hay usuarios tipo empresa usándolo.
 *
 * @module core/documentType
 */

import { db } from "#lib/db";
import { documentType, type NewDocumentType } from "#models/documentType";
import { user } from "#models/user";
import { and, eq, count } from "drizzle-orm";
import type {
  IUpsertDocumentType,
  IListDocumentTypesParams,
  IDocumentType,
  IToggleDocumentType,
  IToggleDocumentTypeResult,
} from "#utils/dto/core/documentType";

// ============================================================================
// Utilidades internas
// ============================================================================

/**
 * Cuenta usuarios activos que usan un tipo de documento específico.
 */
async function countUsersWithDocumentType(
  documentTypeId: number,
  userType?: "person" | "company"
): Promise<number> {
  const conditions = [
    eq(user.documentTypeId, documentTypeId),
    eq(user.isActive, true),
  ];

  if (userType) {
    conditions.push(eq(user.type, userType));
  }

  const [result] = await db
    .select({ total: count() })
    .from(user)
    .where(and(...conditions));

  return result?.total ?? 0;
}

// ============================================================================
// Servicios de lectura
// ============================================================================

/**
 * Lista los tipos de documento según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de tipos de documento.
 * @permission core.document_type.read
 * *
 */
export async function listDocumentTypes(
  params: IListDocumentTypesParams = {}
): Promise<IDocumentType[]> {
  const { activeOnly = true, personOnly, companyOnly } = params;

  const conditions = [];

  if (activeOnly) {
    conditions.push(eq(documentType.isEnabled, true));
  }

  if (personOnly) {
    conditions.push(eq(documentType.appliesToPerson, true));
  }

  if (companyOnly) {
    conditions.push(eq(documentType.appliesToCompany, true));
  }

  const query = db.select().from(documentType);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * Lista los tipos de documento que aplican para personas naturales.
 * @deprecated Usa `listDocumentTypes({ personOnly: true })` en su lugar.
 */
export async function listPersonDocumentTypes(
  activeOnly = true
): Promise<IDocumentType[]> {
  return listDocumentTypes({ activeOnly, personOnly: true });
}

/**
 * Obtiene un tipo de documento por su ID.
 *
 * @param id ID del tipo de documento.
 * @returns Tipo de documento o undefined si no existe.
 * @permission core.document_type.read
 */
export async function getDocumentTypeById(
  id: number
): Promise<IDocumentType | undefined> {
  const [record] = await db
    .select()
    .from(documentType)
    .where(eq(documentType.id, id));
  return record;
}

/**
 * Obtiene un tipo de documento por su código.
 *
 * @param code Código del tipo de documento.
 * @returns Tipo de documento o undefined si no existe.
 * @permission core.document_type.read
 */
export async function getDocumentTypeByCode(
  code: string
): Promise<IDocumentType | undefined> {
  const [record] = await db
    .select()
    .from(documentType)
    .where(eq(documentType.code, code));
  return record;
}

// ============================================================================
// Servicios de escritura
// ============================================================================

/**
 * Crea o actualiza un tipo de documento de identidad.
 *
 * **Validaciones:**
 * - Si ya existe un tipo con el mismo código (y diferente ID), falla por unique constraint.
 * - Si se intenta cambiar `appliesToPerson=false` y hay usuarios persona usándolo, lanza error.
 * - Si se intenta cambiar `appliesToCompany=false` y hay usuarios empresa usándolo, lanza error.
 *
 * @param payload Datos del tipo de documento.
 * @returns Array con el tipo de documento creado/actualizado.
 * @permission core.document_type.manage
 * *
 */
export async function upsertDocumentType(
  payload: IUpsertDocumentType
): Promise<[IDocumentType]> {
  const { id, ...data } = payload;

  // Si es actualización, aplicar reglas de negocio
  if (typeof id === "number") {
    const existing = await getDocumentTypeById(id);

    if (!existing) {
      throw new Error(`Tipo de documento con ID ${id} no encontrado`);
    }

    // Regla: No cambiar appliesToPerson=false si hay usuarios persona usándolo
    if (existing.appliesToPerson && !data.appliesToPerson) {
      const personCount = await countUsersWithDocumentType(id, "person");
      if (personCount > 0) {
        throw new Error(
          `No se puede desmarcar "Aplica a Persona" porque hay ${personCount} usuario(s) persona usando este tipo de documento`
        );
      }
    }

    // Regla: No cambiar appliesToCompany=false si hay usuarios empresa usándolo
    if (existing.appliesToCompany && !data.appliesToCompany) {
      const companyCount = await countUsersWithDocumentType(id, "company");
      if (companyCount > 0) {
        throw new Error(
          `No se puede desmarcar "Aplica a Empresa" porque hay ${companyCount} usuario(s) empresa usando este tipo de documento`
        );
      }
    }

    const result = await db
      .update(documentType)
      .set(data)
      .where(eq(documentType.id, id))
      .returning();

    return result as [IDocumentType];
  }

  // Insertar nuevo o actualizar si el código ya existe (upsert real)
  const result = await db
    .insert(documentType)
    .values(data as NewDocumentType)
    .onConflictDoUpdate({
      target: documentType.code,
      set: {
        name: data.name,
        isEnabled: data.isEnabled,
        appliesToPerson: data.appliesToPerson,
        appliesToCompany: data.appliesToCompany,
      },
    })
    .returning();

  return result as [IDocumentType];
}

/**
 * Habilita o deshabilita un tipo de documento.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar si hay usuarios activos usando este tipo de documento.
 *
 * @param payload ID y nuevo estado del tipo de documento.
 * @returns Resultado de la operación con el tipo de documento actualizado.
 * @permission core.document_type.manage
 * *
 */
export async function toggleDocumentType(
  payload: IToggleDocumentType
): Promise<IToggleDocumentTypeResult> {
  const { id, isEnabled } = payload;

  const existing = await getDocumentTypeById(id);

  if (!existing) {
    throw new Error(`Tipo de documento con ID ${id} no encontrado`);
  }

  // Regla: No deshabilitar si hay usuarios activos usándolo
  if (!isEnabled) {
    const userCount = await countUsersWithDocumentType(id);
    if (userCount > 0) {
      throw new Error(
        `No se puede deshabilitar este tipo de documento porque hay ${userCount} usuario(s) activo(s) usándolo. ` +
        `Primero debe migrar estos usuarios a otro tipo de documento o desactivarlos.`
      );
    }
  }

  const [updated] = await db
    .update(documentType)
    .set({ isEnabled })
    .where(eq(documentType.id, id))
    .returning();

  return {
    success: true,
    documentType: updated,
    message: isEnabled
      ? "Tipo de documento habilitado correctamente"
      : "Tipo de documento deshabilitado correctamente",
  };
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  IUpsertDocumentType,
  IListDocumentTypesParams,
  IDocumentType,
  IToggleDocumentType,
  IToggleDocumentTypeResult,
} from "#utils/dto/core/documentType";

// Tipos derivados de funciones para compatibilidad con frontend
export type DocumentType = IDocumentType;
export type DocumentTypeRecord = IDocumentType;
export type { NewDocumentType };
