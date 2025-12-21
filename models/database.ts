/**
 * Interfaz central de base de datos para Kysely
 *
 * Define todas las tablas disponibles en el esquema.
 * Esta interfaz se pasa al constructor de Kysely para
 * obtener tipado completo en las queries.
 */
import type { AgapeTable } from "./agape";
import type { DocumentTypeTable } from "./documentType";
import type { UserTable } from "./user";
import type { PersonTable } from "./person";
import type { CompanyTable } from "./company";
import type { AddressTable, UserAddressTable } from "./address";
import type { ContactMethodTable } from "./contactMethod";
import type { CompanyContactTable } from "./companyContact";
import type { DepartmentTable } from "./hr/department";
import type { JobPositionTable } from "./hr/jobPosition";
import type { EmployeeTable, EmployeeJobPositionTable } from "./hr/employee";

export interface Database {
    /** Configuración global key-value */
    agape: AgapeTable;

    /** Catálogo de tipos de documento de identificación */
    coreIdentityDocumentType: DocumentTypeTable;

    /** Entidades genéricas (personas o empresas) */
    user: UserTable;

    /** Personas físicas (CTI: extiende user) */
    corePerson: PersonTable;

    /** Personas jurídicas (CTI: extiende user) */
    coreCompany: CompanyTable;

    /** Direcciones físicas */
    coreAddress: AddressTable;

    /** Relación user ↔ address */
    coreUserAddress: UserAddressTable;

    /** Métodos de contacto (email, teléfono, etc.) */
    coreContactMethod: ContactMethodTable;

    /** Contactos de empresas (personas asociadas) */
    coreCompanyContact: CompanyContactTable;

    // ========================================================================
    // HR - Recursos Humanos
    // ========================================================================

    /** Departamentos organizacionales */
    hrDepartment: DepartmentTable;

    /** Cargos o puestos de trabajo */
    hrJobPosition: JobPositionTable;

    /** Empleados */
    hrEmployee: EmployeeTable;

    /** Relación empleado ↔ cargo */
    hrEmployeeJobPosition: EmployeeJobPositionTable;
}
