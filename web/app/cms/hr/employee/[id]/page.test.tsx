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
import DateTime from "@utils/data/DateTime";

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
    },
    {
      id: 2,
      name: "Tarjeta de Identidad",
      code: "TI",
      appliesToPerson: true,
      appliesToCompany: false,
      isEnabled: true,
    },
    {
      id: 3,
      name: "NIT",
      code: "NIT",
      appliesToPerson: false,
      appliesToCompany: true,
      isEnabled: true,
    },
  ];

  // Complete mock employee with all fields
  const mockEmployee = {
    id: 101,
    userId: 202,
    firstName: "Juan",
    lastName: "Perez",
    email: "juan@example.com",
    phone: "555-0000",
    address: "Calle Falsa 123",
    birthdate: new DateTime("1990-05-15"),
    hireDate: new DateTime("2020-01-10"),
    isActive: true,
    avatarUrl: "",
    createdAt: new DateTime(),
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
    it("renders the page with correct header", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText("Editar Empleado")).toBeInTheDocument();
      expect(
        screen.getByText("Actualiza la información del empleado")
      ).toBeInTheDocument();
    });

    it("renders all form sections", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText("Identificación")).toBeInTheDocument();
      expect(screen.getByText("Información Personal")).toBeInTheDocument();
      expect(screen.getByText("Información Laboral")).toBeInTheDocument();
    });

    it("maps all employee fields to form inputs correctly", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      // Document type
      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("1");

      // Document number
      expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument();

      // Personal data
      expect(screen.getByDisplayValue("Juan")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Perez")).toBeInTheDocument();
      expect(screen.getByDisplayValue("juan@example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("555-0000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Calle Falsa 123")).toBeInTheDocument();

      // isActive checkbox
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("maps inactive employee correctly", () => {
      const inactiveEmployee = { ...mockEmployee, isActive: false };

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={inactiveEmployee}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("filters out company document types", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const select = screen.getByRole("combobox");
      const options = Array.from(select.querySelectorAll("option"));

      const optionTexts = options.map((o) => o.textContent);
      expect(optionTexts).toContain("Cédula de Ciudadanía");
      expect(optionTexts).toContain("Tarjeta de Identidad");
      expect(optionTexts).not.toContain("NIT");
    });

    it("handles employee with null optional fields", () => {
      const employeeWithNulls = {
        ...mockEmployee,
        email: null,
        phone: null,
        address: null,
        birthdate: null,
        avatarUrl: "",
      };

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={employeeWithNulls}
        />
      );

      // Should render without errors
      expect(screen.getByText("Editar Empleado")).toBeInTheDocument();
      // Null values should render as empty strings
      expect(screen.getByPlaceholderText("juan.perez@example.com")).toHaveValue(
        ""
      );
    });
  });

  describe("Form Interaction", () => {
    it("allows modifying firstName", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const firstNameInput = screen.getByDisplayValue("Juan");
      fireEvent.change(firstNameInput, { target: { value: "Carlos" } });
      expect(firstNameInput).toHaveValue("Carlos");
    });

    it("allows modifying lastName", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const lastNameInput = screen.getByDisplayValue("Perez");
      fireEvent.change(lastNameInput, { target: { value: "García" } });
      expect(lastNameInput).toHaveValue("García");
    });

    it("allows modifying email", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const emailInput = screen.getByDisplayValue("juan@example.com");
      fireEvent.change(emailInput, { target: { value: "carlos@new.com" } });
      expect(emailInput).toHaveValue("carlos@new.com");
    });

    it("allows modifying phone", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const phoneInput = screen.getByDisplayValue("555-0000");
      fireEvent.change(phoneInput, { target: { value: "999-1111" } });
      expect(phoneInput).toHaveValue("999-1111");
    });

    it("allows modifying address", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const addressInput = screen.getByDisplayValue("Calle Falsa 123");
      fireEvent.change(addressInput, { target: { value: "Av. Nueva 456" } });
      expect(addressInput).toHaveValue("Av. Nueva 456");
    });

    it("allows modifying document number", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const docInput = screen.getByDisplayValue("1234567890");
      fireEvent.change(docInput, { target: { value: "0987654321" } });
      expect(docInput).toHaveValue("0987654321");
    });

    it("allows changing document type", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "2" } }); // TI
      expect(select).toHaveValue("2");
    });

    it("allows toggling isActive status", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("Form Submission", () => {
    it("submits the form with modified firstName", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      // Modify firstName
      const nameInput = screen.getByDisplayValue("Juan");
      fireEvent.change(nameInput, { target: { value: "Juan Modified" } });

      // Submit
      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      const payload = (upsertEmployee as any).mock.calls[0][0];
      expect(payload.id).toBe(101);
      expect(payload.user.person.firstName).toBe("Juan Modified");
      expect(payload.user.person.lastName).toBe("Perez");
    });

    it("submits with all fields correctly mapped to DTO", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      // Get all input references FIRST before modifying any
      const firstNameInput = screen.getByPlaceholderText("Juan");
      const lastNameInput = screen.getByPlaceholderText("Pérez");
      const docNumberInput = screen.getByPlaceholderText("Número de documento");
      const emailInput = screen.getByPlaceholderText("juan.perez@example.com");
      const phoneInput = screen.getByPlaceholderText("+1 234 567 8900");
      const addressInput = screen.getByPlaceholderText("Calle Principal 123");

      // Modify all fields
      fireEvent.change(firstNameInput, { target: { value: "Carlos" } });
      fireEvent.change(lastNameInput, { target: { value: "López" } });
      fireEvent.change(docNumberInput, { target: { value: "0000000001" } });
      fireEvent.change(emailInput, { target: { value: "carlos@newmail.com" } });
      fireEvent.change(phoneInput, { target: { value: "999-888-7777" } });
      fireEvent.change(addressInput, {
        target: { value: "Nueva Dirección 456" },
      });

      // Toggle isActive off
      fireEvent.click(screen.getByRole("checkbox"));

      // Submit
      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      // Verify ALL fields are correctly mapped to the DTO
      const payload = (upsertEmployee as any).mock.calls[0][0];

      // Employee-level fields
      expect(payload.id).toBe(101);
      expect(payload.isActive).toBe(false);

      // User-level fields
      expect(payload.user.id).toBe(202);
      expect(payload.user.documentTypeId).toBe(1);
      expect(payload.user.documentNumber).toBe("0000000001");
      expect(payload.user.email).toBe("carlos@newmail.com");
      expect(payload.user.phone).toBe("999-888-7777");
      expect(payload.user.address).toBe("Nueva Dirección 456");

      // Person-level fields
      expect(payload.user.person.firstName).toBe("Carlos");
      expect(payload.user.person.lastName).toBe("López");
    });

    it("shows success notification after submit", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload: "Empleado actualizado exitosamente",
        });
      });
    });

    it("navigates after successful submission", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("../../employees");
      });
    });

    it("handles submission error from service", async () => {
      const error = new Error("Database error");
      (upsertEmployee as any).mockRejectedValue(error);

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({ payload: error });
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("converts documentTypeId to number", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      const payload = (upsertEmployee as any).mock.calls[0][0];
      expect(typeof payload.user.documentTypeId).toBe("number");
    });

    it("preserves employee id and user id on submit", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 101 });

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      const payload = (upsertEmployee as any).mock.calls[0][0];
      expect(payload.id).toBe(101);
      expect(payload.user.id).toBe(202);
    });
  });

  describe("Validation", () => {
    it("validates missing document type when cleared", async () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      // Clear document type
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "" } });

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload: expect.any(Error),
        });
      });

      expect(upsertEmployee).not.toHaveBeenCalled();
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

  describe("Edge Cases", () => {
    it("handles employee with different document type", () => {
      const employeeWithTI = { ...mockEmployee, documentTypeId: 2 };

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={employeeWithTI}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("2");
    });

    it("renders avatar upload section", () => {
      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText("Seleccionar Foto")).toBeInTheDocument();
    });

    it("handles employee with existing avatar URL", () => {
      const employeeWithAvatar = {
        ...mockEmployee,
        avatarUrl: "https://example.com/avatar.jpg",
      };

      renderWithProviders(
        <EditEmployeePage
          documentTypes={mockDocumentTypes}
          employee={employeeWithAvatar}
        />
      );

      // Should render without errors
      expect(screen.getByText("Editar Empleado")).toBeInTheDocument();
    });
  });
});
