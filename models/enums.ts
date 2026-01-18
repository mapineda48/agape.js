import { schema } from "./schema";

// ============================================================================
// User Type Enum
// ============================================================================

/**
 * Enum para los tipos de usuario/entidad en el sistema.
 *
 * Este enum define los tipos de entidades soportadas en el modelo de "Party/Identity":
 * - `person`: Representa una persona física (natural person)
 * - `company`: Representa una persona jurídica (legal entity)
 *
 * Se utiliza en el modelo `user` para determinar el tipo de entidad
 * y garantizar la integridad referencial con las tablas de detalle
 * (`person` o `company`).
 *
  */
export const userTypeEnum = schema.enum("user_type_enum", ["person", "company"]);
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

// ============================================================================
// Address Type Enum
// ============================================================================

/**
 * Enum para los tipos de dirección en el sistema.
 *
 * Define los diferentes propósitos que puede tener una dirección:
 * - `billing`: Dirección de facturación
 * - `shipping`: Dirección de envío
 * - `main`: Dirección principal/sede
 * - `branch`: Sucursal
 * - `other`: Otro tipo
 *
  */
export const addressTypeEnum = schema.enum("address_type_enum", [
  "billing",
  "shipping",
  "main",
  "branch",
  "other",
]);

/**
 * Tipo TypeScript derivado del enum de tipo de dirección.
 * Representa: "billing" | "shipping" | "main" | "branch" | "other"
 */
export type AddressType = (typeof addressTypeEnum.enumValues)[number];

/**
 * Array con todos los valores válidos del enum AddressType.
 * Útil para validaciones en tiempo de ejecución.
 */
export const ADDRESS_TYPE_VALUES = addressTypeEnum.enumValues;

// ============================================================================
// Contact Method Type Enum
// ============================================================================

/**
 * Enum para los tipos de método de contacto en el sistema.
 *
 * Define los diferentes canales de comunicación soportados:
 * - `email`: Correo electrónico
 * - `phone`: Teléfono fijo
 * - `mobile`: Teléfono móvil
 * - `whatsapp`: WhatsApp
 * - `telegram`: Telegram
 * - `fax`: Fax
 * - `other`: Otro tipo
 *
  */
export const contactMethodTypeEnum = schema.enum("contact_method_type_enum", [
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "telegram",
  "fax",
  "other",
]);

/**
 * Tipo TypeScript derivado del enum de método de contacto.
 * Representa: "email" | "phone" | "mobile" | "whatsapp" | "telegram" | "fax" | "other"
 */
export type ContactMethodType =
  (typeof contactMethodTypeEnum.enumValues)[number];

/**
 * Array con todos los valores válidos del enum ContactMethodType.
 * Útil para validaciones en tiempo de ejecución.
 */
export const CONTACT_METHOD_TYPE_VALUES = contactMethodTypeEnum.enumValues;
