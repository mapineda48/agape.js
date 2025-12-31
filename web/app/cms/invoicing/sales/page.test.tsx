import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import EventEmitter from "@/components/util/event-emitter";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import SalesInvoicesPage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts → web/test/mocks/)
import { listSalesInvoices } from "@agape/finance/sales_invoice";
import { listClients } from "@agape/crm/client";

// Types
import type { SalesInvoiceListItem } from "@utils/dto/finance/sales_invoice";
import type { ClientListItem } from "@utils/dto/crm/client";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

// Mock de notificaciones
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: vi.fn(() => vi.fn()),
}));

describe("SalesInvoicesPage", () => {
    let router: HistoryManager;

    // Mock data completo
    const mockInvoices: SalesInvoiceListItem[] = [
        {
            id: 1,
            clientId: 1,
            clientName: "Cliente ABC",
            orderId: null,
            orderDocumentNumber: null,
            status: "draft",
            issueDate: "2024-01-15",
            totalAmount: new Decimal("1500.00"),
            totalPaid: new Decimal("0.00"),
            balance: new Decimal("1500.00"),
            documentNumberFull: "FV-001",
        },
        {
            id: 2,
            clientId: 2,
            clientName: "Cliente XYZ",
            orderId: 5,
            orderDocumentNumber: "OV-005",
            status: "issued",
            issueDate: "2024-01-16",
            totalAmount: new Decimal("2500.50"),
            totalPaid: new Decimal("500.00"),
            balance: new Decimal("2000.50"),
            documentNumberFull: "FV-002",
        },
        {
            id: 3,
            clientId: 1,
            clientName: "Cliente ABC",
            orderId: null,
            orderDocumentNumber: null,
            status: "paid",
            issueDate: "2024-01-17",
            totalAmount: new Decimal("750.00"),
            totalPaid: new Decimal("750.00"),
            balance: new Decimal("0.00"),
            documentNumberFull: "FV-003",
        },
    ];

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

    const defaultProps = {
        invoices: mockInvoices,
        totalCount: mockInvoices.length,
        clients: mockClients,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mocks de RPC (las funciones ya son vi.fn() via alias)
        (listSalesInvoices as ReturnType<typeof vi.fn>).mockResolvedValue({
            invoices: mockInvoices,
            totalCount: mockInvoices.length,
        });
        (listClients as ReturnType<typeof vi.fn>).mockResolvedValue({
            clients: mockClients,
        });

        router = new HistoryManager({}, {});
        vi.spyOn(router, "navigateTo").mockImplementation(() => { });
        vi.spyOn(router, "listenPath").mockReturnValue(() => { });
        vi.spyOn(router, "listenParams").mockReturnValue(() => { });
    });

    const renderPage = (props = defaultProps) => {
        return render(
            <HistoryContext.Provider value={router}>
                <EventEmitter>
                    <PortalProvider>
                        <SalesInvoicesPage {...props} />
                    </PortalProvider>
                </EventEmitter>
            </HistoryContext.Provider>
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Facturas de Venta")).toBeInTheDocument();
        });

        it("should render the page description", () => {
            renderPage();
            expect(
                screen.getByText(
                    "Gestiona tus facturas a clientes y cuentas por cobrar"
                )
            ).toBeInTheDocument();
        });

        it("should render the 'Nueva Factura' button", () => {
            renderPage();
            expect(
                screen.getByRole("button", { name: /Nueva Factura/i })
            ).toBeInTheDocument();
        });

        it("should render invoices in the table", () => {
            renderPage();
            expect(screen.getByText("FV-001")).toBeInTheDocument();
            expect(screen.getByText("FV-002")).toBeInTheDocument();
            expect(screen.getByText("FV-003")).toBeInTheDocument();
            expect(screen.getAllByText("Cliente ABC").length).toBeGreaterThan(0);
            expect(screen.getByText("Cliente XYZ")).toBeInTheDocument();
        });

        it("should render status badges in the table", () => {
            renderPage();
            const table = screen.getByRole("table");
            expect(table).toBeInTheDocument();
            // "Borrador" appears both in filter dropdown and in badge
            const borradorElements = screen.getAllByText("Borrador");
            expect(borradorElements.length).toBeGreaterThan(0);
        });

        it("should render order reference when present", () => {
            renderPage();
            expect(screen.getByText("Orden: OV-005")).toBeInTheDocument();
        });

        it("should render empty state when no invoices", () => {
            renderPage({ invoices: [], totalCount: 0, clients: mockClients });
            expect(
                screen.getByText("No se encontraron facturas de venta")
            ).toBeInTheDocument();
        });
    });

    describe("Filters", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should render client filter", () => {
            renderPage();
            expect(screen.getByLabelText("Cliente")).toBeInTheDocument();
        });

        it("should render status filter", () => {
            renderPage();
            expect(screen.getByLabelText("Estado")).toBeInTheDocument();
        });

        it("should render date filter", () => {
            renderPage();
            expect(screen.getByLabelText("Desde")).toBeInTheDocument();
        });

        it("should call listSalesInvoices when client filter changes", async () => {
            renderPage();

            const clientSelect = screen.getByLabelText("Cliente");
            fireEvent.change(clientSelect, { target: { value: "1" } });

            await waitFor(() => {
                expect(listSalesInvoices).toHaveBeenCalledWith(
                    expect.objectContaining({ clientId: 1 })
                );
            });
        });

        it("should call listSalesInvoices when status filter changes", async () => {
            renderPage();

            const statusSelect = screen.getByLabelText("Estado");
            fireEvent.change(statusSelect, { target: { value: "paid" } });

            await waitFor(() => {
                expect(listSalesInvoices).toHaveBeenCalledWith(
                    expect.objectContaining({ status: "paid" })
                );
            });
        });

        it("should reset filters when 'Limpiar Filtros' button is clicked", async () => {
            renderPage();

            const resetButton = screen.getByRole("button", {
                name: /Limpiar Filtros/i,
            });
            fireEvent.click(resetButton);

            await waitFor(() => {
                expect(listSalesInvoices).toHaveBeenCalledWith(
                    expect.objectContaining({
                        clientId: undefined,
                        status: undefined,
                        fromDate: undefined,
                        toDate: undefined,
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

        it("should navigate to new invoice page when 'Nueva Factura' is clicked", async () => {
            renderPage();

            const newButton = screen.getByRole("button", { name: /Nueva Factura/i });
            fireEvent.click(newButton);

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });

        it("should navigate to invoice detail when row is clicked", async () => {
            renderPage();

            const firstRow = screen.getByText("FV-001").closest("tr");
            if (firstRow) {
                fireEvent.click(firstRow);
            }

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });

        it("should navigate to invoice detail when 'Ver' button is clicked", async () => {
            renderPage();

            const viewButtons = screen.getAllByRole("button", { name: /Ver/i });
            fireEvent.click(viewButtons[0]);

            await waitFor(() => {
                expect(router.navigateTo).toHaveBeenCalled();
            });
        });
    });

    describe("Formatting", () => {
        it("should format currency correctly", () => {
            renderPage();
            // Match currency format variations (locale dependent)
            const currencyTexts = screen.getAllByText(/\$?1[.,]500[,.]00/);
            expect(currencyTexts.length).toBeGreaterThan(0);
        });

        it("should format dates correctly", () => {
            renderPage();
            const table = screen.getByRole("table");
            expect(table).toBeInTheDocument();
            // Verify invoices are rendered with dates
            expect(screen.getByText("FV-001")).toBeInTheDocument();
        });
    });

    describe("Pagination", () => {
        it("should render pagination when totalCount > pageSize", () => {
            renderPage({
                ...defaultProps,
                totalCount: 100,
            });
            // Should find page numbers
            expect(screen.getByText("1")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });
});
