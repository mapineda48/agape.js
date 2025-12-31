import type Decimal from "../../data/Decimal";

/**
 * Tipos de ítem disponibles en el catálogo.
 * - `good`: Bien físico inventariable (producto)
 * - `service`: Servicio
 */
export type ItemType = "good" | "service";

/**
 * Valores válidos para el tipo de ítem.
 * Útil para validaciones en tiempo de ejecución.
 */
export const ITEM_TYPE_VALUES: readonly ItemType[] = ["good", "service"];

/**
 * Datos de un bien físico (producto inventariable).
 * Campos específicos para ítems de tipo "good".
 */
export interface IGood {
  /** ID de la unidad de medida (requerido) */
  uomId: number;
  /** Stock mínimo recomendado */
  minStock?: Decimal | null;
  /** Stock máximo recomendado */
  maxStock?: Decimal | null;
  /** Punto de reorden */
  reorderPoint?: Decimal | null;
}

/**
 * Datos de un servicio.
 * Campos específicos para ítems de tipo "service".
 */
export interface IService {
  /** Duración del servicio en minutos */
  durationMinutes?: number | null;
  /** Indica si es un servicio recurrente */
  isRecurring?: boolean;
}

/**
 * Campos base de un ítem (comunes a goods y services).
 * Estos campos son requeridos al crear o actualizar un ítem.
 */
export interface IItemBase {
  /** ID del ítem (solo para updates) */
  id?: number;
  /** Código interno / SKU del ítem */
  code: string;
  /** Nombre completo del ítem */
  fullName: string;
  /** Slogan del ítem (opcional) */
  slogan?: string | null;
  /** Descripción del ítem */
  description?: string | null;
  /** Indica si el ítem está habilitado */
  isEnabled: boolean;
  /** Calificación del ítem (0-5) */
  rating?: number;
  /** Precio base del ítem */
  basePrice: Decimal;
  /** ID de la categoría asociada */
  categoryId?: number | null;
  /** ID de la subcategoría asociada */
  subcategoryId?: number | null;
  /** ID del grupo de impuestos asociado */
  taxGroupId?: number | null;
  /** ID del grupo contable asociado */
  itemAccountingGroupId?: number | null;
}

/**
 * DTO para crear/actualizar un ítem de tipo bien físico.
 * Garantiza que se proporcionen los datos de good y NO de service.
 */
export interface IItemGood extends IItemBase {
  /** Datos del bien físico */
  good: IGood;
  /** No puede tener datos de servicio */
  service?: never;
  /** Imágenes del ítem (URLs existentes o Files para subir) */
  images?: (string | File)[];
}

/**
 * DTO para crear/actualizar un ítem de tipo servicio.
 * Garantiza que se proporcionen los datos de service y NO de good.
 */
export interface IItemService extends IItemBase {
  /** Datos del servicio */
  service: IService;
  /** No puede tener datos de bien físico */
  good?: never;
  /** Imágenes del ítem (URLs existentes o Files para subir) */
  images?: (string | File)[];
}

/**
 * DTO general de entrada para crear o actualizar un ítem.
 * Debe incluir datos de good O service (no ambos).
 */
export type IItem = IItemGood | IItemService;

/**
 * Parámetros para listar ítems con filtros y paginación.
 */
export interface ListItemsParams {
  /** Filtro por nombre (búsqueda parcial insensible a mayúsculas) */
  fullName?: string;
  /** Filtro por código (búsqueda parcial insensible a mayúsculas) */
  code?: string;
  /** Filtro por estado habilitado/deshabilitado */
  isEnabled?: boolean;
  /** Filtro por tipo de ítem */
  type?: ItemType;
  /** Filtro por ID de categoría */
  categoryId?: number;
  /** Filtro por precio mínimo */
  minPrice?: Decimal;
  /** Filtro por precio máximo */
  maxPrice?: Decimal;
  /** Filtro por calificación mínima */
  rating?: number;
  /** Si es true, incluye el conteo total de registros */
  includeTotalCount?: boolean;
  /** Índice de página (0-based) */
  pageIndex?: number;
  /** Tamaño de página */
  pageSize?: number;
}

/**
 * Ítem en el resultado de listado con información básica.
 */
export interface ListItemItem {
  id: number;
  code: string;
  fullName: string;
  isEnabled: boolean;
  type: ItemType;
  basePrice: Decimal;
  category: string | null;
  images: unknown;
  rating: number;
}

/**
 * Resultado del listado de ítems.
 */
export interface ListItemsResult {
  items: ListItemItem[];
  totalCount?: number;
}

/**
 * Estructura de un ítem leído de la base de datos con sus detalles.
 */
export type IItemRecord =
  | (IItemBase & {
    id: number;
    type: ItemType;
    images: unknown;
    good: IGood;
    service?: never;
  })
  | (IItemBase & {
    id: number;
    type: ItemType;
    images: unknown;
    service: IService;
    good?: never;
  })
  | (IItemBase & {
    id: number;
    type: ItemType;
    images: unknown;
    good?: never;
    service?: never;
  });
