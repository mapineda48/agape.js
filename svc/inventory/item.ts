import { db } from "#lib/db";
import { item, type NewItem, type Item } from "#models/catalogs/item";
import { inventoryItemStock } from "#models/inventory/item";
import { inventoryItemService } from "#models/catalogs/service";
import { category } from "#models/catalogs/category";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";

/**
 * Obtiene un ítem por su ID.
 * @param id Identificador único del ítem
 * @returns Ítem encontrado o undefined si no existe
 */
export async function getItemById(id: number) {
  const [match] = await db.select().from(item).where(eq(item.id, id));
  return match;
}

/**
 * Obtiene un ítem por su código.
 * @param code Código único del ítem
 * @returns Ítem encontrado o undefined si no existe
 */
export async function getItemByCode(code: string) {
  const [match] = await db.select().from(item).where(eq(item.code, code));
  return match;
}

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
  itemType?: "good" | "service" | "bundle" | "charge";
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
 * Ítem en lista con nombre de categoría.
 */
export interface ListItemItem {
  id: number;
  code: string;
  fullName: string;
  isEnabled: boolean;
  itemType: "good" | "service" | "bundle" | "charge";
  basePrice: Decimal;
  category: string | null;
  images: unknown;
  rating: number;
}

/**
 * Resultado de listado de ítems.
 */
export interface ListItemsResult {
  items: ListItemItem[];
  totalCount?: number;
}

/**
 * Lista ítems con filtros opcionales y paginación.
 * @param params Parámetros de filtrado y paginación
 * @returns Lista de ítems y opcionalmente el conteo total
 */
export async function listItems(
  params: ListItemsParams = {}
): Promise<ListItemsResult> {
  const {
    fullName,
    code,
    isEnabled,
    itemType,
    categoryId,
    minPrice,
    maxPrice,
    rating,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (fullName) {
    conditions.push(sql`${item.fullName} ILIKE ${`%${fullName}%`}`);
  }

  if (code) {
    conditions.push(sql`${item.code} ILIKE ${`%${code}%`}`);
  }

  if (isEnabled !== undefined) {
    conditions.push(eq(item.isEnabled, isEnabled));
  }

  if (itemType !== undefined) {
    conditions.push(eq(item.itemType, itemType));
  }

  if (categoryId !== undefined) {
    conditions.push(eq(item.categoryId, categoryId));
  }

  if (minPrice !== undefined) {
    conditions.push(gte(item.basePrice, minPrice));
  }

  if (maxPrice !== undefined) {
    conditions.push(lte(item.basePrice, maxPrice));
  }

  if (rating !== undefined) {
    conditions.push(gte(item.rating, rating));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const queryItems = db
    .select({
      id: item.id,
      code: item.code,
      fullName: item.fullName,
      isEnabled: item.isEnabled,
      itemType: item.itemType,
      basePrice: item.basePrice,
      category: category.fullName,
      images: item.images,
      rating: item.rating,
    })
    .from(item)
    .leftJoin(category, eq(item.categoryId, category.id))
    .where(whereClause)
    .orderBy(item.id)
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  if (!includeTotalCount) {
    const items = await queryItems;
    return { items };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(item)
    .where(whereClause);

  const [items, [{ totalCount }]] = await Promise.all([queryItems, queryCount]);

  return { items, totalCount };
}

/**
 * Payload para crear o actualizar un ítem.
 */
export type UpsertItemPayload = Omit<NewItem, "images"> & {
  id?: number;
  images: (string | File)[];
  /** Datos de stock (solo para ítems tipo 'good' o 'bundle') */
  stockData?: {
    uomId: number;
    trackStock?: boolean;
    minStock?: Decimal | null;
    maxStock?: Decimal | null;
    reorderPoint?: Decimal | null;
  };
  /** Datos de servicio (solo para ítems tipo 'service') */
  serviceData?: {
    durationMinutes?: number | null;
    isRecurring?: boolean;
  };
};

/**
 * Inserta o actualiza un ítem junto con sus imágenes y datos de extensión.
 * @param data Datos del ítem a insertar o actualizar
 * @returns El ítem insertado o actualizado
 */
export async function upsertItem(data: UpsertItemPayload): Promise<Item> {
  const { id, images, stockData, serviceData, ...rest } = data;

  return await db.transaction(async (tx) => {
    // Upsert principal
    const [record] = await tx
      .insert(item)
      .values({
        ...(id !== undefined && { id }),
        ...rest,
        images: [],
      })
      .onConflictDoUpdate({
        target: item.id,
        set: {
          ...rest,
        },
      })
      .returning();

    // Manejar datos de stock para ítems tipo 'good' o 'bundle'
    if (stockData && (rest.itemType === "good" || rest.itemType === "bundle")) {
      await tx
        .insert(inventoryItemStock)
        .values({
          itemId: record.id,
          uomId: stockData.uomId,
          trackStock: stockData.trackStock ?? true,
          minStock: stockData.minStock ?? null,
          maxStock: stockData.maxStock ?? null,
          reorderPoint: stockData.reorderPoint ?? null,
        })
        .onConflictDoUpdate({
          target: inventoryItemStock.itemId,
          set: {
            uomId: stockData.uomId,
            trackStock: stockData.trackStock ?? true,
            minStock: stockData.minStock ?? null,
            maxStock: stockData.maxStock ?? null,
            reorderPoint: stockData.reorderPoint ?? null,
          },
        });
    }

    // Manejar datos de servicio para ítems tipo 'service'
    if (serviceData && rest.itemType === "service") {
      await tx
        .insert(inventoryItemService)
        .values({
          itemId: record.id,
          durationMinutes: serviceData.durationMinutes ?? null,
          isRecurring: serviceData.isRecurring ?? false,
        })
        .onConflictDoUpdate({
          target: inventoryItemService.itemId,
          set: {
            durationMinutes: serviceData.durationMinutes ?? null,
            isRecurring: serviceData.isRecurring ?? false,
          },
        });
    }

    // Manejar imágenes
    if (areArraysEqual(record.images as string[], images) || !images.length) {
      return record;
    }

    const imgs = await Promise.all(
      images.map((file) => {
        if (typeof file === "string") {
          return Promise.resolve(file);
        }
        return BlobStorage.uploadFile(`inventory/item/${record.id}`, file);
      })
    );

    await tx.update(item).set({ images: imgs }).where(eq(item.id, record.id));
    record.images = imgs;

    return record;
  });
}

/**
 * Compara dos arrays para verificar si son iguales.
 */
function areArraysEqual(a: string[], b: (string | File)[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export type { Item, NewItem };
