/**
 * DTOs para configuración global del sistema.
 * Utilizados para lectura y actualización de la tabla `agape` (clave-valor).
 */

/**
 * Claves conocidas de configuración del sistema.
 * Permite autocompletado y type safety.
 */
export type SystemConfigKey =
  | "system.country" // Código ISO del país (ej: "CO", "US")
  | "system.language" // Código ISO del idioma (ej: "es", "en")
  | "system.timezone" // Zona horaria (ej: "America/Bogota")
  | "system.currency" // Moneda por defecto (ej: "COP", "USD")
  | "system.decimalPlaces" // Decimales para precios (ej: 2)
  | "system.companyName" // Nombre de la empresa
  | "system.companyLogo" // URL del logo de la empresa
  | "system.companyNit" // NIT/ID fiscal de la empresa
  | "system.companyAddress" // Dirección principal de la empresa
  | "system.companyPhone" // Teléfono de la empresa
  | "system.companyEmail" // Email de contacto de la empresa
  | string; // Permite claves personalizadas

/**
 * Tipo de valor permitido en configuración del sistema.
 */
export type SystemConfigValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

/**
 * Registro individual de configuración.
 */
export interface ISystemConfigEntry {
  /** Clave de configuración */
  key: SystemConfigKey;
  /** Valor de configuración */
  value: SystemConfigValue;
}

/**
 * DTO de entrada para actualizar configuración del sistema.
 * Permite actualización parcial (solo las claves proporcionadas).
 */
export interface IUpdateSystemConfig {
  /** Código ISO del país */
  country?: string;
  /** Código ISO del idioma */
  language?: string;
  /** Zona horaria */
  timezone?: string;
  /** Código de moneda por defecto */
  currency?: string;
  /** Número de decimales para precios */
  decimalPlaces?: number;
  /** Nombre de la empresa */
  companyName?: string;
  /** URL del logo de la empresa */
  companyLogo?: string;
  /** NIT/ID fiscal de la empresa */
  companyNit?: string;
  /** Dirección principal de la empresa */
  companyAddress?: string;
  /** Teléfono de la empresa */
  companyPhone?: string;
  /** Email de contacto de la empresa */
  companyEmail?: string;
}

/**
 * DTO de salida de configuración del sistema.
 * Consolidado para el frontend.
 */
export interface ISystemConfig extends Required<IUpdateSystemConfig> {
  // Campos adicionales de solo lectura podrían ir aquí
}

/**
 * Parámetros para obtener una configuración específica.
 */
export interface IGetConfigParams {
  /** Claves a obtener, si se omite devuelve todas */
  keys?: SystemConfigKey[];
}
