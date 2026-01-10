/**
 * Servicio de Configuración Global del Sistema
 *
 * Gestiona la configuración global usando la tabla `agape` (clave-valor).
 *
 * @module config/systemConfig
 */

import { db } from "#lib/db";
import { agape } from "#models/agape";
import { eq, inArray } from "drizzle-orm";
import type {
  ISystemConfig,
  IUpdateSystemConfig,
  SystemConfigKey,
  SystemConfigValue,
} from "#utils/dto/config/systemConfig";

// ============================================================================
// Constantes
// ============================================================================

/**
 * Mapeo de claves de configuración del sistema a claves de la tabla agape.
 */
const CONFIG_KEY_MAP: Record<keyof IUpdateSystemConfig, SystemConfigKey> = {
  country: "system.country",
  language: "system.language",
  timezone: "system.timezone",
  currency: "system.currency",
  decimalPlaces: "system.decimalPlaces",
  companyName: "system.companyName",
  companyLogo: "system.companyLogo",
  companyNit: "system.companyNit",
  companyAddress: "system.companyAddress",
  companyPhone: "system.companyPhone",
  companyEmail: "system.companyEmail",
};

/**
 * Valores por defecto para la configuración del sistema.
 */
const DEFAULT_CONFIG: ISystemConfig = {
  country: "CO",
  language: "es",
  timezone: "America/Bogota",
  currency: "COP",
  decimalPlaces: 2,
  companyName: "",
  companyLogo: "",
  companyNit: "",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
};

// ============================================================================
// Servicios
// ============================================================================

/**
 * Obtiene la configuración del sistema consolidada.
 *
 * Lee todas las claves de configuración de la tabla `agape` y las consolida
 * en un objeto tipado. Los valores no encontrados usan los valores por defecto.
 *
 * @returns Configuración del sistema consolidada.
 * @permission config.system.read
 * *
 */
export async function getSystemConfig(): Promise<ISystemConfig> {
  const keys = Object.values(CONFIG_KEY_MAP);

  const rows = await db.select().from(agape).where(inArray(agape.key, keys));

  // Crear mapa de valores
  const valueMap = new Map<string, SystemConfigValue>();
  for (const row of rows) {
    valueMap.set(row.key, row.value as SystemConfigValue);
  }

  // Construir objeto de configuración
  const config: ISystemConfig = { ...DEFAULT_CONFIG };

  for (const [field, key] of Object.entries(CONFIG_KEY_MAP)) {
    const value = valueMap.get(key);
    if (value !== undefined) {
      // Type assertion necesario porque el mapeo es dinámico
      (config as Record<string, unknown>)[field] = value;
    }
  }

  return config;
}

/**
 * Obtiene un valor de configuración específico.
 *
 * @param key Clave de configuración.
 * @returns Valor de configuración o undefined si no existe.
 * @permission config.system.read
 * *
 */
export async function getConfigValue(
  key: SystemConfigKey
): Promise<SystemConfigValue | undefined> {
  const [row] = await db.select().from(agape).where(eq(agape.key, key));

  return row?.value as SystemConfigValue | undefined;
}

/**
 * Actualiza la configuración del sistema.
 *
 * Recibe un DTO parcial y actualiza solo las claves proporcionadas.
 * Ejecuta todas las actualizaciones dentro de una transacción para garantizar
 * atomicidad.
 *
 * **Reglas de negocio:**
 * - Si se cambia `currency`, se debe verificar que la moneda exista en el catálogo.
 * - Si se cambia `decimalPlaces`, el valor debe estar entre 0 y 6.
 *
 * @param payload Datos de configuración a actualizar.
 * @returns Configuración actualizada.
 *
 * @throws Error si `decimalPlaces` está fuera del rango permitido.
 * @permission config.system.manage
 * *
 */
export async function updateSystemConfig(
  payload: IUpdateSystemConfig
): Promise<ISystemConfig> {
  // Validar decimalPlaces si está presente
  if (payload.decimalPlaces !== undefined) {
    if (payload.decimalPlaces < 0 || payload.decimalPlaces > 6) {
      throw new Error("El número de decimales debe estar entre 0 y 6");
    }
  }

  // TODO: Validar que currency exista en catálogo de monedas cuando se implemente

  await db.transaction(async (tx) => {
    for (const [field, key] of Object.entries(CONFIG_KEY_MAP)) {
      const value = (payload as Record<string, unknown>)[field];

      if (value === undefined) {
        continue;
      }

      // Upsert: insertar o actualizar
      await tx.insert(agape).values({ key, value }).onConflictDoUpdate({
        target: agape.key,
        set: { value },
      });
    }
  });

  return getSystemConfig();
}

/**
 * Establece un valor de configuración específico.
 *
 * @param key Clave de configuración.
 * @param value Valor a establecer.
 * @permission config.system.manage
 * *
 */
export async function setConfigValue(
  key: SystemConfigKey,
  value: SystemConfigValue
): Promise<void> {
  await db.insert(agape).values({ key, value }).onConflictDoUpdate({
    target: agape.key,
    set: { value },
  });
}

// ============================================================================
// Re-exportación de tipos
// ============================================================================

export type {
  ISystemConfig,
  IUpdateSystemConfig,
  ISystemConfigEntry,
  IGetConfigParams,
  SystemConfigKey,
  SystemConfigValue,
} from "#utils/dto/config/systemConfig";
