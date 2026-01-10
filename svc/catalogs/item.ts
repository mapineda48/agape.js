import { db } from "#lib/db";
import {
  item,
  type NewItem,
  type Item,
  type ItemType,
} from "#models/catalogs/item";
import { inventoryItem, type NewInventoryItem } from "#models/inventory/item";
import { service, type NewService } from "#models/catalogs/service";
import { category } from "#models/catalogs/category";
import { subcategory } from "#models/catalogs/subcategory";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";
// DTOs compartidos con el frontend
import type {
  IGood,
  IService,
  IItemGood,
  IItemService,
  IItem,
  IItemRecord,
  ListItemsParams,
  ListItemItem,
  ListItemsResult,
} from "#utils/dto/catalogs/item";

// ============================================================================
// Errores de Negocio
// ============================================================================

/**
 * Error cuando la subcategoría especificada no existe.
 */
export class SubcategoryNotFoundError extends Error {
  constructor(subcategoryId: number) {
    super(`La subcategoría con ID ${subcategoryId} no existe.`);
    this.name = "SubcategoryNotFoundError";
  }
}

/**
 * Error cuando la subcategoría no pertenece a la categoría especificada.
 * Ejemplo: Intentar asignar subcategoría "Zapatillas" (de Ropa) a un ítem de categoría "Comida".
 */
export class CategoryMismatchError extends Error {
  constructor(
    categoryId: number | null | undefined,
    subcategoryId: number,
    actualCategoryId: number
  ) {
    super(
      `La subcategoría ${subcategoryId} pertenece a la categoría ${actualCategoryId}, ` +
      `pero el ítem tiene categoryId ${categoryId ?? "null"}.`
    );
    this.name = "CategoryMismatchError";
  }
}

// ============================================================================
// Validaciones de Negocio
// ============================================================================

/**
 * Valida que la subcategoría pertenezca a la categoría del ítem.
 *
 * @param categoryId - ID de la categoría del ítem
 * @param subcategoryId - ID de la subcategoría del ítem
 * @throws SubcategoryNotFoundError si la subcategoría no existe
 * @throws CategoryMismatchError si la subcategoría no pertenece a la categoría
 */
async function validateCategoryHierarchy(
  categoryId: number | null | undefined,
  subcategoryId: number | null | undefined
): Promise<void> {
  // Sin subcategoría, no hay nada que validar
  if (subcategoryId === null || subcategoryId === undefined) {
    return;
  }

  // Obtener la subcategoría y verificar su categoría padre
  const [sub] = await db
    .select({ categoryId: subcategory.categoryId })
    .from(subcategory)
    .where(eq(subcategory.id, subcategoryId));

  if (!sub) {
    throw new SubcategoryNotFoundError(subcategoryId);
  }

  // Verificar que la subcategoría pertenezca a la categoría del ítem
  if (sub.categoryId !== categoryId) {
    throw new CategoryMismatchError(categoryId, subcategoryId, sub.categoryId);
  }
}

// ============================================================================
// Funciones de Servicio
// ============================================================================

/**
 * Obtiene un ítem por su ID, incluyendo los detalles según su tipo (good o service).
 *
 * @param id - Identificador único del ítem
 * @returns Ítem encontrado con sus detalles o undefined si no existe
 * @permission inventory.item.read
 *
 */
export async function getItemById(
  id: number
): Promise<IItemRecord | undefined> {
  const [record] = await db.select().from(item).where(eq(item.id, id));

  if (!record) {
    return undefined;
  }

  if (record.type === "good") {
    const [goodRecord] = await db
      .select({
        uomId: inventoryItem.uomId,
        minStock: inventoryItem.minStock,
        maxStock: inventoryItem.maxStock,
        reorderPoint: inventoryItem.reorderPoint,
      })
      .from(inventoryItem)
      .where(eq(inventoryItem.itemId, id));

    return { ...record, good: goodRecord } as IItemRecord;
  }

  if (record.type === "service") {
    const [serviceRecord] = await db
      .select({
        durationMinutes: service.durationMinutes,
        isRecurring: service.isRecurring,
      })
      .from(service)
      .where(eq(service.itemId, id));

    return { ...record, service: serviceRecord } as IItemRecord;
  }

  return record as IItemRecord;
}

/**
 * Obtiene un ítem por su código.
 *
 * @param code - Código único del ítem
 * @returns Ítem encontrado o undefined si no existe
 * @permission inventory.item.read
 */
export async function getItemByCode(code: string) {
  const [record] = await db.select().from(item).where(eq(item.code, code));
  return record;
}

/**
 * Lista ítems con filtros opcionales y paginación.
 *
 * @param params - Parámetros de filtrado y paginación
 * @returns Lista de ítems y opcionalmente el conteo total
 * @permission inventory.item.read
 */
export async function listItems(
  params: ListItemsParams = {}
): Promise<ListItemsResult> {
  const {
    fullName,
    code,
    isEnabled,
    type,
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

  if (type !== undefined) {
    conditions.push(eq(item.type, type));
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
      type: item.type,
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
 * Inserta o actualiza un ítem (bien o servicio).
 *
 * Si el payload incluye `id`, actualiza el ítem existente.
 * Si no incluye `id`, crea un nuevo ítem.
 *
 * El tipo de ítem se infiere automáticamente de la propiedad presente en el payload:
 * - Si contiene `good`, el tipo será "good" (bien físico inventariable)
 * - Si contiene `service`, el tipo será "service" (servicio)
 *
 * **Importante**: El cliente nunca debe enviar la propiedad `type`, esta se infiere
 * automáticamente de la propiedad de entidad presente en el payload.
 *
 * @param payload - Datos del ítem a insertar o actualizar
 * @returns Ítem creado o actualizado con sus datos relacionados
 * @permission inventory.item.manage
 * @throws Error si se proporcionan ambas propiedades (good y service)
 * @throws Error si no se proporciona ninguna propiedad de entidad
 * *
 */
export async function upsertItem(
  payload: IItemGood
): Promise<IItemRecord & { good: IGood; service?: never }>;
export async function upsertItem(
  payload: IItemService
): Promise<IItemRecord & { service: IService; good?: never }>;
export function upsertItem(payload: IItem): Promise<IItemRecord>;
export async function upsertItem(payload: IItem): Promise<IItemRecord> {
  const {
    id,
    good: goodDto,
    service: serviceDto,
    images,
    ...itemDto
  } = payload;

  // Validar coherencia de jerarquía categoría/subcategoría
  await validateCategoryHierarchy(itemDto.categoryId, itemDto.subcategoryId);

  // Inferir el tipo de ítem basado en las propiedades presentes
  const itemType = inferItemType(goodDto, serviceDto);

  // Construir el DTO con el tipo inferido
  const dto: NewItem = {
    ...itemDto,
    type: itemType,
    images: images ?? [],
  };

  if (typeof id !== "number") {
    return insertItem(dto, itemType, goodDto, serviceDto, images);
  }

  return updateItem(id, dto, itemType, goodDto, serviceDto, images);
}

/**
 * Infiere el tipo de ítem basado en las propiedades de entidad presentes.
 *
 * @param goodDto - Datos de bien físico (opcional)
 * @param serviceDto - Datos de servicio (opcional)
 * @returns El tipo de ítem inferido ("good" | "service")
 * @throws Error si ambas propiedades están presentes
 * @throws Error si ninguna propiedad está presente
 */
function inferItemType(
  goodDto: IGood | undefined,
  serviceDto: IService | undefined
): ItemType {
  const hasGood = goodDto !== undefined && goodDto !== null;
  const hasService = serviceDto !== undefined && serviceDto !== null;

  // Validar que no vengan ambos
  if (hasGood && hasService) {
    throw new Error(
      "Item cannot be both a good and a service. Provide only 'good' or 'service', not both."
    );
  }

  // Validar que venga al menos uno
  if (!hasGood && !hasService) {
    throw new Error(
      "Item must be either a good or a service. Please provide either 'good' or 'service' data."
    );
  }

  // Retornar el tipo inferido usando el enum
  return hasGood ? "good" : "service";
}

/**
 * Actualiza un ítem existente y sus datos relacionados (bien o servicio).
 *
 * @param id - ID del ítem a actualizar
 * @param itemDto - Datos base del ítem (incluye type)
 * @param itemType - Tipo de ítem ("good" | "service")
 * @param goodDto - Datos de bien físico (si aplica)
 * @param serviceDto - Datos de servicio (si aplica)
 * @param images - Imágenes del ítem
 * @returns Ítem actualizado con sus datos relacionados
 */
async function updateItem(
  id: number,
  itemDto: NewItem,
  itemType: ItemType,
  goodDto: IGood | undefined,
  serviceDto: IService | undefined,
  images: (string | File)[] | undefined
) {
  return await db.transaction(async (tx) => {
    // Actualizar datos base del ítem
    const [record] = await tx
      .update(item)
      .set(itemDto)
      .where(eq(item.id, id))
      .returning();

    let detailRecord: IGood | IService;

    switch (itemType) {
      case "good": {
        const [goodRecord] = await tx
          .update(inventoryItem)
          .set(goodDto!)
          .where(eq(inventoryItem.itemId, id))
          .returning({
            uomId: inventoryItem.uomId,
            minStock: inventoryItem.minStock,
            maxStock: inventoryItem.maxStock,
            reorderPoint: inventoryItem.reorderPoint,
          });
        detailRecord = goodRecord;
        break;
      }

      case "service": {
        const [serviceRecord] = await tx
          .update(service)
          .set(serviceDto!)
          .where(eq(service.itemId, id))
          .returning({
            durationMinutes: service.durationMinutes,
            isRecurring: service.isRecurring,
          });
        detailRecord = serviceRecord;
        break;
      }

      default: {
        const _exhaustive: never = itemType;
        throw new Error(`Unsupported item type: ${_exhaustive}`);
      }
    }

    // Manejar imágenes
    const finalRecord = await handleImages(tx, record, images);

    return itemType === "good"
      ? { ...finalRecord, good: detailRecord as IGood }
      : { ...finalRecord, service: detailRecord as IService };
  });
}

/**
 * Inserta un nuevo ítem y sus datos relacionados (bien o servicio).
 *
 * @param itemDto - Datos base del ítem (incluye type)
 * @param itemType - Tipo de ítem ("good" | "service")
 * @param goodDto - Datos de bien físico (si aplica)
 * @param serviceDto - Datos de servicio (si aplica)
 * @param images - Imágenes del ítem
 * @returns Ítem creado con sus datos relacionados
 */
async function insertItem(
  itemDto: NewItem,
  itemType: ItemType,
  goodDto: IGood | undefined,
  serviceDto: IService | undefined,
  images: (string | File)[] | undefined
) {
  return await db.transaction(async (tx) => {
    // Insertar datos base del ítem
    const [record] = await tx.insert(item).values(itemDto).returning();

    let detailRecord: IGood | IService;

    switch (itemType) {
      case "good": {
        const [goodRecord] = await tx
          .insert(inventoryItem)
          .values({ itemId: record.id, ...goodDto! })
          .returning({
            uomId: inventoryItem.uomId,
            minStock: inventoryItem.minStock,
            maxStock: inventoryItem.maxStock,
            reorderPoint: inventoryItem.reorderPoint,
          });
        detailRecord = goodRecord;
        break;
      }

      case "service": {
        const [serviceRecord] = await tx
          .insert(service)
          .values({ itemId: record.id, ...serviceDto! })
          .returning({
            durationMinutes: service.durationMinutes,
            isRecurring: service.isRecurring,
          });
        detailRecord = serviceRecord;
        break;
      }

      default: {
        const _exhaustive: never = itemType;
        throw new Error(`Unsupported item type: ${_exhaustive}`);
      }
    }

    // Manejar imágenes
    const finalRecord = await handleImages(tx, record, images);

    return itemType === "good"
      ? { ...finalRecord, good: detailRecord as IGood }
      : { ...finalRecord, service: detailRecord as IService };
  });
}

/**
 * Maneja la subida de imágenes si es necesario.
 */
async function handleImages(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  record: Item,
  images: (string | File)[] | undefined
): Promise<Item> {
  if (!images?.length || areArraysEqual(record.images as string[], images)) {
    return record;
  }

  const imgs = await Promise.all(
    images.map((file) => {
      if (typeof file === "string") {
        return Promise.resolve(file);
      }
      return BlobStorage.uploadFile(`catalogs/item/${record.id}`, file);
    })
  );

  await tx.update(item).set({ images: imgs }).where(eq(item.id, record.id));
  record.images = imgs;

  return record;
}

/**
 * Compara dos arrays para verificar si son iguales.
 */
function areArraysEqual(a: string[], b: (string | File)[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

/**
 * Tipo inferido del resultado de upsertItem.
 */
export type IUpsertItem = Awaited<ReturnType<typeof upsertItem>>;

export type { Item, NewItem, ItemType };

// Re-exportar DTOs compartidos con frontend
export type {
  IGood,
  IService,
  IItemGood,
  IItemService,
  IItem,
  IItemRecord,
  ListItemsParams,
  ListItemItem,
  ListItemsResult,
} from "#utils/dto/catalogs/item";
