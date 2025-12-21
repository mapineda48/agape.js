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
 */
import type {
  Generated,
  CreatedAt,
  UpdatedAt,
  Selectable,
  Insertable,
  Updateable,
} from "./types";

export interface CompanyContactTable {
  /** Identificador único del registro */
  id: Generated<number>;

  /**
   * FK a la empresa.
   * Referencia company.id (que a su vez es FK de user.id por CTI)
   */
  companyId: number;

  /**
   * FK a la persona de contacto.
   * Referencia person.id (que a su vez es FK de user.id por CTI)
   */
  personId: number;

  /**
   * Rol o cargo del contacto dentro de la empresa.
   * Ejemplos: "Representante Legal", "Jefe de Compras", "Gerente", etc.
   */
  role: string | null;

  /**
   * Departamento o área de la empresa a la que pertenece el contacto.
   * Ejemplos: "Ventas", "Compras", "Finanzas", "Legal", etc.
   */
  department: string | null;

  /**
   * Indica si es el contacto principal de la empresa.
   * Solo debe haber un contacto principal por empresa.
   */
  isPrimary: boolean;

  /** Indica si el contacto está activo */
  isActive: boolean;

  /** Notas adicionales sobre la relación */
  notes: string | null;

  /** Fecha de creación del registro */
  createdAt: CreatedAt;

  /** Fecha de última actualización del registro */
  updatedAt: UpdatedAt;
}

export type CompanyContact = Selectable<CompanyContactTable>;
export type NewCompanyContact = Insertable<CompanyContactTable>;
export type CompanyContactUpdate = Updateable<CompanyContactTable>;
