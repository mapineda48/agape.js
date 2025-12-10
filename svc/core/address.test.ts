import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * Tests de integración para el servicio de direcciones.
 *
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_address_${uuid}`,
    dev: false,
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("address service", () => {
  describe("upsertAddress", () => {
    it("should create a new address", async () => {
      const { upsertAddress } = await import("./address");

      const result = await upsertAddress({
        street: "Calle 123 #45-67",
        city: "Bogotá",
        countryCode: "CO",
        state: "Cundinamarca",
        zipCode: "110111",
      });

      expect(result).toHaveProperty("id");
      expect(result.street).toBe("Calle 123 #45-67");
      expect(result.city).toBe("Bogotá");
      expect(result.countryCode).toBe("CO");
      expect(result.isActive).toBe(true);
    });

    it("should update an existing address", async () => {
      const { upsertAddress, getAddressById } = await import("./address");

      // Crear
      const created = await upsertAddress({
        street: "Calle Original",
        city: "Medellín",
        countryCode: "CO",
      });

      // Actualizar
      const updated = await upsertAddress({
        id: created.id,
        street: "Calle Actualizada",
        city: "Medellín",
        countryCode: "CO",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.street).toBe("Calle Actualizada");

      // Verificar en BD
      const fromDb = await getAddressById(created.id);
      expect(fromDb?.street).toBe("Calle Actualizada");
    });

    it("should throw AddressNotFoundError when updating non-existent address", async () => {
      const { upsertAddress, AddressNotFoundError } = await import("./address");

      await expect(
        upsertAddress({
          id: 999999,
          street: "No existe",
          city: "Ciudad",
          countryCode: "CO",
        })
      ).rejects.toThrow(AddressNotFoundError);
    });
  });

  describe("upsertUserAddress - Single Default Logic", () => {
    it("should set isDefault to false for other addresses of same user and type", async () => {
      const { upsertAddress, upsertUserAddress, listUserAddresses } =
        await import("./address");
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula Test Address",
        code: "CCADDR1",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const user = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "ADDR_TEST_001",
        person: {
          firstName: "Test",
          lastName: "Address",
        },
      });

      // Crear dos direcciones
      const addr1 = await upsertAddress({
        street: "Dirección 1",
        city: "Bogotá",
        countryCode: "CO",
      });

      const addr2 = await upsertAddress({
        street: "Dirección 2",
        city: "Medellín",
        countryCode: "CO",
      });

      // Asociar dirección 1 como default
      const userAddr1 = await upsertUserAddress({
        userId: user.id,
        addressId: addr1.id,
        type: "billing",
        isDefault: true,
        label: "Oficina Principal",
      });

      expect(userAddr1.isDefault).toBe(true);

      // Asociar dirección 2 como default (debe desmarcar la 1)
      const userAddr2 = await upsertUserAddress({
        userId: user.id,
        addressId: addr2.id,
        type: "billing",
        isDefault: true,
        label: "Nueva Oficina",
      });

      expect(userAddr2.isDefault).toBe(true);

      // Verificar que la dirección 1 ya no es default
      const addresses = await listUserAddresses({
        userId: user.id,
        type: "billing",
      });

      const addr1Updated = addresses.find((a) => a.id === userAddr1.id);
      const addr2Updated = addresses.find((a) => a.id === userAddr2.id);

      expect(addr1Updated?.isDefault).toBe(false);
      expect(addr2Updated?.isDefault).toBe(true);
    });

    it("should not affect addresses of different types", async () => {
      const { upsertAddress, upsertUserAddress, listUserAddresses } =
        await import("./address");
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula Test Address 2",
        code: "CCADDR2",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const user = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "ADDR_TEST_002",
        person: {
          firstName: "Test",
          lastName: "Types",
        },
      });

      // Crear direcciones
      const addrBilling = await upsertAddress({
        street: "Dirección Facturación",
        city: "Cali",
        countryCode: "CO",
      });

      const addrShipping = await upsertAddress({
        street: "Dirección Envío",
        city: "Barranquilla",
        countryCode: "CO",
      });

      // Asociar billing como default
      const userAddrBilling = await upsertUserAddress({
        userId: user.id,
        addressId: addrBilling.id,
        type: "billing",
        isDefault: true,
      });

      // Asociar shipping como default (no debe afectar billing)
      const userAddrShipping = await upsertUserAddress({
        userId: user.id,
        addressId: addrShipping.id,
        type: "shipping",
        isDefault: true,
      });

      // Verificar que ambos siguen siendo default (diferentes tipos)
      const billingAddresses = await listUserAddresses({
        userId: user.id,
        type: "billing",
      });

      const shippingAddresses = await listUserAddresses({
        userId: user.id,
        type: "shipping",
      });

      expect(billingAddresses[0]?.isDefault).toBe(true);
      expect(shippingAddresses[0]?.isDefault).toBe(true);
    });
  });

  describe("createUserAddressWithAddress", () => {
    it("should create address and association in one transaction", async () => {
      const { createUserAddressWithAddress, listUserAddresses } = await import(
        "./address"
      );
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula Test Create",
        code: "CCCREATE1",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const user = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "CREATE_TEST_001",
        person: {
          firstName: "Create",
          lastName: "Test",
        },
      });

      // Crear dirección + asociación
      const result = await createUserAddressWithAddress({
        userId: user.id,
        type: "main",
        isDefault: true,
        label: "Sede Principal",
        address: {
          street: "Avenida Principal 123",
          city: "Bogotá",
          state: "Cundinamarca",
          countryCode: "CO",
          zipCode: "110111",
        },
      });

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.type).toBe("main");
      expect(result.isDefault).toBe(true);
      expect(result.label).toBe("Sede Principal");
      expect(result.address.street).toBe("Avenida Principal 123");
      expect(result.address.city).toBe("Bogotá");

      // Verificar que se puede listar
      const addresses = await listUserAddresses({ userId: user.id });
      expect(addresses.length).toBeGreaterThan(0);
    });
  });

  describe("deleteUserAddress", () => {
    it("should delete user address association", async () => {
      const {
        upsertAddress,
        upsertUserAddress,
        deleteUserAddress,
        listUserAddresses,
        getAddressById,
      } = await import("./address");
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula Test Delete",
        code: "CCDEL1",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const user = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "DELETE_TEST_001",
        person: {
          firstName: "Delete",
          lastName: "Test",
        },
      });

      // Crear dirección
      const addr = await upsertAddress({
        street: "Dirección a eliminar",
        city: "Cartagena",
        countryCode: "CO",
      });

      // Asociar
      const userAddr = await upsertUserAddress({
        userId: user.id,
        addressId: addr.id,
        type: "other",
      });

      // Eliminar solo asociación (sin eliminar dirección)
      await deleteUserAddress(userAddr.id, false);

      // Verificar que la asociación fue eliminada
      const addresses = await listUserAddresses({ userId: user.id });
      const found = addresses.find((a) => a.id === userAddr.id);
      expect(found).toBeUndefined();

      // Verificar que la dirección física sigue existiendo
      const addrStillExists = await getAddressById(addr.id);
      expect(addrStillExists).toBeDefined();
    });

    it("should delete address when deleteAddress flag is true", async () => {
      const {
        upsertAddress,
        upsertUserAddress,
        deleteUserAddress,
        getAddressById,
      } = await import("./address");
      const { upsertUser } = await import("./user");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula Test Delete Full",
        code: "CCDELFULL",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear usuario
      const user = await upsertUser({
        documentTypeId: docType.id,
        documentNumber: "DELETE_FULL_001",
        person: {
          firstName: "Delete",
          lastName: "Full",
        },
      });

      // Crear dirección
      const addr = await upsertAddress({
        street: "Dirección a eliminar completa",
        city: "Pereira",
        countryCode: "CO",
      });

      // Asociar
      const userAddr = await upsertUserAddress({
        userId: user.id,
        addressId: addr.id,
        type: "branch",
      });

      // Eliminar asociación Y dirección
      await deleteUserAddress(userAddr.id, true);

      // Verificar que la dirección física también fue eliminada
      const addrDeleted = await getAddressById(addr.id);
      expect(addrDeleted).toBeUndefined();
    });

    it("should throw UserAddressNotFoundError when deleting non-existent association", async () => {
      const { deleteUserAddress, UserAddressNotFoundError } = await import(
        "./address"
      );

      await expect(deleteUserAddress(999999)).rejects.toThrow(
        UserAddressNotFoundError
      );
    });
  });
});
