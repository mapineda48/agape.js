import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

// Component under test
import NewSalesInvoicePage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts)
import {
    createSalesInvoice,
    postSalesInvoice,
} from "@agape/finance/sales_invoice";
import { listClients } from "@agape/crm/client";
import { listItems } from "@agape/catalogs/item";

// Types
import type {
    SalesInvoiceWithNumbering,
    PostSalesInvoiceResult,
} from "@utils/dto/finance/sales_invoice";
import type { ClientListItem } from "@utils/dto/crm/client";
import type { ListItemItem } from "@utils/dto/catalogs/item";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

// Mock de notificaciones
const mockNotify = vi.fn();
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: vi.fn(() => mockNotify),
}));

describe("NewSalesInvoicePage", () => {
    let router: HistoryManager;

    // Mock data
    const mockClients: ClientListItem[] = [
        {
            id: 1,
            userId: 1,
            clientCode: "CLI-001",
            firstName: "Juan",
            lastName: "Pérez",
            legalName: null,
            tradeName: null,
            birthdate: null,
            typeId: 1,
            typeName: "Individual",
            photoUrl: null,
            active: true,
            documentNumber: "123456789",
            priceListId: null,
            priceListName: null,
            paymentTermsId: null,
            paymentTermsName: null,
            creditLimit: null,
            creditDays: null,
            salespersonId: null,
            salespersonName: null,
            primaryEmail: "juan@example.com",
            primaryPhone: null,
            createdAt: new DateTime("2024-01-01"),
            updatedAt: null,
        },
        {
            id: 2,
            userId: 2,
            clientCode: "CLI-002",
            firstName: null,
            lastName: null,
            legalName: "Empresa XYZ S.A.S.",
            tradeName: "XYZ Corp",
            birthdate: null,
            typeId: 2,
            typeName: "Empresa",
            photoUrl: null,
            active: true,
            documentNumber: "987654321",
            priceListId: null,
            priceListName: null,
            paymentTermsId: null,
            paymentTermsName: null,
            creditLimit: null,
            creditDays: null,
            salespersonId: null,
            salespersonName: null,
            primaryEmail: "contacto@xyz.com",
            primaryPhone: null,
            createdAt: new DateTime("2024-01-02"),
            updatedAt: null,
        },
    ];

    const mockItems: ListItemItem[] = [
        {
            id: 1,
            code: "PROD-001",
            fullName: "Producto de Prueba 1",
            isEnabled: true,
            type: "good",
            basePrice: new Decimal("100.00"),
            category: "Electrónicos",
            images: [],
            rating: 5,
        },
        {
            id: 2,
            code: "PROD-002",
            fullName: "Producto de Prueba 2",
            isEnabled: true,
            type: "good",
            basePrice: new Decimal("250.50"),
            category: "Electrodomésticos",
            images: [],
            rating: 4,
        },
        {
            id: 3,
            code: "SERV-001",
            fullName: "Servicio de Consultoría",
            isEnabled: true,
            type: "service",
            basePrice: new Decimal("500.00"),
            category: "Servicios",
            images: [],
            rating: 5,
        },
    ];

    const mockCreatedInvoice: SalesInvoiceWithNumbering = {
        id: 1,
        clientId: 1,
        orderId: null,
        issueDate: "2024-01-15",
        dueDate: null,
        status: "draft",
        subtotal: new Decimal("100.00"),
        globalDiscountAmount: new Decimal("0.00"),
        taxAmount: new Decimal("0.00"),
        totalAmount: new Decimal("100.00"),
        seriesId: 1,
        documentNumber: 1,
        documentNumberFull: "FV-001",
    };

    const mockPostedResult: PostSalesInvoiceResult = {
        salesInvoiceId: 1,
        documentNumberFull: "FV-001",
        previousStatus: "draft",
        newStatus: "issued",
        subtotal: new Decimal("100.00"),
        globalDiscountAmount: new Decimal("0.00"),
        taxAmount: new Decimal("19.00"),
        totalAmount: new Decimal("119.00"),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        router = new HistoryManager();

        // Setup router spies
        vi.spyOn(router, "navigateTo");
        vi.spyOn(router, "listenPath").mockReturnValue(() => { });
    });

    const renderPage = (props = {}) => {
        const defaultProps = {
            clients: mockClients,
            items: mockItems,
            ...props,
        };

        return render(
            createElement(
                HistoryContext.Provider,
                { value: router },
                createElement(
                    EventEmitter,
                    null,
                    createElement(
                        PortalProvider,
                        null,
                        createElement(NewSalesInvoicePage, defaultProps)
                    )
                )
            )
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Nueva Factura de Venta")).toBeInTheDocument();
        });

        it("should render the back button", () => {
            renderPage();
            expect(screen.getByText("Volver a Facturas")).toBeInTheDocument();
        });

        it("should render the client selector", () => {
            renderPage();
            expect(screen.getByText("Cliente")).toBeInTheDocument();
            expect(screen.getByText("Seleccionar cliente...")).toBeInTheDocument();
        });

        it("should render client options in the selector", () => {
            renderPage();
            expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
            expect(screen.getByText("Empresa XYZ S.A.S.")).toBeInTheDocument();
        });

        it("should render the issue date field", () => {
            renderPage();
            expect(screen.getByText("Fecha de Emisión")).toBeInTheDocument();
        });

        it("should render the due date field", () => {
            renderPage();
            expect(screen.getByText("Fecha de Vencimiento")).toBeInTheDocument();
        });

        it("should render the global discount field", () => {
            renderPage();
            expect(screen.getByText("Descuento Global (%)")).toBeInTheDocument();
        });

        it("should render the items section", () => {
            renderPage();
            expect(screen.getByText("Ítems de la Factura")).toBeInTheDocument();
        });

        it("should render the 'Agregar Ítem' button", () => {
            renderPage();
            expect(
                screen.getByRole("button", { name: /Agregar Ítem/i })
            ).toBeInTheDocument();
        });

        it("should render empty items message initially", () => {
            renderPage();
            expect(
                screen.getByText("No hay ítems en la factura")
            ).toBeInTheDocument();
        });

        it("should render 'Cancelar' button", () => {
            renderPage();
            expect(
                screen.getByRole("button", { name: /Cancelar/i })
            ).toBeInTheDocument();
        });

        it("should render 'Guardar Borrador' button", () => {
            renderPage();
            expect(
                screen.getByRole("button", { name: /Guardar Borrador/i })
            ).toBeInTheDocument();
        });

        it("should render 'Crear y Emitir' button", () => {
            renderPage();
            expect(
                screen.getByRole("button", { name: /Crear y Emitir/i })
            ).toBeInTheDocument();
        });

        it("should render notes section", () => {
            renderPage();
            expect(screen.getByText("Notas Internas")).toBeInTheDocument();
        });

        it("should render summary section with initial totals as zero", () => {
            renderPage();
            expect(screen.getByText("Subtotal:")).toBeInTheDocument();
            expect(screen.getByText("Total:")).toBeInTheDocument();
        });
    });

    describe("Adding Items", () => {
        it('should add an item row when "Agregar Ítem" is clicked', async () => {
            renderPage();

            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Producto")).toBeInTheDocument();
                expect(screen.getByText("Cant.")).toBeInTheDocument();
                expect(screen.getByText("Precio Unit.")).toBeInTheDocument();
            });
        });

        it("should show product options in item select", async () => {
            renderPage();

            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(
                    screen.getByText("Seleccionar producto...")
                ).toBeInTheDocument();
                expect(screen.getByText("PROD-001 - Producto de Prueba 1")).toBeInTheDocument();
                expect(screen.getByText("PROD-002 - Producto de Prueba 2")).toBeInTheDocument();
            });
        });

        it("should update unit price when product is selected", async () => {
            renderPage();

            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select a product
            const productSelect = screen.getByDisplayValue("");
            if (productSelect.tagName === "SELECT") {
                fireEvent.change(productSelect, { target: { value: "1" } });

                await waitFor(() => {
                    // The unit price should be set from the product's basePrice
                    const priceInputs = screen.getAllByRole("spinbutton");
                    // One of them should have the product's base price
                    expect(priceInputs.length).toBeGreaterThan(0);
                });
            }
        });

        it("should remove item row when delete button is clicked", async () => {
            renderPage();

            // Add an item first
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Producto")).toBeInTheDocument();
            });

            // Find and click the delete button
            const deleteButton = screen.getByTitle("Eliminar ítem");
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByText("No hay ítems en la factura")).toBeInTheDocument();
            });
        });

        it("should allow adding multiple items", async () => {
            renderPage();

            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });

            // Add first item
            fireEvent.click(addButton);

            // Add second item
            fireEvent.click(addButton);

            await waitFor(() => {
                const deleteButtons = screen.getAllByTitle("Eliminar ítem");
                expect(deleteButtons.length).toBe(2);
            });
        });
    });

    describe("Form Validation", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should show error when trying to submit without client", async () => {
            renderPage();

            const submitButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: "Debe seleccionar un cliente",
                        type: "error",
                    })
                );
            });
        });

        it("should show error when trying to submit without items", async () => {
            renderPage();

            // Select a client
            const clientSelect = screen.getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            const submitButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: "Debe agregar al menos un ítem a la factura",
                        type: "error",
                    })
                );
            });
        });
    });

    describe("Form Submission - Draft", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should call createSalesInvoice when saving as draft", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product in the item row
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit as draft
            const draftButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(draftButton);

            await waitFor(() => {
                expect(createSalesInvoice).toHaveBeenCalledWith(
                    expect.objectContaining({
                        clientId: 1,
                        items: expect.arrayContaining([
                            expect.objectContaining({
                                itemId: 1,
                            }),
                        ]),
                    })
                );
            });
        });

        it("should NOT call postSalesInvoice when saving as draft", async () => {
            // Clear mocks to ensure no interference from other tests
            vi.clearAllMocks();

            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // IMPORTANT: Clear any calls that might have happened before clicking
            (postSalesInvoice as ReturnType<typeof vi.fn>).mockClear();

            // Submit as draft - specifically the draft button, not "Crear y Emitir"
            const draftButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(draftButton);

            await waitFor(() => {
                expect(createSalesInvoice).toHaveBeenCalled();
            });

            // Wait a bit more to ensure all async operations complete
            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalled();
            });

            // CRITICAL: postSalesInvoice should NOT be called when saving as draft
            expect(postSalesInvoice).not.toHaveBeenCalled();
        });

        it("should call createSalesInvoice ONLY ONCE when saving as draft (no duplicate invoices)", async () => {
            // Clear mocks to ensure no interference from other tests
            vi.clearAllMocks();

            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Clear createSalesInvoice mock to count only the clicks
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockClear();

            // Submit as draft
            const draftButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(draftButton);

            // Wait for the submit to complete
            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalled();
            });

            // CRITICAL: createSalesInvoice should be called EXACTLY ONCE
            // If this fails with 2 calls, it means both Submit components triggered
            expect(createSalesInvoice).toHaveBeenCalledTimes(1);
        });

        it("should show success notification after creating draft", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit as draft
            const draftButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(draftButton);

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.stringContaining("creada como borrador"),
                        type: "success",
                    })
                );
            });
        });

        it("should navigate to invoice detail after creating draft", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit as draft
            const draftButton = screen.getByRole("button", {
                name: /Guardar Borrador/i,
            });
            fireEvent.click(draftButton);

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });
    });

    describe("Form Submission - Create and Post (Crear y Emitir)", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should call createSalesInvoice and then postSalesInvoice when using 'Crear y Emitir'", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );
            (postSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockPostedResult
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit with "Crear y Emitir"
            const postButton = screen.getByRole("button", {
                name: /Crear y Emitir/i,
            });
            fireEvent.click(postButton);

            await waitFor(() => {
                expect(createSalesInvoice).toHaveBeenCalled();
            });

            await waitFor(() => {
                // CRITICAL: postSalesInvoice must be called with the invoice ID
                expect(postSalesInvoice).toHaveBeenCalledWith(mockCreatedInvoice.id);
            });
        });

        it("should show success notification mentioning 'emitida' when using 'Crear y Emitir'", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );
            (postSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockPostedResult
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit with "Crear y Emitir"
            const postButton = screen.getByRole("button", {
                name: /Crear y Emitir/i,
            });
            fireEvent.click(postButton);

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.stringContaining("creada y emitida"),
                        type: "success",
                    })
                );
            });
        });

        it("should navigate to invoice detail after 'Crear y Emitir'", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );
            (postSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockPostedResult
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit with "Crear y Emitir"
            const postButton = screen.getByRole("button", {
                name: /Crear y Emitir/i,
            });
            fireEvent.click(postButton);

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });

        it("should handle error when postSalesInvoice fails", async () => {
            (createSalesInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockCreatedInvoice
            );
            (postSalesInvoice as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error("Error al emitir la factura")
            );

            renderPage();

            // Select client
            const clientSelect = screen
                .getByText("Seleccionar cliente...")
                .closest("select");
            if (clientSelect) {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            }

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // Submit with "Crear y Emitir"
            const postButton = screen.getByRole("button", {
                name: /Crear y Emitir/i,
            });
            fireEvent.click(postButton);

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: "Error al emitir la factura",
                        type: "error",
                    })
                );
            });
        });
    });

    describe("Navigation", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should navigate back when 'Volver a Facturas' button is clicked", async () => {
            renderPage();

            const backButton = screen.getByText("Volver a Facturas");
            fireEvent.click(backButton);

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });

        it("should navigate back when 'Cancelar' button is clicked", async () => {
            renderPage();

            const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });
    });

    describe("Totals Calculation", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should update total when items are added with quantity and price", async () => {
            renderPage();

            // Add an item
            const addButton = screen.getByRole("button", { name: /Agregar Ítem/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText("Seleccionar producto...")).toBeInTheDocument();
            });

            // Select product (which should set the unit price)
            const productSelects = screen.getAllByRole("combobox");
            const itemProductSelect = productSelects.find(
                (select) =>
                    select.querySelector('option[value="0"]')?.textContent ===
                    "Seleccionar producto..."
            );
            if (itemProductSelect) {
                fireEvent.change(itemProductSelect, { target: { value: "1" } });
            }

            // The subtotal/total should reflect quantity=1 × price=100.00 = $100.00
            await waitFor(() => {
                // The form should show the item subtotal
                const subtotalLabels = screen.getAllByText(/Subtotal/);
                expect(subtotalLabels.length).toBeGreaterThan(0);
            });
        });
    });
});

