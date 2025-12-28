import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import EditItemPage from "./page";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";
import * as routerHook from "@/components/router/router-hook";
import * as notification from "@/components/ui/notification";
import Decimal from "@utils/data/Decimal";

// Mock del router hook
vi.mock("@/components/router/router-hook", () => ({
    useRouter: vi.fn(),
}));

// Mock del notification hook
vi.mock("@/components/ui/notification", () => ({
    useNotificacion: vi.fn(),
}));

// Mock de los servicios
import { getItemById, upsertItem } from "@agape/catalogs/item";
import { listCategories, listSubcategories } from "@agape/catalogs/category";

describe("EditItemPage", () => {
    let router: HistoryManager;
    const mockNavigate = vi.fn();
    const mockNotify = vi.fn();

    const mockProduct = {
        id: 1,
        code: "PROD-001",
        fullName: "Producto de Prueba",
        slogan: "El mejor producto",
        description: "Descripción del producto",
        isEnabled: true,
        basePrice: new Decimal("150.00"),
        rating: 4,
        categoryId: 1,
        subcategoryId: 1,
        images: [],
        type: "good" as const,
        good: {
            uomId: 1,
            minStock: new Decimal("10"),
            maxStock: new Decimal("100"),
            reorderPoint: new Decimal("20"),
        },
    };

    const mockService = {
        id: 2,
        code: "SVC-001",
        fullName: "Servicio de Consultoría",
        isEnabled: true,
        basePrice: new Decimal("200.00"),
        rating: 5,
        images: [],
        type: "service" as const,
        service: {
            durationMinutes: 60,
            isRecurring: true,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        router = new HistoryManager();

        // Configurar el mock del router
        (routerHook.useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            navigate: mockNavigate,
            pathname: "/cms/inventory/product/1",
            params: { id: "1" },
        });

        // Configurar mock de notificación
        (notification.useNotificacion as ReturnType<typeof vi.fn>).mockReturnValue(
            mockNotify
        );

        // Configurar mocks de servicios
        (listCategories as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, fullName: "Electrónicos", isEnabled: true },
        ]);

        (listSubcategories as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, fullName: "Smartphones", isEnabled: true },
        ]);

        (getItemById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

        (upsertItem as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
    });

    const renderPage = () => {
        return render(
            createElement(
                HistoryContext.Provider,
                { value: router },
                createElement(
                    EventEmitter,
                    null,
                    createElement(PortalProvider, null, createElement(EditItemPage))
                )
            )
        );
    };

    describe("Loading State", () => {
        it("should show loading spinner while fetching item", () => {
            // Configurar una promesa que nunca resuelve para mantener el estado de carga
            (getItemById as ReturnType<typeof vi.fn>).mockReturnValue(
                new Promise(() => { })
            );

            renderPage();

            // Verificar que el spinner de carga existe
            const spinner = document.querySelector(".animate-spin");
            expect(spinner).toBeInTheDocument();
        });

        it("should call getItemById with the correct id from params", async () => {
            renderPage();

            await waitFor(() => {
                expect(getItemById).toHaveBeenCalledWith(1);
            });
        });
    });

    describe("Not Found State", () => {
        it("should show 'Item no encontrado' when item does not exist", async () => {
            (getItemById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            renderPage();

            await waitFor(() => {
                expect(screen.getByText("Item no encontrado")).toBeInTheDocument();
            });
        });

        it("should show explanation message when item does not exist", async () => {
            (getItemById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            renderPage();

            await waitFor(() => {
                expect(
                    screen.getByText(
                        "El item que intentas editar no existe o ha sido eliminado."
                    )
                ).toBeInTheDocument();
            });
        });
    });

    describe("Error Handling", () => {
        it("should call notify when getItemById fails", async () => {
            const error = new Error("Network error");
            (getItemById as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            renderPage();

            await waitFor(() => {
                expect(mockNotify).toHaveBeenCalledWith({ payload: error });
            });
        });
    });

    describe("Rendering - Product Edit", () => {
        it("should render 'Editar Producto' title for product type", async () => {
            renderPage();

            await waitFor(() => {
                expect(screen.getByText("Editar Producto")).toBeInTheDocument();
            });
        });

        it("should render 'Producto' badge for product type", async () => {
            renderPage();

            await waitFor(() => {
                // El badge de producto debe estar visible
                const badges = screen.getAllByText("Producto");
                expect(badges.length).toBeGreaterThan(0);
            });
        });

        it("should display the item form with the loaded data", async () => {
            renderPage();

            await waitFor(() => {
                // Verificar que el nombre del producto está en el formulario
                const nameInput = screen.getByPlaceholderText(
                    "Ej: Camiseta Premium Algodon"
                );
                expect(nameInput).toHaveValue("Producto de Prueba");
            });
        });

        it("should NOT show type selector when editing", async () => {
            renderPage();

            await waitFor(() => {
                expect(screen.queryByText("Tipo de Item")).not.toBeInTheDocument();
            });
        });
    });

    describe("Rendering - Service Edit", () => {
        beforeEach(() => {
            (getItemById as ReturnType<typeof vi.fn>).mockResolvedValue(mockService);
        });

        it("should render 'Editar Servicio' title for service type", async () => {
            renderPage();

            await waitFor(() => {
                expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
            });
        });

        it("should render 'Servicio' badge for service type", async () => {
            renderPage();

            await waitFor(() => {
                // El badge de servicio debe estar visible
                const badges = screen.getAllByText("Servicio");
                expect(badges.length).toBeGreaterThan(0);
            });
        });

        it("should show service details section", async () => {
            renderPage();

            await waitFor(() => {
                expect(screen.getByText("Detalles del Servicio")).toBeInTheDocument();
            });
        });
    });

    describe("Navigation", () => {
        it("should render 'Ver Catalogo' button", async () => {
            renderPage();

            await waitFor(() => {
                expect(screen.getByText("Ver Catalogo")).toBeInTheDocument();
            });
        });

        it("should navigate to catalog when 'Ver Catalogo' is clicked", async () => {
            renderPage();

            await waitFor(() => {
                screen.getByText("Ver Catalogo");
            });

            const button = screen.getByText("Ver Catalogo");
            button.click();

            expect(mockNavigate).toHaveBeenCalledWith("../../products");
        });
    });

    describe("Page Description", () => {
        it("should render page description", async () => {
            renderPage();

            await waitFor(() => {
                expect(
                    screen.getByText("Modifica la informacion del item.")
                ).toBeInTheDocument();
            });
        });
    });

    describe("ItemForm Integration", () => {
        it("should pass item data to ItemForm", async () => {
            renderPage();

            await waitFor(() => {
                // Verificar que el slogan está presente (solo aparece si el item fue pasado correctamente)
                const sloganInput = screen.getByPlaceholderText(
                    "Ej: La mejor calidad para tu dia a dia"
                );
                expect(sloganInput).toHaveValue("El mejor producto");
            });
        });

        it("should show inventory details for product type", async () => {
            renderPage();

            await waitFor(() => {
                expect(screen.getByText("Detalles de Inventario")).toBeInTheDocument();
            });
        });
    });

    describe("Different ID Values", () => {
        it("should handle numeric id correctly", async () => {
            (routerHook.useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
                navigate: mockNavigate,
                pathname: "/cms/inventory/product/123",
                params: { id: "123" },
            });

            renderPage();

            await waitFor(() => {
                expect(getItemById).toHaveBeenCalledWith(123);
            });
        });
    });
});
