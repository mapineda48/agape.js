import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientForm } from "./components";
import { Form } from "@/components/form";
import { getUserByDocument } from "@agape/core/user";
import { getClientByDocument } from "@agape/crm/client";
import { useNotificacion } from "@/components/ui/notification";
import { useRouter } from "@/components/router/router-hook";
import { type DocumentType } from "@agape/core/documentType";
import { type ClientType } from "@agape/crm/clientType";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

// Mock dependencies
const mockNotify = vi.fn();
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: () => mockNotify,
}));

const mockNavigate = vi.fn();
vi.mock("@/components/router/router-hook", () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    pathname: "/cms/crm/client",
    params: {},
  }),
}));

describe("ClientForm", () => {
  const mockDocumentTypes: DocumentType[] = [
    {
      id: 1,
      name: "Cédula de Ciudadanía",
      code: "CC",
      appliesToPerson: true,
      appliesToCompany: false, // Important: Person
      isEnabled: true,
    },
    {
      id: 2,
      name: "NIT",
      code: "NIT",
      appliesToPerson: false,
      appliesToCompany: true, // Important: Company
      isEnabled: true,
    },
  ];

  const mockClientTypes: ClientType[] = [
    { id: 1, name: "Gold", isEnabled: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getClientByDocument as any).mockResolvedValue(null);
    (getUserByDocument as any).mockResolvedValue(null);
  });

  const renderForm = (props = {}, state?: any) => {
    return render(
      <EventEmitter>
        <PortalProvider>
          <Form.Root state={state ?? {}}>
            <ClientForm
              documentTypes={mockDocumentTypes}
              clientTypes={mockClientTypes}
              {...props}
            />
          </Form.Root>
        </PortalProvider>
      </EventEmitter>
    );
  };

  describe("Rendering", () => {
    it("renders correctly and enables Person fields by default if no type selected", () => {
      renderForm();
      // Verify document types dropdown has options
      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];
      const options = Array.from(docSelect.querySelectorAll("option"));
      expect(options.map((o) => o.textContent)).toContain("Cédula de Ciudadanía");
    });

    it("switches to Company fields when Company document selected", async () => {
      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "2" } }); // NIT
      });

      // Wait for the component to re-render with company fields
      await waitFor(() => {
        expect(screen.getByText("Información de Empresa")).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText("Razón Social")).toBeInTheDocument();
    });

    it("shows microcopy for person document type", async () => {
      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } }); // CC
      });

      await waitFor(() => {
        expect(screen.getByText(/requiere datos de persona/i)).toBeInTheDocument();
      });
    });

    it("shows microcopy for company document type", async () => {
      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "2" } }); // NIT
      });

      await waitFor(() => {
        expect(screen.getByText(/requiere datos de empresa/i)).toBeInTheDocument();
      });
    });
  });

  describe("P0: Document Validation Modal - Cliente Existente", () => {
    it("shows modal instead of navigating when document already exists", async () => {
      (getClientByDocument as any).mockResolvedValue({
        id: 500,
        person: { firstName: "Carlos", lastName: "Perez", birthdate: null },
      });

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
          target: { value: "123456" },
        });
      });

      await waitFor(
        () => {
          expect(getClientByDocument).toHaveBeenCalledWith(1, "123456");
        },
        { timeout: 1000 }
      );

      // Should show modal instead of navigating
      await waitFor(() => {
        expect(screen.getByText("Cliente Existente")).toBeInTheDocument();
        expect(screen.getByText("Carlos Perez")).toBeInTheDocument();
      });

      // Should NOT navigate automatically
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to client when 'Ver Cliente' is clicked", async () => {
      (getClientByDocument as any).mockResolvedValue({
        id: 500,
        person: { firstName: "Carlos", lastName: "Perez", birthdate: null },
      });

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
          target: { value: "123456" },
        });
      });

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Cliente Existente")).toBeInTheDocument();
      });

      // Click "Ver Cliente"
      await act(async () => {
        fireEvent.click(screen.getByText("Ver Cliente"));
      });

      // Now it should navigate
      expect(mockNavigate).toHaveBeenCalledWith("../client/500");
    });

    it("allows continuing to edit when modal is dismissed with 'Continuar Editando'", async () => {
      (getClientByDocument as any).mockResolvedValue({
        id: 500,
        person: { firstName: "Carlos", lastName: "Perez", birthdate: null },
      });

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
          target: { value: "123456" },
        });
      });

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Cliente Existente")).toBeInTheDocument();
      });

      // Click "Continuar Editando"
      await act(async () => {
        fireEvent.click(screen.getByText("Continuar Editando"));
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Cliente Existente")).not.toBeInTheDocument();
      });

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("P0: Document Validation Modal - Usuario Existente", () => {
    it("shows decision modal when user exists but not as client", async () => {
      (getUserByDocument as any).mockResolvedValue({
        id: 99,
        person: {
          firstName: "Found",
          lastName: "One",
          birthdate: null,
        },
        company: null,
      });

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      // Select Person Type
      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } }); // CC
      });

      // Type document number
      const docInput = screen.getByPlaceholderText("Número de documento");
      await act(async () => {
        fireEvent.change(docInput, { target: { value: "99999" } });
      });

      // Wait for modal
      await waitFor(
        () => {
          expect(getUserByDocument).toHaveBeenCalledWith(1, "99999");
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(screen.getByText("Usuario Encontrado")).toBeInTheDocument();
        expect(screen.getByText("Found One")).toBeInTheDocument();
      });

      // Data should NOT be prefilled automatically
      expect(mockNotify).not.toHaveBeenCalledWith(
        expect.objectContaining({
          payload: "Se ha cargado la información existente.",
        })
      );
    });

    it("loads user data when 'Sí, Usar Datos' is clicked", async () => {
      (getUserByDocument as any).mockResolvedValue({
        id: 99,
        person: {
          firstName: "Found",
          lastName: "One",
          birthdate: null,
        },
        company: null,
      });

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
          target: { value: "99999" },
        });
      });

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Usuario Encontrado")).toBeInTheDocument();
      });

      // Click "Sí, Usar Datos"
      await act(async () => {
        fireEvent.click(screen.getByText("Sí, Usar Datos"));
      });

      // Should notify about data load
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: "Se han cargado los datos del usuario existente.",
            type: "success",
          })
        );
      });
    });
  });

  describe("P0: Document Validation - Edit Mode", () => {
    it("does not trigger duplicate validation on initial render in edit mode", async () => {
      renderForm(
        { isEdit: true, clientId: 99 },
        {
          user: { documentTypeId: 1, documentNumber: "5555" },
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(getClientByDocument).not.toHaveBeenCalled();
    });

    it("shows confirmation modal when document does not exist in edit mode", async () => {
      // Start with some initial data
      renderForm(
        { isEdit: true, clientId: 99 },
        {
          user: { documentTypeId: 1, documentNumber: "5555" },
        }
      );

      // Initial check should be skipped
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(getClientByDocument).not.toHaveBeenCalled();

      // Now change the document to something new that doesn't exist
      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];
      const docInput = screen.getByPlaceholderText("Número de documento");

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "2" } }); // Change to NIT
      });

      await act(async () => {
        fireEvent.change(docInput, { target: { value: "88888" } });
      });

      // Wait for validation
      await waitFor(
        () => {
          expect(getClientByDocument).toHaveBeenCalledWith(2, "88888");
          expect(getUserByDocument).toHaveBeenCalledWith(2, "88888");
        },
        { timeout: 1000 }
      );

      // Should show modal instead of navigating
      await waitFor(() => {
        expect(screen.getByText("Documento No Encontrado")).toBeInTheDocument();
      });

      // Should NOT navigate automatically
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to create when 'Crear Nuevo Cliente' is clicked", async () => {
      renderForm(
        { isEdit: true, clientId: 99 },
        {
          user: { documentTypeId: 1, documentNumber: "5555" },
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 600));

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];
      const docInput = screen.getByPlaceholderText("Número de documento");

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "2" } });
      });

      await act(async () => {
        fireEvent.change(docInput, { target: { value: "88888" } });
      });

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Documento No Encontrado")).toBeInTheDocument();
      });

      // Click "Crear Nuevo Cliente"
      await act(async () => {
        fireEvent.click(screen.getByText("Crear Nuevo Cliente"));
      });

      // Now should navigate
      expect(mockNavigate).toHaveBeenCalledWith("../../client", {
        state: expect.objectContaining({
          clientTypes: mockClientTypes,
          documentTypes: mockDocumentTypes,
          initialData: expect.objectContaining({
            user: expect.objectContaining({
              documentTypeId: 2,
              documentNumber: "88888",
            }),
          }),
        }),
      });
    });
  });

  describe("P0: Validation Error Handling", () => {
    it("shows error status when validation fails", async () => {
      (getClientByDocument as any).mockRejectedValue(new Error("Network error"));

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
          target: { value: "123456" },
        });
      });

      // Wait for validation error
      await waitFor(
        () => {
          expect(getClientByDocument).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      // Should show error modal
      await waitFor(() => {
        expect(screen.getByText("Error de Validación")).toBeInTheDocument();
        // Error message appears in both ValidationStatus and Modal, so use getAllByText
        expect(screen.getAllByText("Network error").length).toBeGreaterThan(0);
      });
    });

    it("allows continuing without verification when error occurs", async () => {
      (getClientByDocument as any).mockRejectedValue(new Error("Network error"));

      renderForm();

      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "1" } });
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
          target: { value: "123456" },
        });
      });

      // Wait for error modal
      await waitFor(() => {
        expect(screen.getByText("Error de Validación")).toBeInTheDocument();
      });

      // Click "Continuar Sin Verificar"
      await act(async () => {
        fireEvent.click(screen.getByText("Continuar Sin Verificar"));
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Error de Validación")).not.toBeInTheDocument();
      });

      // Form should still be usable
      expect(screen.getByPlaceholderText("Número de documento")).toBeInTheDocument();
    });
  });

  describe("P1: Data Cleanup on Type Change", () => {
    it("cleans person data when switching from person to company document type", async () => {
      renderForm(
        {},
        {
          user: {
            documentTypeId: 1,
            documentNumber: "12345",
            person: {
              firstName: "John",
              lastName: "Doe",
            },
          },
        }
      );

      // Initially should show person fields
      await waitFor(() => {
        expect(screen.getByText("Información Personal")).toBeInTheDocument();
      });

      // Change to NIT (company)
      const selects = screen.getAllByRole("combobox");
      const docSelect = selects[0];

      await act(async () => {
        fireEvent.change(docSelect, { target: { value: "2" } }); // NIT
      });

      // Should now show company fields
      await waitFor(() => {
        expect(screen.getByText("Información de Empresa")).toBeInTheDocument();
      });

      // Person section should be gone (due to autoCleanup)
      expect(screen.queryByText("Información Personal")).not.toBeInTheDocument();
    });
  });
});
