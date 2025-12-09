import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditClientPage from "./page";
import { upsertClient, getClientById } from "@agape/crm/client";
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

  const mockClient: ClientDto = {
    id: 100,
    typeId: 1,
    active: true,
    photo: null,
    user: {
      id: 100,
      documentTypeId: 1,
      documentNumber: "123456789",
      email: "juan@example.com",
      phone: "555-1234",
      address: "Calle 123",
    },
    person: {
      firstName: "Juan",
      lastName: "Perez",
      birthdate: null,
    },
    company: null,
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
      expect(screen.getByDisplayValue("juan@example.com")).toBeInTheDocument();
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
  });

  describe("Interaction and Submission", () => {
    it("modifies data and submits", async () => {
      (upsertClient as any).mockResolvedValue({ id: 100 });

      renderWithProviders(
        <EditClientPage
          client={mockClient}
          clientTypes={mockClientTypes}
          documentTypes={mockDocumentTypes}
        />
      );

      // Modify email
      const emailInput = screen.getByDisplayValue("juan@example.com");
      fireEvent.change(emailInput, {
        target: { value: "juan.updated@example.com" },
      });

      // Submit
      const form = document.querySelector("form");
      await act(async () => {
        fireEvent.submit(form!);
      });

      await waitFor(() => {
        expect(upsertClient).toHaveBeenCalled();
      });

      const payload = (upsertClient as any).mock.calls[0][0];
      expect(payload.user.email).toBe("juan.updated@example.com");
      expect(payload.id).toBe(100); // Should preserve ID

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: "Cliente actualizado exitosamente",
          })
        );
      });
    });
  });
});
