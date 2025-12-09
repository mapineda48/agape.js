import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditEmployeePage from "./page";
import { upsertEmployee } from "@agape/hr/employee";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { DocumentType } from "@agape/core/documentType";
import EventEmitter from "@/components/util/event-emitter";

// @agape/hr/employee is mocked via alias in vitest.config.ts -> web/test/mocks/employee.ts

vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

describe("EditEmployeePage", () => {
  const mockNavigate = vi.fn();
  const mockNotify = vi.fn();

  const mockDocumentTypes: DocumentType[] = [
    {
      id: 1,
      name: "Cédula de Ciudadanía",
      code: "CC",
      appliesToPerson: true,
      appliesToCompany: false,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      id: 2,
      name: "NIT",
      code: "NIT",
      appliesToPerson: false,
      appliesToCompany: true,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    },
  ];

  const mockEmployee = {
    id: 101,
    userId: 202,
    firstName: "Juan",
    lastName: "Perez",
    email: "juan@example.com",
    phone: "555-0000",
    address: "Calle Falsa 123",
    birthdate: new Date("1990-05-15"),
    hireDate: new Date("2020-01-10"),
    isActive: true,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: null,
    documentTypeId: 1,
    documentNumber: "1234567890",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ navigate: mockNavigate });
    (useNotificacion as any).mockReturnValue(mockNotify);
  });

  const renderWithContext = (ui: React.ReactNode) => {
    return render(<EventEmitter>{ui}</EventEmitter>);
  };

  it("renders the form with initial data", () => {
    renderWithContext(
      <EditEmployeePage
        documentTypes={mockDocumentTypes}
        employee={mockEmployee}
      />
    );

    // Check header
    expect(screen.getByText("Editar Empleado")).toBeInTheDocument();

    // Check initial values in inputs
    expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Juan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Perez")).toBeInTheDocument();
    expect(screen.getByDisplayValue("juan@example.com")).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("1");
  });

  it("submits the form with valid data", async () => {
    (upsertEmployee as any).mockResolvedValue({ id: 101 });

    renderWithContext(
      <EditEmployeePage
        documentTypes={mockDocumentTypes}
        employee={mockEmployee}
      />
    );

    const submitBtn = screen.getByText("Guardar Cambios");

    // Modify a field
    const nameInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nameInput, { target: { value: "Juan Modified" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(upsertEmployee).toHaveBeenCalled();
    });

    const expectedPayload = expect.objectContaining({
      id: 101,
      user: expect.objectContaining({
        person: expect.objectContaining({
          firstName: "Juan Modified",
        }),
      }),
    });

    expect(upsertEmployee).toHaveBeenCalledWith(expectedPayload);
    expect(mockNotify).toHaveBeenCalledWith({
      payload: "Empleado actualizado exitosamente",
    });
    expect(mockNavigate).toHaveBeenCalledWith("../../employees");
  });

  it("handles submission error from service", async () => {
    const errorMsg = "Database error";
    (upsertEmployee as any).mockRejectedValue(errorMsg);

    renderWithContext(
      <EditEmployeePage
        documentTypes={mockDocumentTypes}
        employee={mockEmployee}
      />
    );

    const submitBtn = screen.getByText("Guardar Cambios");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(upsertEmployee).toHaveBeenCalled();
    });

    expect(mockNotify).toHaveBeenCalledWith({ payload: errorMsg });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("validates missing personal data (if cleared)", async () => {
    renderWithContext(
      <EditEmployeePage
        documentTypes={mockDocumentTypes}
        employee={mockEmployee}
      />
    );

    // Cancel does not submit
    const cancelBtn = screen.getByText("Cancelar");
    fireEvent.click(cancelBtn);
    expect(mockNavigate).toHaveBeenCalledWith("../../employees");
  });

  it("validates missing document type", async () => {
    // Render with an employee that somehow has no document type (unlikely in real app but possible in robust testing)
    // OR simply change the select to empty if allowed.
    renderWithContext(
      <EditEmployeePage
        documentTypes={mockDocumentTypes}
        employee={{ ...mockEmployee, documentTypeId: 0 as any }} // Force invalid initial state
      />
    );

    const submitBtn = screen.getByText("Guardar Cambios");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        payload: expect.objectContaining({
          message: "Tipo de documento no seleccionado",
        }),
      });
    });

    expect(upsertEmployee).not.toHaveBeenCalled();
  });
});
