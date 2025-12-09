import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewEmployeePage from "./page";
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

describe("NewEmployeePage", () => {
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
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      expect(screen.getByText("Nuevo Empleado")).toBeInTheDocument();
      expect(
        screen.getByText("Ingresa la información del nuevo empleado")
      ).toBeInTheDocument();
    });

    it("renders all form sections", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      expect(screen.getByText("Identificación")).toBeInTheDocument();
      expect(screen.getByText("Información Personal")).toBeInTheDocument();
      expect(screen.getByText("Información Laboral")).toBeInTheDocument();
    });

    it("auto-selects Cedula document type if available", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const select = screen.getByRole("combobox");
      // CC has id=1 and should be auto-selected
      expect(select).toHaveValue("1");
    });

    it("filters out company document types from select options", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const select = screen.getByRole("combobox");
      const options = Array.from(select.querySelectorAll("option"));

      // Should have: placeholder + CC + TI (NIT filtered out)
      const optionTexts = options.map((o) => o.textContent);
      expect(optionTexts).toContain("Cédula de Ciudadanía");
      expect(optionTexts).toContain("Tarjeta de Identidad");
      expect(optionTexts).not.toContain("NIT");
    });

    it("renders all form fields", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Document fields
      expect(
        screen.getByPlaceholderText("Número de documento")
      ).toBeInTheDocument();

      // Personal fields
      expect(screen.getByPlaceholderText("Juan")).toBeInTheDocument(); // firstName
      expect(screen.getByPlaceholderText("Pérez")).toBeInTheDocument(); // lastName
      expect(
        screen.getByPlaceholderText("juan.perez@example.com")
      ).toBeInTheDocument(); // email
      expect(
        screen.getByPlaceholderText("+1 234 567 8900")
      ).toBeInTheDocument(); // phone
      expect(
        screen.getByPlaceholderText("Calle Principal 123")
      ).toBeInTheDocument(); // address

      // Work fields
      expect(screen.getByText("Fecha de Contratación")).toBeInTheDocument();
      expect(screen.getByText("Estado")).toBeInTheDocument();
      expect(screen.getByText("Activo")).toBeInTheDocument();
    });

    it("sets isActive to true by default", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("Form Interaction", () => {
    it("allows typing in all text fields", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Document number
      const docNumber = screen.getByPlaceholderText("Número de documento");
      fireEvent.change(docNumber, { target: { value: "123456789" } });
      expect(docNumber).toHaveValue("123456789");

      // First name
      const firstName = screen.getByPlaceholderText("Juan");
      fireEvent.change(firstName, { target: { value: "Carlos" } });
      expect(firstName).toHaveValue("Carlos");

      // Last name
      const lastName = screen.getByPlaceholderText("Pérez");
      fireEvent.change(lastName, { target: { value: "García" } });
      expect(lastName).toHaveValue("García");

      // Email
      const email = screen.getByPlaceholderText("juan.perez@example.com");
      fireEvent.change(email, { target: { value: "carlos@test.com" } });
      expect(email).toHaveValue("carlos@test.com");

      // Phone
      const phone = screen.getByPlaceholderText("+1 234 567 8900");
      fireEvent.change(phone, { target: { value: "555-1234" } });
      expect(phone).toHaveValue("555-1234");

      // Address
      const address = screen.getByPlaceholderText("Calle Principal 123");
      fireEvent.change(address, { target: { value: "Av. Siempre Viva 742" } });
      expect(address).toHaveValue("Av. Siempre Viva 742");
    });

    it("allows changing document type", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "2" } }); // TI
      expect(select).toHaveValue("2");
    });

    it("allows toggling isActive checkbox", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe("Form Submission", () => {
    it("submits the form with all required data", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 1 });

      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Fill all required fields
      fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
        target: { value: "1234567890" },
      });
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "María" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "López" },
      });
      fireEvent.change(screen.getByPlaceholderText("juan.perez@example.com"), {
        target: { value: "maria@company.com" },
      });

      // Submit form
      const form = document.querySelector("form");
      expect(form).not.toBeNull();

      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      // Verify payload structure
      const payload = (upsertEmployee as any).mock.calls[0][0];
      expect(payload).toMatchObject({
        isActive: true,
        user: expect.objectContaining({
          documentTypeId: 1, // CC auto-selected
          documentNumber: "1234567890",
          person: expect.objectContaining({
            firstName: "María",
            lastName: "López",
          }),
        }),
      });

      expect(mockNotify).toHaveBeenCalledWith({
        payload: "Empleado creado exitosamente",
      });
      expect(mockNavigate).toHaveBeenCalledWith("../employees");
    });

    it("submits with all optional fields filled", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 2 });

      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Fill all fields including optional
      fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
        target: { value: "9876543210" },
      });
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "Pedro" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "Martínez" },
      });
      fireEvent.change(screen.getByPlaceholderText("juan.perez@example.com"), {
        target: { value: "pedro@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("+1 234 567 8900"), {
        target: { value: "300-555-1234" },
      });
      fireEvent.change(screen.getByPlaceholderText("Calle Principal 123"), {
        target: { value: "Carrera 50 #20-30" },
      });

      // Submit form
      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      const payload = (upsertEmployee as any).mock.calls[0][0];
      expect(payload.user.email).toBe("pedro@test.com");
      expect(payload.user.phone).toBe("300-555-1234");
      expect(payload.user.address).toBe("Carrera 50 #20-30");
    });

    it("validates missing document type", async () => {
      // Use document types without CC to avoid auto-selection
      const typesWithoutCC: DocumentType[] = [
        {
          id: 5,
          name: "Pasaporte",
          code: "PA",
          appliesToPerson: true,
          appliesToCompany: false,
          isEnabled: true,
        },
      ];

      renderWithProviders(<NewEmployeePage documentTypes={typesWithoutCC} />);

      // Don't select document type (should be empty)
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "" } });

      // Fill required personal fields
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "User" },
      });

      // Submit
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
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("handles service error", async () => {
      const error = new Error("Network error");
      (upsertEmployee as any).mockRejectedValue(error);

      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
        target: { value: "111222333" },
      });
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "User" },
      });

      // Submit
      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload: error,
        });
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("converts documentTypeId to number before submit", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 1 });

      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Fill minimum required fields
      fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
        target: { value: "12345" },
      });
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "User" },
      });

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
  });

  describe("Navigation", () => {
    it("navigates back when cancel is clicked", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const cancelBtn = screen.getByText("Cancelar");
      fireEvent.click(cancelBtn);
      expect(mockNavigate).toHaveBeenCalledWith("../employees");
    });

    it("navigates back when header back button is clicked", () => {
      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      const backBtn = screen.getByText("Volver a Empleados");
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith("../employees");
    });

    it("navigates after successful submission", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 1 });

      renderWithProviders(
        <NewEmployeePage documentTypes={mockDocumentTypes} />
      );

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
        target: { value: "111" },
      });
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "User" },
      });

      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("../employees");
      });
    });
  });
});
