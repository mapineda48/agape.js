import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import PurchaseOrdersPage from "./page";
import { listPurchaseOrders } from "@agape/purchasing/purchase_order";
import { PURCHASE_ORDER_STATUS_VALUES } from "@utils/dto/purchasing/purchase_order";
import { listSuppliers } from "@agape/purchasing/supplier";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import type {
  PurchaseOrderListItem,
  ListPurchaseOrdersResult,
} from "@utils/dto/purchasing/purchase_order";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";

// Mock services
vi.mock("@agape/purchasing/purchase_order");
vi.mock("@agape/purchasing/supplier");

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
    email: "juan@proveedor.com",
    phone: "1234567890",
    address: null,
    birthdate: null,
    supplierTypeId: 1,
    supplierTypeName: "Nacional",
    registrationDate: new DateTime("2024-01-01"),
    active: true,
    documentTypeId: 1,
    documentNumber: "123456789",
  },
  {
    id: 2,
    userId: 2,
    firstName: null,
    lastName: null,
    legalName: "Distribuidora S.A.",
    tradeName: "Distribuidora",
    email: "info@distribuidora.com",
    phone: "0987654321",
    address: null,
    birthdate: null,
    supplierTypeId: 2,
    supplierTypeName: "Internacional",
    registrationDate: new DateTime("2024-01-01"),
    active: true,
    documentTypeId: 2,
    documentNumber: "900123456-1",
  },
];

const mockOrders: PurchaseOrderListItem[] = [
  {
    id: 1,
    supplierId: 1,
    supplierName: "Juan Proveedor",
    orderDate: new DateTime("2024-01-15"),
    status: "pending" as const,
    totalAmount: new Decimal(1500),
    itemCount: 3,
  },
  {
    id: 2,
    supplierId: 2,
    supplierName: "Distribuidora S.A.",
    orderDate: new DateTime("2024-01-16"),
    status: "approved" as const,
    totalAmount: new Decimal(2500.5),
    itemCount: 5,
  },
  {
    id: 3,
    supplierId: 1,
    supplierName: "Juan Proveedor",
    orderDate: new DateTime("2024-01-17"),
    status: "received" as const,
    totalAmount: new Decimal(800),
    itemCount: 2,
  },
];

describe("PurchaseOrdersPage", () => {
  const mockNavigate = vi.fn();
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      navigate: mockNavigate,
      pathname: "/cms/purchasing/orders",
      params: {},
    });

    (useNotificacion as ReturnType<typeof vi.fn>).mockReturnValue(mockNotify);

    vi.mocked(listPurchaseOrders).mockResolvedValue({
      orders: mockOrders,
      totalCount: mockOrders.length,
    } as ListPurchaseOrdersResult);

    vi.mocked(listSuppliers).mockResolvedValue({
      suppliers: mockSuppliers,
      totalCount: mockSuppliers.length,
    });
  });

  const renderWithProviders = (
    props?: Partial<Parameters<typeof PurchaseOrdersPage>[0]>
  ) => {
    const defaultProps = {
      orders: mockOrders,
      totalCount: mockOrders.length,
      suppliers: mockSuppliers,
    };

    return render(
      createElement(
        EventEmitter,
        null,
        createElement(
          PortalProvider,
          null,
          createElement(PurchaseOrdersPage, { ...defaultProps, ...props })
        )
      )
    );
  };

  describe("Rendering", () => {
    it("renders the page title", () => {
      renderWithProviders();
      expect(screen.getByText("Órdenes de Compra")).toBeInTheDocument();
    });

    it("displays all orders in the table", () => {
      renderWithProviders();

      expect(screen.getByText("#1")).toBeInTheDocument();
      // Use getAllByText since "Juan Proveedor" appears in both table and filter dropdown
      expect(screen.getAllByText("Juan Proveedor").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Distribuidora S.A.").length).toBeGreaterThan(
        0
      );
    });

    it("shows new order button", () => {
      renderWithProviders();
      expect(screen.getByText("Nueva Orden")).toBeInTheDocument();
    });

    it("displays status badges correctly", () => {
      renderWithProviders();

      expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Aprobada").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Recibida").length).toBeGreaterThan(0);
    });

    it("shows empty state when no orders", () => {
      renderWithProviders({ orders: [], totalCount: 0 });

      expect(
        screen.getByText("No se encontraron órdenes de compra")
      ).toBeInTheDocument();
    });
  });

  describe("Filters", () => {
    it("shows supplier filter dropdown", () => {
      renderWithProviders();

      expect(screen.getByText("Todos los proveedores")).toBeInTheDocument();
    });

    it("shows status filter dropdown", () => {
      renderWithProviders();

      expect(screen.getByText("Todos los estados")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to new order page on button click", () => {
      renderWithProviders();

      const newOrderBtn = screen.getByText("Nueva Orden");
      fireEvent.click(newOrderBtn);

      expect(mockNavigate).toHaveBeenCalledWith("../order");
    });
  });
});

describe("PurchaseOrdersPage.onInit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(listPurchaseOrders).mockResolvedValue({
      orders: mockOrders,
      totalCount: mockOrders.length,
    } as ListPurchaseOrdersResult);

    vi.mocked(listSuppliers).mockResolvedValue({
      suppliers: mockSuppliers,
      totalCount: mockSuppliers.length,
    });
  });

  it("loads orders and suppliers on init", async () => {
    const { onInit } = await import("./page");

    const result = await onInit();

    expect(listPurchaseOrders).toHaveBeenCalledWith({
      pageIndex: 0,
      pageSize: 15,
      includeTotalCount: true,
    });

    expect(listSuppliers).toHaveBeenCalledWith({ pageSize: 100 });

    expect(result.orders).toEqual(mockOrders);
    expect(result.suppliers).toEqual(mockSuppliers);
  });
});
