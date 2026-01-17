---
name: service-layer-architecture
description: Usa este skill cuando el usuario pida crear o modificar un servicio de negocio en la capa svc/. Define la arquitectura y convenciones de servicios backend.
---

# Arquitectura de Capa de Servicios

Este skill define las convenciones para crear servicios de negocio en `agape.js`.

## Ubicación de Archivos

Todos los servicios deben residir en `<root>/svc/[módulo]/[entidad].ts`.

## Filosofía: Lógica de Negocio, No CRUD

El servicio es el **coordinador del proceso**, no un pasamanos de datos.

### Lo que NO hacemos (Anti-patrones)

```typescript
// ❌ NO validar campos obligatorios - es responsabilidad de NOT NULL
if (!payload.name) throw new Error("Name required");

// ❌ NO verificar duplicados - es responsabilidad de UNIQUE INDEX
const exists = await db.select().from(table).where(eq(table.code, payload.code));
if (exists.length) throw new Error("Duplicado");

// ❌ NO capturar errores de SQL genéricamente - agape.js los traduce
try { ... } catch (e) { ... }
```

### Lo que SÍ hacemos

```typescript
// ✅ Validar reglas de estado y proceso
if (order.status === "shipped") {
  throw new Error("No se puede modificar una orden ya despachada");
}

// ✅ Validar vigencias y relaciones de negocio
if (priceList.validUntil.isBefore(new DateTime())) {
  throw new Error("La lista de precios ha expirado");
}

// ✅ Validar permisos específicos de negocio
if (!user.canAccessBranch(branchId)) {
  throw new Error("Sin acceso a esta sucursal");
}
```

## Estructura Canónica

```typescript
import { db } from "#lib/db";
import { miEntidad, type MiEntidad, type NewMiEntidad } from "#models/modulo/entidad";
import { eq, and, sql } from "drizzle-orm";
import Decimal from "#utils/data/Decimal";
import DateTime from "#utils/data/DateTime";

// DTOs compartidos con el frontend
import type { IMiDTO, ListParams, ListResult } from "#utils/dto/modulo/entidad";

// ============================================================================
// Errores de Negocio
// ============================================================================

export class MiBusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MiBusinessError";
  }
}

// ============================================================================
// Funciones de Servicio
// ============================================================================

/**
 * [Descripción de la función]
 *
 * @param id - Identificador del registro
 * @returns Registro encontrado o undefined
 * @permission modulo.entidad.read
 */
export async function getById(id: number): Promise<MiEntidad | undefined> {
  const [record] = await db.select().from(miEntidad).where(eq(miEntidad.id, id));
  return record;
}

/**
 * Inserta o actualiza un registro.
 *
 * @param payload - Datos del registro
 * @returns Registro creado o actualizado
 * @permission modulo.entidad.manage
 */
export async function upsert(payload: IMiDTO): Promise<MiEntidad> {
  // 1. Validar reglas de negocio (no duplicados ni nulls)
  await validateBusinessRules(payload);

  // 2. Preparar DTO
  const dto: NewMiEntidad = {
    ...payload,
    // Transformaciones si necesario
  };

  // 3. Persistir
  if (typeof payload.id === "number") {
    const [updated] = await db
      .update(miEntidad)
      .set(dto)
      .where(eq(miEntidad.id, payload.id))
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(miEntidad).values(dto).returning();
  return inserted;
}

// Re-exportar DTOs compartidos con frontend
export type { IMiDTO, ListParams, ListResult } from "#utils/dto/modulo/entidad";
```

## Tipos de Datos Obligatorios

### DateTime

```typescript
import DateTime from "#utils/data/DateTime";

// ✅ El payload ya contiene DateTime - usar directamente
const issueDate = payload.issueDate ?? new DateTime();

// ✅ Para insertar en BD, convertir a string si necesario
const dateStr = issueDate.toISOString().split("T")[0];

// ✅ Operaciones con fechas
const dueDate = issueDate.addDays(30);
if (expiration.isBefore(new DateTime())) {
  throw new Error("Fecha expirada");
}
```

### Decimal

```typescript
import Decimal from "#utils/data/Decimal";

// ✅ Crear instancias
const price = new Decimal("100.00");
const quantity = new Decimal(5);

// ✅ Operaciones precisas
const subtotal = price.mul(quantity);     // 500.00
const withTax = subtotal.mul(1.19);       // 595.00

// ✅ Comparaciones
if (total.lte(0)) throw new Error("Monto inválido");
if (total.gt(budget)) throw new Error("Excede presupuesto");
```

## Uso de Transacciones

Usar `db.transaction` cuando:
1. Hay operaciones compuestas (cabecera + detalles)
2. Se requiere consistencia entre lecturas y escrituras
3. Se modifican múltiples entidades

```typescript
export async function createOrder(payload: IOrderDTO) {
  return await db.transaction(async (tx) => {
    // 1. Insertar cabecera
    const [order] = await tx.insert(orders).values(headerDto).returning();

    // 2. Insertar detalles
    const details = await tx.insert(orderItems).values(
      payload.items.map((item) => ({ orderId: order.id, ...item }))
    ).returning();

    // 3. Actualizar inventario
    for (const item of details) {
      await tx
        .update(inventory)
        .set({ quantity: sql`quantity - ${item.quantity}` })
        .where(eq(inventory.itemId, item.itemId));
    }

    return { ...order, items: details };
  });
}
```

## Permisos con @permission

Documentar permisos en JSDoc:

```typescript
/**
 * Lista todos los ítems.
 *
 * @permission catalogs.item.read
 */
export async function listItems() { ... }

/**
 * Crea o actualiza un ítem.
 *
 * @permission catalogs.item.manage
 */
export async function upsertItem(payload: IItem) { ... }
```

## Imports Backend

```typescript
// Database
import { db } from "#lib/db";

// Models
import { miEntidad } from "#models/modulo/entidad";

// Utilities
import Decimal from "#utils/data/Decimal";
import DateTime from "#utils/data/DateTime";

// DTOs
import type { IMiDTO } from "#utils/dto/modulo/entidad";

// Drizzle Operators
import { eq, and, or, sql, count, gte, lte } from "drizzle-orm";

// Session (si necesario)
import { session } from "#session";

// Logger
import log from "#logger";
```

## Paginación y Filtros

```typescript
export interface ListParams {
  search?: string;
  isEnabled?: boolean;
  pageIndex?: number;
  pageSize?: number;
  includeTotalCount?: boolean;
}

export interface ListResult<T> {
  items: T[];
  totalCount?: number;
}

export async function list(params: ListParams = {}): Promise<ListResult<Item>> {
  const {
    search,
    isEnabled,
    pageIndex = 0,
    pageSize = 10,
    includeTotalCount = false,
  } = params;

  const conditions = [];

  if (search) {
    conditions.push(sql`${table.name} ILIKE ${`%${search}%`}`);
  }

  if (isEnabled !== undefined) {
    conditions.push(eq(table.isEnabled, isEnabled));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const query = db
    .select()
    .from(table)
    .where(whereClause)
    .orderBy(table.id)
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  if (!includeTotalCount) {
    const items = await query;
    return { items };
  }

  const countQuery = db.select({ count: count() }).from(table).where(whereClause);
  const [items, [{ count: totalCount }]] = await Promise.all([query, countQuery]);

  return { items, totalCount };
}
```

## Restricciones

- ❌ **NO** usar `Date` nativo - siempre `DateTime`
- ❌ **NO** usar `number` para montos - siempre `Decimal`
- ❌ **NO** crear helpers de conversión - el RPC ya lo hace
- ❌ **NO** duplicar validaciones de BD (nulls, uniques, FKs)
- ❌ **NO** usar try/catch genéricos para errores SQL
