/**
 * Enums para los modelos core
 *
 * En Kysely, los enums de PostgreSQL se representan como tipos
 * unión de strings en TypeScript. Los valores del array se usan
 * para validaciones en runtime.
 */

// ============================================================================
// User Type Enum
// ============================================================================

/**
 * Tipo de entidad: persona física o jurídica.
 * Determina qué tabla de detalle contiene la información específica.
 */
export type UserType = "person" | "company";

/**
 * Array con todos los valores válidos del tipo de usuario.
 * Útil para validaciones en tiempo de ejecución.
 */
export const USER_TYPE_VALUES = ["person", "company"] as const;

// ============================================================================
// Address Type Enum
// ============================================================================

/**
 * Tipo de dirección:
 * - billing: Facturación
 * - shipping: Envío
 * - main: Principal/Sede
 * - branch: Sucursal
 * - other: Otro
 */
export type AddressType = "billing" | "shipping" | "main" | "branch" | "other";

/**
 * Array con todos los valores válidos del tipo de dirección.
 */
export const ADDRESS_TYPE_VALUES = [
  "billing",
  "shipping",
  "main",
  "branch",
  "other",
] as const;

// ============================================================================
// Contact Method Type Enum
// ============================================================================

/**
 * Tipo de método de contacto:
 * - email: Correo electrónico
 * - phone: Teléfono fijo
 * - mobile: Teléfono móvil
 * - whatsapp: WhatsApp
 * - telegram: Telegram
 * - fax: Fax
 * - other: Otro
 */
export type ContactMethodType =
  | "email"
  | "phone"
  | "mobile"
  | "whatsapp"
  | "telegram"
  | "fax"
  | "other";

/**
 * Array con todos los valores válidos del tipo de método de contacto.
 */
export const CONTACT_METHOD_TYPE_VALUES = [
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "telegram",
  "fax",
  "other",
] as const;
