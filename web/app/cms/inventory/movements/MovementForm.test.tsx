import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { MovementForm } from "./MovementForm";
import Form from "@/components/form";
import { createInventoryMovement } from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";
import { listItems } from "@agape/catalogs/item";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import PortalProvider from "@/components/util/portal";
import EventEmitter from "@/components/util/event-emitter";

// Mock services
vi.mock("@agape/inventory/movement");
vi.mock("@agape/inventory/movementType");
vi.mock("@agape/catalogs/item");

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
    code: "I1",
    fullName: "Item 1",
    basePrice: new Decimal(10),
    isEnabled: true,
    type: "good" as const,
  },
];

describe("MovementForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(listMovementTypes).mockResolvedValue(mockTypes as any);

    vi.mocked(listItems).mockResolvedValue({
      items: mockItems,
      totalCount: 1,
    } as any);
  });

  const renderForm = () => {
    return render(
      createElement(
        EventEmitter,
        null,
        createElement(
          PortalProvider,
          null,
          createElement(MovementForm, {
            types: mockTypes as any,
            onSuccess: vi.fn(),
          })
        )
      )
    );
  };

  it("renders correctly", () => {
    renderForm();
    expect(screen.getByText("Información General")).toBeInTheDocument();
    expect(screen.getByText("Detalles del Movimiento")).toBeInTheDocument();
  });

  it("submits the form with correct payload", async () => {
    // Mock createInventoryMovement to succeed
    vi.mocked(createInventoryMovement).mockResolvedValue({
      id: 1,
      documentNumberFull: "MOV-001",
    } as any);

    renderForm();

    // Wait for items to load (the component fetches items on mount)
    await waitFor(() => {
      expect(listItems).toHaveBeenCalled();
    });

    // Select movement type
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "1" } });

    // Add item
    fireEvent.click(screen.getByText("Agregar Item"));

    // Wait for the item row to appear and items to be loaded in select
    await waitFor(() => {
      expect(screen.getByText("- Seleccionar Item -")).toBeInTheDocument();
    });

    // Select item - re-query comboboxes after item row is added
    const updatedSelects = screen.getAllByRole("combobox");
    // 0 is movement type, 1 is item
    fireEvent.change(updatedSelects[1], { target: { value: "1" } });

    // Set quantity - look for the placeholder "0" in the quantity input
    const quantityInput = screen.getByPlaceholderText("0");
    fireEvent.change(quantityInput, {
      target: { value: "10" },
    });

    // Submit - click the submit button
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
          quantity: 10,
        }),
      ],
    });
  });
});
