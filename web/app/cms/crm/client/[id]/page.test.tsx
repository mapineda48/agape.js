import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditClientPage from "./page";
import { upsertClient, getClientById, getClientByDocument } from "@agape/crm/client";
import { getUserByDocument } from "@agape/core/user";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { DocumentType } from "@agape/core/documentType";
import type { ClientType } from "@agape/crm/clientType";
import type { ClientDto } from "@agape/crm/client";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

// Mocks
vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

describe("EditClientPage", () => {
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
      name: "NIT",
      code: "NIT",
      appliesToPerson: false,
      appliesToCompany: true,
      isEnabled: true,
    },
  ];

  const mockClientTypes: ClientType[] = [
    { id: 1, name: "VIP", isEnabled: true },
    { id: 2, name: "Regular", isEnabled: true },
  ];

  // Cliente básico
  const mockClient: ClientDto = {
    id: 100,
    typeId: 1,
    active: true,
    photo: null,
    clientCode: null,
    priceListId: null,
    paymentTermsId: null,
    creditLimit: null,
    creditDays: null,
    salespersonId: null,
    user: {
      id: 100,
      documentTypeId: 1,
      documentNumber: "123456789",
      countryCode: "CO",
      languageCode: "es",
      currencyCode: "COP",
    },
    person: {
      firstName: "Juan",
      lastName: "Perez",
      birthdate: null,
    },
    company: null,
  };

  // Cliente con contactos y condiciones comerciales
  const mockClientWithContacts: ClientDto = {
    id: 200,
    typeId: 1,
    active: true,
    photo: null,
    clientCode: "CLI-200",
    priceListId: 1,
    paymentTermsId: 2,
    creditLimit: null,
    creditDays: 30,
    salespersonId: 1,
    user: {
      id: 200,
      documentTypeId: 1,
      documentNumber: "987654321",
      countryCode: "CO",
      languageCode: "es",
      currencyCode: "COP",
    },
    person: {
      firstName: "María",
      lastName: "García",
      birthdate: null,
    },
    company: null,
    contacts: {
      email: "maria.garcia@example.com",
      phone: "+57 1 234 5678",
      mobile: "+57 300 123 4567",
      whatsapp: "+57 310 999 8888",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ navigate: mockNavigate });
    (useNotificacion as any).mockReturnValue(mockNotify);
    // Configure mocks for services used in ClientForm to prevent async errors
    (getClientByDocument as any).mockResolvedValue(null);
    (getUserByDocument as any).mockResolvedValue(null);
  });

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <EventEmitter>
        <PortalProvider>{ui}</PortalProvider>
      </EventEmitter>
    );
  };

  // ============================================================================
  // TESTS DE RENDERIZADO
  // ============================================================================
  describe("Rendering", () => {
    it("renders with initial data pre-filled", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Check Header
      expect(screen.getByText("Editar Cliente")).toBeInTheDocument();

      // Check pre-filled inputs
      expect(screen.getByDisplayValue("123456789")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Juan")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Perez")).toBeInTheDocument();

      // Check checkbox
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("renders company data if client is company", () => {
      const companyClient: ClientDto = {
        ...mockClient,
        user: { ...mockClient.user, documentTypeId: 2 },
        person: null,
        company: {
          legalName: "Acme Corp",
          tradeName: "Acme",
        },
      };

      renderWithProviders(
        <EditClientPage
          client={companyClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Acme")).toBeInTheDocument();
    });

    it("renders contact section", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Check contact section exists
      expect(screen.getByText("Información de Contacto")).toBeInTheDocument();
      expect(screen.getByText("Email Principal")).toBeInTheDocument();
      expect(screen.getByText("Teléfono Fijo")).toBeInTheDocument();
      expect(screen.getByText("Teléfono Móvil")).toBeInTheDocument();
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    it("renders commercial conditions section", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Check commercial section exists
      expect(screen.getByText("Condiciones Comerciales")).toBeInTheDocument();
      expect(screen.getByText("Lista de Precios")).toBeInTheDocument();
      expect(screen.getByText("Condiciones de Pago")).toBeInTheDocument();
      expect(screen.getByText("Vendedor Asignado")).toBeInTheDocument();
      expect(screen.getByText("Límite de Crédito")).toBeInTheDocument();
      expect(screen.getByText("Días de Crédito")).toBeInTheDocument();
      expect(screen.getByText("Código de Cliente")).toBeInTheDocument();
    });

    it("pre-fills contact information from server data", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClientWithContacts}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Email should be pre-filled
      expect(
        screen.getByDisplayValue("maria.garcia@example.com")
      ).toBeInTheDocument();

      // Phone should be pre-filled
      expect(
        screen.getByDisplayValue("+57 1 234 5678")
      ).toBeInTheDocument();

      // Mobile should be pre-filled
      expect(
        screen.getByDisplayValue("+57 300 123 4567")
      ).toBeInTheDocument();

      // WhatsApp should be pre-filled
      expect(
        screen.getByDisplayValue("+57 310 999 8888")
      ).toBeInTheDocument();
    });

    it("pre-fills commercial conditions from server data", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClientWithContacts}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Client code should be pre-filled
      expect(screen.getByDisplayValue("CLI-200")).toBeInTheDocument();

      // Credit days should be pre-filled
      expect(screen.getByDisplayValue("30")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TESTS DE INTERACCIÓN
  // ============================================================================
  describe("Interaction", () => {
    it("allows typing in email field", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
      fireEvent.change(emailInput, {
        target: { value: "nuevo@email.com" },
      });

      expect(emailInput).toHaveValue("nuevo@email.com");
    });

    it("allows typing in phone field", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      const phoneInput = screen.getByPlaceholderText("+57 1 234 5678");
      fireEvent.change(phoneInput, {
        target: { value: "+57 1 999 8888" },
      });

      expect(phoneInput).toHaveValue("+57 1 999 8888");
    });

    it("allows typing in client code field", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      const codeInput = screen.getByPlaceholderText("CLI-001");
      fireEvent.change(codeInput, {
        target: { value: "CLI-999" },
      });

      expect(codeInput).toHaveValue("CLI-999");
    });

    it("allows typing in credit days field", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Find by placeholder since it's a number field
      const creditDaysInput = screen.getByPlaceholderText("30");
      fireEvent.change(creditDaysInput, {
        target: { value: "45" },
      });

      expect(creditDaysInput).toHaveValue(45);
    });
  });

  // ============================================================================
  // TESTS DE ENVÍO DEL FORMULARIO
  // ============================================================================
  describe("Form Submission", () => {
    it("modifies data and submits", async () => {
      (upsertClient as any).mockResolvedValue({ id: 100 });

      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Modify firstName
      const firstNameInput = screen.getByDisplayValue("Juan");
      fireEvent.change(firstNameInput, {
        target: { value: "Carlos" },
      });

      // Click the submit button to set internal state
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar cambios/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(upsertClient).toHaveBeenCalled();
      });

      const payload = (upsertClient as any).mock.calls[0][0];
      expect(payload.user.person.firstName).toBe("Carlos");
      expect(payload.id).toBe(100); // Should preserve ID

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: "Cliente actualizado exitosamente",
          })
        );
      });
    });

    it("includes contact information in submission payload when filled", async () => {
      (upsertClient as any).mockResolvedValue({ id: 100 });

      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Fill contact fields
      const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
      fireEvent.change(emailInput, {
        target: { value: "test@example.com" },
      });

      const phoneInput = screen.getByPlaceholderText("+57 1 234 5678");
      fireEvent.change(phoneInput, {
        target: { value: "+57 1 555 6666" },
      });

      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar cambios/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(upsertClient).toHaveBeenCalled();
      });

      const payload = (upsertClient as any).mock.calls[0][0];
      expect(payload.contacts).toBeDefined();
      expect(payload.contacts.email).toBe("test@example.com");
      expect(payload.contacts.phone).toBe("+57 1 555 6666");
    });

    it("includes client code in submission payload when filled", async () => {
      (upsertClient as any).mockResolvedValue({ id: 100 });

      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Fill client code
      const codeInput = screen.getByPlaceholderText("CLI-001");
      fireEvent.change(codeInput, {
        target: { value: "CLIENTE-ABC" },
      });

      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar cambios/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(upsertClient).toHaveBeenCalled();
      });

      const payload = (upsertClient as any).mock.calls[0][0];
      expect(payload.clientCode).toBe("CLIENTE-ABC");
    });

    it("includes credit days in submission payload when filled", async () => {
      (upsertClient as any).mockResolvedValue({ id: 100 });

      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Fill credit days
      const creditDaysInput = screen.getByPlaceholderText("30");
      fireEvent.change(creditDaysInput, {
        target: { value: "60" },
      });

      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar cambios/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(upsertClient).toHaveBeenCalled();
      });

      const payload = (upsertClient as any).mock.calls[0][0];
      expect(payload.creditDays).toBe(60);
    });
  });

  // ============================================================================
  // TESTS DE NAVEGACIÓN
  // ============================================================================
  describe("Navigation", () => {
    it("navigates back when clicking 'Volver a Clientes'", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      const backButton = screen.getByText("Volver a Clientes");
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("../../clients");
    });

    it("navigates back when clicking Cancel", () => {
      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      const cancelButton = screen.getByText("Cancelar");
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith("../../clients");
    });

    it("navigates back after successful submission", async () => {
      (upsertClient as any).mockResolvedValue({ id: 100 });

      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Click the submit button using userEvent
      const user = userEvent.setup();
      const submitButton = screen.getByRole("button", { name: /guardar cambios/i });
      await user.click(submitButton);

      // Manually trigger submit because JSDOM sometimes fails to trigger it from click
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("../../clients");
      });
    });
  });
});
