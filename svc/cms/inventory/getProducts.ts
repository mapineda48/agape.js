import { db } from "#lib/db";
import { product } from "#models/inventory/product";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { category } from "#models/inventory/category";
import Decimal from "#utils/data/Decimal";

export default async function getProducts(
  params: GetProductsParams
): Promise<GetProductsResult> {
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
    // Usamos ILIKE directamente en SQL para insensibilidad a mayúsculas/minúsculas
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

  // Consulta de productos
  const queryProducts = db
    .select({
      id: product.id,
      fullName: product.fullName,
      isActive: product.isActive,
      price: product.price,
      category: category.fullName,
      inventory: product.id, // Ajusta si tienes un campo real de inventario
      images: product.images,
      rating: product.rating,
    })
    .from(product)
    .innerJoin(category, eq(product.categoryId, category.id))
    .where(whereClause)
    .orderBy(product.id)
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  // Si no se requiere totalCount, devolvemos solo los productos
  if (!includeTotalCount) {
    const products = await queryProducts;
    return {
      products,
    };
  }

  // Consulta de totalCount solo si se requiere
  const queryCount = db
    .select({ totalCount: count() })
    .from(product)
    .where(whereClause);

  // Ejecutar ambas consultas en paralelo
  // Esto mejora el rendimiento al evitar esperar una consulta antes de la otra
  // y permite que ambas se ejecuten simultáneamente.
  const [products, [{ totalCount }]] = await Promise.all([
    queryProducts,
    queryCount,
  ]);

  return {
    products,
    totalCount,
  };
}

/**
 * Types
 */

export interface GetProductsParams {
  fullName?: string;
  isActive?: boolean;
  categoryId?: number;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  rating?: number;
  includeTotalCount?: boolean; // más claro que "count"
  pageIndex?: number;
  pageSize?: number;
}

export interface GetProduct {
  id: number;
  fullName: string;
  isActive: boolean;
  price: Decimal; // o number, según tu modelo
  category: string; // o el tipo adecuado según tu modelo
  inventory: number;
  images: unknown;
  rating: number;
}

export interface GetProductsResult {
  products: GetProduct[];
  totalCount?: number; // solo presente si includeTotalCount === true
}
