import { vi } from "vitest";

// Re-exportar DTOs desde utils para uso en tests del frontend
export type {
  ItemType,
  IGood,
  IService,
  IItemBase,
  IItemGood,
  IItemService,
  IItem,
  ListItemsParams,
  ListItemItem,
  ListItemsResult,
  IItemRecord,
} from "@utils/dto/catalogs/item";

// Constantes también disponibles
export { ITEM_TYPE_VALUES } from "@utils/dto/catalogs/item";

// Mocks de funciones del servicio
export const getItemById = vi.fn();
export const getItemByCode = vi.fn();
export const listItems = vi.fn();
export const upsertItem = vi.fn();
