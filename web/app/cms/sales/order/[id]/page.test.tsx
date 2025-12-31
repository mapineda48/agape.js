import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import EventEmitter from "@/components/util/event-emitter";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import SalesOrderDetailPage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts → web/test/mocks/)
import { getSalesOrderById, updateSalesOrderStatus } from "@agape/crm/order";
import { deliverSalesOrder, invoiceSalesOrder } from "@agape/sales/sales_flow";
import { listLocations } from "@agape/inventory/location";

// Types
import type { SalesOrderDetails, SalesOrderItemDetails } from "@utils/dto/crm/order";
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
        pathname: "/cms/sales/order/1",
        params: { id: "1" },
    }),
}));

describe("SalesOrderDetailPage", () => {
    let router: HistoryManager;

    const mockOrderItems: SalesOrderItemDetails[] = [
        {
            id: 1,
            lineNumber: 1,
            itemId: 1,
            itemCode: "PROD-001",
            itemName: "Producto Test 1",
            quantity: new Decimal("10"),
            unitPrice: new Decimal("100.00"),
            discountPercent: new Decimal("0"),
            discountAmount: new Decimal("0"),
            taxPercent: new Decimal("0"),
            taxAmount: new Decimal("0"),
            subtotal: new Decimal("1000.00"),
            total: new Decimal("1000.00"),
            notes: null,
            deliveredQuantity: new Decimal("5"),
            invoicedQuantity: new Decimal("2"),
        },
        {
            id: 2,
            lineNumber: 2,
            itemId: 2,
            itemCode: "PROD-002",
            itemName: "Producto Test 2",
            quantity: new Decimal("5"),
            unitPrice: new Decimal("200.00"),
            discountPercent: new Decimal("0"),
            discountAmount: new Decimal("0"),
            taxPercent: new Decimal("0"),
            taxAmount: new Decimal("0"),
            subtotal: new Decimal("1000.00"),
            total: new Decimal("1000.00"),
            notes: null,
            deliveredQuantity: new Decimal("0"),
            invoicedQuantity: new Decimal("0"),
        },
    ];

    const createMockOrder = (status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"): SalesOrderDetails => ({
        id: 1,
        clientId: 1,
        clientName: "Juan Pérez",
        clientDocumentType: "CC",
        clientDocumentNumber: "123456789",
        orderTypeId: 1,
        orderDate: "2024-01-15",
        status,
        documentNumberFull: "OV-001",
        disabled: false,
        subtotal: new Decimal("2000.00"),
        taxAmount: new Decimal("0"),
        total: new Decimal("2000.00"),
        notes: null,
        items: mockOrderItems,
    });

    const mockLocations = [
        { id: 1, name: "Almacén Principal" },
        { id: 2, name: "Sucursal Norte" },
    ];

    const defaultProps = {
        order: createMockOrder("pending"),
        locations: mockLocations,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mocks de RPC
        (getSalesOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(createMockOrder("pending"));
        (updateSalesOrderStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 1,
            status: "confirmed",
        });
        (deliverSalesOrder as ReturnType<typeof vi.fn>).mockResolvedValue({
            movementId: 1,
            documentNumber: "SAL-001",
        });
        (invoiceSalesOrder as ReturnType<typeof vi.fn>).mockResolvedValue({
            invoiceId: 1,
            documentNumber: "FV-001",
        });
        (listLocations as ReturnType<typeof vi.fn>).mockResolvedValue(mockLocations);

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
                        <SalesOrderDetailPage {...props} />
                    </PortalProvider>
                </EventEmitter>
            </HistoryContext.Provider>
        );
    };

    describe("Rendering", () => {
        it("should render the order document number", () => {
            renderPage();
            expect(screen.getByText(/Orden OV-001/)).toBeInTheDocument();
        });

        it("should render the client name", () => {
            renderPage();
            expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
        });

        it("should render the client document", () => {
            renderPage();
            expect(screen.getByText(/CC: 123456789/)).toBeInTheDocument();
        });

        it("should render the back button", () => {
            renderPage();
            expect(screen.getByText("Volver a Ventas")).toBeInTheDocument();
        });

        it("should render product items in the table", () => {
            renderPage();
            expect(screen.getByText("Producto Test 1")).toBeInTheDocument();
            expect(screen.getByText("PROD-001")).toBeInTheDocument();
            expect(screen.getByText("Producto Test 2")).toBeInTheDocument();
            expect(screen.getByText("PROD-002")).toBeInTheDocument();
        });

        it("should render the products section title", () => {
            renderPage();
            expect(screen.getByText("Productos del Pedido")).toBeInTheDocument();
        });

        it("should render delivery progress", () => {
            renderPage();
            expect(screen.getByText("Entrega / Surtido")).toBeInTheDocument();
        });

        it("should render invoicing progress", () => {
            renderPage();
            expect(screen.getByText("Facturación")).toBeInTheDocument();
        });
    });

    describe("Action Buttons - Pending Status", () => {
        it("should show 'Confirmar Pedido' button when status is pending", () => {
            renderPage({ ...defaultProps, order: createMockOrder("pending") });
            expect(screen.getByRole("button", { name: /Confirmar Pedido/i })).toBeInTheDocument();
        });

        it("should show 'Cancelar' button when status is pending", () => {
            renderPage({ ...defaultProps, order: createMockOrder("pending") });
            expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
        });

        it("should NOT show 'Registrar Entrega' button when status is pending", () => {
            renderPage({ ...defaultProps, order: createMockOrder("pending") });
            expect(screen.queryByRole("button", { name: /Registrar Entrega/i })).not.toBeInTheDocument();
        });
    });

    describe("Action Buttons - Confirmed Status", () => {
        it("should show 'Registrar Entrega' button when status is confirmed", () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });
            expect(screen.getByRole("button", { name: /Registrar Entrega/i })).toBeInTheDocument();
        });

        it("should show 'Generar Factura' button when status is confirmed", () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });
            expect(screen.getByRole("button", { name: /Generar Factura/i })).toBeInTheDocument();
        });

        it("should NOT show 'Confirmar Pedido' button when status is confirmed", () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });
            expect(screen.queryByRole("button", { name: /Confirmar Pedido/i })).not.toBeInTheDocument();
        });
    });

    describe("Action Buttons - Delivered Status", () => {
        it("should show 'Generar Factura' button when status is delivered", () => {
            renderPage({ ...defaultProps, order: createMockOrder("delivered") });
            expect(screen.getByRole("button", { name: /Generar Factura/i })).toBeInTheDocument();
        });

        it("should NOT show 'Cancelar' button when status is delivered", () => {
            renderPage({ ...defaultProps, order: createMockOrder("delivered") });
            expect(screen.queryByRole("button", { name: /Cancelar/i })).not.toBeInTheDocument();
        });
    });

    describe("Action Buttons - Cancelled Status", () => {
        it("should NOT show any action buttons when status is cancelled", () => {
            renderPage({ ...defaultProps, order: createMockOrder("cancelled") });
            expect(screen.queryByRole("button", { name: /Confirmar Pedido/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /Registrar Entrega/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /Generar Factura/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /^Cancelar$/i })).not.toBeInTheDocument();
        });
    });

    describe("Status Changes", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should call updateSalesOrderStatus when 'Confirmar Pedido' is clicked", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("pending") });

            const confirmButton = screen.getByRole("button", { name: /Confirmar Pedido/i });

            await act(async () => {
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(updateSalesOrderStatus).toHaveBeenCalledWith(1, "confirmed");
            });
        });

        it("should show success notification after status change", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("pending") });

            const confirmButton = screen.getByRole("button", { name: /Confirmar Pedido/i });

            await act(async () => {
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "success",
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

        it("should navigate back when 'Volver a Ventas' is clicked", async () => {
            renderPage();

            const backButton = screen.getByText("Volver a Ventas");

            await act(async () => {
                fireEvent.click(backButton);
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("../../orders");
            });
        });
    });

    describe("Table Columns", () => {
        it("should display product column", () => {
            renderPage();
            expect(screen.getByText("Producto")).toBeInTheDocument();
        });

        it("should display ordered quantity column", () => {
            renderPage();
            expect(screen.getByText("Pedido")).toBeInTheDocument();
        });

        it("should display delivered quantity column", () => {
            renderPage();
            expect(screen.getByText("Entregado")).toBeInTheDocument();
        });

        it("should display invoiced quantity column", () => {
            renderPage();
            expect(screen.getByText("Facturado")).toBeInTheDocument();
        });

        it("should display price column", () => {
            renderPage();
            expect(screen.getByText("Precio")).toBeInTheDocument();
        });

        it("should display subtotal column", () => {
            renderPage();
            expect(screen.getByText("Subtotal")).toBeInTheDocument();
        });
    });

    describe("Quantity Badges", () => {
        it("should display delivery progress for items", () => {
            renderPage();
            // First item: 5 delivered of 10
            expect(screen.getByText("5 / 10")).toBeInTheDocument();
        });

        it("should display zero delivery for items not delivered", () => {
            renderPage();
            // Second item: 0 delivered of 5 (appears for both delivery and invoice)
            expect(screen.getAllByText("0 / 5").length).toBeGreaterThan(0);
        });
    });

    describe("Delivery Modal", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should open delivery modal when 'Registrar Entrega' is clicked", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });

            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });
        });

        it("should display pending items in the delivery modal", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                // Both products should appear in the modal (both have pending quantities)
                expect(screen.getByText("Productos Pendientes")).toBeInTheDocument();
            });
        });

        it("should display location selector in delivery modal", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText(/Bodega de Salida/i)).toBeInTheDocument();
            });
        });

        it("should close delivery modal when Cancel is clicked", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });

            // Get the cancel button inside the modal (last one)
            const cancelButtons = screen.getAllByRole("button", { name: /^Cancelar$/i });
            const modalCancelButton = cancelButtons[cancelButtons.length - 1];
            await act(async () => {
                fireEvent.click(modalCancelButton);
            });

            await waitFor(() => {
                expect(screen.queryByText("Registrar Entrega / Remisión")).not.toBeInTheDocument();
            });
        });

        it("should call deliverSalesOrder when delivery is confirmed", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: /Confirmar Entrega/i });
            await act(async () => {
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(deliverSalesOrder).toHaveBeenCalled();
            });
        });

        it("should send modified quantities when user changes input values", async () => {
            // Create an order where item has pending quantity
            const orderWithPending: SalesOrderDetails = {
                ...createMockOrder("confirmed"),
                items: [{
                    id: 1,
                    lineNumber: 1,
                    itemId: 1,
                    itemCode: "PROD-001",
                    itemName: "Producto Test 1",
                    quantity: new Decimal("10"),
                    unitPrice: new Decimal("100.00"),
                    discountPercent: new Decimal("0"),
                    discountAmount: new Decimal("0"),
                    taxPercent: new Decimal("0"),
                    taxAmount: new Decimal("0"),
                    subtotal: new Decimal("1000.00"),
                    total: new Decimal("1000.00"),
                    notes: null,
                    deliveredQuantity: new Decimal("0"), // 10 pendientes
                    invoicedQuantity: new Decimal("0"),
                }],
            };

            renderPage({ ...defaultProps, order: orderWithPending });

            // Open delivery modal
            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            // Wait for modal to appear
            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });

            // Find the quantity input (inside the modal) and change it to 3
            const quantityInputs = screen.getAllByRole("spinbutton");
            expect(quantityInputs.length).toBeGreaterThan(0);
            const firstInput = quantityInputs[0];

            // Initial value should be 10 (all pending)
            expect(firstInput).toHaveValue(10);

            // Change to 3 (partial delivery)
            await act(async () => {
                fireEvent.change(firstInput, { target: { value: "3" } });
            });

            // Verify the value changed
            expect(firstInput).toHaveValue(3);

            // Click confirm button
            const confirmButton = screen.getByRole("button", { name: /Confirmar Entrega/i });
            await act(async () => {
                fireEvent.click(confirmButton);
            });

            // Verify deliverSalesOrder was called with quantity 3
            await waitFor(() => {
                expect(deliverSalesOrder).toHaveBeenCalled();
            });

            const callArgs = (deliverSalesOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(callArgs.items).toHaveLength(1);

            const deliveredQty = callArgs.items[0].quantity;
            const qtyValue = typeof deliveredQty === 'object' && 'toNumber' in deliveredQty
                ? deliveredQty.toNumber()
                : Number(deliveredQty);

            expect(qtyValue).toBe(3);
        });

        it("should show success notification after delivery", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: /Confirmar Entrega/i });
            await act(async () => {
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "success",
                        payload: expect.stringContaining("Entrega registrada"),
                    })
                );
            });
        });

        it("should show error notification when delivery fails", async () => {
            (deliverSalesOrder as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error("Stock insuficiente")
            );

            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: /Confirmar Entrega/i });
            await act(async () => {
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "error",
                        payload: "Stock insuficiente",
                    })
                );
            });
        });

        it("should show completion message when all items are delivered", async () => {
            // Create an order where all items are fully delivered
            const fullyDeliveredOrder: SalesOrderDetails = {
                ...createMockOrder("shipped"),
                items: [{
                    id: 1,
                    lineNumber: 1,
                    itemId: 1,
                    itemCode: "PROD-001",
                    itemName: "Producto Test 1",
                    quantity: new Decimal("10"),
                    unitPrice: new Decimal("100.00"),
                    discountPercent: new Decimal("0"),
                    discountAmount: new Decimal("0"),
                    taxPercent: new Decimal("0"),
                    taxAmount: new Decimal("0"),
                    subtotal: new Decimal("1000.00"),
                    total: new Decimal("1000.00"),
                    notes: null,
                    deliveredQuantity: new Decimal("10"), // Fully delivered
                    invoicedQuantity: new Decimal("0"),
                }],
            };

            renderPage({ ...defaultProps, order: fullyDeliveredOrder });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("¡Entregas Completadas!")).toBeInTheDocument();
            });

            // Should show the order number in the message
            expect(screen.getByText(/han sido entregados exitosamente/i)).toBeInTheDocument();

            // Should have a "Cerrar" button instead of form buttons
            expect(screen.getAllByRole("button", { name: /Cerrar/i }).length).toBeGreaterThan(0);
            expect(screen.queryByRole("button", { name: /Confirmar Entrega/i })).not.toBeInTheDocument();
        });
    });

    describe("Invoicing Modal", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should open invoicing modal when 'Generar Factura' is clicked", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });

            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Generar Factura de Venta")).toBeInTheDocument();
            });
        });

        it("should display pending items in the invoicing modal", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Productos Pendientes")).toBeInTheDocument();
            });
        });

        it("should close invoicing modal when Cancel is clicked", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Generar Factura de Venta")).toBeInTheDocument();
            });

            // Get the cancel button inside the modal (last one)
            const cancelButtons = screen.getAllByRole("button", { name: /^Cancelar$/i });
            const modalCancelButton = cancelButtons[cancelButtons.length - 1];
            await act(async () => {
                fireEvent.click(modalCancelButton);
            });

            await waitFor(() => {
                expect(screen.queryByText("Generar Factura de Venta")).not.toBeInTheDocument();
            });
        });

        it("should call invoiceSalesOrder when invoice is confirmed", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Generar Factura de Venta")).toBeInTheDocument();
            });

            // Get the submit button inside the modal (last one with that text)
            const confirmButtons = screen.getAllByRole("button", { name: /Generar Factura/i });
            const modalConfirmButton = confirmButtons[confirmButtons.length - 1];
            await act(async () => {
                fireEvent.click(modalConfirmButton);
            });

            await waitFor(() => {
                expect(invoiceSalesOrder).toHaveBeenCalled();
            });
        });

        it("should show success notification with invoice number after invoicing", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Generar Factura de Venta")).toBeInTheDocument();
            });

            // Get the submit button inside the modal
            const confirmButtons = screen.getAllByRole("button", { name: /Generar Factura/i });
            const modalConfirmButton = confirmButtons[confirmButtons.length - 1];
            await act(async () => {
                fireEvent.click(modalConfirmButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "success",
                        payload: expect.stringContaining("FV-001"),
                    })
                );
            });
        });

        it("should show error notification when invoicing fails", async () => {
            (invoiceSalesOrder as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error("Error al generar factura")
            );

            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Generar Factura de Venta")).toBeInTheDocument();
            });

            // Get the submit button inside the modal
            const confirmButtons = screen.getAllByRole("button", { name: /Generar Factura/i });
            const modalConfirmButton = confirmButtons[confirmButtons.length - 1];
            await act(async () => {
                fireEvent.click(modalConfirmButton);
            });

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "error",
                        payload: "Error al generar factura",
                    })
                );
            });
        });

        it("should show completion message when all items are invoiced", async () => {
            // Create an order where all items are fully invoiced
            const fullyInvoicedOrder: SalesOrderDetails = {
                ...createMockOrder("shipped"),
                items: [{
                    id: 1,
                    lineNumber: 1,
                    itemId: 1,
                    itemCode: "PROD-001",
                    itemName: "Producto Test 1",
                    quantity: new Decimal("10"),
                    unitPrice: new Decimal("100.00"),
                    discountPercent: new Decimal("0"),
                    discountAmount: new Decimal("0"),
                    taxPercent: new Decimal("0"),
                    taxAmount: new Decimal("0"),
                    subtotal: new Decimal("1000.00"),
                    total: new Decimal("1000.00"),
                    notes: null,
                    deliveredQuantity: new Decimal("10"),
                    invoicedQuantity: new Decimal("10"), // Fully invoiced
                }],
            };

            renderPage({ ...defaultProps, order: fullyInvoicedOrder });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("¡Facturación Completada!")).toBeInTheDocument();
            });

            // Should show the order number in the message
            expect(screen.getByText(/han sido facturados exitosamente/i)).toBeInTheDocument();

            // Should have a "Cerrar" button instead of form buttons
            expect(screen.getAllByRole("button", { name: /Cerrar/i }).length).toBeGreaterThan(0);
        });
    });

    describe("Partial Delivery/Invoicing Indicators", () => {
        it("should show partially delivered items correctly", () => {
            const partialOrder = createMockOrder("confirmed");
            partialOrder.items[0].deliveredQuantity = new Decimal("7");
            renderPage({ ...defaultProps, order: partialOrder });

            // Should display 7 / 10 for delivery
            expect(screen.getByText("7 / 10")).toBeInTheDocument();
        });

        it("should show partially invoiced items correctly", () => {
            const partialOrder = createMockOrder("confirmed");
            partialOrder.items[0].invoicedQuantity = new Decimal("3");
            renderPage({ ...defaultProps, order: partialOrder });

            // Should display 3 / 10 for invoicing (first item)
            expect(screen.getByText("3 / 10")).toBeInTheDocument();
        });

        it("should calculate delivery percentage correctly", () => {
            // Default mock order items:
            // Item 1: qty=10, delivered=5
            // Item 2: qty=5, delivered=0 + 2 (we override below)
            // Total qty: 15, Total delivered: 7 = 46.67% ≈ 47%
            const partialOrder = createMockOrder("confirmed");
            partialOrder.items = [
                { ...partialOrder.items[0], deliveredQuantity: new Decimal("5") },
                { ...partialOrder.items[1], deliveredQuantity: new Decimal("2") },
            ];
            renderPage({ ...defaultProps, order: partialOrder });

            // Check that the percentage text content exists (7/15 ≈ 47%)
            const deliverySection = screen.getByText("Entrega / Surtido").closest("div")?.parentElement;
            expect(deliverySection?.textContent).toMatch(/47.*%/);
        });

        it("should calculate invoicing percentage correctly", () => {
            // Default mock order items:
            // Item 1: qty=10, invoiced=2
            // Item 2: qty=5, invoiced=1 (we override below)
            // Total qty: 15, Total invoiced: 3 = 20%
            const partialOrder = createMockOrder("confirmed");
            partialOrder.items = [
                { ...partialOrder.items[0], invoicedQuantity: new Decimal("2") },
                { ...partialOrder.items[1], invoicedQuantity: new Decimal("1") },
            ];
            renderPage({ ...defaultProps, order: partialOrder });

            // Check that the percentage text content exists (3/15 = 20%)
            const invoiceSection = screen.getByText("Facturación").closest("div")?.parentElement;
            expect(invoiceSection?.textContent).toMatch(/20.*%/);
        });
    });

    describe("Shipped Status", () => {
        it("should show 'Registrar Entrega' button when status is shipped (for partial deliveries)", () => {
            renderPage({ ...defaultProps, order: createMockOrder("shipped") });
            expect(screen.getByRole("button", { name: /Registrar Entrega/i })).toBeInTheDocument();
        });

        it("should show 'Generar Factura' button when status is shipped", () => {
            renderPage({ ...defaultProps, order: createMockOrder("shipped") });
            expect(screen.getByRole("button", { name: /Generar Factura/i })).toBeInTheDocument();
        });

        it("should NOT show 'Cancelar' button when status is shipped", () => {
            renderPage({ ...defaultProps, order: createMockOrder("shipped") });
            expect(screen.queryByRole("button", { name: /^Cancelar$/i })).not.toBeInTheDocument();
        });
    });

    describe("Order Reload After Actions", () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it("should reload order after successful delivery", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const deliveryButton = screen.getByRole("button", { name: /Registrar Entrega/i });
            await act(async () => {
                fireEvent.click(deliveryButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Registrar Entrega / Remisión")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: /Confirmar Entrega/i });
            await act(async () => {
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                // getSalesOrderById should have been called at least once after delivery
                expect(getSalesOrderById).toHaveBeenCalled();
            });
        });

        it("should reload order after successful invoicing", async () => {
            renderPage({ ...defaultProps, order: createMockOrder("confirmed") });

            const invoiceButton = screen.getByRole("button", { name: /Generar Factura/i });
            await act(async () => {
                fireEvent.click(invoiceButton);
            });

            await waitFor(() => {
                expect(screen.getByText("Generar Factura de Venta")).toBeInTheDocument();
            });

            // Get the submit button inside the modal
            const confirmButtons = screen.getAllByRole("button", { name: /Generar Factura/i });
            const modalConfirmButton = confirmButtons[confirmButtons.length - 1];
            await act(async () => {
                fireEvent.click(modalConfirmButton);
            });

            await waitFor(() => {
                // getSalesOrderById should have been called after invoicing
                expect(getSalesOrderById).toHaveBeenCalled();
            });
        });
    });
});
