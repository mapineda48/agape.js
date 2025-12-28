import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import CreateItemPage from "./page";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";
import * as routerHook from "@/components/router/router-hook";

// Mock del router hook
vi.mock("@/components/router/router-hook", () => ({
    useRouter: vi.fn(),
}));

// Mock de los servicios
import { listCategories, listSubcategories } from "@agape/catalogs/category";
import { upsertItem } from "@agape/catalogs/item";

describe("CreateItemPage", () => {
    let router: HistoryManager;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        router = new HistoryManager();

        // Configurar el mock del router
        (routerHook.useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            navigate: mockNavigate,
            pathname: "/cms/inventory/product",
            params: {},
        });

        // Configurar mocks de servicios
        (listCategories as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, fullName: "Electrónicos", isEnabled: true },
            { id: 2, fullName: "Ropa", isEnabled: true },
        ]);

        (listSubcategories as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, fullName: "Smartphones", isEnabled: true },
            { id: 2, fullName: "Laptops", isEnabled: true },
        ]);
    });

    const renderPage = () => {
        return render(
            createElement(
                HistoryContext.Provider,
                { value: router },
                createElement(
                    EventEmitter,
                    null,
                    createElement(PortalProvider, null, createElement(CreateItemPage))
                )
            )
        );
    };

    describe("Rendering", () => {
        it("should render the page title", () => {
            renderPage();
            expect(screen.getByText("Nuevo Item")).toBeInTheDocument();
        });

        it("should render the page description", () => {
            renderPage();
            expect(
                screen.getByText(
                    "Selecciona el tipo y completa la informacion para crear un nuevo item."
                )
            ).toBeInTheDocument();
        });

        it("should render the 'Ver Catalogo' button", () => {
            renderPage();
            expect(screen.getByText("Ver Catalogo")).toBeInTheDocument();
        });

        it("should render type selector with 'Producto' and 'Servicio' options", () => {
            renderPage();
            expect(screen.getByText("Producto")).toBeInTheDocument();
            expect(screen.getByText("Servicio")).toBeInTheDocument();
        });

        it("should render 'Producto' as default selected type", () => {
            renderPage();
            // El texto "Bien fisico inventariable" solo aparece cuando Producto está visible
            expect(screen.getByText("Bien fisico inventariable")).toBeInTheDocument();
        });
    });

    describe("Navigation", () => {
        it("should navigate to catalog when 'Ver Catalogo' button is clicked", () => {
            renderPage();
            const button = screen.getByText("Ver Catalogo");
            fireEvent.click(button);
            expect(mockNavigate).toHaveBeenCalledWith("../products");
        });
    });

    describe("Type Selector Interaction", () => {
        it("should switch to service type when 'Servicio' is clicked", () => {
            renderPage();

            const serviceButton = screen.getByText("Servicio").closest("button");
            expect(serviceButton).toBeInTheDocument();

            fireEvent.click(serviceButton!);

            // Verificar que ahora muestra los detalles del servicio
            expect(screen.getByText("Detalles del Servicio")).toBeInTheDocument();
        });

        it("should show 'Guardar Producto' button when product type is selected", () => {
            renderPage();
            expect(screen.getByText("Guardar Producto")).toBeInTheDocument();
        });

        it("should show 'Guardar Servicio' button when service type is selected", () => {
            renderPage();

            const serviceButton = screen.getByText("Servicio").closest("button");
            fireEvent.click(serviceButton!);

            expect(screen.getByText("Guardar Servicio")).toBeInTheDocument();
        });
    });

    describe("Form Fields - Product Type", () => {
        it("should render basic information fields", () => {
            renderPage();
            expect(screen.getByText("Nombre")).toBeInTheDocument();
            expect(screen.getByText("Slogan / Subtitulo")).toBeInTheDocument();
            expect(screen.getByText("Descripcion")).toBeInTheDocument();
        });

        it("should render inventory details for product type", () => {
            renderPage();
            expect(screen.getByText("Detalles de Inventario")).toBeInTheDocument();
            expect(screen.getByText("Unidad de Medida")).toBeInTheDocument();
            expect(screen.getByText("Stock Minimo")).toBeInTheDocument();
            expect(screen.getByText("Stock Maximo")).toBeInTheDocument();
            expect(screen.getByText("Punto de Reorden")).toBeInTheDocument();
        });

        it("should render status and price section", () => {
            renderPage();
            expect(screen.getByText("Estado y Precio")).toBeInTheDocument();
            expect(screen.getByText("Item Habilitado")).toBeInTheDocument();
            expect(screen.getByText("Precio Base")).toBeInTheDocument();
            expect(screen.getByText("Rating Inicial")).toBeInTheDocument();
        });

        it("should render categorization section", () => {
            renderPage();
            expect(screen.getByText("Categorizacion")).toBeInTheDocument();
            expect(screen.getByText("Categoria")).toBeInTheDocument();
            expect(screen.getByText("Subcategoria")).toBeInTheDocument();
        });

        it("should render media section", () => {
            renderPage();
            expect(screen.getByText("Galeria de Imagenes")).toBeInTheDocument();
        });
    });

    describe("Form Fields - Service Type", () => {
        it("should render service details when service type is selected", () => {
            renderPage();

            const serviceButton = screen.getByText("Servicio").closest("button");
            fireEvent.click(serviceButton!);

            expect(screen.getByText("Detalles del Servicio")).toBeInTheDocument();
            expect(screen.getByText("Duracion (minutos)")).toBeInTheDocument();
            expect(screen.getByText("Servicio Recurrente")).toBeInTheDocument();
        });

        it("should not render inventory details when service type is selected", () => {
            renderPage();

            const serviceButton = screen.getByText("Servicio").closest("button");
            fireEvent.click(serviceButton!);

            expect(
                screen.queryByText("Detalles de Inventario")
            ).not.toBeInTheDocument();
        });
    });
});
