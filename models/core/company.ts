import { schema } from "../agape";
import user from "./user";
import { serial, varchar } from "drizzle-orm/pg-core";
import {
  type InferSelectModel,
  type InferInsertModel,
  relations,
} from "drizzle-orm";

/**
 * Modelo de empresa (Company)
 * Representa una persona jurídica en el sistema.
 * PK = FK a user.id (herencia por tabla relacionada).
 */
export const company = schema.table("company", {
  /**
   * Identificador único de la empresa
   * Además es FK a user.id (una empresa es una user).
   */
  id: serial("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),

  /** Razón social de la empresa */
  legalName: varchar("legal_name", { length: 150 }).notNull(),

  /** Nombre comercial de la empresa (si aplica) */
  tradeName: varchar("trade_name", { length: 150 }),
});

/**
 * Relaciones de Company:
 * - Cada empresa pertenece a exactamente una user.
 */
export const companyRelations = relations(company, ({ one }) => ({
  user: one(user, {
    fields: [company.id],
    references: [user.id],
  }),
}));

export type Company = InferSelectModel<typeof company>;
export type NewCompany = InferInsertModel<typeof company>;

export default company;
