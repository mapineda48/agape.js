import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientForm } from "./components";
import Form from "@/components/form";
import { getUserByDocument } from "@agape/core/user";
import { useNotificacion } from "@/components/ui/notification";
import { useFormReset } from "@/components/form";
import { type DocumentType } from "@agape/core/documentType";
import { type ClientType } from "@agape/crm/clientType";

// Mock dependencies
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

// Mock useFormReset
vi.mock("@/components/form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/form")>();
  return {
    ...actual,
    useFormReset: vi.fn(),
  };
});

describe("ClientForm", () => {
  const mockNotify = vi.fn();
  const mockMerge = vi.fn();
  const mockSetAt = vi.fn();

  const mockDocumentTypes: DocumentType[] = [
    {
      id: 1,
      name: "Cédula de Ciudadanía",
      code: "CC",
      appliesToPerson: true,
      appliesToCompany: false, // Important: Person
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      id: 2,
      name: "NIT",
      code: "NIT",
      appliesToPerson: false,
      appliesToCompany: true, // Important: Company
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    },
  ];

  const mockClientTypes: ClientType[] = [
    { id: 1, name: "Gold", isEnabled: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotificacion as any).mockReturnValue(mockNotify);
    (useFormReset as any).mockReturnValue({
      merge: mockMerge,
      setAt: mockSetAt,
    });
  });

  const renderForm = (props = {}) => {
    return render(
      <Form>
        <ClientForm
          documentTypes={mockDocumentTypes}
          clientTypes={mockClientTypes}
          {...props}
        />
      </Form>
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

    // Verify merge called
    await waitFor(() => {
      expect(mockMerge).toHaveBeenCalledWith({
        email: "found@example.com",
        phone: "555-FOUND",
        address: "Found Address",
      });
    });

    // Verify notification
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: "Se ha cargado la información existente.",
      })
    );
  });
});
