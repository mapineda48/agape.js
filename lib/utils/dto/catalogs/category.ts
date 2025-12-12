/**
 * DTOs para categorías y subcategorías de catálogo.
 * @module catalogs/category
 */

/**
 * DTO para crear/actualizar una categoría.
 */
export interface IUpsertCategory {
  /** ID de la categoría (si existe, es actualización) */
  id?: number;
  /** Nombre completo de la categoría */
  fullName: string;
  /** Indica si la categoría está habilitada */
  isEnabled?: boolean;
}

/**
 * Resultado de una categoría.
 */
export interface ICategory {
  /** Identificador único de la categoría */
  id: number;
  /** Nombre completo de la categoría */
  fullName: string;
  /** Indica si la categoría está habilitada */
  isEnabled: boolean;
}

/**
 * DTO para toggle (habilitar/deshabilitar) una categoría.
 */
export interface IToggleCategory {
  /** ID de la categoría */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle de categoría.
 */
export interface IToggleCategoryResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Categoría actualizada */
  category: ICategory;
  /** Mensaje informativo */
  message?: string;
  /** Número de subcategorías afectadas (si se deshabilitó en cascada) */
  affectedSubcategories?: number;
}

/**
 * DTO para crear/actualizar una subcategoría.
 */
export interface IUpsertSubcategory {
  /** ID de la subcategoría (si existe, es actualización) */
  id?: number;
  /** Nombre completo de la subcategoría */
  fullName: string;
  /** ID de la categoría padre */
  categoryId: number;
  /** Indica si la subcategoría está habilitada */
  isEnabled?: boolean;
}

/**
 * Resultado de una subcategoría.
 */
export interface ISubcategory {
  /** Identificador único de la subcategoría */
  id: number;
  /** Nombre completo de la subcategoría */
  fullName: string;
  /** ID de la categoría padre */
  categoryId: number;
  /** Indica si la subcategoría está habilitada */
  isEnabled: boolean;
}

/**
 * Subcategoría con datos de categoría padre.
 */
export interface ISubcategoryWithCategory extends ISubcategory {
  /** Datos de la categoría padre */
  category: ICategory;
}

/**
 * Filtros para listar categorías.
 */
export interface IListCategoriesParams {
  /** Si es true, retorna solo las activas */
  activeOnly?: boolean;
  /** Incluir conteo de subcategorías */
  includeSubcategoryCount?: boolean;
}

/**
 * Categoría con conteo de subcategorías.
 */
export interface ICategoryWithCounts extends ICategory {
  /** Número de subcategorías activas */
  activeSubcategoryCount?: number;
  /** Número total de subcategorías */
  totalSubcategoryCount?: number;
}

/**
 * Filtros para listar subcategorías.
 */
export interface IListSubcategoriesParams {
  /** ID de la categoría padre */
  categoryId?: number;
  /** Si es true, retorna solo las activas */
  activeOnly?: boolean;
}
