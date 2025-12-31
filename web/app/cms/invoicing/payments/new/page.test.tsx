import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import EventEmitter from "@/components/util/event-emitter";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import NewPaymentPage, { onInit } from "./page";

// Mocks de servicios
import { listClients } from "@agape/crm/client";
import { listPaymentMethods } from "@agape/finance/payment_method";
import { createPayment } from "@agape/finance/payment";
import { listSalesInvoices } from "@agape/finance/sales_invoice";

// Types
import Decimal from "@utils/data/Decimal";

// Mock de notificaciones
const mockNotify = vi.fn();
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: () => mockNotify,
}));

// Mock del router
const mockNavigate = vi.fn();
vi.mock("@/components/router/router-hook", () => ({
    useRouter: () => ({
        navigate: mockNavigate,
    }),
}));

describe("NewPaymentPage", () => {
    let router: HistoryManager;

    const mockClients = [
        { id: 1, firstName: "Juan", lastName: "Pérez", isActive: true },
        { id: 2, legalName: "Empresa XYZ S.A.S.", isActive: true },
    ];

    const mockMethods = [
        { id: 1, fullName: "Transferencia Bancaria", isEnabled: true },
        { id: 2, fullName: "Efectivo", isEnabled: true },
    ];

    const defaultProps = {
        clients: mockClients as any,
        paymentMethods: mockMethods as any,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (listClients as any).mockResolvedValue({ clients: mockClients, totalCount: 2 });
        (listPaymentMethods as any).mockResolvedValue({ paymentMethods: mockMethods });
        (createPayment as any).mockResolvedValue({ id: 100, documentNumberFull: "RC-100" });
        (listSalesInvoices as any).mockResolvedValue({ invoices: [], totalCount: 0 });

        router = new HistoryManager({}, {});
        vi.spyOn(router, "navigateTo").mockImplementation(() => { });
    });

    const renderPage = (props = defaultProps) => {
        return render(
            <HistoryContext.Provider value={router}>
                <EventEmitter>
                    <PortalProvider>
                        <NewPaymentPage {...props} />
                    </PortalProvider>
                </EventEmitter>
            </HistoryContext.Provider>
        );
    };

    const getField = (container: HTMLElement, labelText: string, selector: string) => {
        const labels = Array.from(container.querySelectorAll('label'));
        const label = labels.find(l => l.textContent?.includes(labelText));
        return label?.parentElement?.querySelector(selector) as HTMLElement | null;
    };

    describe("onInit", () => {
        it("should fetch clients and payment methods", async () => {
            const result = await onInit();

            expect(listClients).toHaveBeenCalledWith({ isActive: true, pageSize: 100 });
            expect(listPaymentMethods).toHaveBeenCalledWith({ isEnabled: true });
            expect(result).toEqual({
                clients: mockClients,
                paymentMethods: mockMethods,
            });
        });
    });

    describe("Rendering", () => {
        it("should render the back button", () => {
            renderPage();
            expect(screen.getByText("Volver a Pagos")).toBeInTheDocument();
        });

        it("should render the form title inside PaymentForm", () => {
            renderPage();
            expect(screen.getByText("Registro de Recaudo")).toBeInTheDocument();
        });

        it("should render client and method selections", () => {
            const { container } = renderPage();
            expect(getField(container, "Cliente", "select")).toBeInTheDocument();
            expect(getField(container, "Método de Pago", "select")).toBeInTheDocument();
        });
    });

    describe("Form Submission", () => {
        it("should successfully create a payment and navigate back", async () => {
            const { container } = renderPage();

            const clientSelect = getField(container, "Cliente", "select")!;
            const methodSelect = getField(container, "Método de Pago", "select")!;
            const amountInput = getField(container, "Monto a Recibir", "input")!;

            await act(async () => {
                fireEvent.change(clientSelect, { target: { value: "1" } });
                fireEvent.change(methodSelect, { target: { value: "1" } });
                fireEvent.change(amountInput, { target: { value: "5000" } });
            });

            const submitButton = screen.getByRole("button", { name: /Registrar Recaudo/i });

            await act(async () => {
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(createPayment).toHaveBeenCalled();
            });

            const callArgs = (createPayment as any).mock.calls[0][0];
            expect(callArgs).toMatchObject({
                userId: 1,
                paymentMethodId: 1,
                type: "receipt",
            });
            expect(Number(callArgs.amount)).toBe(5000);

            expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
                type: "success",
                payload: expect.stringContaining("RC-100"),
            }));

            expect(mockNavigate).toHaveBeenCalledWith("..");
        });

        it("should show error if validation fails (missing client)", async () => {
            renderPage();

            const submitButton = screen.getByRole("button", { name: /Registrar Recaudo/i });

            await act(async () => {
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
                    type: "error",
                    payload: "Debe seleccionar un cliente",
                }));
            });
        });

        it("should show error if validation fails (invalid amount)", async () => {
            const { container } = renderPage();

            const clientSelect = getField(container, "Cliente", "select")!;
            const methodSelect = getField(container, "Método de Pago", "select")!;

            fireEvent.change(clientSelect, { target: { value: "1" } });
            fireEvent.change(methodSelect, { target: { value: "1" } });

            const submitButton = screen.getByRole("button", { name: /Registrar Recaudo/i });

            await act(async () => {
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
                    type: "error",
                    payload: "El monto debe ser mayor a cero",
                }));
            });
        });

        it("should handle service errors", async () => {
            (createPayment as any).mockRejectedValue(new Error("API Error"));

            const { container } = renderPage();

            const clientSelect = getField(container, "Cliente", "select")!;
            const methodSelect = getField(container, "Método de Pago", "select")!;
            const amountInput = getField(container, "Monto a Recibir", "input")!;

            await act(async () => {
                fireEvent.change(clientSelect, { target: { value: "1" } });
                fireEvent.change(methodSelect, { target: { value: "1" } });
                fireEvent.change(amountInput, { target: { value: "100" } });
            });

            const submitButton = screen.getByRole("button", { name: /Registrar Recaudo/i });

            await act(async () => {
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
                    type: "error",
                    payload: "API Error",
                }));
            });
        });
    });

    describe("Allocations", () => {
        it("should clean allocations before calling createPayment", async () => {
            const mockInvoices = [
                { id: 10, documentNumberFull: "INV-010", balance: new Decimal(1000), totalAmount: new Decimal(1000), issueDate: "2024-01-01" }
            ];
            // Component calls listSalesInvoices twice (once for issued, once for partially_paid)
            (listSalesInvoices as any).mockResolvedValue({ invoices: mockInvoices, totalCount: 1 });

            const { container } = renderPage();

            const clientSelect = getField(container, "Cliente", "select")!;
            const methodSelect = getField(container, "Método de Pago", "select")!;
            const amountInput = getField(container, "Monto a Recibir", "input")!;

            // Select client to trigger invoice load
            await act(async () => {
                fireEvent.change(clientSelect, { target: { value: "1" } });
            });

            await waitFor(() => {
                expect(screen.getAllByText("INV-010").length).toBeGreaterThan(0);
            }, { timeout: 3000 });

            // Set amount first to have unallocated funds
            await act(async () => {
                fireEvent.change(amountInput, { target: { value: "500" } });
            });

            // Add allocation (using first one found since listSalesInvoices returns same for both calls)
            fireEvent.click(screen.getAllByText("INV-010")[0]);

            expect(screen.getByText("Facturas Aplicadas")).toBeInTheDocument();

            fireEvent.change(methodSelect, { target: { value: "1" } });

            const submitButton = screen.getByRole("button", { name: /Registrar Recaudo/i });

            await act(async () => {
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(createPayment).toHaveBeenCalled();
            });

            const callArgs = (createPayment as any).mock.calls[0][0];
            expect(callArgs.allocations).toHaveLength(1);
            expect(callArgs.allocations[0].invoiceId).toBe(10);
            expect(Number(callArgs.allocations[0].amount)).toBe(500);

            // Ensure helper fields like _invoiceNumber are NOT sent to API
            expect(callArgs.allocations[0]).not.toHaveProperty("_invoiceNumber");
        });
    });

    describe("Navigation", () => {
        it("should navigate back when clicking 'Volver a Pagos'", () => {
            renderPage();
            fireEvent.click(screen.getByText("Volver a Pagos"));
            expect(mockNavigate).toHaveBeenCalledWith("..");
        });
    });
});
