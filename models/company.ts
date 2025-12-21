/**
 * Modelo de empresa (Company)
 *
 * Representa una persona jurídica en el sistema.
 * Implementa Class Table Inheritance (CTI): PK = FK a user.id.
 * El id NO es Generated porque se hereda del registro padre en user.
 *
 * ## Relaciones
 *
 * - **User**: Cada empresa ES un user (herencia CTI).
 * - **Contactos**: Una empresa puede tener múltiples personas de contacto
 *   asociadas a través de `core_company_contact`.
 */
import type { Selectable, Insertable, Updateable } from "./types";

export interface CompanyTable {
  /**
   * Identificador único de la empresa.
   * Es FK a user.id (una empresa ES un user).
   * No es Generated: el id se asigna desde la tabla padre user.
   */
  id: number;

  /** Razón social de la empresa */
  legalName: string;

  /** Nombre comercial de la empresa (si aplica) */
  tradeName: string | null;
}

export type Company = Selectable<CompanyTable>;
export type NewCompany = Insertable<CompanyTable>;
export type CompanyUpdate = Updateable<CompanyTable>;
