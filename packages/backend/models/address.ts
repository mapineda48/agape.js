import {
  serial,
  varchar,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { schema } from "./schema";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "@mapineda48/agape-rpc/data/DateTime";
import user from "./user";
import { addressTypeEnum } from "./enums";

/**
 * Modelo de Dirección (Address)
 * Representa una dirección física en el sistema.
 *
 * Este modelo permite gestionar múltiples direcciones por entidad,
 * siguiendo el patrón estándar de ERPs que requieren distinguir entre
 * direcciones de facturación, envío, oficina principal, sucursales, etc.
 *
 */
export const address = schema.table("address", {
  /** Identificador único de la dirección */
  id: serial("id").primaryKey(),

  /** Línea principal de la dirección (calle, número, etc.) */
  street: varchar("street", { length: 255 }).notNull(),

  /** Línea adicional de la dirección (apartamento, suite, edificio, etc.) */
  streetLine2: varchar("street_line_2", { length: 255 }),

  /** Ciudad */
  city: varchar("city", { length: 100 }).notNull(),

  /** Estado, departamento o provincia */
  state: varchar("state", { length: 100 }),

  /** Código postal o ZIP code */
  zipCode: varchar("zip_code", { length: 20 }),

  /**
   * Código ISO 3166-1 alpha-2 del país (ej: CO, US, ES, MX)
   * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  countryCode: varchar("country_code", { length: 2 }).notNull(),

  /** Referencia o punto de referencia para ubicar la dirección */
  reference: varchar("reference", { length: 255 }),

  /** Notas adicionales sobre la dirección */
  notes: varchar("notes", { length: 500 }),

  /** Indica si la dirección está activa/válida */
  isActive: boolean("is_active").notNull().default(true),

  /** Fecha de creación del registro */
  createdAt: dateTime("created_at").notNull().default(sql`now()`),

  /** Fecha de última actualización del registro */
  updatedAt: dateTime("updated_at")
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

/**
 * Tabla pivote para asociar direcciones a usuarios/entidades
 *
 * Implementa la relación muchos-a-muchos entre user y address,
 * permitiendo que una entidad tenga múltiples direcciones tipificadas
 * (facturación, envío, principal, sucursal, etc.).
 *
 */
export const userAddress = schema.table(
  "user_address",
  {
    /** Identificador único del registro */
    id: serial("id").primaryKey(),

    /** FK al usuario/entidad */
    userId: integer("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** FK a la dirección */
    addressId: integer("address_id")
      .notNull()
      .references(() => address.id, { onDelete: "cascade" }),

    /**
     * Tipo de dirección:
     * - billing: Facturación
     * - shipping: Envío
     * - main: Principal/Sede
     * - branch: Sucursal
     * - other: Otro
     */
    type: addressTypeEnum("address_type").notNull(),

    /** Indica si es la dirección principal de este tipo para el usuario */
    isDefault: boolean("is_default").notNull().default(false),

    /** Etiqueta personalizada para identificar la dirección */
    label: varchar("label", { length: 100 }),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at").notNull().default(sql`now()`),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /**
     * Restricción para evitar duplicados:
     * Un usuario no puede tener la misma dirección asociada más de una vez
     * con el mismo tipo.
     */
    uniqueIndex("ux_user_address_type").on(
      table.userId,
      table.addressId,
      table.type,
    ),
  ],
);

// ============================================================================
// Relaciones
// ============================================================================

/**
 * Relaciones de Address:
 * - Una dirección puede estar asociada a múltiples usuarios
 */
export const addressRelations = relations(address, ({ many }) => ({
  userAddresses: many(userAddress),
}));

/**
 * Relaciones de UserAddress:
 * - Cada registro pertenece a un usuario
 * - Cada registro apunta a una dirección
 */
export const userAddressRelations = relations(userAddress, ({ one }) => ({
  user: one(user, {
    fields: [userAddress.userId],
    references: [user.id],
  }),
  address: one(address, {
    fields: [userAddress.addressId],
    references: [address.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type Address = InferSelectModel<typeof address>;
export type NewAddress = InferInsertModel<typeof address>;

export type UserAddress = InferSelectModel<typeof userAddress>;
export type NewUserAddress = InferInsertModel<typeof userAddress>;

// Re-exportar tipos de enum
export { type AddressType, ADDRESS_TYPE_VALUES } from "./enums";

export default address;
