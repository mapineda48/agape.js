import { db } from "#lib/db";
import {
  product,
  type NewProduct,
  type Product,
} from "#models/inventory/product";
import { category } from "#models/inventory/category";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";

/**
 * Obtiene un producto por su ID.
 * @param id Identificador único del producto
 * @returns Producto encontrado o undefined si no existe
 */
export async function getProductById(id: number) {
  const [match] = await db.select().from(product).where(eq(product.id, id));

  return match;
}

/**
 * Parámetros para listar productos con filtros y paginación.
 */
export interface ListProductsParams {
  /** Filtro por nombre (búsqueda parcial insensible a mayúsculas) */
  fullName?: string;
  /** Filtro por estado activo/inactivo */
  isActive?: boolean;
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
 * Producto en lista con nombre de categoría.
 */
export interface ListProductItem {
  id: number;
  fullName: string;
  isActive: boolean;
  price: Decimal;
  category: string;
  inventory: number;
  images: unknown;
  rating: number;
}

/**
 * Resultado de listado de productos.
 */
export interface ListProductsResult {
  products: ListProductItem[];
  totalCount?: number;
}

/**
 * Lista productos con filtros opcionales y paginación.
 * @param params Parámetros de filtrado y paginación
 * @returns Lista de productos y opcionalmente el conteo total
 */
export async function listProducts(
  params: ListProductsParams = {}
): Promise<ListProductsResult> {
  const {
    fullName,
    isActive,
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
    conditions.push(sql`${product.fullName} ILIKE ${`%${fullName}%`}`);
  }

  if (isActive !== undefined) {
    conditions.push(eq(product.isActive, isActive));
  }

  if (categoryId !== undefined) {
    conditions.push(eq(product.categoryId, categoryId));
  }

  if (minPrice !== undefined) {
    conditions.push(gte(product.price, minPrice));
  }

  if (maxPrice !== undefined) {
    conditions.push(lte(product.price, maxPrice));
  }

  if (rating !== undefined) {
    conditions.push(gte(product.rating, rating));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const queryProducts = db
    .select({
      id: product.id,
      fullName: product.fullName,
      isActive: product.isActive,
      price: product.price,
      category: category.fullName,
      inventory: product.id, // Placeholder - ajustar según modelo real
      images: product.images,
      rating: product.rating,
    })
    .from(product)
    .innerJoin(category, eq(product.categoryId, category.id))
    .where(whereClause)
    .orderBy(product.id)
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  if (!includeTotalCount) {
    const products = await queryProducts;
    return { products };
  }

  const queryCount = db
    .select({ totalCount: count() })
    .from(product)
    .where(whereClause);

  const [products, [{ totalCount }]] = await Promise.all([
    queryProducts,
    queryCount,
  ]);

  return { products, totalCount };
}

/**
 * Payload para crear o actualizar un producto.
 */
export type UpsertProductPayload = Omit<NewProduct, "images"> & {
  id?: number;
  images: (string | File)[];
};

/**
 * Inserta o actualiza un producto junto con sus imágenes.
 * @param data Datos del producto a insertar o actualizar
 * @returns El producto insertado o actualizado
 */
export async function upsertProduct(
  data: UpsertProductPayload
): Promise<Product> {
  const { id, images, ...rest } = data;

  // Upsert principal
  const [record] = await db
    .insert(product)
    .values({
      ...(id !== undefined && { id }),
      ...rest,
      images: [],
    })
    .onConflictDoUpdate({
      target: product.id,
      set: {
        ...rest,
      },
    })
    .returning();

  if (areArraysEqual(record.images as string[], images) || !images.length) {
    return record;
  }

  const imgs = await Promise.all(
    images.map((file) => {
      if (typeof file === "string") {
        return Promise.resolve(file);
      }

      return BlobStorage.uploadFile(`inventory/product/${record.id}`, file);
    })
  );

  await db
    .update(product)
    .set({ images: imgs })
    .where(eq(product.id, record.id));
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

export type { Product, NewProduct };
