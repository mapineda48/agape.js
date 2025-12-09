import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditClientPage from "./page";
import { upsertClient } from "@agape/crm/client";
import { listClientTypes } from "@agape/crm/clientType";
import { listDocumentTypes } from "@agape/core/documentType";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { DocumentType } from "@agape/core/documentType";
import type { ClientType } from "@agape/crm/clientType";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

// Mocks
vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

// Setup mocks for data fetching
vi.mock("@agape/core/documentType", () => ({
  listDocumentTypes: vi.fn(),
}));

vi.mock("@agape/crm/clientType", () => ({
  listClientTypes: vi.fn(),
}));

describe("CreateClientPage", () => {
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

  const mockClientTypes: ClientType[] = [
    { id: 1, name: "VIP", isEnabled: true },
    { id: 2, name: "Regular", isEnabled: true },
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
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      expect(screen.getByText("Nuevo Cliente")).toBeInTheDocument();
      expect(
        screen.getByText("Ingresa la información del nuevo cliente")
      ).toBeInTheDocument();
    });

    it("renders all form sections", () => {
      renderWithProviders(
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      expect(screen.getByText("Identificación")).toBeInTheDocument();
      expect(screen.getByText("Datos Básicos")).toBeInTheDocument();
      expect(screen.getByText("Información de Cliente")).toBeInTheDocument();
    });

    it("renders fields", () => {
      renderWithProviders(
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      expect(
        screen.getByPlaceholderText("Número de documento")
      ).toBeInTheDocument();
      expect(screen.getByText("Cliente Activo")).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("allows typing in document number", () => {
      renderWithProviders(
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      const input = screen.getByPlaceholderText("Número de documento");
      fireEvent.change(input, { target: { value: "12345" } });
      expect(input).toHaveValue("12345");
    });

    it("shows person fields when person document type is selected", () => {
      renderWithProviders(
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Select CC (Person)
      const selects = screen.getAllByRole("combobox");
      // The first select is likely Document Type (based on order in DOM, check components.tsx)
      const docTypeSelect = selects[0];
      // Or find by label wrapper? "Identificación" -> Select.Int

      fireEvent.change(docTypeSelect, { target: { value: "1" } });

      expect(screen.getByText("Información Personal")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Juan")).toBeInTheDocument();
    });

    it("shows company fields when company document type is selected", () => {
      renderWithProviders(
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Select NIT (Company)
      const selects = screen.getAllByRole("combobox");
      const docTypeSelect = selects[0];

      fireEvent.change(docTypeSelect, { target: { value: "2" } });

      expect(screen.getByText("Información de Empresa")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Razón Social")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("submits the form with valid data (Person)", async () => {
      (upsertClient as any).mockResolvedValue({ id: 1 });

      renderWithProviders(
        <EditClientPage
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Fill form
      // 1. Document Type (CC)
      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "1" } });

      // 2. Document Number
      fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
        target: { value: "123456789" },
      });

      // 3. Email
      fireEvent.change(screen.getByPlaceholderText("correo@ejemplo.com"), {
        target: { value: "test@example.com" },
      });

      // 4. Person Fields
      fireEvent.change(screen.getByPlaceholderText("Juan"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByPlaceholderText("Pérez"), {
        target: { value: "User" },
      });
      // Date? Input.DateTime usually text-like inputs in JSDOM unless configured
      // But let's assume it requires value.
      // If it's `type="datetime-local"`, value format is YYYY-MM-DDTHH:mm
      // Let's try to set it via path or just ignore if not strictly required by test logic but validation might trigger.

      // 5. Client Type
      fireEvent.change(selects[1], { target: { value: "1" } }); // VIP

      // Submit
      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertClient).toHaveBeenCalled();
      });

      // Verify success notification
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({ payload: "Cliente creado exitosamente" })
        );
      });

      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
