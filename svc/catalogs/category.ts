/**
 * Servicio de Categorías y Subcategorías de Catálogo
 *
 * Gestiona las categorías y subcategorías para la organización
 * de ítems del catálogo.
 *
 * **Reglas de negocio:**
 * 1. No se puede deshabilitar una categoría si tiene subcategorías activas
 *    (opción alternativa: deshabilitar en cascada).
 * 2. No se puede crear/habilitar una subcategoría si su categoría padre está deshabilitada.
 * 3. No se puede eliminar una categoría si tiene subcategorías (usar restrict o cascada lógica).
 *
 * @module catalogs/category
 */

import { db } from "#lib/db";
import { category, type NewCategory } from "#models/catalogs/category";
import { subcategory, type NewSubcategory } from "#models/catalogs/subcategory";
import { and, eq, count, sql } from "drizzle-orm";
import type {
  IUpsertCategory,
  ICategory,
  IToggleCategory,
  IToggleCategoryResult,
  IListCategoriesParams,
  ICategoryWithCounts,
  IUpsertSubcategory,
  ISubcategory,
  ISubcategoryWithCategory,
  IListSubcategoriesParams,
} from "#utils/dto/catalogs/category";

// ============================================================================
// Servicios de Categoría
// ============================================================================

/**
 * Lista las categorías según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de categorías.
 * @permission inventory.category.read
 *
 * @example
 * ```ts
 * const categories = await listCategories({ activeOnly: true });
 * ```
 */
export async function listCategories(
  params: IListCategoriesParams = {}
): Promise<ICategoryWithCounts[]> {
  const { activeOnly = true, includeSubcategoryCount = false } = params;

  if (includeSubcategoryCount) {
    // Query con conteo de subcategorías usando LEFT JOIN
    const subQuery = db
      .select({
        categoryId: subcategory.categoryId,
        activeSubcategoryCount: sql<string>`
          SUM(CASE WHEN ${subcategory.isEnabled} = true THEN 1 ELSE 0 END)
        `.as("active_count"),
        totalSubcategoryCount: count().as("total_count"),
      })
      .from(subcategory)
      .groupBy(subcategory.categoryId)
      .as("sub_counts");

    let baseQuery = db
      .select({
        id: category.id,
        fullName: category.fullName,
        isEnabled: category.isEnabled,
        activeSubcategoryCount: sql<string>`COALESCE(${subQuery.activeSubcategoryCount}, '0')`,
        totalSubcategoryCount: sql<string>`COALESCE(${subQuery.totalSubcategoryCount}, '0')`,
      })
      .from(category)
      .leftJoin(subQuery, eq(category.id, subQuery.categoryId));

    let rows;
    if (activeOnly) {
      rows = await baseQuery.where(eq(category.isEnabled, true));
    } else {
      rows = await baseQuery;
    }

    // PostgreSQL devuelve bigint como string, convertir a número
    return rows.map((row) => ({
      ...row,
      activeSubcategoryCount: parseInt(row.activeSubcategoryCount, 10),
      totalSubcategoryCount: parseInt(row.totalSubcategoryCount, 10),
    }));
  }

  // Query simple sin conteo
  const query = db.select().from(category);

  if (activeOnly) {
    return query.where(eq(category.isEnabled, true));
  }

  return query;
}

/**
 * Obtiene una categoría por su ID.
 *
 * @param id ID de la categoría.
 * @returns Categoría o undefined si no existe.
 * @permission inventory.category.read
 */
export async function getCategoryById(
  id: number
): Promise<ICategory | undefined> {
  const [record] = await db.select().from(category).where(eq(category.id, id));
  return record;
}

/**
 * Crea o actualiza una categoría.
 *
 * @param payload Datos de la categoría.
 * @returns Array con la categoría creada/actualizada.
 * @permission inventory.category.manage
 *
 * @example
 * ```ts
 * const [cat] = await upsertCategory({ fullName: "Electrónicos" });
 * ```
 */
export async function upsertCategory(
  payload: IUpsertCategory
): Promise<[ICategory]> {
  const { id, ...data } = payload;

  if (typeof id === "number") {
    const [updated] = await db
      .update(category)
      .set(data)
      .where(eq(category.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Categoría con ID ${id} no encontrada`);
    }

    return [updated];
  }

  const result = await db
    .insert(category)
    .values(data as NewCategory)
    .returning();

  return result as [ICategory];
}

/**
 * Habilita o deshabilita una categoría.
 *
 * **Reglas de negocio:**
 * - No se puede deshabilitar si tiene subcategorías activas.
 *   - Opción: deshabilitar en cascada (cascade) si se especifica.
 *
 * @param payload ID y nuevo estado de la categoría.
 * @param cascade Si es true, deshabilita subcategorías en cascada.
 * @returns Resultado de la operación.
 * @permission inventory.category.manage
 *
 * @example
 * ```ts
 * // Deshabilitar con cascada
 * const result = await toggleCategory({ id: 1, isEnabled: false }, true);
 * console.log(`Subcategorías afectadas: ${result.affectedSubcategories}`);
 * ```
 */
export async function toggleCategory(
  payload: IToggleCategory,
  cascade = false
): Promise<IToggleCategoryResult> {
  const { id, isEnabled } = payload;

  const existing = await getCategoryById(id);

  if (!existing) {
    throw new Error(`Categoría con ID ${id} no encontrada`);
  }

  // Si se está deshabilitando, verificar subcategorías activas
  if (!isEnabled) {
    const [countResult] = await db
      .select({ total: count() })
      .from(subcategory)
      .where(
        and(eq(subcategory.categoryId, id), eq(subcategory.isEnabled, true))
      );

    const activeSubcategories = countResult?.total ?? 0;

    if (activeSubcategories > 0 && !cascade) {
      throw new Error(
        `No se puede deshabilitar la categoría porque tiene ${activeSubcategories} subcategoría(s) activa(s). ` +
        `Primero deshabilite las subcategorías o use la opción de cascada.`
      );
    }

    // Deshabilitar en cascada si se especificó
    if (activeSubcategories > 0 && cascade) {
      await db
        .update(subcategory)
        .set({ isEnabled: false })
        .where(eq(subcategory.categoryId, id));

      const [updatedCategory] = await db
        .update(category)
        .set({ isEnabled: false })
        .where(eq(category.id, id))
        .returning();

      return {
        success: true,
        category: updatedCategory,
        message: `Categoría y ${activeSubcategories} subcategoría(s) deshabilitadas correctamente`,
        affectedSubcategories: activeSubcategories,
      };
    }
  }

  // Actualización simple
  const [updated] = await db
    .update(category)
    .set({ isEnabled })
    .where(eq(category.id, id))
    .returning();

  return {
    success: true,
    category: updated,
    message: isEnabled
      ? "Categoría habilitada correctamente"
      : "Categoría deshabilitada correctamente",
    affectedSubcategories: 0,
  };
}

// ============================================================================
// Servicios de Subcategoría
// ============================================================================

/**
 * Lista las subcategorías según los filtros especificados.
 *
 * @param params Filtros de listado.
 * @returns Lista de subcategorías.
 * @permission inventory.category.read
 *
 * @example
 * ```ts
 * const subcats = await listSubcategories({ categoryId: 1, activeOnly: true });
 * ```
 */
export async function listSubcategories(
  params: IListSubcategoriesParams = {}
): Promise<ISubcategory[]> {
  const { categoryId, activeOnly = true } = params;

  const conditions = [];

  if (activeOnly) {
    conditions.push(eq(subcategory.isEnabled, true));
  }

  if (categoryId !== undefined) {
    conditions.push(eq(subcategory.categoryId, categoryId));
  }

  const query = db.select().from(subcategory);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * Obtiene una subcategoría por su ID.
 *
 * @param id ID de la subcategoría.
 * @returns Subcategoría o undefined si no existe.
 * @permission inventory.category.read
 */
export async function getSubcategoryById(
  id: number
): Promise<ISubcategory | undefined> {
  const [record] = await db
    .select()
    .from(subcategory)
    .where(eq(subcategory.id, id));
  return record;
}

/**
 * Obtiene una subcategoría con los datos de su categoría padre.
 *
 * @param id ID de la subcategoría.
 * @returns Subcategoría con categoría o undefined si no existe.
 * @permission inventory.category.read
 */
export async function getSubcategoryWithCategory(
  id: number
): Promise<ISubcategoryWithCategory | undefined> {
  const [record] = await db
    .select({
      id: subcategory.id,
      fullName: subcategory.fullName,
      categoryId: subcategory.categoryId,
      isEnabled: subcategory.isEnabled,
      category: {
        id: category.id,
        fullName: category.fullName,
        isEnabled: category.isEnabled,
      },
    })
    .from(subcategory)
    .innerJoin(category, eq(subcategory.categoryId, category.id))
    .where(eq(subcategory.id, id));

  return record;
}

/**
 * Crea o actualiza una subcategoría.
 *
 * **Validaciones:**
 * - La categoría padre debe existir.
 * - Si la subcategoría se está habilitando, la categoría padre debe estar habilitada.
 *
 * @param payload Datos de la subcategoría.
 * @returns Array con la subcategoría creada/actualizada.
 * @permission inventory.category.manage
 *
 * @example
 * ```ts
 * const [subcat] = await upsertSubcategory({
 *   fullName: "Teléfonos",
 *   categoryId: 1,
 * });
 * ```
 */
export async function upsertSubcategory(
  payload: IUpsertSubcategory
): Promise<[ISubcategory]> {
  const { id, ...data } = payload;

  // Verificar que la categoría padre existe
  const parentCategory = await getCategoryById(data.categoryId);
  if (!parentCategory) {
    throw new Error(`Categoría padre con ID ${data.categoryId} no encontrada`);
  }

  // Verificar que la categoría padre está habilitada si se está creando/habilitando
  const isEnabling = data.isEnabled !== false;
  if (isEnabling && !parentCategory.isEnabled) {
    throw new Error(
      `No se puede crear/habilitar una subcategoría para una categoría deshabilitada. ` +
      `Primero habilite la categoría "${parentCategory.fullName}".`
    );
  }

  if (typeof id === "number") {
    const [updated] = await db
      .update(subcategory)
      .set(data)
      .where(eq(subcategory.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Subcategoría con ID ${id} no encontrada`);
    }

    return [updated];
  }

  const result = await db
    .insert(subcategory)
    .values(data as NewSubcategory)
    .returning();

  return result as [ISubcategory];
}

/**
 * Habilita o deshabilita una subcategoría.
 *
 * **Reglas de negocio:**
 * - No se puede habilitar si la categoría padre está deshabilitada.
 *
 * @param id ID de la subcategoría.
 * @param isEnabled Nuevo estado de habilitación.
 * @returns Subcategoría actualizada.
 * @permission inventory.category.manage
 */
export async function toggleSubcategory(
  id: number,
  isEnabled: boolean
): Promise<ISubcategory> {
  const existing = await getSubcategoryWithCategory(id);

  if (!existing) {
    throw new Error(`Subcategoría con ID ${id} no encontrada`);
  }

  // Verificar categoría padre si se está habilitando
  if (isEnabled && !existing.category.isEnabled) {
    throw new Error(
      `No se puede habilitar la subcategoría porque su categoría padre "${existing.category.fullName}" está deshabilitada. ` +
      `Primero habilite la categoría padre.`
    );
  }

  const [updated] = await db
    .update(subcategory)
    .set({ isEnabled })
    .where(eq(subcategory.id, id))
    .returning();

  return updated;
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  IUpsertCategory,
  ICategory,
  IToggleCategory,
  IToggleCategoryResult,
  IListCategoriesParams,
  ICategoryWithCounts,
  IUpsertSubcategory,
  ISubcategory,
  ISubcategoryWithCategory,
  IListSubcategoriesParams,
} from "#utils/dto/catalogs/category";
