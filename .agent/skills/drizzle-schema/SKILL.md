---
name: drizzle-schema-generator
description: Usa este skill cuando el usuario pida crear una nueva tabla, modelo o esquema en Drizzle ORM para PostgreSQL.
---

# Generador de Esquemas Drizzle ORM

Este skill define las convenciones para crear modelos/esquemas en Drizzle ORM dentro del proyecto `agape.js`.

## Ubicación de Archivos

Todos los modelos deben residir en `<root>/models/[módulo]/[entidad].ts`.

## Estructura del Archivo

```typescript
import { schema } from "../schema";
import {
  serial,
  varchar,
  boolean,
  integer,
  // ... otros tipos necesarios
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { decimal } from "../../lib/db/custom-types"; // Para valores Decimal

/**
 * [Descripción de la entidad en español]
 */
export const miEntidad = schema.table(
  "modulo_entidad", // Formato: modulo_entidad en snake_case
  {
    // Columnas aquí
  },
  (table) => [
    // Índices aquí
  ]
);

export type MiEntidad = InferSelectModel<typeof miEntidad>;
export type NewMiEntidad = InferInsertModel<typeof miEntidad>;

export default miEntidad;
```

## Convenciones de Nomenclatura

### Nombres de Tablas
- Formato: `modulo_entidad` en `snake_case`
- Ejemplo: `catalogs_item`, `finance_payment`, `hr_employee`

### Nombres de Columnas (PostgreSQL)
- **SIEMPRE** usar `snake_case` en la base de datos
- Mapear a `camelCase` en TypeScript

```typescript
// ✅ CORRECTO
fullName: varchar("full_name", { length: 80 }).notNull(),
isEnabled: boolean("is_enabled").notNull(),
createdAt: timestamp("created_at").notNull(),

// ❌ INCORRECTO
fullName: varchar("fullName", { length: 80 }), // NO usar camelCase en DB
```

## Primary Keys

**REGLA:** Para PostgreSQL 10+, preferir `serial` para simplicidad a menos que se requiera `identity`:

```typescript
// ✅ Opción estándar (recomendada para este proyecto)
id: serial("id").primaryKey(),

// ✅ Alternativa con identity (para casos especiales)
id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
```

## Timestamps Obligatorios

Si la entidad requiere auditoría, incluir:

```typescript
import { timestamp } from "drizzle-orm/pg-core";

// En el objeto de columnas:
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
```

> **Nota:** No todas las tablas del proyecto requieren timestamps. Evalúa si la entidad necesita auditoría antes de agregarlos.

## Tipos Personalizados

### Decimal (para montos y precisión)
```typescript
import { decimal } from "../../lib/db/custom-types";

basePrice: decimal("base_price").notNull(),
amount: decimal("amount").notNull(),
```

### Referencias a Otras Tablas
```typescript
import { integer } from "drizzle-orm/pg-core";
import { category } from "./category";

categoryId: integer("category_id").references(() => category.id, {
  onDelete: "set null",
}),
```

### Opciones de onDelete
- `"cascade"` - Eliminar registros relacionados
- `"set null"` - Establecer a NULL (columna debe ser nullable)
- `"restrict"` - Impedir eliminación (default)

## Enums

Definir enums en un archivo separado o en `./enums.ts`:

```typescript
// models/catalogs/enums.ts
import { schema } from "../schema";
import { pgEnum } from "drizzle-orm/pg-core";

export const itemTypeEnum = schema.enum("catalogs_item_type", [
  "good",
  "service",
]);

export type ItemType = (typeof itemTypeEnum.enumValues)[number];
export const ITEM_TYPE_VALUES = itemTypeEnum.enumValues;
```

```typescript
// En el modelo
import { itemTypeEnum } from "./enums";

type: itemTypeEnum("type").notNull(),
```

## Índices

```typescript
import { uniqueIndex, index } from "drizzle-orm/pg-core";

// Índice único
uniqueIndex("ux_catalogs_item_code").on(table.code),

// Índice simple
index("ix_catalogs_item_category").on(table.categoryId),

// Índice compuesto
index("ix_sales_order_customer_date").on(table.customerId, table.orderDate),
```

### Convención de Nombres de Índices
- Único: `ux_[tabla]_[columnas]`
- Simple: `ix_[tabla]_[columnas]`

## JSONB

```typescript
import { jsonb } from "drizzle-orm/pg-core";

// Para arrays u objetos complejos
images: jsonb("images").notNull(),
metadata: jsonb("metadata"),
```

## Ejemplo Completo

```typescript
import { schema } from "../schema";
import {
  serial,
  varchar,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { decimal } from "../../lib/db/custom-types";
import { itemTypeEnum } from "./enums";
import { category } from "./category";

/**
 * Maestro de ítems (Item)
 * Representa cualquier ítem vendible/comprable: producto, servicio, etc.
 */
export const item = schema.table(
  "catalogs_item",
  {
    /** Identificador único del ítem */
    id: serial("id").primaryKey(),

    /** Código interno / SKU del ítem (único) */
    code: varchar("code", { length: 50 }).notNull(),

    /** Nombre completo del ítem */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Tipo de ítem */
    type: itemTypeEnum("type").notNull(),

    /** Indica si el ítem está habilitado */
    isEnabled: boolean("is_enabled").notNull(),

    /** Precio base del ítem */
    basePrice: decimal("base_price").notNull(),

    /** Categoría asociada (opcional) */
    categoryId: integer("category_id").references(() => category.id, {
      onDelete: "set null",
    }),

    /** Imágenes del ítem en formato JSON */
    images: jsonb("images").notNull(),
  },
  (table) => [
    uniqueIndex("ux_catalogs_item_code").on(table.code),
  ]
);

export type Item = InferSelectModel<typeof item>;
export type NewItem = InferInsertModel<typeof item>;

export default item;
```

## Restricciones

- ❌ **NO** borrar esquemas existentes sin confirmación explícita del usuario
- ❌ **NO** usar `Date` ni `Date | string` en tipos - usar tipos de Drizzle directamente
- ❌ **NO** usar `number` para campos monetarios - usar `decimal` custom type
- ❌ **NO** crear migraciones automáticamente - el usuario las genera con `pnpm drizzle-kit generate`
