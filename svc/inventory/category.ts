import { db } from "#lib/db";
import { desc, eq } from "drizzle-orm";
import { category, type NewCategory } from "#models/inventory/category";
import {
  subcategory,
  type NewSubcategory,
} from "#models/inventory/subcategory";

export type CategoryRecord = typeof category.$inferSelect;
export type CategoryId = CategoryRecord["id"];
export type SubcategoryRecord = typeof subcategory.$inferSelect;
export type SubcategoryId = SubcategoryRecord["id"];

/**
 * DTO de subcategoría expuesto por el servicio.
 * Es el contrato que se usa tanto en lectura como en escritura.
 */
export interface SubcategoryDto {
  /** Identificador único de la subcategoría (opcional en creación) */
  id?: SubcategoryId;
  /** Nombre completo de la subcategoría */
  fullName: string;
  /** Indica si la subcategoría está habilitada */
  isEnabled: boolean;
}

/**
 * DTO de categoría con subcategorías anidadas.
 * Este es el contrato “estable” que usan:
 * - los selects
 * - el retorno del insert/update
 */
export interface CategoryDto {
  /** Identificador único de la categoría */
  id: CategoryId;
  /** Nombre completo de la categoría */
  fullName: string;
  /** Indica si la categoría está habilitada */
  isEnabled: boolean;
  /** Subcategorías asociadas a la categoría */
  subcategories: SubcategoryDto[];
}

/**
 * Payload para crear o actualizar una categoría con subcategorías.
 *
 * - Si `id` es undefined → crea.
 * - Si `id` tiene valor → actualiza.
 * - Subcategorías:
 *   - Sin `id` → se insertan.
 *   - Con `id` → se actualizan.
 *   - Las subcategorías existentes que NO vengan en el payload
 *     NO se tocan (no se borran ni se actualizan).
 */
export interface UpsertCategoryDto
  extends Omit<CategoryDto, "id" | "subcategories"> {
  id?: CategoryId;
  subcategories?: SubcategoryDto[];
}

/**
 * Inserta o actualiza una categoría junto con sus subcategorías
 * y devuelve siempre la categoría con TODAS sus subcategorías actuales.
 *
 * Comportamiento:
 * - Upsert de la categoría según `payload.id`.
 * - Subcategorías:
 *   - Solo se crean/actualizan las que vienen en `payload.subcategories`.
 *   - Las que no se envíen permanecen intactas.
 * - Al final se recargan todas las subcategorías desde la base de datos
 *   y se devuelve un `CategoryDto` completo (categoría + subcategorías).
 *
 * Toda la operación se ejecuta dentro de una transacción.
 *
 * @param payload DTO con los datos de la categoría y sus subcategorías.
 * @returns CategoryDto con subcategorías anidadas.
 */
export async function upsertCategory(
  payload: UpsertCategoryDto
): Promise<CategoryDto> {
  const { id, subcategories: subs, ...data } = payload;

  return db.transaction(async (tx) => {
    let record: CategoryRecord;

    if (typeof id !== "number") {
      // Crear nueva categoría
      const [inserted] = await tx
        .insert(category)
        .values({
          fullName: data.fullName,
          isEnabled: data.isEnabled,
        } satisfies NewCategory)
        .returning();

      record = inserted;
    } else {
      // Actualizar categoría existente
      const [updated] = await tx
        .update(category)
        .set({
          fullName: data.fullName,
          isEnabled: data.isEnabled,
        })
        .where(eq(category.id, id))
        .returning();

      record = updated;
    }

    // Upsert de subcategorías asociadas a la categoría:
    // Solo se modifican las que vienen en el payload.
    if (subs && subs.length > 0) {
      await Promise.all(
        subs.map(async ({ id: subId, fullName, isEnabled }) => {
          if (typeof subId !== "number") {
            // Crear nueva subcategoría
            await tx.insert(subcategory).values({
              fullName,
              isEnabled,
              categoryId: record.id,
            } satisfies NewSubcategory);
          } else {
            // Actualizar subcategoría existente
            await tx
              .update(subcategory)
              .set({
                fullName,
                isEnabled,
                categoryId: record.id,
              })
              .where(eq(subcategory.id, subId));
          }
        })
      );
    }

    // Siempre recargar TODAS las subcategorías actuales de esa categoría
    // para devolver un DTO consistente.
    const subRecords: SubcategoryRecord[] = await tx
      .select()
      .from(subcategory)
      .where(eq(subcategory.categoryId, record.id));

    const subDtos: SubcategoryDto[] = subRecords.map((sub) => ({
      id: sub.id,
      fullName: sub.fullName,
      isEnabled: sub.isEnabled,
    }));

    return {
      id: record.id,
      fullName: record.fullName,
      isEnabled: record.isEnabled,
      subcategories: subDtos,
    };
  });
}

/**
 * DTO de categoría con subcategorías tal como se devuelve en las consultas de lectura.
 * Aquí el `id` siempre está definido.
 */
export interface CategoryWithSubcategoriesDto {
  id: CategoryId;
  fullName: string;
  isEnabled: boolean;
  subcategories: {
    id: SubcategoryId;
    fullName: string;
    isEnabled: boolean;
  }[];
}

/* =========================
 * Funciones de lectura
 * ========================= */

/**
 * Lista todas las categorías con sus subcategorías anidadas.
 *
 * - Siempre retorna una lista de categorías, cada una con un array de subcategorías.
 * - Si una categoría no tiene subcategorías, el array vendrá vacío.
 * - Si `activeOnly` es true, se filtran solo categorías activas.
 *
 * @param activeOnly Si es true, retorna solo las categorías activas.
 * @returns Lista de categorías con sus subcategorías anidadas.
 */
export async function listCategories(
  activeOnly: boolean = true
): Promise<CategoryWithSubcategoriesDto[]> {
  const baseQuery = db
    .select({
      catId: category.id,
      catName: category.fullName,
      catEn: category.isEnabled,
      subId: subcategory.id,
      subName: subcategory.fullName,
      subEn: subcategory.isEnabled,
    })
    .from(category)
    .leftJoin(subcategory, eq(subcategory.categoryId, category.id))
    .orderBy(desc(category.id), desc(subcategory.id));

  const rows = activeOnly
    ? await baseQuery.where(eq(category.isEnabled, true))
    : await baseQuery;

  // Plegado a estructura anidada
  const map = new Map<CategoryId, CategoryWithSubcategoriesDto>();

  for (const row of rows) {
    let cat = map.get(row.catId);

    if (!cat) {
      cat = {
        id: row.catId,
        fullName: row.catName,
        isEnabled: row.catEn,
        subcategories: [],
      };
      map.set(row.catId, cat);
    }

    if (row.subId !== null && row.subId !== undefined) {
      cat.subcategories.push({
        id: row.subId,
        fullName: row.subName!,
        isEnabled: row.subEn!,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Obtiene una categoría por ID sin cargar subcategorías.
 */
export async function getCategoryById(id: CategoryId) {
  const [record] = await db.select().from(category).where(eq(category.id, id));

  return record;
}
