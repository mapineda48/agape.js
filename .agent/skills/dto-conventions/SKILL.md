---
name: dto-conventions
description: Usa este skill cuando el usuario pida crear o modificar DTOs (Data Transfer Objects) que se comparten entre backend y frontend.
---

# Convenciones de DTOs (Data Transfer Objects)

Este skill define las convenciones para crear DTOs compartidos entre backend (`svc`) y frontend (`web`).

## Ubicación de Archivos

Todos los DTOs deben residir en `lib/utils/dto/[módulo]/[entidad].ts`.

## Arquitectura de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                      lib/utils/dto                          │
│                  (Tipos puros, sin lógica)                  │
│                                                             │
│  ✅ Puede usar: Decimal, DateTime (de lib/utils/data)       │
│  ❌ NO puede usar: #models, #lib/db, drizzle, etc.          │
└─────────────────────────────────────────────────────────────┘
                           ▲
              ┌────────────┴────────────┐
              │                         │
     ┌────────┴────────┐       ┌───────┴───────┐
     │      svc        │       │     web       │
     │   (Backend)     │       │  (Frontend)   │
     │                 │       │               │
     │ Importa DTOs    │       │ Importa DTOs  │
     │ vía #utils      │       │ vía @utils    │
     └─────────────────┘       └───────────────┘
```

## Estructura del Archivo

```typescript
// lib/utils/dto/modulo/entidad.ts

import type Decimal from "../../data/Decimal";
import type DateTime from "../../data/DateTime";

/**
 * Tipo/Enum para la entidad.
 */
export type MiTipo = "opcion1" | "opcion2";

/**
 * Valores válidos para validación en runtime.
 */
export const MI_TIPO_VALUES: readonly MiTipo[] = ["opcion1", "opcion2"];

/**
 * Interfaz base de la entidad.
 */
export interface IMiEntidadBase {
  /** Identificador (opcional para creación) */
  id?: number;
  
  /** Nombre completo */
  fullName: string;
  
  /** Precio */
  basePrice: Decimal;
  
  /** Fecha de creación */
  createdAt?: DateTime;
  
  /** Está habilitado */
  isEnabled: boolean;
}

/**
 * DTO para crear/actualizar.
 */
export interface IMiEntidadInput extends IMiEntidadBase {
  // Campos adicionales específicos de input
}

/**
 * DTO de respuesta (lo que devuelve el servicio).
 */
export interface IMiEntidadRecord extends IMiEntidadBase {
  id: number; // Obligatorio en respuesta
  createdAt: DateTime;
}

/**
 * Parámetros para listado con filtros y paginación.
 */
export interface ListParams {
  search?: string;
  isEnabled?: boolean;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  pageIndex?: number;
  pageSize?: number;
  includeTotalCount?: boolean;
}

/**
 * Resultado del listado.
 */
export interface ListResult {
  items: IMiEntidadRecord[];
  totalCount?: number;
}
```

## Tipos de Datos Obligatorios

### ⚠️ REGLA: Siempre usar DateTime y Decimal

```typescript
// ✅ CORRECTO
import type DateTime from "../../data/DateTime";
import type Decimal from "../../data/Decimal";

interface CreateInvoiceInput {
  issueDate?: DateTime;           // Siempre DateTime
  dueDate?: DateTime | null;      // DateTime o null
  totalAmount: Decimal;           // Siempre Decimal para montos
}

// ❌ INCORRECTO - NO USAR
interface CreateInvoiceInput {
  issueDate?: Date;               // ❌ Date nativo
  issueDate?: string;             // ❌ string
  issueDate?: Date | string;      // ❌ Unión con Date
  totalAmount: number;            // ❌ number para montos
}
```

## Tipos Discriminados (Exclusión Mutua)

Usar `never` para tipos discriminados:

```typescript
/**
 * Datos de un bien físico.
 */
export interface IGood {
  uomId: number;
  minStock?: Decimal | null;
  maxStock?: Decimal | null;
}

/**
 * Datos de un servicio.
 */
export interface IService {
  durationMinutes?: number | null;
  isRecurring?: boolean;
}

/**
 * DTO para crear un bien físico.
 */
export interface IItemGood extends IItemBase {
  good: IGood;
  service?: never;  // ← Exclusión mutua
}

/**
 * DTO para crear un servicio.
 */
export interface IItemService extends IItemBase {
  service: IService;
  good?: never;     // ← Exclusión mutua
}

/**
 * Unión discriminada.
 */
export type IItem = IItemGood | IItemService;
```

## Índice del Módulo

Crear `lib/utils/dto/[módulo]/index.ts`:

```typescript
// lib/utils/dto/catalogs/index.ts
export * from "./item";
export * from "./category";
export * from "./subcategory";
```

## Uso en Servicios (Backend)

```typescript
// svc/modulo/entidad.ts

// Importar DTOs
import type {
  IMiEntidadInput,
  IMiEntidadRecord,
  ListParams,
  ListResult,
} from "#utils/dto/modulo/entidad";

// Implementar funciones
export async function upsert(payload: IMiEntidadInput): Promise<IMiEntidadRecord> {
  // ...
}

// Re-exportar DTOs al final del archivo
export type {
  IMiEntidadInput,
  IMiEntidadRecord,
  ListParams,
  ListResult,
} from "#utils/dto/modulo/entidad";
```

## Uso en Frontend

```typescript
// web/app/cms/modulo/page.tsx

// Importar tipos desde utils
import type { IMiEntidadRecord, ListParams } from "@utils/dto/modulo/entidad";

// O desde el servicio (también los re-exporta)
import type { IMiEntidadRecord } from "@agape/modulo/entidad";
```

## Mocks para Tests

Crear mock correspondiente en `web/test/mocks/[módulo]/[entidad].ts`:

```typescript
// web/test/mocks/modulo/entidad.ts
import { vi } from "vitest";

// Re-exportar DTOs para uso en tests
export type {
  IMiEntidadInput,
  IMiEntidadRecord,
  ListParams,
  ListResult,
} from "@utils/dto/modulo/entidad";

// Constantes también disponibles
export { MI_TIPO_VALUES } from "@utils/dto/modulo/entidad";

// Mocks de funciones del servicio
export const getById = vi.fn();
export const list = vi.fn();
export const upsert = vi.fn();
```

## Agregar Alias en Vitest Config

```typescript
// vitest.config.ts - En el proyecto frontend
"@agape/modulo/entidad": path.resolve(__dirname, "./web/test/mocks/modulo/entidad.ts"),
```

## Documentación con JSDoc

```typescript
/**
 * Tipo de ítem disponible en el catálogo.
 * 
 * @description
 * - `good`: Bien físico inventariable
 * - `service`: Servicio no inventariable
 */
export type ItemType = "good" | "service";

/**
 * DTO para crear/actualizar un ítem.
 * 
 * @example
 * ```typescript
 * const newItem: IItemGood = {
 *   code: "PROD-001",
 *   fullName: "Mi Producto",
 *   basePrice: new Decimal("100.00"),
 *   isEnabled: true,
 *   good: { uomId: 1 },
 * };
 * ```
 */
export interface IItemGood extends IItemBase {
  // ...
}
```

## Checklist para Nuevos DTOs

- [ ] Crear archivo en `lib/utils/dto/[módulo]/[entidad].ts`
- [ ] Documentar interfaces con JSDoc
- [ ] **NO** importar nada de `#models`, `#lib/db`, `drizzle`
- [ ] **⚠️ Usar `DateTime` para TODOS los campos de fecha**
- [ ] **⚠️ Usar `Decimal` para TODOS los montos**
- [ ] Exportar desde `lib/utils/dto/[módulo]/index.ts`
- [ ] Importar en servicio con `#utils/dto/...`
- [ ] Re-exportar desde el servicio
- [ ] Crear mock en `web/test/mocks/[módulo]/[entidad].ts`
- [ ] Agregar alias en `vitest.config.ts`

## Restricciones

- ❌ **NO** importar dependencias de Drizzle ni modelos de BD
- ❌ **NO** usar `Date` nativo - siempre `DateTime`
- ❌ **NO** usar `number` para montos - siempre `Decimal`
- ❌ **NO** crear lógica compleja - solo tipos puros
