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
import DateTime from "@mapineda48/agape/data/DateTime";
import company from "./company";
import person from "./person";

/**
 * Modelo de Contacto de Empresa (CompanyContact)
 *
 * Representa la relación entre una empresa y las personas que actúan
 * como sus contactos o representantes. Permite gestionar múltiples
 * contactos por empresa con diferentes roles.
 *
 * Casos de uso típicos:
 * - Representante legal
 * - Contacto de ventas
 * - Contacto de compras
 * - Contacto de facturación
 * - Contacto técnico
 *
 */
export const companyContact = schema.table(
  "company_contact",
  {
    /** Identificador único del registro */
    id: serial("id").primaryKey(),

    /**
     * FK a la empresa.
     * Referencia company.id (que a su vez es FK de user.id por CTI)
     */
    companyId: integer("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),

    /**
     * FK a la persona de contacto.
     * Referencia person.id (que a su vez es FK de user.id por CTI)
     */
    personId: integer("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),

    /**
     * Rol o cargo del contacto dentro de la empresa.
     * Ejemplos: "Representante Legal", "Jefe de Compras", "Gerente", etc.
     */
    role: varchar("role", { length: 100 }),

    /**
     * Departamento o área de la empresa a la que pertenece el contacto.
     * Ejemplos: "Ventas", "Compras", "Finanzas", "Legal", etc.
     */
    department: varchar("department", { length: 100 }),

    /**
     * Indica si es el contacto principal de la empresa.
     * Solo debe haber un contacto principal por empresa.
     */
    isPrimary: boolean("is_primary").notNull().default(false),

    /** Indica si el contacto está activo */
    isActive: boolean("is_active").notNull().default(true),

    /** Notas adicionales sobre la relación */
    notes: varchar("notes", { length: 500 }),

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
     * Restricción de unicidad:
     * Una persona solo puede estar asociada una vez a la misma empresa.
     */
    uniqueIndex("ux_company_contact_unique").on(
      table.companyId,
      table.personId,
    ),
    /**
     * Restricción de unicidad parcial:
     * Solo puede haber un contacto principal por empresa.
     */
    uniqueIndex("ux_company_contact_primary")
      .on(table.companyId)
      .where(sql`is_primary = true`),
  ],
);

// ============================================================================
// Relaciones
// ============================================================================

/**
 * Relaciones de CompanyContact:
 * - Cada registro pertenece a una empresa
 * - Cada registro apunta a una persona
 */
export const companyContactRelations = relations(companyContact, ({ one }) => ({
  company: one(company, {
    fields: [companyContact.companyId],
    references: [company.id],
  }),
  person: one(person, {
    fields: [companyContact.personId],
    references: [person.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type CompanyContact = InferSelectModel<typeof companyContact>;
export type NewCompanyContact = InferInsertModel<typeof companyContact>;

export default companyContact;
