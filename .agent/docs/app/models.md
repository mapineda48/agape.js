# Modelos de Datos - Agape.js

Este documento describe la arquitectura de modelos en el proyecto Agape.js, las convenciones de diseño y cómo implementar nuevas entidades.

## Tabla de Contenidos

1. [Introduccion](#introduccion)
2. [Arquitectura General](#arquitectura-general)
3. [Patron Class Table Inheritance (CTI)](#patron-class-table-inheritance-cti)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Tipos de Datos Personalizados](#tipos-de-datos-personalizados)
6. [Convenciones de Codigo](#convenciones-de-codigo)
7. [Ejemplos Practicos](#ejemplos-practicos)
8. [Guia para Crear Nuevos Modelos](#guia-para-crear-nuevos-modelos)

---

## Introduccion

### El Problema: Mapear Herencia OOP a SQL

En Programacion Orientada a Objetos modelamos el mundo con herencia:

```
class User
class Person extends User
class Company extends User
```

Las bases de datos relacionales no entienden de clases ni herencia; solo entienden **tablas, filas y relaciones**. El reto es:

> **Como representar jerarquias de herencia de OOP en una base de datos relacional?**

Existen tres patrones principales para resolver esto:

| Patron                             | Descripcion                                            | Uso en Agape.js      |
| ---------------------------------- | ------------------------------------------------------ | -------------------- |
| **Table-per-Hierarchy (TPH)**      | Una sola tabla con campos opcionales para cada subtipo | No usado             |
| **Table-per-Concrete-Class (TPC)** | Una tabla por tipo concreto, sin tabla padre           | No usado             |
| **Class Table Inheritance (CTI)**  | Tabla base + tablas de detalle por subtipo             | **Patron principal** |

Agape.js utiliza **Class Table Inheritance (CTI)** como patron principal porque:

- Reutiliza identidad y datos comunes en la tabla maestra
- Permite extender el dominio con nuevos tipos sin duplicar estructuras
- Mantiene integridad referencial estricta
- Evita campos nulos innecesarios

---

## Arquitectura General

### The Pattern

- **Master Table (`user`):** Contains shared identity, authentication data, and the discriminator column (`type`).
- **Detail Tables (`person`, `company`):** Contain specific attributes.
- **Identity Rule:** The Primary Key (PK) of the detail table is **also** a Foreign Key (FK) to the master table.

## 2. Domain-Driven Organization (Domains First)

**Principle: Domains First, Tables Later.** Do not pollute the root `models/` folder. New entities must live under a well-defined functional domain.

### Directory Structure

- **Core (`models/*.ts`):** Only for essential, cross-cutting application entities (e.g., `user`, `person`, `company`, `agape` config).
- **Domains (`models/<domain>/*.ts`):** All business logic specific to a module (e.g., `models/logistics/shipment.ts`, `models/invoicing/invoice.ts`).

### Decision Priority (Strict)

Before creating a table, the Agent must validate:

1.  **Domain Check:** Does this concept fit into an existing or new functional domain? -> **Put in `models/<domain>/`.**
2.  **Extension Check:** Should this extend an existing Master entity via CTI? -> **Implement CTI.**
3.  **Loose Table:** Only if it is a core system concept does it go into the root `models/`.

### Esquema de Base de Datos

Todos los modelos se definen bajo un esquema de PostgreSQL configurable:

```typescript
// models/schema.ts
import Schema from "../lib/db/schema";

export const schema = Schema.tenantSchema;
export default schema;
```

El esquema se configura en tiempo de ejecucion mediante `Schema.setSchemaName()`. Esto permite aislar los datos en diferentes esquemas si fuera necesario.

### Drizzle ORM

Agape.js utiliza [Drizzle ORM](https://orm.drizzle.team/) para la definicion de modelos. Drizzle proporciona:

- Definicion de esquemas con TypeScript
- Inferencia automatica de tipos
- Relaciones declarativas
- Migraciones type-safe

---

## Patron Class Table Inheritance (CTI)

### Concepto

CTI divide la jerarquia de clases en tablas relacionadas:

```
+--------+          +----------+
|  user  |<---------|  person  |
+--------+    1:1   +----------+
     ^
     |
     |    1:1   +----------+
     +----------|  company |
                +----------+
```

- **Tabla maestra (`user`)**: Contiene los datos comunes a todas las entidades
- **Tablas de detalle (`person`, `company`)**: Contienen datos especificos del subtipo
- **Clave primaria compartida**: La PK de la tabla de detalle ES tambien la FK a la tabla maestra

### Implementacion en Codigo

**Tabla maestra (user.ts:45-113):**

```typescript
export const user = schema.table("user", {
  id: serial("id").primaryKey(),
  type: userTypeEnum("user_type").notNull(), // Discriminador: "person" | "company"
  documentTypeId: integer("document_type_id")
    .notNull()
    .references(() => documentType.id, { onDelete: "restrict" }),
  documentNumber: varchar("document_number", { length: 30 }).notNull(),
  // ... campos comunes
});
```

**Tabla de detalle (person.ts:26-44):**

```typescript
export const person = schema.table("person", {
  // La PK es FK a user - NO es serial
  id: integer("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  birthdate: dateTime("birthdate"),
});
```

### Puntos Clave del CTI

1. **El `id` de la tabla de detalle NO es `serial`**: Se hereda del registro padre
2. **La FK usa `onDelete: "restrict"`**: Evita borrar el padre si existe el detalle
3. **El campo `type` en la tabla maestra**: Actua como discriminador para saber que tabla de detalle consultar
4. **Las relaciones se definen en la tabla hija**: La tabla hija tiene la FK, por lo tanto define la relacion

---

## Estructura de Archivos

```
models/
├── schema.ts           # Esquema base de PostgreSQL
├── enums.ts            # Enums de base de datos (tipos de usuario, direccion, contacto)
├── user.ts             # Tabla maestra del patron CTI
├── person.ts           # Detalle CTI: persona natural
├── company.ts          # Detalle CTI: persona juridica
├── documentType.ts     # Catalogo: tipos de documento de identidad
├── address.ts          # Direcciones + tabla pivote user_address
├── contactMethod.ts    # Metodos de contacto (email, telefono, etc.)
├── companyContact.ts   # Relacion empresa-persona (contactos de empresa)
└── agape.ts            # Configuraciones key-value
```

### Organizacion por Tipo de Entidad

| Tipo               | Descripcion                      | Ejemplos                        |
| ------------------ | -------------------------------- | ------------------------------- |
| **Entidades Core** | Tablas fundamentales del sistema | `user`, `person`, `company`     |
| **Catalogos**      | Tablas de referencia/lookup      | `documentType`                  |
| **Relaciones**     | Tablas pivote many-to-many       | `userAddress`, `companyContact` |
| **Configuracion**  | Tablas de parametros del sistema | `agape`                         |

---

## Tipos de Datos Personalizados

Agape.js define tipos personalizados en `lib/db/custom-types.ts` para garantizar consistencia y precision.

### DateTime

**OBLIGATORIO** para todos los campos de fecha y hora:

```typescript
import { dateTime } from "../lib/db/custom-types";
import DateTime from "../shared/data/DateTime";

createdAt: dateTime("created_at").notNull().default(sql`now()`),
updatedAt: dateTime("updated_at")
  .notNull()
  .default(sql`now()`)
  .$onUpdate(() => new DateTime()),
```

El tipo `DateTime` (de `shared/data/DateTime`) envuelve las fechas con funcionalidades adicionales y se serializa como `timestamp with time zone` en PostgreSQL.

### Decimal

**OBLIGATORIO** para todos los valores monetarios o que requieran precision decimal:

```typescript
import { decimal } from "../lib/db/custom-types";
import Decimal from "../shared/data/Decimal";

price: decimal("price").notNull(),
total: decimal("total").notNull(),
```

El tipo `Decimal` (de `shared/data/Decimal`) utiliza `decimal.js` para evitar errores de punto flotante y se serializa como `numeric(10, 2)` en PostgreSQL.

### AddressSnapshot

Para desnormalizacion controlada en documentos transaccionales:

```typescript
import type { AddressSnapshot } from "../lib/db/custom-types";

// En tablas de facturas, ordenes, etc.
billingAddress: jsonb("billing_address").$type<AddressSnapshot>().notNull(),
shippingAddress: jsonb("shipping_address").$type<AddressSnapshot>(),
```

Los snapshots preservan el estado historico de direcciones en el momento de la transaccion, critico para la integridad legal de documentos.

---

## Convenciones de Codigo

### Definicion de Tablas

```typescript
import { schema } from "./schema";
import { serial, varchar, boolean, integer } from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "../shared/data/DateTime";

/**
 * Modelo de [NombreEntidad]
 * [Descripcion breve de la entidad y su proposito]
 *
 * ## Relaciones
 * - [Describir relaciones con otras tablas]
 */
export const miEntidad = schema.table("mi_entidad", {
  id: serial("id").primaryKey(),

  // Campos de negocio con JSDoc
  /** Descripcion del campo */
  nombre: varchar("nombre", { length: 100 }).notNull(),

  // Campos de control (siempre al final)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: dateTime("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: dateTime("updated_at")
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});
```

### Definicion de Relaciones

```typescript
export const miEntidadRelations = relations(miEntidad, ({ one, many }) => ({
  // Relacion uno-a-uno
  padre: one(tablaPadre, {
    fields: [miEntidad.padreId],
    references: [tablaPadre.id],
  }),
  // Relacion uno-a-muchos
  hijos: many(tablaHija),
}));
```

### Exportacion de Tipos

```typescript
// Tipos inferidos automaticamente
export type MiEntidad = InferSelectModel<typeof miEntidad>;
export type NewMiEntidad = InferInsertModel<typeof miEntidad>;

// Export default de la tabla principal
export default miEntidad;
```

### Nomenclatura

| Elemento                | Convencion       | Ejemplo                               |
| ----------------------- | ---------------- | ------------------------------------- |
| Nombre de tabla (SQL)   | snake_case       | `company_contact`                     |
| Nombre de tabla (TS)    | camelCase        | `companyContact`                      |
| Nombre de columna (SQL) | snake_case       | `created_at`                          |
| Nombre de columna (TS)  | camelCase        | `createdAt`                           |
| Tipos exportados        | PascalCase       | `CompanyContact`, `NewCompanyContact` |
| Enums                   | camelCase + Enum | `userTypeEnum`                        |
| Indices                 | ux_tabla_campo   | `ux_user_document`                    |

---

## Ejemplos Practicos

### Ejemplo 1: Tabla de Catalogo Simple

```typescript
// models/documentType.ts
export const documentType = schema.table(
  "identity_document_type",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 10 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    appliesToPerson: boolean("applies_to_person").notNull(),
    appliesToCompany: boolean("applies_to_company").notNull(),
  },
  (table) => [uniqueIndex("ux_identity_document_type_code").on(table.code)],
);
```

### Ejemplo 2: Tabla Pivote Many-to-Many

```typescript
// models/address.ts - Tabla pivote user_address
export const userAddress = schema.table(
  "user_address",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addressId: integer("address_id")
      .notNull()
      .references(() => address.id, { onDelete: "cascade" }),
    type: addressTypeEnum("address_type").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    label: varchar("label", { length: 100 }),
    createdAt: dateTime("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: dateTime("updated_at")
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    uniqueIndex("ux_user_address_type").on(
      table.userId,
      table.addressId,
      table.type,
    ),
  ],
);
```

### Ejemplo 3: Detalle CTI

```typescript
// models/company.ts
export const company = schema.table("company", {
  // PK = FK a user (patron CTI)
  id: integer("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),
  legalName: varchar("legal_name", { length: 150 }).notNull(),
  tradeName: varchar("trade_name", { length: 150 }),
});

export const companyRelations = relations(company, ({ one, many }) => ({
  // Relacion con tabla padre
  user: one(user, {
    fields: [company.id],
    references: [user.id],
  }),
  contacts: many(companyContact),
}));
```

---

## Guia para Crear Nuevos Modelos

### Paso 1: Determinar el Tipo de Entidad

Antes de crear una tabla, responde estas preguntas:

1. **Es un nuevo tipo de "usuario/entidad"?**
   - Si: Implementar como detalle CTI de `user`
   - No: Continuar al paso 2

2. **Pertenece a un dominio existente?**
   - Si: Agregar en la carpeta del dominio o extender un maestro existente
   - No: Crear en la raiz de `models/`

3. **Es una relacion many-to-many?**
   - Si: Crear tabla pivote con FKs a ambas tablas
   - No: Continuar con tabla normal

### Paso 2: Crear el Archivo

```typescript
// models/miNuevaEntidad.ts
import { schema } from "./schema";
import { serial, varchar, boolean, integer } from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "../shared/data/DateTime";

/**
 * Modelo de [NombreEntidad]
 * [Descripcion]
 */
export const miNuevaEntidad = schema.table("mi_nueva_entidad", {
  id: serial("id").primaryKey(),
  // ... campos
  isActive: boolean("is_active").notNull().default(true),
  createdAt: dateTime("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: dateTime("updated_at")
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

export const miNuevaEntidadRelations = relations(
  miNuevaEntidad,
  ({ one, many }) => ({
    // ... relaciones
  }),
);

export type MiNuevaEntidad = InferSelectModel<typeof miNuevaEntidad>;
export type NewMiNuevaEntidad = InferInsertModel<typeof miNuevaEntidad>;

export default miNuevaEntidad;
```

### Paso 3: Lista de Verificacion

- [ ] Usar `dateTime` para todos los campos de fecha/hora
- [ ] Usar `decimal` para todos los valores monetarios
- [ ] Incluir campos de auditoria (`createdAt`, `updatedAt`)
- [ ] Documentar con JSDoc la tabla y campos importantes
- [ ] Definir relaciones con otras tablas
- [ ] Exportar tipos `Select` e `Insert`
- [ ] Crear indices unicos donde sea necesario
- [ ] Usar `onDelete: "restrict"` para evitar borrados en cascada no deseados
- [ ] Usar `onDelete: "cascade"` solo para tablas de detalle o pivote

### Cuando NO Usar CTI

Aunque CTI es el patron por defecto, hay excepciones validas:

- **Catalogos simples**: Tablas de lookup como `documentType`
- **Configuraciones**: Tablas key-value como `agape`
- **Tablas pivote**: Relaciones many-to-many
- **Entidades aisladas**: Sin relacion jerarquica con otras
- **Integraciones externas**: Esquemas impuestos por sistemas legados

---

## Diagrama de Relaciones Actual

```
                    +---------------+
                    | documentType  |
                    +-------+-------+
                            |
                            | 1:N
                            v
+----------+  1:1   +-------+-------+  1:1   +----------+
|  person  |------->|     user      |<-------|  company |
+----+-----+        +-------+-------+        +-----+----+
     |                      |                      |
     |                      | 1:N                  |
     |                      v                      |
     |              +-------+-------+              |
     |              | contactMethod |              |
     |              +---------------+              |
     |                      |                      |
     |                      | 1:N                  |
     |                      v                      |
     |              +-------+-------+              |
     |              |  userAddress  |              |
     |              +-------+-------+              |
     |                      |                      |
     |                      | N:1                  |
     |                      v                      |
     |              +-------+-------+              |
     |              |    address    |              |
     |              +---------------+              |
     |                                             |
     +------------------+     +--------------------+
                        |     |
                        v     v
                  +-----+-----+-----+
                  |  companyContact |
                  +-----------------+
```

---

## Referencias

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Schemas](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [Class Table Inheritance Pattern](https://martinfowler.com/eaaCatalog/classTableInheritance.html)
