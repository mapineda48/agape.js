import { pgEnum } from "drizzle-orm/pg-core";
import { schema } from "../agape";

/**
 * Enum para los tipos de usuario/entidad en el sistema.
 *
 * Este enum define los tipos de entidades soportadas en el modelo de "Party/Identity":
 * - `person`: Representa una persona física (natural person)
 * - `company`: Representa una persona jurídica (legal entity)
 *
 * Se utiliza en el modelo `user` para determinar el tipo de entidad
 * y garantizar la integridad referencial con las tablas de detalle
 * (`core_person` o `core_company`).
 *
 * @example
 * ```ts
 * import { UserType, userTypeEnum } from "@models/core/enums";
 *
 * // Uso en modelo
 * type: userTypeEnum("user_type").notNull(),
 *
 * // Valores disponibles
 * const tipo: UserType = "person";
 * const tipo2: UserType = "company";
 * ```
 */
export const userTypeEnum = schema.enum("user_type_enum", [
  "person",
  "company",
]);

/**
 * Tipo TypeScript derivado del enum de base de datos.
 * Representa los valores posibles: "person" | "company"
 */
export type UserType = (typeof userTypeEnum.enumValues)[number];

/**
 * Array con todos los valores válidos del enum UserType.
 * Útil para validaciones en tiempo de ejecución.
 */
export const USER_TYPE_VALUES = userTypeEnum.enumValues;
