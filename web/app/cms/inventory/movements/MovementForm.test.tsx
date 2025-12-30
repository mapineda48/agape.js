import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
      fireEvent.click(screen.getByText("Agregar Item"));

      // Wait for the item row to appear
      await waitFor(() => {
        expect(
          screen.getByText("- Seleccionar Item -")
        ).toBeInTheDocument();
      });

      // Should not show "No hay items" anymore
      expect(
        screen.queryByText("No hay items agregados.")
      ).not.toBeInTheDocument();
    });

    it("loads items in the select dropdown", async () => {
      renderForm();

      // Add item row
      fireEvent.click(screen.getByText("Agregar Item"));

      await waitFor(() => {
        expect(screen.getByText("Producto Test 1 (PROD-001)")).toBeInTheDocument();
        expect(screen.getByText("Producto Test 2 (PROD-002)")).toBeInTheDocument();
      });
    });

    it("loads locations in the select dropdown", async () => {
      renderForm();

      // Add item row
      fireEvent.click(screen.getByText("Agregar Item"));

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

      fireEvent.click(screen.getByText("Agregar Item"));

      await waitFor(() => {
        expect(screen.getByText("Ubicación")).toBeInTheDocument();
        expect(screen.getByText("- Ubicación -")).toBeInTheDocument();
      });
    });
  });

  describe("Removing Items", () => {
    it("removes a detail row when trash button is clicked", async () => {
      renderForm();

      // Add two items
      fireEvent.click(screen.getByText("Agregar Item"));
      fireEvent.click(screen.getByText("Agregar Item"));

      await waitFor(() => {
        const itemSelects = screen.getAllByText("- Seleccionar Item -");
        expect(itemSelects.length).toBe(2);
      });

      // Click the first trash button
      const trashButtons = screen.getAllByTitle("Remover linea");
      fireEvent.click(trashButtons[0]);

      await waitFor(() => {
        const itemSelects = screen.getAllByText("- Seleccionar Item -");
        expect(itemSelects.length).toBe(1);
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

      // Wait for items and locations to load
      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
        expect(listLocations).toHaveBeenCalled();
      });

      // Select movement type
      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "1" } });

      // Add item
      fireEvent.click(screen.getByText("Agregar Item"));

      // Wait for the item row to appear
      await waitFor(() => {
        expect(screen.getByText("- Seleccionar Item -")).toBeInTheDocument();
      });

      // Get all selects after item is added
      const updatedSelects = screen.getAllByRole("combobox");
      // 0: movement type, 1: item, 2: location
      fireEvent.change(updatedSelects[1], { target: { value: "1" } });
      fireEvent.change(updatedSelects[2], { target: { value: "1" } });

      // Set quantity
      const quantityInput = screen.getByPlaceholderText("0");
      fireEvent.change(quantityInput, { target: { value: "10" } });

      // Submit
      const submitBtn = screen.getByText("Crear Movimiento");
      fireEvent.click(submitBtn);

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

      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });

      // Fill required fields
      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "1" } });

      fireEvent.click(screen.getByText("Agregar Item"));

      await waitFor(() => {
        expect(screen.getByText("- Seleccionar Item -")).toBeInTheDocument();
      });

      const updatedSelects = screen.getAllByRole("combobox");
      fireEvent.change(updatedSelects[1], { target: { value: "1" } });
      fireEvent.change(updatedSelects[2], { target: { value: "1" } });

      const quantityInput = screen.getByPlaceholderText("0");
      fireEvent.change(quantityInput, { target: { value: "5" } });

      fireEvent.click(screen.getByText("Crear Movimiento"));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("submits with unit cost when provided", async () => {
      renderForm();

      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "1" } });

      fireEvent.click(screen.getByText("Agregar Item"));

      await waitFor(() => {
        expect(screen.getByText("- Seleccionar Item -")).toBeInTheDocument();
      });

      const updatedSelects = screen.getAllByRole("combobox");
      fireEvent.change(updatedSelects[1], { target: { value: "1" } });
      fireEvent.change(updatedSelects[2], { target: { value: "1" } });

      const quantityInput = screen.getByPlaceholderText("0");
      fireEvent.change(quantityInput, { target: { value: "5" } });

      // Set unit cost
      const unitCostInput = screen.getByPlaceholderText("0.00");
      fireEvent.change(unitCostInput, { target: { value: "25.50" } });

      fireEvent.click(screen.getByText("Crear Movimiento"));

      await waitFor(() => {
        expect(createInventoryMovement).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(createInventoryMovement).mock.calls[0][0];
      expect(callArgs.details[0]).toMatchObject({
        itemId: 1,
        locationId: 1,
        quantity: 5,
      });
      // Unit cost should be passed (as Decimal or parsed value)
      expect(callArgs.details[0].unitCost).toBeDefined();
    });

    it("submits multiple detail rows correctly", async () => {
      renderForm();

      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });

      // Select movement type
      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "2" } }); // Salida

      // Add two items
      fireEvent.click(screen.getByText("Agregar Item"));
      fireEvent.click(screen.getByText("Agregar Item"));

      await waitFor(() => {
        const itemSelects = screen.getAllByText("- Seleccionar Item -");
        expect(itemSelects.length).toBe(2);
      });

      const updatedSelects = screen.getAllByRole("combobox");
      // First row: itemId (idx 1), locationId (idx 2)
      fireEvent.change(updatedSelects[1], { target: { value: "1" } });
      fireEvent.change(updatedSelects[2], { target: { value: "1" } });
      // Second row: itemId (idx 3), locationId (idx 4)
      fireEvent.change(updatedSelects[3], { target: { value: "2" } });
      fireEvent.change(updatedSelects[4], { target: { value: "2" } });

      const quantityInputs = screen.getAllByPlaceholderText("0");
      fireEvent.change(quantityInputs[0], { target: { value: "10" } });
      fireEvent.change(quantityInputs[1], { target: { value: "20" } });

      fireEvent.click(screen.getByText("Crear Movimiento"));

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
        expect(listItems).toHaveBeenCalled();
      });

      expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
    });

    it("disables movement type selector when editing", async () => {
      const initialData = {
        id: 1,
        movementTypeId: 1,
        movementDate: new DateTime(),
        details: [],
      };

      renderForm({ initialData: initialData as any });

      await waitFor(() => {
        expect(listItems).toHaveBeenCalled();
      });

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

