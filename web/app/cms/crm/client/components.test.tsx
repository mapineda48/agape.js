import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientForm } from "./components";
import { Form } from "@/components/form";
import { getUserByDocument } from "@agape/core/user";
import { getClientByDocument } from "@agape/crm/client";
import { useNotificacion } from "@/components/ui/notification";
import { useRouter } from "@/components/router/router-hook";
import { type DocumentType } from "@agape/core/documentType";
import { type ClientType } from "@agape/crm/clientType";

// Mock dependencies
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

// Mock Form.useForm
vi.mock("@/components/form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/form")>();
  return {
    ...actual,
    Form: {
      ...actual.Form,
      useForm: vi.fn(),
      useSelector: vi.fn(),
    },
  };
});

describe("ClientForm", () => {
  const mockNotify = vi.fn();
  const mockNavigate = vi.fn();
  const mockSetAt = vi.fn();

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
    (useNotificacion as any).mockReturnValue(mockNotify);
    (useRouter as any).mockReturnValue({ navigate: mockNavigate });
    (getClientByDocument as any).mockResolvedValue(null);
    (getUserByDocument as any).mockResolvedValue(null);
    (Form.useForm as any).mockReturnValue({
      setAt: mockSetAt,
    });
    (Form.useSelector as any).mockReturnValue(undefined);
  });

  const renderForm = (props = {}, state?: any) => {
    return render(
      <Form.Root state={state}>
        <ClientForm
          documentTypes={mockDocumentTypes}
          clientTypes={mockClientTypes}
          {...props}
        />
      </Form.Root>
    );
  };

  it("renders correctly and enables Person fields by default if no type selected/or handles empty", () => {
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

    await fireEvent.change(docSelect, { target: { value: "2" } }); // NIT

    expect(screen.getByText("Información de Empresa")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Razón Social")).toBeInTheDocument();
  });

  it("loads existing user data via debounce", async () => {
    // Mock found user
    (getUserByDocument as any).mockResolvedValue({
      id: 99,
      email: "found@example.com",
      phone: "555-FOUND",
      address: "Found Address",
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
    fireEvent.change(docSelect, { target: { value: "1" } }); // CC

    // Type document number
    const docInput = screen.getByPlaceholderText("Número de documento");
    fireEvent.change(docInput, { target: { value: "99999" } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(getUserByDocument).toHaveBeenCalledWith(1, "99999");
      },
      { timeout: 1000 }
    );

    // Verify form data was prefilled
    await waitFor(() => {
      expect(mockSetAt).toHaveBeenCalledWith(
        ["user", "email"],
        "found@example.com"
      );
      expect(mockSetAt).toHaveBeenCalledWith(["user", "phone"], "555-FOUND");
      expect(mockSetAt).toHaveBeenCalledWith(
        ["user", "address"],
        "Found Address"
      );
      expect(mockSetAt).toHaveBeenCalledWith(
        ["user", "person"],
        expect.objectContaining({
          firstName: "Found",
          lastName: "One",
        })
      );
    });

    // Verify notification
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: "Se ha cargado la información existente.",
      })
    );
  });

  it("redirects to existing client when document already exists", async () => {
    (getClientByDocument as any).mockResolvedValue({
      id: 500,
      person: { firstName: "Carlos", lastName: "Perez", birthdate: null },
    });

    renderForm();

    const selects = screen.getAllByRole("combobox");
    const docSelect = selects[0];
    fireEvent.change(docSelect, { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Número de documento"), {
      target: { value: "123456" },
    });

    await waitFor(
      () => {
        expect(getClientByDocument).toHaveBeenCalledWith(1, "123456");
      },
      { timeout: 1000 }
    );

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        payload:
          "Ya existe un cliente registrado con este documento: Carlos Perez",
        type: "warning",
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith("../client/500");
  });

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

  it("redirects to create client when document does not exist in edit mode", async () => {
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

    fireEvent.change(docSelect, { target: { value: "2" } }); // Change to NIT
    fireEvent.change(docInput, { target: { value: "88888" } });

    // Wait for logic
    await waitFor(
      () => {
        expect(getClientByDocument).toHaveBeenCalledWith(2, "88888");
        expect(getUserByDocument).toHaveBeenCalledWith(2, "88888");
      },
      { timeout: 1000 }
    );

    // Should trigger redirect to create
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        payload:
          "El documento ingresado no corresponde a ningún cliente existente. Redirigiendo a crear nuevo cliente.",
        type: "info",
      })
    );
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
