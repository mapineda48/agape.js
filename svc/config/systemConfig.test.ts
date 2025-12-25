import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_config_${uuid}`,
    env: "vitest",
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("systemConfig service", () => {
  describe("getSystemConfig", () => {
    it("should return default configuration when no config exists", async () => {
      const { getSystemConfig } = await import("./systemConfig");

      const config = await getSystemConfig();

      expect(config).toBeDefined();
      expect(config.country).toBe("CO");
      expect(config.language).toBe("es");
      expect(config.timezone).toBe("America/Bogota");
      expect(config.currency).toBe("COP");
      expect(config.decimalPlaces).toBe(2);
      expect(config.companyName).toBe("");
    });
  });

  describe("updateSystemConfig", () => {
    it("should update partial configuration", async () => {
      const { updateSystemConfig, getSystemConfig } = await import(
        "./systemConfig"
      );

      // Actualizar solo algunos campos
      await updateSystemConfig({
        companyName: "Agape Test S.A.S.",
        currency: "USD",
      });

      // Verificar que se actualizaron
      const config = await getSystemConfig();

      expect(config.companyName).toBe("Agape Test S.A.S.");
      expect(config.currency).toBe("USD");
      // Los demás campos mantienen valores por defecto
      expect(config.country).toBe("CO");
    });

    it("should update all company information", async () => {
      const { updateSystemConfig, getSystemConfig } = await import(
        "./systemConfig"
      );

      await updateSystemConfig({
        companyName: "Nueva Empresa S.A.S.",
        companyNit: "900.123.456-7",
        companyAddress: "Calle 123 #45-67",
        companyPhone: "+57 300 123 4567",
        companyEmail: "contacto@nuevaempresa.com",
      });

      const config = await getSystemConfig();

      expect(config.companyName).toBe("Nueva Empresa S.A.S.");
      expect(config.companyNit).toBe("900.123.456-7");
      expect(config.companyAddress).toBe("Calle 123 #45-67");
      expect(config.companyPhone).toBe("+57 300 123 4567");
      expect(config.companyEmail).toBe("contacto@nuevaempresa.com");
    });

    it("should validate decimalPlaces is within valid range", async () => {
      const { updateSystemConfig } = await import("./systemConfig");

      // Valor negativo
      await expect(updateSystemConfig({ decimalPlaces: -1 })).rejects.toThrow(
        "El número de decimales debe estar entre 0 y 6"
      );

      // Valor mayor a 6
      await expect(updateSystemConfig({ decimalPlaces: 7 })).rejects.toThrow(
        "El número de decimales debe estar entre 0 y 6"
      );
    });

    it("should accept valid decimalPlaces values", async () => {
      const { updateSystemConfig, getSystemConfig } = await import(
        "./systemConfig"
      );

      await updateSystemConfig({ decimalPlaces: 4 });

      const config = await getSystemConfig();
      expect(config.decimalPlaces).toBe(4);
    });
  });

  describe("getConfigValue / setConfigValue", () => {
    it("should set and get individual config values", async () => {
      const { getConfigValue, setConfigValue } = await import("./systemConfig");

      // Establecer valor personalizado
      await setConfigValue("system.custom.feature", true);

      const value = await getConfigValue("system.custom.feature");
      expect(value).toBe(true);
    });

    it("should return undefined for non-existent key", async () => {
      const { getConfigValue } = await import("./systemConfig");

      const value = await getConfigValue("system.nonexistent.key");
      expect(value).toBeUndefined();
    });

    it("should handle complex JSON values", async () => {
      const { getConfigValue, setConfigValue } = await import("./systemConfig");

      const complexValue = {
        enabled: true,
        options: ["A", "B", "C"],
        nested: { level1: { level2: "value" } },
      };

      await setConfigValue("system.complex.config", complexValue);

      const value = await getConfigValue("system.complex.config");
      expect(value).toEqual(complexValue);
    });
  });
});
