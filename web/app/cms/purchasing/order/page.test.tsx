import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import NewOrderPage from "./page";
import { OrderForm } from "./components";
import Form from "@/components/form";
import { createPurchaseOrder } from "@agape/purchasing/purchase_order";
import { listSuppliers } from "@agape/purchasing/supplier";
import { listItems } from "@agape/catalogs/item";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import type { CreatePurchaseOrderInput } from "@utils/dto/purchasing/purchase_order";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";
import type { ListItemItem } from "@utils/dto/catalogs/item";

// Mock services
vi.mock("@agape/purchasing/purchase_order");
vi.mock("@agape/purchasing/supplier");
vi.mock("@agape/catalogs/item");

// Mock router
vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

// Mock notification
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

const mockSuppliers: SupplierListItem[] = [
  {
    id: 1,
    userId: 1,
    firstName: "Juan",
    lastName: "Proveedor",
    legalName: null,
    tradeName: null,
    birthdate: null,
    supplierTypeId: 1,
    supplierTypeName: "Nacional",
    registrationDate: new DateTime("2024-01-01"),
    active: true,
    documentTypeId: 1,
    documentNumber: "123456789",
  },
];

const mockItems: ListItemItem[] = [
  {
    id: 1,
    code: "PROD001",
    fullName: "Producto de Prueba 1",
    basePrice: new Decimal(100),
    isEnabled: true,
    type: "good",
    category: "Electrónica",
    images: [],
    rating: 5,
  },
  {
    id: 2,
    code: "PROD002",
    fullName: "Producto de Prueba 2",
    basePrice: new Decimal(250.5),
    isEnabled: true,
    type: "good",
    category: "Oficina",
    images: [],
    rating: 4,
  },
];

// TODO: Fix Form import issue - this test suite has a preexisting mock problem
describe("OrderForm Component", () => {
  const renderForm = (initialState?: Partial<CreatePurchaseOrderInput>) => {
    const defaultState: CreatePurchaseOrderInput = {
      supplierId: 0,
      orderDate: new DateTime(),
      items: [],
      ...initialState,
    };

    const itemsForForm = mockItems.map((item) => ({
      id: item.id,
      code: item.code,
      fullName: item.fullName,
      basePrice: item.basePrice,
    }));

    return render(
      createElement(
        EventEmitter,
        null,
        createElement(
          PortalProvider,
          null,
          createElement(Form.Root, {
            state: defaultState,
            children: createElement(OrderForm, {
              suppliers: mockSuppliers,
              items: itemsForForm,
              children: createElement("button", { type: "submit" }, "Crear"),
            }),
          })
        )
      )
    );
  };

  describe("Rendering", () => {
    it("renders the form header", () => {
      renderForm();
      expect(screen.getByText("Nueva Orden de Compra")).toBeInTheDocument();
    });

    it("shows supplier selection dropdown", () => {
      renderForm();
      expect(screen.getByText("Proveedor")).toBeInTheDocument();
      expect(screen.getByTestId("supplier-select")).toBeInTheDocument();
    });

    it("shows order date field", () => {
      renderForm();
      expect(screen.getByText("Fecha de Orden")).toBeInTheDocument();
    });

    it("shows items section with add button", () => {
      renderForm();
      expect(screen.getByText("Ítems de la Orden")).toBeInTheDocument();
      expect(screen.getByText("Agregar Ítem")).toBeInTheDocument();
    });

    it("shows empty state when no items", () => {
      renderForm();
      expect(screen.getByText("No hay ítems en la orden")).toBeInTheDocument();
    });

    it("displays total as zero initially", () => {
      renderForm();
      expect(screen.getByText(/\$0,00/)).toBeInTheDocument();
    });

    it("shows suppliers in dropdown", () => {
      renderForm();
      expect(screen.getByText("Juan Proveedor")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("adds an item when clicking add button", () => {
      renderForm();

      const addButton = screen.getByText("Agregar Ítem");
      fireEvent.click(addButton);

      // After adding, empty state should disappear
      expect(
        screen.queryByText("No hay ítems en la orden")
      ).not.toBeInTheDocument();
    });
  });
});

describe("NewOrderPage", () => {
  const mockNavigate = vi.fn();
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      navigate: mockNavigate,
      pathname: "/cms/purchasing/order",
      params: {},
    });

    (useNotificacion as ReturnType<typeof vi.fn>).mockReturnValue(mockNotify);

    vi.mocked(createPurchaseOrder).mockResolvedValue({
      id: 1,
      supplierId: 1,
      orderDate: new DateTime(),
      status: "pending",
      items: [],
      seriesId: 1,
      documentNumber: 1,
      documentNumberFull: "OC-001",
    });

    vi.mocked(listSuppliers).mockResolvedValue({
      suppliers: mockSuppliers,
      totalCount: mockSuppliers.length,
    });

    vi.mocked(listItems).mockResolvedValue({
      items: mockItems,
      totalCount: mockItems.length,
    });
  });

  const renderPage = () => {
    return render(
      createElement(
        EventEmitter,
        null,
        createElement(
          PortalProvider,
          null,
          createElement(NewOrderPage, {
            suppliers: mockSuppliers,
            items: mockItems,
          })
        )
      )
    );
  };

  describe("Rendering", () => {
    it("renders the page with back button", () => {
      renderPage();
      expect(screen.getByText("Volver a Órdenes")).toBeInTheDocument();
    });

    it("renders cancel and submit buttons", () => {
      renderPage();
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Crear Orden")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates back when clicking back button", () => {
      renderPage();

      const backButton = screen.getByText("Volver a Órdenes");
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("../orders");
    });

    it("navigates back when clicking cancel button", () => {
      renderPage();

      const cancelButton = screen.getByText("Cancelar");
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith("../orders");
    });
  });
});

describe("NewOrderPage.onInit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(listSuppliers).mockResolvedValue({
      suppliers: mockSuppliers,
      totalCount: mockSuppliers.length,
    });

    vi.mocked(listItems).mockResolvedValue({
      items: mockItems,
      totalCount: mockItems.length,
    });
  });

  it("loads suppliers and items on init", async () => {
    const { onInit } = await import("./page");

    const result = await onInit();

    expect(listSuppliers).toHaveBeenCalledWith({
      isActive: true,
      pageSize: 500,
    });

    expect(listItems).toHaveBeenCalledWith({
      isEnabled: true,
      pageSize: 500,
    });

    expect(result.suppliers).toEqual(mockSuppliers);
    expect(result.items).toEqual(mockItems);
  });
});
