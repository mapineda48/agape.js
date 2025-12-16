import schema from "../schema";

/**
 * Enum para los tipos de ítem en el catálogo.
 *
 * Este enum define los tipos de ítems soportados en el modelo de "Item Master":
 * - `good`: Bien físico inventariable (producto)
 * - `service`: Servicio
 *
 * Se utiliza en el modelo `item` para determinar el tipo de ítem
 * y garantizar la integridad referencial con las tablas de detalle.
 *
 * @example
 * ```ts
 * import { ItemType, itemTypeEnum } from "@models/catalogs/enums";
 *
 * // Valores disponibles
 * const tipo: ItemType = "good";
 * const tipo2: ItemType = "service";
 * ```
 */
export const itemTypeEnum = schema.enum("catalogs_item_type", [
  "good", // bien físico
  "service", // servicio
]);

/**
 * Tipo TypeScript derivado del enum de base de datos.
 * Representa los valores posibles: "good" | "service"
 */
export type ItemType = (typeof itemTypeEnum.enumValues)[number];

/**
 * Array con todos los valores válidos del enum ItemType.
 * Útil para validaciones en tiempo de ejecución.
 */
export const ITEM_TYPE_VALUES = itemTypeEnum.enumValues;
