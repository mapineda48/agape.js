import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let clientId: number;
let taxId19: number;
let taxIdExempt: number;
let itemId1: number;
let itemId2: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_sales_invoice_${uuid}`,
    env: "vitest",
    skipSeeds: true,
  });

  const { upsertDocumentType } = await import("#svc/core/documentType");
  const { upsertClientType } = await import("#svc/crm/clientType");
  const { upsertClient } = await import("#svc/crm/client");
  const { upsertDocumentType: upsertBusinessDocType } = await import(
    "#svc/numbering/documentType"
  );
  const { upsertDocumentSeries } = await import(
    "#svc/numbering/documentSeries"
  );
  const { upsertTax } = await import("#svc/finance/tax_group");
  const { SALES_INVOICE_DOCUMENT_TYPE_CODE } = await import("./sales_invoice");

  // Crear UoM para items (requerido por catalogs/item)
  const { db } = await import("#lib/db");
  const { unitOfMeasure } = await import("#models/inventory/unit_of_measure");
  const [uom] = await db
    .insert(unitOfMeasure)
    .values({
      code: `UND-${uuid.slice(0, 6)}`,
      fullName: "Unidad",
      isEnabled: true,
    })
    .returning();

  // Crear tipo de documento para identificación
  const [documentType] = await upsertDocumentType({
    name: `CC-${uuid.slice(0, 6)}`,
    code: `DOC-${uuid.slice(0, 6)}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: true,
  });

  // Crear tipo de cliente
  const [clientType] = await upsertClientType({
    name: "Cliente Regular",
    isEnabled: true,
  });

  // Crear cliente activo
  const activeClient = await upsertClient({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `CLI-${uuid.slice(0, 6)}`,
      person: { firstName: "Cliente", lastName: "Test" },
    },
    typeId: clientType.id,
    active: true,
  });
  clientId = activeClient.id;

  // Crear impuestos
  const [tax19] = await upsertTax({
    code: `IVA19-${uuid.slice(0, 4)}`,
    fullName: "IVA 19%",
    rate: new Decimal("19.00"),
    isEnabled: true,
  });
  taxId19 = tax19.id;

  const [taxEx] = await upsertTax({
    code: `EXENTO-${uuid.slice(0, 4)}`,
    fullName: "Exento",
    rate: new Decimal("0"),
    isEnabled: true,
  });
  taxIdExempt = taxEx.id;

  // Crear items de catálogo
  const { item } = await import("#models/catalogs/item");
  const [item1] = await db
    .insert(item)
    .values({
      code: `ITEM1-${uuid.slice(0, 6)}`,
      fullName: "Producto Test 1",
      basePrice: new Decimal("100.00"),
      isEnabled: true,
      type: "good",
      images: [],
    })
    .returning();
  itemId1 = item1.id;

  const [item2] = await db
    .insert(item)
    .values({
      code: `ITEM2-${uuid.slice(0, 6)}`,
      fullName: "Producto Test 2",
      basePrice: new Decimal("250.00"),
      isEnabled: true,
      type: "good",
      images: [],
    })
    .returning();
  itemId2 = item2.id;

  // Crear tipo de documento de negocio para facturas de venta
  const salesInvoiceDocType = await upsertBusinessDocType({
    code: SALES_INVOICE_DOCUMENT_TYPE_CODE,
    name: "Factura de Venta",
    isEnabled: true,
  });

  // Crear serie de documentos para facturas de venta
  await upsertDocumentSeries({
    documentTypeId: salesInvoiceDocType.id,
    seriesCode: `SI-SERIE-${uuid.slice(0, 6)}`,
    prefix: "FV-",
    suffix: "",
    startNumber: 1,
    endNumber: 99999,
    validFrom: new DateTime("2024-01-01"),
    validTo: new DateTime("2030-12-31"),
    isActive: true,
    isDefault: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("createSalesInvoice service", () => {
  it("crea una factura de venta con líneas y numeración asignada", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    const invoice = await createSalesInvoice({
      clientId,
      issueDate: new DateTime("2024-01-15"),
      dueDate: new DateTime("2024-02-15"),
      items: [
        {
          itemId: itemId1,
          quantity: 2,
          unitPrice: new Decimal("100.00"),
          taxId: taxId19,
        },
        {
          itemId: itemId2,
          quantity: 1,
          unitPrice: new Decimal("250.00"),
          taxId: taxIdExempt,
        },
      ],
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.clientId).toBe(clientId);
    expect(invoice.status).toBe("draft");
    // Verificar campos de numeración
    expect(invoice.seriesId).toBeDefined();
    expect(invoice.documentNumber).toBeDefined();
    expect(invoice.documentNumber).toBeGreaterThan(0);
    expect(invoice.documentNumberFull).toBeDefined();
    expect(invoice.documentNumberFull).toContain("FV-");
  });

  it("rechaza factura sin líneas", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    await expect(
      createSalesInvoice({
        clientId,
        items: [],
      })
    ).rejects.toThrow("La factura debe tener al menos una línea");
  });

  it("rechaza cliente inexistente", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    await expect(
      createSalesInvoice({
        clientId: 999999,
        items: [
          {
            itemId: itemId1,
            quantity: 1,
            unitPrice: "100.00",
          },
        ],
      })
    ).rejects.toThrow("El cliente no existe");
  });

  it("rechaza item inexistente", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    await expect(
      createSalesInvoice({
        clientId,
        items: [
          {
            itemId: 999999,
            quantity: 1,
            unitPrice: "100.00",
          },
        ],
      })
    ).rejects.toThrow("El item con ID 999999 no existe");
  });
});

describe("postSalesInvoice service (UC-13)", () => {
  describe("Validaciones de posteo", () => {
    it("no permite postear si faltan líneas", async () => {
      const { postSalesInvoice } = await import("./sales_invoice");
      const { db } = await import("#lib/db");
      const sales_invoice = (await import("#models/finance/sales_invoice"))
        .default;
      const { documentSeries } = await import(
        "#models/numbering/document_series"
      );
      const { eq } = await import("drizzle-orm");

      // Obtener serie existente
      const [series] = await db.select().from(documentSeries).limit(1);

      // Crear factura sin líneas directamente en BD (simulando un estado corrupto)
      const [emptyInvoice] = await db
        .insert(sales_invoice)
        .values({
          clientId,
          issueDate: "2024-01-15",
          status: "draft",
          subtotal: new Decimal(0),
          globalDiscountPercent: new Decimal(0),
          globalDiscountAmount: new Decimal(0),
          taxAmount: new Decimal(0),
          totalAmount: new Decimal(0),
          seriesId: series.id,
          documentNumber: 99998,
        })
        .returning();

      await expect(postSalesInvoice(emptyInvoice.id)).rejects.toThrow(
        "No se puede postear una factura sin líneas"
      );

      // Limpiar
      await db
        .delete(sales_invoice)
        .where(eq(sales_invoice.id, emptyInvoice.id));
    });

    it("posteo idempotente / doble post no permitido", async () => {
      const { createSalesInvoice, postSalesInvoice } = await import(
        "./sales_invoice"
      );

      // Crear factura
      const invoice = await createSalesInvoice({
        clientId,
        items: [
          {
            itemId: itemId1,
            quantity: 1,
            unitPrice: new Decimal("100.00"),
          },
        ],
      });

      // Primer posteo - debe funcionar
      const result1 = await postSalesInvoice(invoice.id);
      expect(result1.previousStatus).toBe("draft");
      expect(result1.newStatus).toBe("issued");

      // Segundo posteo - debe fallar
      await expect(postSalesInvoice(invoice.id)).rejects.toThrow(
        "La factura ya fue posteada"
      );
    });

    it("rechaza factura inexistente", async () => {
      const { postSalesInvoice } = await import("./sales_invoice");

      await expect(postSalesInvoice(999999)).rejects.toThrow(
        "Factura de venta no encontrada"
      );
    });
  });

  describe("Cálculo de totales", () => {
    it("calcula totales correctos sin descuento ni impuestos", async () => {
      const { createSalesInvoice, postSalesInvoice } = await import(
        "./sales_invoice"
      );

      const invoice = await createSalesInvoice({
        clientId,
        items: [
          {
            itemId: itemId1,
            quantity: 3,
            unitPrice: new Decimal("100.00"),
            taxId: taxIdExempt, // Sin impuesto
          },
        ],
      });

      const result = await postSalesInvoice(invoice.id);

      // Subtotal: 3 * 100 = 300
      expect(result.subtotal.toString()).toBe("300");
      expect(result.globalDiscountAmount.toString()).toBe("0");
      expect(result.taxAmount.toString()).toBe("0");
      expect(result.totalAmount.toString()).toBe("300");
    });

    it("calcula totales correctos incluyendo impuestos (IVA 19%)", async () => {
      const { createSalesInvoice, postSalesInvoice, getSalesInvoiceById } =
        await import("./sales_invoice");

      const invoice = await createSalesInvoice({
        clientId,
        items: [
          {
            itemId: itemId1,
            quantity: 2,
            unitPrice: new Decimal("100.00"),
            taxId: taxId19, // IVA 19%
          },
        ],
      });

      const result = await postSalesInvoice(invoice.id);

      // Subtotal: 2 * 100 = 200
      // Impuesto: 200 * 19% = 38
      // Total: 200 + 38 = 238
      expect(result.subtotal.toString()).toBe("200");
      expect(result.taxAmount.toString()).toBe("38");
      expect(result.totalAmount.toString()).toBe("238");

      // Verificar que los detalles coinciden
      const details = await getSalesInvoiceById(invoice.id);
      expect(details).toBeDefined();
      expect(details!.status).toBe("issued");
      expect(details!.totalAmount.toString()).toBe("238");
    });

    it("calcula totales con múltiples líneas y diferentes impuestos", async () => {
      const { createSalesInvoice, postSalesInvoice } = await import(
        "./sales_invoice"
      );

      const invoice = await createSalesInvoice({
        clientId,
        items: [
          {
            itemId: itemId1,
            quantity: 2,
            unitPrice: new Decimal("100.00"),
            taxId: taxId19, // IVA 19%: subtotal 200, tax 38
          },
          {
            itemId: itemId2,
            quantity: 1,
            unitPrice: new Decimal("250.00"),
            taxId: taxIdExempt, // Exento: subtotal 250, tax 0
          },
        ],
      });

      const result = await postSalesInvoice(invoice.id);

      // Subtotal: 200 + 250 = 450
      // Impuesto: 38 + 0 = 38
      // Total: 450 + 38 = 488
      expect(result.subtotal.toString()).toBe("450");
      expect(result.taxAmount.toString()).toBe("38");
      expect(result.totalAmount.toString()).toBe("488");
    });

    it("calcula totales con descuento por línea", async () => {
      const { createSalesInvoice, postSalesInvoice } = await import(
        "./sales_invoice"
      );

      const invoice = await createSalesInvoice({
        clientId,
        items: [
          {
            itemId: itemId1,
            quantity: 1,
            unitPrice: new Decimal("100.00"),
            discountPercent: new Decimal("10"), // 10% descuento
            taxId: taxId19,
          },
        ],
      });

      const result = await postSalesInvoice(invoice.id);

      // Bruto: 1 * 100 = 100
      // Descuento línea: 100 * 10% = 10
      // Subtotal línea: 100 - 10 = 90
      // Impuesto: 90 * 19% = 17.1
      // Total: 90 + 17.1 = 107.1
      expect(result.subtotal.toString()).toBe("90");
      expect(result.taxAmount.toString()).toBe("17.1");
      expect(result.totalAmount.toString()).toBe("107.1");
    });

    it("calcula totales con descuento global", async () => {
      const { createSalesInvoice, postSalesInvoice } = await import(
        "./sales_invoice"
      );

      const invoice = await createSalesInvoice({
        clientId,
        globalDiscountPercent: new Decimal("5"), // 5% descuento global
        items: [
          {
            itemId: itemId1,
            quantity: 2,
            unitPrice: new Decimal("100.00"),
            taxId: taxId19,
          },
        ],
      });

      const result = await postSalesInvoice(invoice.id);

      // Subtotal líneas: 2 * 100 = 200
      // Impuesto (antes de descuento global): 200 * 19% = 38
      // Descuento global: 200 * 5% = 10
      // Total: (200 - 10) + 38 = 228
      expect(result.subtotal.toString()).toBe("200");
      expect(result.globalDiscountAmount.toString()).toBe("10");
      expect(result.taxAmount.toString()).toBe("38");
      expect(result.totalAmount.toString()).toBe("228");
    });
  });

  describe("Cambio de estado", () => {
    it("cambia estado de Draft a Issued correctamente", async () => {
      const { createSalesInvoice, postSalesInvoice, getSalesInvoiceById } =
        await import("./sales_invoice");

      const invoice = await createSalesInvoice({
        clientId,
        items: [
          {
            itemId: itemId1,
            quantity: 1,
            unitPrice: new Decimal("50.00"),
          },
        ],
      });

      expect(invoice.status).toBe("draft");

      const result = await postSalesInvoice(invoice.id);
      expect(result.previousStatus).toBe("draft");
      expect(result.newStatus).toBe("issued");

      // Verificar en BD
      const details = await getSalesInvoiceById(invoice.id);
      expect(details?.status).toBe("issued");
    });
  });
});

describe("getSalesInvoiceById service", () => {
  it("retorna una factura de venta con sus detalles y líneas", async () => {
    const { createSalesInvoice, postSalesInvoice, getSalesInvoiceById } =
      await import("./sales_invoice");

    const created = await createSalesInvoice({
      clientId,
      items: [
        {
          itemId: itemId1,
          quantity: 2,
          unitPrice: new Decimal("100.00"),
          taxId: taxId19,
        },
      ],
      notes: "Nota de prueba",
    });

    // Postear para tener totales calculados
    await postSalesInvoice(created.id);

    const invoice = await getSalesInvoiceById(created.id);

    expect(invoice).toBeDefined();
    expect(invoice?.id).toBe(created.id);
    expect(invoice?.clientId).toBe(clientId);
    expect(invoice?.clientName).toContain("Cliente");
    expect(invoice?.documentNumberFull).toBeDefined();
    expect(invoice?.documentNumberFull).toContain("FV-");
    expect(invoice?.status).toBe("issued");
    expect(invoice?.notes).toBe("Nota de prueba");

    // Verificar líneas
    expect(invoice?.items).toHaveLength(1);
    expect(invoice?.items[0].itemId).toBe(itemId1);
    expect(invoice?.items[0].quantity.toString()).toBe("2");
  });

  it("retorna undefined para factura inexistente", async () => {
    const { getSalesInvoiceById } = await import("./sales_invoice");

    const invoice = await getSalesInvoiceById(999999);
    expect(invoice).toBeUndefined();
  });
});

describe("listSalesInvoices service", () => {
  it("lista facturas de venta con paginación", async () => {
    const { createSalesInvoice, postSalesInvoice, listSalesInvoices } =
      await import("./sales_invoice");

    await createSalesInvoice({
      clientId,
      items: [
        {
          itemId: itemId1,
          quantity: 1,
          unitPrice: "500.00",
        },
      ],
    });

    const result = await listSalesInvoices({
      pageIndex: 0,
      pageSize: 10,
      includeTotalCount: true,
    });

    expect(result.invoices).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.invoices.every((i) => i.clientName !== undefined)).toBe(true);
    expect(
      result.invoices.every((i) => i.documentNumberFull !== undefined)
    ).toBe(true);
    expect(result.invoices.every((i) => i.status !== undefined)).toBe(true);
  });

  it("filtra por cliente", async () => {
    const { listSalesInvoices } = await import("./sales_invoice");

    const result = await listSalesInvoices({
      clientId,
    });

    expect(result.invoices.every((i) => i.clientId === clientId)).toBe(true);
  });

  it("filtra por estado", async () => {
    const { listSalesInvoices } = await import("./sales_invoice");

    const result = await listSalesInvoices({
      status: "draft",
    });

    expect(result.invoices.every((i) => i.status === "draft")).toBe(true);
  });
});
