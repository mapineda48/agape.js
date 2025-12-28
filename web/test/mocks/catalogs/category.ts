import { vi } from "vitest";

// Re-exportar DTOs desde utils para uso en tests del frontend
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
} from "@utils/dto/catalogs/category";

// Mocks de funciones del servicio de categorías
export const listCategories = vi.fn();
export const getCategoryById = vi.fn();
export const upsertCategory = vi.fn();
export const toggleCategory = vi.fn();

// Mocks de funciones del servicio de subcategorías
export const listSubcategories = vi.fn();
export const getSubcategoryById = vi.fn();
export const getSubcategoryWithCategory = vi.fn();
export const upsertSubcategory = vi.fn();
export const toggleSubcategory = vi.fn();
