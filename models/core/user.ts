import { schema } from "../agape";
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
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import documentType from "./documentType";
import person from "./person";
import company from "./company";

/**
 * User (entidad genérica)
 * Representa una entidad que puede ser persona o empresa.
 * Centraliza la identidad y los datos de contacto básicos.
 */
export const user = schema.table(
  "user",
  {
    /** Identificador único de la entidad */
    id: serial("id").primaryKey(),

    /** Tipo de entidad: P | C (o valores similares) */
    type: varchar("user_type", { length: 20 }).notNull(),

    /** Tipo de documento asociado */
    documentTypeId: integer("document_type_id")
      .notNull()
      .references(() => documentType.id, { onDelete: "restrict" }),

    /** Número del documento de identificación */
    documentNumber: varchar("document_number", { length: 30 }).notNull(),

    /** Email de contacto (opcional) */
    email: varchar("email", { length: 255 }),

    /** Teléfono de contacto (opcional) */
    phone: varchar("phone", { length: 20 }),

    /** Dirección genérica de contacto (opcional) */
    address: varchar("address", { length: 255 }),

    /** Indica si la entidad está activa en el sistema */
    isActive: boolean("is_active").notNull().default(true),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at").default(sql`now()`),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /**
     * Restricción de unicidad para evitar que exista más de una
     * entidad con el mismo tipo y número de documento.
     */
    uniqueIndex("ux_party_document").on(
      table.documentTypeId,
      table.documentNumber
    ),
  ]
);

/**
 * Relaciones de DocumentType:
 * - Un tipo de documento puede estar asociado a muchas parties.
 */
export const documentTypeRelations = relations(documentType, ({ many }) => ({
  users: many(user),
}));

/**
 * Relaciones de User:
 * - Cada user tiene exactamente un tipo de documento.
 * - Puede tener una persona asociada (si userType = P).
 * - Puede tener una empresa asociada (si userType = C).
 */
export const userRelations = relations(user, ({ one }) => ({
  documentType: one(documentType, {
    fields: [user.documentTypeId],
    references: [documentType.id],
  }),
  person: one(person, {
    fields: [user.id],
    references: [person.id],
  }),
  company: one(company, {
    fields: [user.id],
    references: [company.id],
  }),
}));

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

export default user;
