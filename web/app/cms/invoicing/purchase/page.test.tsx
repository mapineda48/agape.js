import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import PurchaseInvoicesPage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts)
import { listPurchaseInvoices } from "@agape/finance/purchase_invoice";
import { listSuppliers } from "@agape/purchasing/supplier";

// Types
import type { PurchaseInvoiceListItem } from "@utils/dto/finance/purchase_invoice";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";
import Decimal from "@utils/data/Decimal";

// Mock de notificaciones
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: vi.fn(() => vi.fn()),
}));

describe("PurchaseInvoicesPage", () => {
    let router: HistoryManager;

    // Mock data
    const mockInvoices: PurchaseInvoiceListItem[] = [
        {
            id: 1,
            supplierId: 1,
            supplierName: "Proveedor ABC",
            issueDate: "2024-01-15",
            totalAmount: new Decimal("1500.00"),
            documentNumberFull: "FP-001",
        },
        {
            id: 2,
            supplierId: 2,
            supplierName: "Proveedor XYZ",
            issueDate: "2024-01-16",
            totalAmount: new Decimal("2500.50"),
            documentNumberFull: "FP-002",
        },
    ];

    const mockSuppliers: SupplierListItem[] = [
        {
            id: 1,
            documentNumber: "123456789",
            documentTypeName: "NIT",
            firstName: null,
            lastName: null,
            legalName: "Proveedor ABC S.A.S.",
            active: true,
        },
        {
            id: 2,
            documentNumber: "987654321",
            documentTypeName: "CC",
            firstName: "Juan",
            lastName: "Pérez",
            legalName: null,
            active: true,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        router = new HistoryManager();

        // Setup router spies
        vi.spyOn(router, "navigateTo");
        vi.spyOn(router, "listenPath").mockReturnValue(() => { });
    });

    const renderPage = (props = {}) => {
        const defaultProps = {
            invoices: mockInvoices,
            totalCount: mockInvoices.length,
            suppliers: mockSuppliers,
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
                        createElement(PurchaseInvoicesPage, defaultProps)
                    )
                )
            )
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Facturas de Compra")).toBeInTheDocument();
        });

        it("should render the page description", () => {
            renderPage();
            expect(
                screen.getByText(
                    "Gestiona tus facturas de proveedores y cuentas por pagar"
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
            expect(screen.getByText("FP-001")).toBeInTheDocument();
            expect(screen.getByText("FP-002")).toBeInTheDocument();
            expect(screen.getByText("Proveedor ABC")).toBeInTheDocument();
            expect(screen.getByText("Proveedor XYZ")).toBeInTheDocument();
        });

        it("should render empty state when no invoices", () => {
            renderPage({ invoices: [], totalCount: 0 });
            expect(
                screen.getByText("No se encontraron facturas de compra")
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

        it("should render supplier filter", () => {
            renderPage();
            expect(screen.getByLabelText("Proveedor")).toBeInTheDocument();
        });

        it("should render date filter", () => {
            renderPage();
            expect(screen.getByLabelText("Desde")).toBeInTheDocument();
        });

        it("should call listPurchaseInvoices when supplier filter changes", async () => {
            (listPurchaseInvoices as ReturnType<typeof vi.fn>).mockResolvedValue({
                invoices: [],
                totalCount: 0,
            });

            renderPage();

            const supplierSelect = screen.getByLabelText("Proveedor");
            fireEvent.change(supplierSelect, { target: { value: "1" } });

            await waitFor(() => {
                expect(listPurchaseInvoices).toHaveBeenCalledWith(
                    expect.objectContaining({ supplierId: 1 })
                );
            });
        });

        it("should reset filters when 'Limpiar Filtros' button is clicked", async () => {
            (listPurchaseInvoices as ReturnType<typeof vi.fn>).mockResolvedValue({
                invoices: mockInvoices,
                totalCount: mockInvoices.length,
            });

            renderPage();

            const resetButton = screen.getByRole("button", {
                name: /Limpiar Filtros/i,
            });
            fireEvent.click(resetButton);

            await waitFor(() => {
                expect(listPurchaseInvoices).toHaveBeenCalledWith(
                    expect.objectContaining({
                        supplierId: undefined,
                        fromDate: undefined,
                        toDate: undefined,
                    })
                );
            });
        });
    });

    describe("Navigation", () => {
        it("should navigate to new invoice page when 'Nueva Factura' is clicked", () => {
            renderPage();

            const newButton = screen.getByRole("button", { name: /Nueva Factura/i });
            fireEvent.click(newButton);

            expect(router.navigateTo).toHaveBeenCalled();
        });

        it("should navigate to invoice detail when row is clicked", () => {
            renderPage();

            const firstRow = screen.getByText("FP-001").closest("tr");
            if (firstRow) {
                fireEvent.click(firstRow);
            }

            expect(router.navigateTo).toHaveBeenCalled();
        });

        it("should navigate to invoice detail when 'Ver' button is clicked", () => {
            renderPage();

            const viewButtons = screen.getAllByRole("button", { name: /Ver/i });
            fireEvent.click(viewButtons[0]);

            expect(router.navigateTo).toHaveBeenCalled();
        });
    });

    describe("Formatting", () => {
        it("should format currency correctly", () => {
            renderPage();
            // Check if the amount is formatted
            expect(screen.getByText(/1\.500,00/)).toBeInTheDocument();
        });

        it("should format dates correctly", () => {
            renderPage();
            // Dates should be formatted in Spanish locale
            expect(screen.getByText(/15 ene 2024/i)).toBeInTheDocument();
        });
    });
});
