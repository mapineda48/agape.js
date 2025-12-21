/**
 * Pruebas de integración para el Servicio de Cliente CRM - Información de Contacto
 *
 * Escenarios cubiertos:
 * 1. Crear cliente con información de contacto
 * 2. Verificar que los contactos se recuperan al cargar el cliente
 * 3. Actualizar contactos de un cliente existente
 */
import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenants: [`vitest_client_contact_${uuid}`],
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

describe("ClientService - Contact Integration", () => {
  it("should save contact information and retrieve it when loading client", async () => {
    // Imports dinámicos
    const { upsertClient, getClientById } = await import("./client");
    const { upsertDocumentType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("./clientType");

    // Crear tipo de documento
    const [docType] = await upsertDocumentType({
      name: "CC Contact Test",
      code: "CC_CT",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    });

    // Crear tipo de cliente
    const [clientTypeRecord] = await upsertClientType({
      name: "Contact Test Type",
      isEnabled: true,
    });

    // Arrange: Datos del cliente con información de contacto
    // Nota: whatsapp debe ser diferente a mobile para que se guarde por separado
    const clientPayload = {
      user: {
        documentTypeId: docType.id,
        documentNumber: "TEST_CONTACT_123",
        countryCode: "CO",
        person: {
          firstName: "Juan",
          lastName: "Pérez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        email: "juan.perez@test.com",
        phone: "+57 1 234 5678",
        mobile: "+57 300 123 4567",
        whatsapp: "+57 310 987 6543", // Diferente al móvil
      },
    };

    // Act: Crear cliente con contactos
    const createdClient = await upsertClient(clientPayload);

    expect(createdClient.id).toBeDefined();

    // Act: Cargar el cliente por ID
    const loadedClient = await getClientById(createdClient.id);

    // Assert: Verificar que el cliente se cargó
    expect(loadedClient).toBeDefined();
    expect(loadedClient.id).toBe(createdClient.id);

    // Assert: Verificar que los contactos se recuperaron correctamente
    expect(loadedClient.contacts).toBeDefined();
    expect(loadedClient.contacts?.email).toBe("juan.perez@test.com");
    expect(loadedClient.contacts?.phone).toBe("+57 1 234 5678");
    expect(loadedClient.contacts?.mobile).toBe("+57 300 123 4567");
    expect(loadedClient.contacts?.whatsapp).toBe("+57 310 987 6543");
  });

  it("should return empty contacts when client has no contact methods", async () => {
    // Imports dinámicos
    const { upsertClient, getClientById } = await import("./client");
    const { upsertDocumentType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("./clientType");

    // Crear tipo de documento
    const [docType] = await upsertDocumentType({
      name: "No Contact Doc",
      code: "NCD",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    });

    // Crear tipo de cliente
    const [clientTypeRecord] = await upsertClientType({
      name: "No Contact Type",
      isEnabled: true,
    });

    // Arrange: Datos del cliente sin información de contacto
    const clientPayload = {
      user: {
        documentTypeId: docType.id,
        documentNumber: "NO_CONTACT_789",
        person: {
          firstName: "María",
          lastName: "García",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      // Sin contacts
    };

    // Act: Crear cliente sin contactos
    const createdClient = await upsertClient(clientPayload);

    expect(createdClient.id).toBeDefined();

    // Act: Cargar el cliente por ID
    const loadedClient = await getClientById(createdClient.id);

    // Assert: Verificar que el cliente se cargó
    expect(loadedClient).toBeDefined();
    expect(loadedClient.id).toBe(createdClient.id);

    // Assert: Verificar que contacts existe pero está vacío
    expect(loadedClient.contacts).toBeDefined();
    expect(loadedClient.contacts?.email).toBeUndefined();
    expect(loadedClient.contacts?.phone).toBeUndefined();
    expect(loadedClient.contacts?.mobile).toBeUndefined();
    expect(loadedClient.contacts?.whatsapp).toBeUndefined();
  });

  it("should update contact information when editing client", async () => {
    // Imports dinámicos
    const { upsertClient, getClientById } = await import("./client");
    const { upsertDocumentType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("./clientType");
    const { listContactMethods } = await import("#svc/core/contactMethod");

    // Crear tipo de documento
    const [docType] = await upsertDocumentType({
      name: "Update Contact Doc",
      code: "UCD",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    });

    // Crear tipo de cliente
    const [clientTypeRecord] = await upsertClientType({
      name: "Update Contact Type",
      isEnabled: true,
    });

    // Arrange: Crear cliente con contacto inicial
    const initialPayload = {
      user: {
        documentTypeId: docType.id,
        documentNumber: "UPDATE_CONTACT_345",
        person: {
          firstName: "Carlos",
          lastName: "López",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        email: "carlos.inicial@test.com",
      },
    };

    const createdClient = await upsertClient(initialPayload);

    // Verificar que se creó el email inicial
    const initialContacts = await listContactMethods({
      userId: createdClient.id,
      isActive: true,
    });
    const initialEmailCount = initialContacts.filter((c) => c.type === "email").length;
    expect(initialEmailCount).toBe(1);
    expect(initialContacts.find((c) => c.type === "email")?.value).toBe(
      "carlos.inicial@test.com"
    );

    // Act: Actualizar cliente con nuevo email
    const updatePayload = {
      id: createdClient.id,
      user: {
        id: createdClient.id,
        documentTypeId: docType.id,
        documentNumber: "UPDATE_CONTACT_345",
        person: {
          firstName: "Carlos",
          lastName: "López",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        email: "carlos.actualizado@test.com",
        mobile: "+57 310 987 6543",
      },
    };

    await upsertClient(updatePayload);

    // Act: Cargar el cliente actualizado
    const loadedClient = await getClientById(createdClient.id);

    // Assert: Verificar contactos actualizados (getClientById devuelve solo el primario)
    expect(loadedClient.contacts).toBeDefined();
    expect(loadedClient.contacts?.email).toBe("carlos.actualizado@test.com");
    expect(loadedClient.contacts?.mobile).toBe("+57 310 987 6543");

    // Assert: Verificar que hay múltiples registros pero solo 1 es primario
    const updatedContacts = await listContactMethods({
      userId: createdClient.id,
      isActive: true,
    });

    // Con clave compuesta, cada valor diferente es un registro diferente
    // Verificamos que solo hay un email PRIMARIO con el valor actualizado
    const primaryEmails = updatedContacts.filter((c) => c.type === "email" && c.isPrimary);
    expect(primaryEmails.length).toBe(1);
    expect(primaryEmails[0].value).toBe("carlos.actualizado@test.com");
  });

  it("should update phone number without creating duplicates", async () => {
    // Imports dinámicos
    const { upsertClient, getClientById } = await import("./client");
    const { upsertDocumentType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("./clientType");
    const { listContactMethods } = await import("#svc/core/contactMethod");

    // Crear tipo de documento
    const [docType] = await upsertDocumentType({
      name: "Phone Update Doc",
      code: "PUD",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    });

    // Crear tipo de cliente
    const [clientTypeRecord] = await upsertClientType({
      name: "Phone Update Type",
      isEnabled: true,
    });

    // Arrange: Crear cliente con teléfono inicial
    const initialPayload = {
      user: {
        documentTypeId: docType.id,
        documentNumber: "PHONE_UPDATE_789",
        person: {
          firstName: "Ana",
          lastName: "Rodríguez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        phone: "+57 1 234 5678",
      },
    };

    const createdClient = await upsertClient(initialPayload);

    // Verificar teléfono inicial
    const initialContacts = await listContactMethods({
      userId: createdClient.id,
      isActive: true,
    });
    expect(initialContacts.find((c) => c.type === "phone")?.value).toBe(
      "+57 1 234 5678"
    );

    // Act: Actualizar el teléfono
    const updatePayload = {
      id: createdClient.id,
      user: {
        id: createdClient.id,
        documentTypeId: docType.id,
        documentNumber: "PHONE_UPDATE_789",
        person: {
          firstName: "Ana",
          lastName: "Rodríguez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        phone: "+57 1 999 8888", // Nuevo número de teléfono
      },
    };

    await upsertClient(updatePayload);

    // Assert: Verificar que el teléfono primario se actualizó
    const loadedClient = await getClientById(createdClient.id);
    expect(loadedClient.contacts?.phone).toBe("+57 1 999 8888");

    // Assert: Verificar que solo hay 1 teléfono PRIMARIO con el nuevo valor
    const updatedContacts = await listContactMethods({
      userId: createdClient.id,
      isActive: true,
    });
    const primaryPhones = updatedContacts.filter((c) => c.type === "phone" && c.isPrimary);
    expect(primaryPhones.length).toBe(1);
    expect(primaryPhones[0].value).toBe("+57 1 999 8888");
  });

  it("should only return primary contacts", async () => {
    // Imports dinámicos
    const { upsertClient, getClientById } = await import("./client");
    const { upsertDocumentType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("./clientType");
    const { upsertContactMethod } = await import("#svc/core/contactMethod");

    // Crear tipo de documento
    const [docType] = await upsertDocumentType({
      name: "Primary Contact Doc",
      code: "PCD",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    });

    // Crear tipo de cliente
    const [clientTypeRecord] = await upsertClientType({
      name: "Primary Contact Type",
      isEnabled: true,
    });

    // Crear cliente con contacto principal
    const createdClient = await upsertClient({
      user: {
        documentTypeId: docType.id,
        documentNumber: "PRIMARY_CONTACT_001",
        person: {
          firstName: "Pedro",
          lastName: "Martínez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        email: "pedro.principal@test.com",
      },
    });

    // Agregar un email secundario (no principal)
    await upsertContactMethod({
      userId: createdClient.id,
      type: "email",
      value: "pedro.secundario@test.com",
      isPrimary: false,
      label: "Secundario",
    });

    // Cargar el cliente
    const loadedClient = await getClientById(createdClient.id);

    // Assert: Solo debe devolver el email principal
    expect(loadedClient.contacts?.email).toBe("pedro.principal@test.com");
  });

  it("should allow reverting to a previous contact value without duplicate error", async () => {
    // Imports dinámicos
    const { upsertClient, getClientById } = await import("./client");
    const { upsertDocumentType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("./clientType");
    const { listContactMethods } = await import("#svc/core/contactMethod");

    // Crear tipo de documento
    const [docType] = await upsertDocumentType({
      name: "Revert Contact Doc",
      code: "RCD",
      isEnabled: true,
      appliesToPerson: true,
      appliesToCompany: false,
    });

    // Crear tipo de cliente
    const [clientTypeRecord] = await upsertClientType({
      name: "Revert Contact Type",
      isEnabled: true,
    });

    const PHONE_A = "1234567890";
    const PHONE_B = "12345678900";

    // Paso 1: Crear cliente con teléfono A
    const initialPayload = {
      user: {
        documentTypeId: docType.id,
        documentNumber: "REVERT_CONTACT_001",
        person: {
          firstName: "Luis",
          lastName: "Martínez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        phone: PHONE_A,
      },
    };

    const createdClient = await upsertClient(initialPayload);

    // Verificar teléfono inicial A
    let loadedClient = await getClientById(createdClient.id);
    expect(loadedClient.contacts?.phone).toBe(PHONE_A);

    // Paso 2: Cambiar a teléfono B
    const updateToB = {
      id: createdClient.id,
      user: {
        id: createdClient.id,
        documentTypeId: docType.id,
        documentNumber: "REVERT_CONTACT_001",
        person: {
          firstName: "Luis",
          lastName: "Martínez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        phone: PHONE_B,
      },
    };

    await upsertClient(updateToB);

    // Verificar que cambió a B
    loadedClient = await getClientById(createdClient.id);
    expect(loadedClient.contacts?.phone).toBe(PHONE_B);

    // Paso 3: Volver al teléfono A (esto antes causaba error de duplicado)
    const revertToA = {
      id: createdClient.id,
      user: {
        id: createdClient.id,
        documentTypeId: docType.id,
        documentNumber: "REVERT_CONTACT_001",
        person: {
          firstName: "Luis",
          lastName: "Martínez",
        },
      },
      typeId: clientTypeRecord.id,
      active: true,
      contacts: {
        phone: PHONE_A, // Volver al valor original
      },
    };

    // No debe lanzar error
    await upsertClient(revertToA);

    // Verificar que volvió a A (el primario)
    loadedClient = await getClientById(createdClient.id);
    expect(loadedClient.contacts?.phone).toBe(PHONE_A);

    // Verificar que solo hay 1 teléfono PRIMARIO con valor A
    const contacts = await listContactMethods({
      userId: createdClient.id,
      isActive: true,
    });
    const primaryPhones = contacts.filter((c) => c.type === "phone" && c.isPrimary);
    expect(primaryPhones.length).toBe(1);
    expect(primaryPhones[0].value).toBe(PHONE_A);
  });
});
