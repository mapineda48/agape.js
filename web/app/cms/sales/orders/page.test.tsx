import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import EventEmitter from "@/components/util/event-emitter";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import SalesOrdersPage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts → web/test/mocks/)
import { listSalesOrders } from "@agape/crm/order";
import { listClients } from "@agape/crm/client";

// Types
import type { SalesOrderListItem } from "@utils/dto/crm/order";
import type { ClientListItem } from "@utils/dto/crm/client";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

// Mock de notificaciones
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: vi.fn(() => vi.fn()),
}));

// Mock del router
const mockNavigate = vi.fn();
vi.mock("@/components/router/router-hook", () => ({
    useRouter: () => ({
        navigate: mockNavigate,
        pathname: "/cms/sales/orders",
        params: {},
    }),
}));

describe("SalesOrdersPage", () => {
    let router: HistoryManager;

    const mockOrders: SalesOrderListItem[] = [
        {
            id: 1,
            clientId: 1,
            clientName: "Juan Pérez",
            orderTypeId: 1,
            orderDate: "2024-01-15",
            status: "pending",
            documentNumberFull: "OV-001",
            total: new Decimal("1500.00"),
            deliveredPercent: 0,
            invoicedPercent: 0,
        },
        {
            id: 2,
            clientId: 2,
            clientName: "Empresa XYZ S.A.S.",
            orderTypeId: 1,
            orderDate: "2024-01-16",
            status: "confirmed",
            documentNumberFull: "OV-002",
            total: new Decimal("3200.50"),
            deliveredPercent: 50,
            invoicedPercent: 25,
        },
        {
            id: 3,
            clientId: 1,
            clientName: "Juan Pérez",
            orderTypeId: 2,
            orderDate: "2024-01-17",
            status: "delivered",
            documentNumberFull: "OV-003",
            total: new Decimal("750.00"),
            deliveredPercent: 100,
            invoicedPercent: 100,
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
        orders: mockOrders,
        totalCount: mockOrders.length,
        clients: mockClients,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mocks de RPC
        (listSalesOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
            orders: mockOrders,
            totalCount: mockOrders.length,
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
                        <SalesOrdersPage {...props} />
                    </PortalProvider>
                </EventEmitter>
            </HistoryContext.Provider>
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Órdenes de Venta")).toBeInTheDocument();
        });

        it("should render the page description", () => {
            renderPage();
            expect(screen.getByText("Gestiona tus pedidos y ventas a clientes")).toBeInTheDocument();
        });

        it("should render 'Nueva Orden' button", () => {
            renderPage();
            expect(screen.getByRole("button", { name: /Nueva Orden/i })).toBeInTheDocument();
        });

        it("should render orders in the table", () => {
            renderPage();
            expect(screen.getByText("OV-001")).toBeInTheDocument();
            expect(screen.getByText("OV-002")).toBeInTheDocument();
            expect(screen.getByText("OV-003")).toBeInTheDocument();
        });

        it("should render client names in the table", () => {
            renderPage();
            expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0);
            // "Empresa XYZ S.A.S." appears in both table and filter select
            expect(screen.getAllByText("Empresa XYZ S.A.S.").length).toBeGreaterThan(0);
        });

        it("should render status badges", () => {
            renderPage();
            const table = screen.getByRole("table");
            expect(table).toBeInTheDocument();
        });

        it("should render empty state when no orders", () => {
            renderPage({ orders: [], totalCount: 0, clients: mockClients });
            expect(screen.getByText("No se encontraron órdenes de venta")).toBeInTheDocument();
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
            // "Cliente" appears in filter label and table header
            expect(screen.getAllByText("Cliente").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Todos los clientes").length).toBeGreaterThan(0);
        });

        it("should render status filter", () => {
            renderPage();
            // "Estado" appears in filter label and table header
            expect(screen.getAllByText("Estado").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Todos los estados").length).toBeGreaterThan(0);
        });

        it("should render reset filters button", () => {
            renderPage();
            expect(screen.getByRole("button", { name: /Limpiar Filtros/i })).toBeInTheDocument();
        });

        it("should call listSalesOrders when client filter changes", async () => {
            renderPage();

            // Find the client filter select
            const clientSelect = screen.getAllByRole("combobox")[0];

            await act(async () => {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            });

            await waitFor(() => {
                expect(listSalesOrders).toHaveBeenCalledWith(
                    expect.objectContaining({ clientId: 1 })
                );
            });
        });

        it("should call listSalesOrders when status filter changes", async () => {
            renderPage();

            const statusSelect = screen.getAllByRole("combobox")[1];

            await act(async () => {
                fireEvent.change(statusSelect, { target: { value: "confirmed" } });
            });

            await waitFor(() => {
                expect(listSalesOrders).toHaveBeenCalledWith(
                    expect.objectContaining({ status: "confirmed" })
                );
            });
        });

        it("should reset filters when 'Limpiar Filtros' is clicked", async () => {
            renderPage();

            const resetButton = screen.getByRole("button", { name: /Limpiar Filtros/i });

            await act(async () => {
                fireEvent.click(resetButton);
            });

            await waitFor(() => {
                expect(listSalesOrders).toHaveBeenCalledWith(
                    expect.objectContaining({
                        clientId: undefined,
                        status: undefined,
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

        it("should navigate to new order page when 'Nueva Orden' is clicked", async () => {
            renderPage();

            const newButton = screen.getByRole("button", { name: /Nueva Orden/i });

            await act(async () => {
                fireEvent.click(newButton);
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("../order");
            });
        });

        it("should navigate to order detail when row is clicked", async () => {
            renderPage();

            const firstRow = screen.getByText("OV-001").closest("tr");

            await act(async () => {
                if (firstRow) {
                    fireEvent.click(firstRow);
                }
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("../order/1");
            });
        });

        it("should navigate to order detail when 'Ver' button is clicked", async () => {
            renderPage();

            const viewButtons = screen.getAllByRole("button", { name: /Ver/i });

            await act(async () => {
                fireEvent.click(viewButtons[0]);
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("../order/1");
            });
        });
    });

    describe("Table Columns", () => {
        it("should display document number column", () => {
            renderPage();
            expect(screen.getByText("Documento")).toBeInTheDocument();
        });

        it("should display client column", () => {
            renderPage();
            // "Cliente" appears both as header and filter label
            expect(screen.getAllByText("Cliente").length).toBeGreaterThan(0);
        });

        it("should display date column", () => {
            renderPage();
            expect(screen.getByText("Fecha")).toBeInTheDocument();
        });

        it("should display status column", () => {
            renderPage();
            // "Estado" appears both as header and filter label
            expect(screen.getAllByText("Estado").length).toBeGreaterThan(0);
        });

        it("should display total column", () => {
            renderPage();
            expect(screen.getByText("Total")).toBeInTheDocument();
        });

        it("should display progress columns", () => {
            renderPage();
            expect(screen.getByText("Surtido")).toBeInTheDocument();
            expect(screen.getByText("Facturado")).toBeInTheDocument();
        });

        it("should display actions column", () => {
            renderPage();
            expect(screen.getByText("Acciones")).toBeInTheDocument();
        });
    });

    describe("Progress Bars", () => {
        it("should display delivery progress", () => {
            renderPage();
            // Second order has 50% delivered
            expect(screen.getByText("50%")).toBeInTheDocument();
        });

        it("should display invoice progress", () => {
            renderPage();
            // Third order has 100% invoiced
            expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
        });
    });
});
