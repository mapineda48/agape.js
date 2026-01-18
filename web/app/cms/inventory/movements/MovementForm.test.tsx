import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { MovementForm } from "./MovementForm";
import Form from "@/components/form";
import { createInventoryMovement } from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";
import { listItems } from "@agape/catalogs/item";
import { listLocations } from "@agape/inventory/location";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import PortalProvider from "@/components/util/portal";
import EventEmitter from "@/components/util/event-emitter";

// Mock services
vi.mock("@agape/inventory/movement");
vi.mock("@agape/inventory/movementType");
vi.mock("@agape/catalogs/item");
vi.mock("@agape/inventory/location");

// Mock notification
const mockNotify = vi.fn();
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: () => mockNotify,
  useConfirmModal: vi.fn(),
}));

// Setup default props
const mockTypes = [
  {
    id: 1,
    name: "Entrada por Compra",
    factor: 1,
    isEnabled: true,
    documentTypeId: 1,
    affectsStock: true,
  },
  {
    id: 2,
    name: "Salida por Venta",
    factor: -1,
    isEnabled: true,
    documentTypeId: 2,
    affectsStock: true,
  },
];

const mockItems = [
  {
    id: 1,
    code: "PROD-001",
    fullName: "Producto Test 1",
    basePrice: new Decimal(10),
    isEnabled: true,
    type: "good" as const,
  },
  {
    id: 2,
    code: "PROD-002",
    fullName: "Producto Test 2",
    basePrice: new Decimal(25),
    isEnabled: true,
    type: "good" as const,
  },
];

const mockLocations = [
  { id: 1, code: "ALM-01", name: "Almacén Principal", isEnabled: true },
  { id: 2, code: "ALM-02", name: "Almacén Secundario", isEnabled: true },
];

describe("MovementForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(listMovementTypes).mockResolvedValue(mockTypes as any);

    vi.mocked(listItems).mockResolvedValue({
      items: mockItems,
      totalCount: mockItems.length,
    } as any);

    vi.mocked(listLocations).mockResolvedValue(mockLocations as any);
  });

  const renderForm = (props?: Partial<Parameters<typeof MovementForm>[0]>) => {
    const defaultProps = {
      types: mockTypes as any,
      onSuccess: vi.fn(),
    };
    return render(
      createElement(
        EventEmitter,
        null,
        createElement(
          PortalProvider,
          null,
          createElement(MovementForm, { ...defaultProps, ...props })
        )
      )
    );
  };

  describe("Rendering", () => {
    it("renders correctly with all sections", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
        expect(listLocations).toHaveBeenCalled();
      });
      expect(screen.getByText("Información General")).toBeInTheDocument();
      expect(screen.getByText("Detalles del Movimiento")).toBeInTheDocument();
      expect(screen.getByText("Resumen")).toBeInTheDocument();
    });

    it("renders movement type selector with options", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });
      expect(screen.getByText("Tipo de Movimiento")).toBeInTheDocument();
      expect(screen.getByText("Entrada por Compra")).toBeInTheDocument();
      expect(screen.getByText("Salida por Venta")).toBeInTheDocument();
    });

    it("renders date input", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });
      expect(screen.getByText("Fecha")).toBeInTheDocument();
    });

    it("renders observation field", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });
      expect(screen.getByText("Observación")).toBeInTheDocument();
    });

    it("renders 'Agregar Item' button", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });
      expect(screen.getByText("Agregar Item")).toBeInTheDocument();
    });

    it("shows 'No hay items agregados' when details are empty", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });
      expect(screen.getByText("No hay items agregados.")).toBeInTheDocument();
    });

    it("renders submit button with correct text for new movement", async () => {
      renderForm();
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });
      expect(screen.getByText("Crear Movimiento")).toBeInTheDocument();
    });
  });

  describe("Adding Items", () => {
    it("adds a detail row when 'Agregar Item' is clicked", async () => {
      renderForm();

      // Wait for items to load
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });

      // Initial state: no items
      expect(screen.getByText("No hay items agregados.")).toBeInTheDocument();

      // Click to add item
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      await waitFor(() => {
        expect(screen.getByText("Producto Test 1 (PROD-001)")).toBeInTheDocument();
        expect(screen.getByText("Producto Test 2 (PROD-002)")).toBeInTheDocument();
      });
    });

    it("loads items in the select dropdown", async () => {
      renderForm();

      // Add item row
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      await waitFor(() => {
        expect(screen.getByText("Producto Test 1 (PROD-001)")).toBeInTheDocument();
        expect(screen.getByText("Producto Test 2 (PROD-002)")).toBeInTheDocument();
      });
    });

    it("loads locations in the select dropdown", async () => {
      renderForm();

      // Add item row
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      await waitFor(() => {
        expect(listLocations).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("ALM-01 - Almacén Principal")).toBeInTheDocument();
        expect(screen.getByText("ALM-02 - Almacén Secundario")).toBeInTheDocument();
      });
    });

    it("shows location selector for each detail row", async () => {
      renderForm();

      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      await waitFor(() => {
        expect(screen.getByText("Ubicación")).toBeInTheDocument();
        expect(screen.getAllByText("- Ubicación -").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Removing Items", () => {
    it("removes a detail row when trash button is clicked", async () => {
      renderForm();

      // Add two items
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      const comboCountBefore = screen.getAllByRole("combobox").length;
      expect(comboCountBefore).toBeGreaterThan(3);

      // Click the first trash button
      const trashButtons = screen.getAllByTitle("Remover linea");
      await act(async () => {
        fireEvent.click(trashButtons[0]);
      });

      await waitFor(() => {
        const comboCountAfter = screen.getAllByRole("combobox").length;
        expect(comboCountAfter).toBeLessThan(comboCountBefore);
      });
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      vi.mocked(createInventoryMovement).mockResolvedValue({
        movementId: 1,
        documentNumber: "MOV-001",
        status: "draft",
      } as any);
    });

    it("submits the form with correct payload including locationId", async () => {
      renderForm();

      // Wait for the form to be ready and selects to be available
      const typeSelect = await screen.findByTestId("type-select-hidden");

      await act(async () => {
        fireEvent.change(typeSelect, { target: { value: "1" } });
      });

      // Add item
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      // Wait for the item fields to appear
      const itemSelect = await screen.findByTestId("item-select-0-hidden");
      const locationSelect = await screen.findByTestId("location-select-0-hidden");
      const quantityInput = await screen.findByTestId("quantity-input-0");

      // Set item and location
      await act(async () => {
        fireEvent.change(itemSelect, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(locationSelect, { target: { value: "1" } });
      });

      // Set quantity
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: "10" } });
      });

      // Submit
      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(createInventoryMovement).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(createInventoryMovement).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        movementTypeId: 1,
        userId: 1,
        details: [
          expect.objectContaining({
            itemId: 1,
            locationId: 1,
            quantity: 10,
          }),
        ],
      });
    });

    it("calls onSuccess after successful submission", async () => {
      const onSuccess = vi.fn();
      renderForm({ onSuccess });

      const typeSelect = await screen.findByTestId("type-select-hidden");
      await act(async () => {
        fireEvent.change(typeSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      const itemSelect = await screen.findByTestId("item-select-0-hidden");
      const locationSelect = await screen.findByTestId("location-select-0-hidden");
      const quantityInput = await screen.findByTestId("quantity-input-0");
      const unitCostInput = await screen.findByTestId("unit-cost-input-0");

      await act(async () => {
        fireEvent.change(itemSelect, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(locationSelect, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: "5" } });
      });
      await act(async () => {
        fireEvent.change(unitCostInput, { target: { value: "25.50" } });
      });

      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(createInventoryMovement).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(createInventoryMovement).mock.calls[0][0];
      expect(callArgs.details[0]).toMatchObject({
        itemId: 1,
        locationId: 1,
        quantity: 5,
      });
      expect(callArgs.details[0].unitCost).toBeDefined();
    });

    it("submits multiple detail rows correctly", async () => {
      renderForm();

      const typeSelect = await screen.findByTestId("type-select-hidden");
      await act(async () => {
        fireEvent.change(typeSelect, { target: { value: "2" } }); // Salida
      });

      // Add two items
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });
      await act(async () => {
        fireEvent.click(screen.getByText("Agregar Item"));
      });

      // Row 0
      const itemSelect0 = await screen.findByTestId("item-select-0-hidden");
      const locationSelect0 = await screen.findByTestId("location-select-0-hidden");
      const quantityInput0 = await screen.findByTestId("quantity-input-0");

      await act(async () => {
        fireEvent.change(itemSelect0, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(locationSelect0, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(quantityInput0, { target: { value: "10" } });
      });

      // Row 1
      const itemSelect1 = await screen.findByTestId("item-select-1-hidden");
      const locationSelect1 = await screen.findByTestId("location-select-1-hidden");
      const quantityInput1 = await screen.findByTestId("quantity-input-1");

      await act(async () => {
        fireEvent.change(itemSelect1, { target: { value: "2" } });
      });
      await act(async () => {
        fireEvent.change(locationSelect1, { target: { value: "2" } });
      });
      await act(async () => {
        fireEvent.change(quantityInput1, { target: { value: "20" } });
      });

      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(createInventoryMovement).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(createInventoryMovement).mock.calls[0][0];
      expect(callArgs.movementTypeId).toBe(2);
      expect(callArgs.details).toHaveLength(2);
      expect(callArgs.details[0]).toMatchObject({
        itemId: 1,
        locationId: 1,
        quantity: 10,
      });
      expect(callArgs.details[1]).toMatchObject({
        itemId: 2,
        locationId: 2,
        quantity: 20,
      });
    });
  });

  describe("Edit Mode", () => {
    it("shows 'Guardar Cambios' button when editing", async () => {
      const initialData = {
        id: 1,
        movementTypeId: 1,
        movementDate: new DateTime(),
        details: [],
      };

      renderForm({ initialData: initialData as any });

      await waitFor(() => {
        expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
      });
    });

    it("disables movement type selector when editing", async () => {
      const initialData = {
        id: 1,
        movementTypeId: 1,
        movementDate: new DateTime(),
        details: [],
      };

      renderForm({ initialData: initialData as any });

      const selects = screen.getAllByRole("combobox");
      expect(selects[0]).toBeDisabled();
    });
  });

  describe("Data Loading", () => {
    it("calls listItems on mount", async () => {
      renderForm();

      await waitFor(() => {
        expect(listItems).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 100 });
      });
    });

    it("calls listLocations on mount", async () => {
      renderForm();

      await waitFor(() => {
        expect(listLocations).toHaveBeenCalled();
      });
    });
  });
});

