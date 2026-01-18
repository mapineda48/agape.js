import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import EventEmitter from "@/components/util/event-emitter";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";

// Componente a testear
import NewSalesOrderPage from "./page";

// Mocks de servicios (vía alias en vitest.config.ts → web/test/mocks/)
import { createSalesOrder, listSalesOrderTypes } from "@agape/crm/order";
import { listClients } from "@agape/crm/client";
import { listItems } from "@agape/catalogs/item";

// Types
import type { SalesOrderType } from "@utils/dto/crm/order";
import type { ClientListItem } from "@utils/dto/crm/client";
import type { ListItemItem } from "@utils/dto/catalogs/item";
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
        pathname: "/cms/sales/order",
        params: {},
    }),
}));

describe("NewSalesOrderPage", () => {
    let router: HistoryManager;

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

    const mockOrderTypes: SalesOrderType[] = [
        { id: 1, name: "Pedido Estándar", disabled: false },
        { id: 2, name: "Pedido Urgente", disabled: false },
    ];

    const mockItems: ListItemItem[] = [
        {
            id: 1,
            code: "PROD-001",
            fullName: "Producto Test 1",
            isEnabled: true,
            type: "good",
            basePrice: new Decimal("100.00"),
            category: "General",
            images: [],
            rating: 5,
        },
        {
            id: 2,
            code: "PROD-002",
            fullName: "Producto Test 2",
            isEnabled: true,
            type: "good",
            basePrice: new Decimal("250.00"),
            category: "General",
            images: [],
            rating: 4,
        },
    ];

    const defaultProps = {
        clients: mockClients,
        orderTypes: mockOrderTypes,
        items: mockItems,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mocks de RPC
        (createSalesOrder as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 1,
            documentNumberFull: "OV-001",
        });
        (listSalesOrderTypes as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrderTypes);
        (listClients as ReturnType<typeof vi.fn>).mockResolvedValue({
            clients: mockClients,
        });
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
            items: mockItems,
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
                        <NewSalesOrderPage {...props} />
                    </PortalProvider>
                </EventEmitter>
            </HistoryContext.Provider>
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Nueva Orden de Venta")).toBeInTheDocument();
        });

        it("should render the back button", () => {
            renderPage();
            expect(screen.getByText("VOLVER AL LISTADO")).toBeInTheDocument();
        });

        it("should render client select with options", () => {
            renderPage();
            expect(screen.getByTestId("client-select")).toBeInTheDocument();
        });

        it("should render order type select with options", () => {
            renderPage();
            expect(screen.getByTestId("order-type-select")).toBeInTheDocument();
        });

        it("should render issue date field", () => {
            renderPage();
            expect(screen.getByTestId("order-date-picker")).toBeInTheDocument();
        });

        it("should render empty state when no items added", () => {
            renderPage();
            expect(screen.getByText("La orden está vacía")).toBeInTheDocument();
        });

        it("should render 'Añadir Producto' button", () => {
            renderPage();
            expect(screen.getByTestId("add-item-button")).toBeInTheDocument();
        });

        it("should render 'CREAR PEDIDO' submit button", () => {
            renderPage();
            expect(screen.getByRole("button", { name: /CREAR PEDIDO/i })).toBeInTheDocument();
        });

        it("should render cancel button", () => {
            renderPage();
            expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
        });
    });

    describe("Item Management", () => {
        it("should add item row when 'Añadir Producto' is clicked", async () => {
            renderPage();

            const addButton = screen.getByTestId("add-item-button");

            await act(async () => {
                fireEvent.click(addButton);
            });

            // Should show product selector (hidden select patterned)
            await waitFor(() => {
                expect(screen.getByTestId("item-select-0-hidden")).toBeInTheDocument();
            });
        });

        it("should fill unit price when product is selected", async () => {
            renderPage();

            const addButton = screen.getByTestId("add-item-button");

            await act(async () => {
                fireEvent.click(addButton);
            });

            // Find the hidden product select
            const productSelect = await screen.findByTestId("item-select-0-hidden");

            // Select a product (this should auto-fill the price)
            await act(async () => {
                fireEvent.change(productSelect, { target: { value: "1" } });
            });

            // The unit price input should be filled with 100
            await waitFor(() => {
                // Wait for the total to update as confirmation that the store updated
                expect(screen.getByTestId("total-header").textContent).toBe("$100,00");

                const priceInput = screen.getByTestId("price-input-0") as HTMLInputElement;
                expect(priceInput.value).toBe("100");
            });
        });

        it("should remove item when trash button is clicked", async () => {
            renderPage();

            const addButton = screen.getByTestId("add-item-button");

            await act(async () => {
                fireEvent.click(addButton);
            });

            await waitFor(() => {
                expect(screen.getByTestId("item-select-0-hidden")).toBeInTheDocument();
            });

            // Find and click the remove button
            const removeButton = screen.getByTestId("remove-item-0");
            await act(async () => {
                fireEvent.click(removeButton);
            });

            // Should show empty state again
            await waitFor(() => {
                expect(screen.getByText("La orden está vacía")).toBeInTheDocument();
            });
        });
    });

    describe("Navigation", () => {
        it("should navigate back when 'VOLVER AL LISTADO' is clicked", async () => {
            renderPage();

            const backButton = screen.getByText("VOLVER AL LISTADO");

            await act(async () => {
                fireEvent.click(backButton);
            });

            expect(mockNavigate).toHaveBeenCalledWith("../orders");
        });

        it("should navigate back when 'Cancelar' is clicked", async () => {
            renderPage();

            const cancelButton = screen.getByRole("button", { name: /Cancelar/i });

            await act(async () => {
                fireEvent.click(cancelButton);
            });

            expect(mockNavigate).toHaveBeenCalledWith("../orders");
        });
    });

    describe("Totals Calculation", () => {
        it("should show 0 productos when no items", () => {
            renderPage();
            expect(screen.getByText("0 productos seleccionados")).toBeInTheDocument();
        });

        it("should update product count when items are added", async () => {
            renderPage();

            const addButton = screen.getByTestId("add-item-button");

            await act(async () => {
                fireEvent.click(addButton);
            });

            await waitFor(() => {
                expect(screen.getByText("1 productos seleccionados")).toBeInTheDocument();
            });
        });

        it("should show zero total initially", () => {
            renderPage();
            expect(screen.getByTestId("total-header").textContent).toBe("$0,00");
        });

        it("should update total when items are added with quantity and price", async () => {
            renderPage();

            const addButton = screen.getByTestId("add-item-button");

            await act(async () => {
                fireEvent.click(addButton);
            });

            // Select product (unitPrice = 100.00)
            const itemSelect = await screen.findByTestId("item-select-0-hidden");
            await act(async () => {
                fireEvent.change(itemSelect, { target: { value: "1" } });
            });

            await waitFor(() => {
                expect(screen.getByTestId("total-header").textContent).toBe("$100,00");
                expect(screen.getByTestId("line-subtotal-0").textContent).toBe("$100,00");
            });
        });
    });
});
