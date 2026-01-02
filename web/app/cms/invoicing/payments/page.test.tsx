import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import EventEmitter from "@/components/util/event-emitter";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import PaymentsPage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts → web/test/mocks/)
import { listPayments } from "@agape/finance/payment";

// Types
import type { PaymentListItem } from "@utils/dto/finance/payment";
import Decimal from "@utils/data/Decimal";

// Mock de notificaciones
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: vi.fn(() => vi.fn()),
}));

// Mock del router
const mockNavigate = vi.fn();
vi.mock("@/components/router/router-hook", () => ({
    useRouter: () => ({
        navigate: mockNavigate,
        pathname: "/cms/invoicing/payments",
        params: {},
    }),
}));

describe("PaymentsPage", () => {
    let router: HistoryManager;

    const mockPayments: PaymentListItem[] = [
        {
            id: 1,
            documentNumberFull: "RC-001",
            paymentType: "receipt",
            userId: 1,
            userName: "Juan Pérez",
            paymentDate: "2024-01-15",
            amount: new Decimal("1500.00"),
            unallocatedAmount: new Decimal("500.00"),
            status: "posted",
        },
        {
            id: 2,
            documentNumberFull: "RC-002",
            paymentType: "receipt",
            userId: 2,
            userName: "Empresa XYZ S.A.S.",
            paymentDate: "2024-01-16",
            amount: new Decimal("3200.50"),
            unallocatedAmount: new Decimal("0.00"),
            status: "posted",
        },
        {
            id: 3,
            documentNumberFull: "EG-001",
            paymentType: "disbursement",
            userId: 3,
            userName: "Proveedor ABC",
            paymentDate: "2024-01-17",
            amount: new Decimal("750.00"),
            unallocatedAmount: new Decimal("750.00"),
            status: "draft",
        },
    ];

    const defaultProps = {
        payments: mockPayments,
        totalCount: mockPayments.length,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mocks de RPC
        (listPayments as ReturnType<typeof vi.fn>).mockResolvedValue({
            payments: mockPayments,
            totalCount: mockPayments.length,
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
                        <PaymentsPage {...props} />
                    </PortalProvider>
                </EventEmitter>
            </HistoryContext.Provider>
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Pagos y Recaudos")).toBeInTheDocument();
        });

        it("should render the page description", () => {
            renderPage();
            expect(screen.getByText("Gestión de cobros a clientes y pagos a proveedores")).toBeInTheDocument();
        });

        it("should render 'Nuevo Recaudo' button", () => {
            renderPage();
            expect(screen.getByRole("button", { name: /Nuevo Recaudo/i })).toBeInTheDocument();
        });

        it("should render payments in the table", () => {
            renderPage();
            expect(screen.getByText("RC-001")).toBeInTheDocument();
            expect(screen.getByText("RC-002")).toBeInTheDocument();
            expect(screen.getByText("EG-001")).toBeInTheDocument();
        });

        it("should render user names in the table", () => {
            renderPage();
            expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
            expect(screen.getByText("Empresa XYZ S.A.S.")).toBeInTheDocument();
            expect(screen.getByText("Proveedor ABC")).toBeInTheDocument();
        });

        it("should render payment type badges", () => {
            renderPage();
            expect(screen.getAllByText("Recaudo").length).toBe(2);
            expect(screen.getByText("Egreso")).toBeInTheDocument();
        });

        it("should render empty state when no payments", () => {
            renderPage({ payments: [], totalCount: 0 });
            expect(screen.getByText("No se encontraron pagos registrados.")).toBeInTheDocument();
        });
    });

    describe("Filters", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should render payment type filter", () => {
            renderPage();
            expect(screen.getAllByText("Tipo de Pago").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Todos los tipos").length).toBeGreaterThan(0);
        });

        it("should render status filter", () => {
            renderPage();
            expect(screen.getAllByText("Estado").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Todos los estados").length).toBeGreaterThan(0);
        });

        it("should render reset filters button", () => {
            renderPage();
            expect(screen.getByRole("button", { name: /Limpiar/i })).toBeInTheDocument();
        });

        it("should call listPayments when type filter changes", async () => {
            renderPage();

            const typeSelect = screen.getAllByRole("combobox")[0];

            await act(async () => {
                fireEvent.change(typeSelect, { target: { value: "receipt" } });
            });

            await waitFor(() => {
                expect(listPayments).toHaveBeenCalledWith(
                    expect.objectContaining({ type: "receipt" })
                );
            });
        });

        it("should call listPayments when status filter changes", async () => {
            renderPage();

            const statusSelect = screen.getAllByRole("combobox")[1];

            await act(async () => {
                fireEvent.change(statusSelect, { target: { value: "posted" } });
            });

            await waitFor(() => {
                expect(listPayments).toHaveBeenCalledWith(
                    expect.objectContaining({ status: "posted" })
                );
            });
        });

        it("should reset filters when 'Limpiar' is clicked", async () => {
            renderPage();

            const resetButton = screen.getByRole("button", { name: /Limpiar/i });

            await act(async () => {
                fireEvent.click(resetButton);
            });

            await waitFor(() => {
                expect(listPayments).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: undefined,
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

        it("should navigate to new payment page when 'Nuevo Recaudo' is clicked", async () => {
            renderPage();

            const newButton = screen.getByRole("button", { name: /Nuevo Recaudo/i });

            await act(async () => {
                fireEvent.click(newButton);
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("./new");
            });
        });
    });

    describe("Table Columns", () => {
        it("should display document number column", () => {
            renderPage();
            expect(screen.getByText("Documento")).toBeInTheDocument();
        });

        it("should display type column", () => {
            renderPage();
            expect(screen.getByText("Tipo")).toBeInTheDocument();
        });

        it("should display date column", () => {
            renderPage();
            expect(screen.getByText("Fecha")).toBeInTheDocument();
        });

        it("should display user column", () => {
            renderPage();
            expect(screen.getByText("Usuario/Empresa")).toBeInTheDocument();
        });

        it("should display amount column", () => {
            renderPage();
            expect(screen.getByText("Monto")).toBeInTheDocument();
        });

        it("should display pending amount column", () => {
            renderPage();
            expect(screen.getByText("Pendiente")).toBeInTheDocument();
        });
    });

    describe("Payment Types", () => {
        it("should display receipt type with correct styling", () => {
            renderPage();
            const receiptBadges = screen.getAllByText("Recaudo");
            expect(receiptBadges.length).toBe(2);
        });

        it("should display disbursement type with correct styling", () => {
            renderPage();
            const disbursementBadge = screen.getByText("Egreso");
            expect(disbursementBadge).toBeInTheDocument();
        });
    });

    describe("Filter Options", () => {
        it("should have receipt option in type filter", () => {
            renderPage();
            expect(screen.getByText("Recaudos (Clientes)")).toBeInTheDocument();
        });

        it("should have disbursement option in type filter", () => {
            renderPage();
            expect(screen.getByText("Egresos (Proveedores)")).toBeInTheDocument();
        });

        it("should have draft option in status filter", () => {
            renderPage();
            expect(screen.getByText("Borrador (Registrado)")).toBeInTheDocument();
        });

        it("should have posted option in status filter", () => {
            renderPage();
            expect(screen.getByText("Contabilizado (Aplicado)")).toBeInTheDocument();
        });
    });
});
