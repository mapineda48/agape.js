import DateTime from "#utils/data/DateTime";
import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let clientId: number;
let itemId: number;
let paymentMethodId: number;

beforeAll(async () => {
    const { default: initDatabase } = await import("#lib/db");
    const uuid = crypto.randomUUID();

    await initDatabase("postgresql://postgres:mypassword@localhost", {
        tenant: `vitest_finance_payment_${uuid}`,
        env: "vitest",
        skipSeeds: true,
    });

    const { db } = await import("#lib/db");
    const { upsertDocumentType: upsertCoreDocType } = await import("#svc/core/documentType");
    const { upsertClientType } = await import("#svc/crm/clientType");
    const { upsertClient } = await import("#svc/crm/client");
    const { upsertDocumentType: upsertBusDocType } = await import("#svc/numbering/documentType");
    const { upsertDocumentSeries } = await import("#svc/numbering/documentSeries");
    const { upsertItem } = await import("#svc/catalogs/item");
    const { upsertPaymentMethod } = await import("#svc/finance/payment_method");
    const { SALES_RECEIPT_DOCUMENT_TYPE_CODE } = await import("./payment");
    const { SALES_INVOICE_DOCUMENT_TYPE_CODE } = await import("./sales_invoice");

    // 1. Identity
    const [idDocType] = await upsertCoreDocType({
        code: "CC",
        name: "Cédula",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
    });

    // 2. Client
    const [clientType] = await upsertClientType({ name: "Regular", isEnabled: true });
    const activeClient = await upsertClient({
        user: {
            documentTypeId: idDocType.id,
            documentNumber: `CLI-${uuid.slice(0, 6)}`,
            person: { firstName: "Test", lastName: "Payment" },
        },
        typeId: clientType.id,
        active: true,
    });
    clientId = activeClient.id;

    // 3. Numbering for Receipts and Invoices
    const receiptDoc = await upsertBusDocType({ code: SALES_RECEIPT_DOCUMENT_TYPE_CODE, name: "RC", isEnabled: true });
    await upsertDocumentSeries({
        documentTypeId: receiptDoc.id,
        seriesCode: "RC-2024",
        prefix: "RC-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    const invoiceDoc = await upsertBusDocType({ code: SALES_INVOICE_DOCUMENT_TYPE_CODE, name: "FAC", isEnabled: true });
    await upsertDocumentSeries({
        documentTypeId: invoiceDoc.id,
        seriesCode: "FAC-2024",
        prefix: "FAC-",
        startNumber: 1,
        endNumber: 9999,
        validFrom: new DateTime("2024-01-01"),
        isActive: true,
        isDefault: true,
    });

    // 4. Item for invoices
    const unitOfMeasure = await import("#models/inventory/unit_of_measure");
    await db.insert(unitOfMeasure.default).values([{ id: 1, code: "UN", fullName: "Unidad", isEnabled: true }]);

    const itemRecord = await upsertItem({
        code: "ITEM-PAY",
        fullName: "Item Pago",
        isEnabled: true,
        basePrice: new Decimal("0"),
        images: [],
        good: { uomId: 1 }
    });
    itemId = (itemRecord as any).id;

    // 5. Payment Method
    const { paymentMethod } = await import("#models/finance/payment_method");
    const [pm] = await db.insert(paymentMethod).values({
        code: "CASH",
        fullName: "Efectivo",
        isEnabled: true
    }).returning();
    paymentMethodId = pm.id;
});

afterAll(async () => {
    const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
    const { db } = await import("#lib/db");
    const { default: config } = await import("#lib/db/schema/config");
    await deleteSchema(config.schemaName, db.$client);
    await db.$client.end();
});

describe("Payment Service", () => {
    it("debe crear un recaudo de cliente sin asignaciones iniciales", async () => {
        const { createPayment } = await import("./payment");

        const payment = await createPayment({
            type: "receipt",
            userId: clientId,
            paymentMethodId,
            amount: 50000,
            reference: "REF-001"
        });

        expect(payment.id).toBeDefined();
        expect(payment.status).toBe("draft"); // Registrado
        expect(Number(payment.amount)).toBe(50000);
        expect(Number(payment.unallocatedAmount)).toBe(50000);
        expect(payment.documentNumberFull).toContain("RC-");
    });

    it("debe aplicar un pago a una factura y actualizar su estado", async () => {
        const { createSalesInvoice, postSalesInvoice, getSalesInvoiceById } = await import("./sales_invoice");
        const { createPayment } = await import("./payment");

        // 1. Crear y postear una factura de $10.000
        const invoice = await createSalesInvoice({
            clientId,
            items: [{ itemId, quantity: 1, unitPrice: 10000 }]
        });
        await postSalesInvoice(invoice.id);

        // 2. Crear un pago de $10.000 asignado a esa factura
        const payment = await createPayment({
            type: "receipt",
            userId: clientId,
            paymentMethodId,
            amount: 10000,
            allocations: [
                { invoiceId: invoice.id, amount: 10000 }
            ]
        });

        expect(payment.status).toBe("posted"); // Aplicado
        expect(Number(payment.unallocatedAmount)).toBe(0);

        // 3. Verificar estado de la factura
        const invoiceAfter = await getSalesInvoiceById(invoice.id);
        expect(invoiceAfter?.status).toBe("paid");
    });

    it("debe manejar pagos parciales correctamente", async () => {
        const { createSalesInvoice, postSalesInvoice, getSalesInvoiceById } = await import("./sales_invoice");
        const { createPayment } = await import("./payment");

        // 1. Factura de $10.000
        const invoice = await createSalesInvoice({
            clientId,
            items: [{ itemId, quantity: 1, unitPrice: 10000 }]
        });
        await postSalesInvoice(invoice.id);

        // 2. Abono de $4.000
        const p1 = await createPayment({
            type: "receipt",
            userId: clientId,
            paymentMethodId,
            amount: 4000,
            allocations: [{ invoiceId: invoice.id, amount: 4000 }]
        });

        const invAfterP1 = await getSalesInvoiceById(invoice.id);
        expect(invAfterP1?.status).toBe("partially_paid");

        // 3. Segundo abono de $6.000 (cierra la factura)
        await createPayment({
            type: "receipt",
            userId: clientId,
            paymentMethodId,
            amount: 7000, // Pago por más del saldo
            allocations: [{ invoiceId: invoice.id, amount: 6000 }]
        });

        const invAfterP2 = await getSalesInvoiceById(invoice.id);
        expect(invAfterP2?.status).toBe("paid");
    });

    it("debe rechazar asignaciones que excedan el monto del pago", async () => {
        const { createSalesInvoice, postSalesInvoice } = await import("./sales_invoice");
        const { createPayment } = await import("./payment");

        const invoice = await createSalesInvoice({ clientId, items: [{ itemId, quantity: 1, unitPrice: 100 }] });
        await postSalesInvoice(invoice.id);

        await expect(createPayment({
            type: "receipt",
            userId: clientId,
            paymentMethodId,
            amount: 50,
            allocations: [{ invoiceId: invoice.id, amount: 60 }]
        })).rejects.toThrow(/excede el monto disponible/);
    });
});
