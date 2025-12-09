import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmployeeForm } from "./components";
import Form from "@/components/form";
import { getUserByDocument } from "@agape/core/user";
import { useNotificacion } from "@/components/ui/notification";
import { useFormReset } from "@/components/form";
import { type DocumentType } from "@agape/core/documentType";

// Mock dependencies
vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

// We need to mock useFormReset but keep Form component working
vi.mock("@/components/form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/form")>();
  return {
    ...actual,
    useFormReset: vi.fn(),
  };
});

describe("EmployeeForm", () => {
  const mockNotify = vi.fn();
  const mockMerge = vi.fn();
  const mockSetAt = vi.fn();

  const mockDocumentTypes: DocumentType[] = [
    {
      id: 1,
      name: "Cédula de Ciudadanía",
      code: "CC",
      appliesToCompany: false,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      id: 2,
      name: "NIT",
      code: "NIT",
      appliesToCompany: true,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotificacion as any).mockReturnValue(mockNotify);
    (useFormReset as any).mockReturnValue({
      merge: mockMerge,
      setAt: mockSetAt,
    });
  });

  it("renders correctly and filters document types", () => {
    render(
      <Form>
        <EmployeeForm documentTypes={mockDocumentTypes} />
      </Form>
    );

    // Check if fields exist
    expect(screen.getByText("Identificación")).toBeInTheDocument();
    expect(screen.getByText("Información Personal")).toBeInTheDocument();
    expect(screen.getByText("Información Laboral")).toBeInTheDocument();

    // Check Document Type options
    const select = screen.getByRole("combobox"); // The select element
    const options = Array.from(select.querySelectorAll("option"));

    // Expect "Seleccionar tipo..." + "Cédula de Ciudadanía" (NIT should be filtered out)
    expect(options.map((o) => o.textContent)).toEqual([
      "Seleccionar tipo...",
      "Cédula de Ciudadanía",
    ]);
  });

  it("shows error when document corresponds to a company", async () => {
    // Mock user found as company
    (getUserByDocument as any).mockResolvedValue({
      id: 100,
      person: null,
      company: { legalName: "Acme Corp" },
    });

    render(
      <Form>
        <EmployeeForm documentTypes={mockDocumentTypes} />
      </Form>
    );

    const select = screen.getByRole("combobox");
    const input = screen.getByPlaceholderText("Número de documento");

    // Select document type
    fireEvent.change(select, { target: { value: "1" } });
    // Type document number
    fireEvent.change(input, { target: { value: "123456789" } });

    // Wait for debounce and effect
    await waitFor(
      () => {
        expect(getUserByDocument).toHaveBeenCalledWith(1, "123456789");
      },
      { timeout: 1000 }
    );

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        payload:
          "El documento ingresado corresponde a una empresa, no a una persona.",
        type: "error",
      });
    });

    // Ensure state was NOT updated
    expect(mockMerge).not.toHaveBeenCalled();
    expect(mockSetAt).not.toHaveBeenCalled();
  });

  it("loads user data when document corresponds to a person", async () => {
    const mockPersonDate = new Date("1990-01-01");
    // Mock user found as person
    (getUserByDocument as any).mockResolvedValue({
      id: 200,
      email: "juan@example.com",
      phone: "555-1234",
      address: "Calle 123",
      person: {
        firstName: "Juan",
        lastName: "Perez",
        birthdate: mockPersonDate,
      },
      company: null,
    });

    render(
      <Form>
        <EmployeeForm documentTypes={mockDocumentTypes} />
      </Form>
    );

    const select = screen.getByRole("combobox");
    const input = screen.getByPlaceholderText("Número de documento");

    // Select document type
    fireEvent.change(select, { target: { value: "1" } });
    // Type document number
    fireEvent.change(input, { target: { value: "987654321" } });

    // Wait for debounce and effect
    await waitFor(() => {
      expect(getUserByDocument).toHaveBeenCalledWith(1, "987654321");
    });

    await waitFor(() => {
      expect(mockMerge).toHaveBeenCalledWith({
        user: {
          email: "juan@example.com",
          phone: "555-1234",
          address: "Calle 123",
        },
      });
    });

    // We can't strictly equality check DateTime object created inside component vs here without specific matcher or accessing the class,
    // but we can check the call structure.
    expect(mockSetAt).toHaveBeenCalledWith(
      ["user", "person"],
      expect.objectContaining({
        firstName: "Juan",
        lastName: "Perez",
      })
    );

    expect(mockNotify).toHaveBeenCalledWith({
      payload: "Se ha cargado la información existente.",
      type: "success",
    });
  });

  describe("Edit mode - initial data handling", () => {
    it("should NOT call getUserByDocument on initial render when editing existing employee", async () => {
      // This test replicates the bug where the document validation effect
      // fires on initial render and overwrites the data that came from the server.

      // Initial state simulating data from the server (edit mode)
      const initialState = {
        id: 101,
        isActive: true,
        user: {
          id: 202,
          documentTypeId: 1,
          documentNumber: "1234567890",
          email: "existing@email.com",
          phone: "555-0000",
          address: "Existing Address 123",
          person: {
            firstName: "Juan",
            lastName: "Perez",
          },
        },
      };

      render(
        <Form state={initialState}>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form>
      );

      // Wait for the debounce timeout (500ms) + extra buffer
      await new Promise((resolve) => setTimeout(resolve, 700));

      // The effect should NOT have been called because the data already exists
      // and the user hasn't made any changes yet
      expect(getUserByDocument).not.toHaveBeenCalled();
      expect(mockMerge).not.toHaveBeenCalled();
      expect(mockSetAt).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should call getUserByDocument when document type CHANGES in edit mode", async () => {
      // Mock the service to return different data
      (getUserByDocument as any).mockResolvedValue({
        id: 300,
        email: "different@email.com",
        phone: "999-9999",
        address: "Different Address",
        person: {
          firstName: "Pedro",
          lastName: "Garcia",
        },
      });

      const initialState = {
        id: 101,
        isActive: true,
        user: {
          id: 202,
          documentTypeId: 1,
          documentNumber: "1234567890",
          email: "existing@email.com",
          phone: "555-0000",
          address: "Existing Address 123",
          person: {
            firstName: "Juan",
            lastName: "Perez",
          },
        },
      };

      render(
        <Form state={initialState}>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form>
      );

      // First, verify no call on initial render
      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(getUserByDocument).not.toHaveBeenCalled();

      // Now change the document number to trigger the validation
      const docInput = screen.getByPlaceholderText("Número de documento");
      fireEvent.change(docInput, { target: { value: "9999999999" } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(getUserByDocument).toHaveBeenCalledWith(1, "9999999999");
        },
        { timeout: 1000 }
      );

      // Verify merge was called with the new data
      expect(mockMerge).toHaveBeenCalled();
    });
  });
});
