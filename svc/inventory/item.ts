/**
 * @deprecated Este módulo ha sido movido a `svc/catalogs/item`.
 * Se mantiene por compatibilidad, pero se recomienda usar el nuevo módulo directamente.
 *
 * El servicio de ítems ahora sigue el patrón de Class Table Inheritance
 * donde el tipo se infiere automáticamente de la propiedad `good` o `service`.
 */

// Re-exportar todo desde el nuevo servicio de catálogos
// Re-exportar todo desde el nuevo servicio de catálogos
/** @permission inventory.item.read */
export {
  getItemById,
  getItemByCode,
  listItems,
} from "#svc/catalogs/item";

/** @permission inventory.item.manage */
export {
  upsertItem,
} from "#svc/catalogs/item";

export {
  type ListItemsParams,
  type ListItemsResult,
  type ListItemItem,
  type IItem,
  type IItemGood,
  type IItemService,
  type IItemRecord,
  type IUpsertItem,
  type Item,
  type NewItem,
  type ItemType,
} from "#svc/catalogs/item";
