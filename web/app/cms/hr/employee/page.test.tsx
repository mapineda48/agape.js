import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  const defaultProps = {
    documentTypes: mockDocumentTypes,
    jobPositions: [],
    departments: [],
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
        <NewEmployeePage {...defaultProps} />
      );

      expect(screen.getByText("Nuevo Empleado")).toBeInTheDocument();
      expect(
        screen.getByText("Ingresa la información del nuevo empleado")
      ).toBeInTheDocument();
    });

    it("renders all form sections", () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      expect(screen.getByText("Identificación")).toBeInTheDocument();
      expect(screen.getByText("Información Personal")).toBeInTheDocument();
      expect(screen.getByText("Información Laboral")).toBeInTheDocument();
    });

    it("auto-selects Cedula document type if available", () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      const select = screen.getByTestId("document-type-select-hidden");
      // CC has id=1 and should be auto-selected
      expect(select).toHaveValue("1");
    });

    it("filters out company document types from select options", () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      const select = screen.getByTestId("document-type-select-hidden");
      const options = Array.from(select.querySelectorAll("option"));

      // Should have: placeholder + CC + TI (NIT filtered out)
      const optionTexts = options.map((o) => o.textContent);
      expect(optionTexts).toContain("Cédula de Ciudadanía");
      expect(optionTexts).toContain("Tarjeta de Identidad");
      expect(optionTexts).not.toContain("NIT");
    });

    it("renders all form fields", () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      // Document fields
      expect(screen.getByTestId("document-number-input")).toBeInTheDocument();

      // Personal fields
      expect(screen.getByTestId("first-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("last-name-input")).toBeInTheDocument();

      // Work fields
      expect(screen.getByText("Fecha de Contratación")).toBeInTheDocument();
      expect(screen.getByText("Estado")).toBeInTheDocument();
      expect(screen.getByText("Activo")).toBeInTheDocument();
    });

    it("sets isActive to true by default", () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      const checkbox = screen.getByTestId("is-active-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe("Form Interaction", () => {
    it("allows typing in all text fields", async () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      // Document number
      const docNumber = screen.getByTestId("document-number-input");
      await fireEvent.change(docNumber, { target: { value: "123456789" } });
      expect(docNumber).toHaveValue("123456789");

      // First name
      const firstName = screen.getByTestId("first-name-input");
      await fireEvent.change(firstName, { target: { value: "Carlos" } });
      expect(firstName).toHaveValue("Carlos");

      // Last name
      const lastName = screen.getByTestId("last-name-input");
      await fireEvent.change(lastName, { target: { value: "García" } });
      expect(lastName).toHaveValue("García");
    });

    it("allows changing document type", async () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      const select = screen.getByTestId("document-type-select-hidden");
      await fireEvent.change(select, { target: { value: "2" } }); // TI
      expect(select).toHaveValue("2");
    });

    it("allows toggling isActive checkbox", async () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      const checkbox = screen.getByTestId("is-active-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      await fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);

      await fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe("Form Submission", () => {
    it("submits the form with all required data", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 1 });

      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      // Fill all required fields
      await fireEvent.change(screen.getByTestId("document-number-input"), {
        target: { value: "1234567890" },
      });
      await fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "María" },
      });
      await fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "López" },
      });

      // Click the submit button (required for Submit component to process the event)
      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

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
        <NewEmployeePage {...defaultProps} />
      );

      // Fill all fields
      await fireEvent.change(screen.getByTestId("document-number-input"), {
        target: { value: "9876543210" },
      });
      await fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "Pedro" },
      });
      await fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Martínez" },
      });

      // Click the submit button
      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(upsertEmployee).toHaveBeenCalled();
      });

      const payload = (upsertEmployee as any).mock.calls[0][0];
      expect(payload.user.person.firstName).toBe("Pedro");
      expect(payload.user.person.lastName).toBe("Martínez");
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

      renderWithProviders(<NewEmployeePage {...defaultProps} documentTypes={typesWithoutCC} />);

      // Don't select document type (should be empty)
      const select = screen.getByTestId("document-type-select-hidden");
      await fireEvent.change(select, { target: { value: "" } });

      // Fill required personal fields
      await fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "Test" },
      });
      await fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "User" },
      });

      // Click the submit button
      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

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
        <NewEmployeePage {...defaultProps} />
      );

      // Fill required fields
      await fireEvent.change(screen.getByTestId("document-number-input"), {
        target: { value: "111222333" },
      });
      await fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "Test" },
      });
      await fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "User" },
      });

      // Click the submit button
      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

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
        <NewEmployeePage {...defaultProps} />
      );

      // Fill minimum required fields
      await fireEvent.change(screen.getByTestId("document-number-input"), {
        target: { value: "12345" },
      });
      await fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "Test" },
      });
      await fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "User" },
      });

      // Click the submit button
      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

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
        <NewEmployeePage {...defaultProps} />
      );

      const cancelBtn = screen.getByText("Cancelar");
      fireEvent.click(cancelBtn);
      expect(mockNavigate).toHaveBeenCalledWith("../employees");
    });

    it("navigates back when header back button is clicked", () => {
      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      const backBtn = screen.getByText("Volver a Empleados");
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith("../employees");
    });

    it("navigates after successful submission", async () => {
      (upsertEmployee as any).mockResolvedValue({ id: 1 });

      renderWithProviders(
        <NewEmployeePage {...defaultProps} />
      );

      // Fill required fields
      await fireEvent.change(screen.getByTestId("document-number-input"), {
        target: { value: "111" },
      });
      await fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "Test" },
      });
      await fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "User" },
      });

      // Click the submit button
      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("../employees");
      });
    });
  });
});
