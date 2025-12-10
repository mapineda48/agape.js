import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let orderId: number;

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_sales_invoice_${uuid}`,
    dev: false,
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
  const { SALES_ORDER_DOCUMENT_TYPE_CODE, createSalesOrder } = await import(
    "#svc/crm/order"
  );
  const { SALES_INVOICE_DOCUMENT_TYPE_CODE } = await import("./sales_invoice");

  // Create document type for identification
  const [documentType] = await upsertDocumentType({
    name: `CC-${uuid.slice(0, 6)}`,
    code: `DOC-${uuid.slice(0, 6)}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: true,
  });

  // Create client type
  const [clientType] = await upsertClientType({
    name: "Cliente Regular",
    isEnabled: true,
  });

  // Create active client
  const activeClient = await upsertClient({
    user: {
      documentTypeId: documentType.id,
      documentNumber: `CLI-${uuid.slice(0, 6)}`,
      person: { firstName: "Cliente", lastName: "Test" },
    },
    typeId: clientType.id,
    active: true,
  });

  // Create order type
  const { db } = await import("#lib/db");
  const orderType = await import("#models/crm/order_type");
  const [createdOrderType] = await db
    .insert(orderType.default)
    .values({
      name: "Venta Directa",
      disabled: false,
    })
    .returning();

  // Create business document type for sales orders
  const salesOrderDocType = await upsertBusinessDocType({
    code: SALES_ORDER_DOCUMENT_TYPE_CODE,
    name: "Orden de Venta",
    isEnabled: true,
  });

  // Create document series for sales order document type
  await upsertDocumentSeries({
    documentTypeId: salesOrderDocType.id,
    seriesCode: `SO-SERIE-${uuid.slice(0, 6)}`,
    prefix: "OV-",
    suffix: "",
    startNumber: 1,
    endNumber: 99999,
    validFrom: new DateTime("2024-01-01"),
    validTo: new DateTime("2030-12-31"),
    isActive: true,
    isDefault: true,
  });

  // Create business document type for sales invoices
  const salesInvoiceDocType = await upsertBusinessDocType({
    code: SALES_INVOICE_DOCUMENT_TYPE_CODE,
    name: "Factura de Venta",
    isEnabled: true,
  });

  // Create document series for sales invoice document type
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

  // Create a sales order to use in invoice tests
  const salesOrder = await createSalesOrder({
    clientId: activeClient.id,
    orderTypeId: createdOrderType.id,
  });

  // Store IDs for tests
  orderId = salesOrder.id;
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("createSalesInvoice service", () => {
  it("crea una factura de venta con numeración asignada", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    const invoice = await createSalesInvoice({
      orderId,
      issueDate: new DateTime("2024-01-15"),
      dueDate: new DateTime("2024-02-15"),
      totalAmount: new Decimal("1500.00"),
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.orderId).toBe(orderId);
    expect(invoice.totalAmount).toBeInstanceOf(Decimal);
    // Verificar campos de numeración
    expect(invoice.seriesId).toBeDefined();
    expect(invoice.documentNumber).toBeDefined();
    expect(invoice.documentNumber).toBeGreaterThan(0);
    expect(invoice.documentNumberFull).toBeDefined();
    expect(invoice.documentNumberFull).toContain("FV-");
  });

  it("rechaza montos inválidos", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    await expect(
      createSalesInvoice({
        orderId,
        totalAmount: 0,
      })
    ).rejects.toThrow("El monto total debe ser mayor a cero");

    await expect(
      createSalesInvoice({
        orderId,
        totalAmount: -100,
      })
    ).rejects.toThrow("El monto total debe ser mayor a cero");
  });

  it("rechaza órdenes inexistentes", async () => {
    const { createSalesInvoice } = await import("./sales_invoice");

    await expect(
      createSalesInvoice({
        orderId: 999999,
        totalAmount: "1000.00",
      })
    ).rejects.toThrow("La orden de venta no existe");
  });
});

describe("getSalesInvoiceById service", () => {
  it("retorna una factura de venta con sus detalles y número de documento", async () => {
    const { createSalesInvoice, getSalesInvoiceById } = await import(
      "./sales_invoice"
    );

    const created = await createSalesInvoice({
      orderId,
      totalAmount: "2500.00",
    });

    const invoice = await getSalesInvoiceById(created.id);

    expect(invoice).toBeDefined();
    expect(invoice?.id).toBe(created.id);
    expect(invoice?.orderId).toBe(orderId);
    expect(invoice?.orderDocumentNumber).toContain("OV-");
    expect(invoice?.clientName).toContain("Cliente");
    expect(invoice?.documentNumberFull).toBeDefined();
    expect(invoice?.documentNumberFull).toContain("FV-");
  });

  it("retorna undefined para factura inexistente", async () => {
    const { getSalesInvoiceById } = await import("./sales_invoice");

    const invoice = await getSalesInvoiceById(999999);
    expect(invoice).toBeUndefined();
  });
});

describe("listSalesInvoices service", () => {
  it("lista facturas de venta con paginación y número de documento", async () => {
    const { createSalesInvoice, listSalesInvoices } = await import(
      "./sales_invoice"
    );

    await createSalesInvoice({
      orderId,
      totalAmount: "500.00",
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
    expect(
      result.invoices.every((i) => i.orderDocumentNumber !== undefined)
    ).toBe(true);
  });

  it("filtra por orden", async () => {
    const { listSalesInvoices } = await import("./sales_invoice");

    const result = await listSalesInvoices({
      orderId,
    });

    expect(result.invoices.every((i) => i.orderId === orderId)).toBe(true);
  });
});
