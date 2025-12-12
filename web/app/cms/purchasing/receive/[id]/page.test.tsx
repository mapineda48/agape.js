import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import ReceiveOrderPage from "./page";
import { getPurchaseOrderById } from "@agape/purchasing/purchase_order";
import { listLocations } from "@agape/inventory/location";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import type { PurchaseOrderDetails } from "@utils/dto/purchasing/purchase_order";

// Mock services
vi.mock("@agape/purchasing/purchase_order");
vi.mock("@agape/inventory/location");

// Mock router
vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

// Mock notification
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

const mockOrder: PurchaseOrderDetails = {
  id: 1,
  supplierId: 1,
  supplierName: "Proveedor Test",
  supplierDocumentType: "NIT",
  supplierDocumentNumber: "123456789",
  orderDate: new DateTime("2024-01-01"),
  status: "approved",
  documentNumberFull: "PO-00001",
  totalAmount: new Decimal(1000),
  items: [
    {
      id: 1,
      purchaseOrderId: 1,
      itemId: 101,
      itemCode: "P001",
      itemName: "Producto 1",
      quantity: 10,
      unitPrice: new Decimal(50),
      subtotal: new Decimal(500),
    },
    {
      id: 2,
      purchaseOrderId: 1,
      itemId: 102,
      itemCode: "P002",
      itemName: "Producto 2",
      quantity: 5,
      unitPrice: new Decimal(100),
      subtotal: new Decimal(500),
    },
  ],
};

const mockLocations: any[] = [
  {
    id: 1,
    name: "Bodega Principal",
    isEnabled: true,
    code: "BP",
    type: "warehouse",
    parentLocationId: null,
    description: null,
  },
  {
    id: 2,
    name: "Bodega Secundaria",
    isEnabled: true,
    code: "BS",
    type: "warehouse",
    parentLocationId: null,
    description: null,
  },
];

describe("ReceiveOrderPage", () => {
  const mockNavigate = vi.fn();
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      navigate: mockNavigate,
      pathname: "/cms/purchasing/receive/1",
      params: { id: "1" },
    });

    (useNotificacion as ReturnType<typeof vi.fn>).mockReturnValue(mockNotify);

    vi.mocked(getPurchaseOrderById).mockResolvedValue(mockOrder);
    vi.mocked(listLocations).mockResolvedValue(mockLocations);
  });

  const renderPage = () => {
    return render(
      createElement(
        EventEmitter,
        null,
        createElement(
          PortalProvider,
          null,
          createElement(ReceiveOrderPage, {
            order: mockOrder,
            locations: mockLocations,
          })
        )
      )
    );
  };

  describe("Rendering", () => {
    it("renders page title", () => {
      renderPage();
      expect(screen.getByText("Recibir Mercancía")).toBeInTheDocument();
      expect(screen.getByText(/Orden #1/)).toBeInTheDocument();
    });

    it("displays location selector", () => {
      renderPage();
      expect(screen.getByText("Ubicación de Bodega *")).toBeInTheDocument();
      expect(screen.getByText("Bodega Principal")).toBeInTheDocument();
    });

    it("lists items to receive", () => {
      renderPage();
      expect(screen.getByText("Producto 1")).toBeInTheDocument();
      expect(screen.getByText("Producto 2")).toBeInTheDocument();
    });

    it("inputs default to full quantity", () => {
      renderPage();
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(10); // Quantity of item 1
      expect(inputs[1]).toHaveValue(5); // Quantity of item 2
    });
  });

  describe("Validation", () => {
    it("shows error when location is not selected", async () => {
      renderPage();

      const submitBtn = screen.getByText("Confirmar Recepción");
      fireEvent.click(submitBtn);

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          payload: "Debe seleccionar una ubicación de bodega",
        })
      );
    });
  });
});
