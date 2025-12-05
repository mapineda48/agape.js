import { schema } from "../agape";
import user from "./user";
import { integer, varchar } from "drizzle-orm/pg-core";
import {
  type InferSelectModel,
  type InferInsertModel,
  relations,
} from "drizzle-orm";

/**
 * Modelo de empresa (Company)
 * Representa una persona jurídica en el sistema.
 * Implementa Class Table Inheritance (CTI): PK = FK a user.id.
 * El id NO es serial porque se hereda del registro padre en user.
 */
export const company = schema.table("core_company", {
  /**
   * Identificador único de la empresa.
   * Es FK a user.id (una empresa ES un user).
   * No es serial: el id se asigna desde la tabla padre user.
   */
  id: integer("id")
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
