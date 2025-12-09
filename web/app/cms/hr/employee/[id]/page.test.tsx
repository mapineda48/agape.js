import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditEmployeePage from "./page";
import { upsertEmployee } from "@agape/hr/employee";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { DocumentType } from "@agape/core/documentType";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

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

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <EventEmitter>
        <PortalProvider>{ui}</PortalProvider>
      </EventEmitter>
    );
  };

  describe("Rendering", () => {
    it("renders the form with initial data", () => {
      renderWithProviders(
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

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("1");
    });

    it("renders document type select with valid options", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const select = screen.getByRole("combobox");
      const options = Array.from(select.querySelectorAll("option"));

      // NIT should be filtered out (appliesToCompany = true)
      // Only "Cédula de Ciudadanía" should be available + placeholder
      expect(options.map((o) => o.textContent)).toContain(
        "Cédula de Ciudadanía"
      );
      expect(options.map((o) => o.textContent)).not.toContain("NIT");
    });
  });

  describe("Form Submission", () => {
    it("submits the form with valid data", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      // Modify a field
      const nameInput = screen.getByDisplayValue("Juan");
      fireEvent.change(nameInput, { target: { value: "Juan Modified" } });

      // Find and submit the form directly
      const form = nameInput.closest("form");
      expect(form).not.toBeNull();

      await act(async () => {
        fireEvent.submit(form!);
      });

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

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      // Find and submit the form
      const form = document.querySelector("form");
      expect(form).not.toBeNull();

      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      expect(mockNotify).toHaveBeenCalledWith({ payload: errorMsg });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("navigates back when cancel is clicked", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const cancelBtn = screen.getByText("Cancelar");
      fireEvent.click(cancelBtn);
      expect(mockNavigate).toHaveBeenCalledWith("../../employees");
    });

    it("navigates back when header back button is clicked", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const backBtn = screen.getByText("Volver a Empleados");
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith("../../employees");
    });
  });
});
