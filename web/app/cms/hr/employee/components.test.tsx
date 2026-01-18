import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmployeeForm } from "./components";
import { Form } from "@/components/form";
import { getUserByDocument } from "@agape/core/user";
import { getEmployeeByDocument } from "@agape/hr/employee";
import { type DocumentType } from "@agape/core/documentType";
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
    pathname: "/cms/hr/employee",
    params: {},
  }),
}));

describe("EmployeeForm", () => {
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

  // Helper to render with all required providers
  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <EventEmitter>
        <PortalProvider>{ui}</PortalProvider>
      </EventEmitter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no employee/user exists
    (getEmployeeByDocument as any).mockResolvedValue(null);
    (getUserByDocument as any).mockResolvedValue(null);
  });

  describe("Rendering", () => {
    it("renders correctly and filters document types", () => {
      renderWithProviders(
        <Form.Root>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form.Root>
      );

      // Check if fields exist
      expect(screen.getByText("Identificación")).toBeInTheDocument();
      expect(screen.getByText("Información Personal")).toBeInTheDocument();
      expect(screen.getByText("Información Laboral")).toBeInTheDocument();

      // Check Document Type options
      const select = screen.getByTestId("document-type-select-hidden"); // The select element
      const options = Array.from(select.querySelectorAll("option"));

      // Expect "Seleccionar tipo..." + "Cédula de Ciudadanía" + "Tarjeta de Identidad" (NIT should be filtered out)
      expect(options.map((o) => o.textContent)).toEqual([
        "Seleccionar tipo...",
        "Cédula de Ciudadanía",
        "Tarjeta de Identidad",
      ]);
    });
  });

  describe("Document Validation - Error Cases", () => {
    it("shows error when document corresponds to a company", async () => {
      // Mock: No employee exists, but user exists as company
      (getEmployeeByDocument as any).mockResolvedValue(null);
      (getUserByDocument as any).mockResolvedValue({
        id: 100,
        person: null,
        company: { legalName: "Acme Corp" },
      });

      renderWithProviders(
        <Form.Root>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form.Root>
      );

      const select = screen.getByTestId("document-type-select-hidden");
      const input = screen.getByTestId("document-number-input");

      // Select document type
      await act(async () => {
        fireEvent.change(select, { target: { value: "1" } });
      });
      // Type document number
      await act(async () => {
        fireEvent.change(input, { target: { value: "123456789" } });
      });

      // Wait for debounce and effect
      await waitFor(
        () => {
          expect(getEmployeeByDocument).toHaveBeenCalledWith(1, "123456789");
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
    });
  });

  describe("Document Validation - User Preloading", () => {
    it("loads user data when document corresponds to a person", async () => {
      const mockPersonDate = new Date("1990-01-01");
      // Mock: No employee exists, but user exists as person
      (getEmployeeByDocument as any).mockResolvedValue(null);
      (getUserByDocument as any).mockResolvedValue({
        id: 200,
        person: {
          firstName: "Juan",
          lastName: "Perez",
          birthdate: mockPersonDate,
        },
        company: null,
      });

      renderWithProviders(
        <Form.Root>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form.Root>
      );

      const select = screen.getByTestId("document-type-select-hidden");
      const input = screen.getByTestId("document-number-input");

      // Select document type
      await act(async () => {
        fireEvent.change(select, { target: { value: "1" } });
      });
      // Type document number
      await act(async () => {
        fireEvent.change(input, { target: { value: "987654321" } });
      });

      // Wait for debounce and effect
      await waitFor(() => {
        expect(getEmployeeByDocument).toHaveBeenCalledWith(1, "987654321");
      });

      await waitFor(() => {
        expect(getUserByDocument).toHaveBeenCalledWith(1, "987654321");
      });

      // Check success notification
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload: "Se ha cargado la información del usuario existente.",
          type: "success",
        });
      });
    });
  });

  describe("Document Validation - Employee Redirect", () => {
    it("redirects to existing employee when document belongs to another employee", async () => {
      // Mock: Employee already exists with this document
      (getEmployeeByDocument as any).mockResolvedValue({
        id: 500,
        firstName: "Carlos",
        lastName: "Garcia",
      });

      renderWithProviders(
        <Form.Root>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form.Root>
      );

      const select = screen.getByTestId("document-type-select-hidden");
      const input = screen.getByTestId("document-number-input");

      // Select document type and type document number
      await act(async () => {
        fireEvent.change(select, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(input, { target: { value: "111222333" } });
      });

      // Wait for effect
      await waitFor(
        () => {
          expect(getEmployeeByDocument).toHaveBeenCalledWith(1, "111222333");
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload:
            "Ya existe un empleado registrado con este documento: Carlos Garcia",
          type: "warning",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("../employee/500");

      // User data should NOT be loaded
      expect(getUserByDocument).not.toHaveBeenCalled();
    });

    it("does NOT redirect when editing same employee", async () => {
      // Mock: The same employee being edited
      (getEmployeeByDocument as any).mockResolvedValue({
        id: 101,
        firstName: "Juan",
        lastName: "Perez",
      });

      const initialState = {
        id: 101,
        isActive: true,
        user: {
          id: 202,
          documentTypeId: 1,
          documentNumber: "1234567890",
          person: {
            firstName: "Juan",
            lastName: "Perez",
          },
        },
      };

      renderWithProviders(
        <Form.Root state={initialState}>
          <EmployeeForm
            documentTypes={mockDocumentTypes}
            isEdit={true}
            employeeId={101}
          />
        </Form.Root>
      );

      // Wait for debounce - should NOT trigger on initial load with same values
      await new Promise((resolve) => setTimeout(resolve, 700));

      // The effect should skip because values haven't changed
      expect(getEmployeeByDocument).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Edit Mode - Skip Validation for Same Employee", () => {
    it("should NOT call services on initial render when editing existing employee", async () => {
      // Initial state simulating data from the server (edit mode)
      const initialState = {
        id: 101,
        isActive: true,
        user: {
          id: 202,
          documentTypeId: 1,
          documentNumber: "1234567890",
          person: {
            firstName: "Juan",
            lastName: "Perez",
          },
        },
      };

      renderWithProviders(
        <Form.Root state={initialState}>
          <EmployeeForm
            documentTypes={mockDocumentTypes}
            isEdit={true}
            employeeId={101}
          />
        </Form.Root>
      );

      // Wait for the debounce timeout (500ms) + extra buffer
      await new Promise((resolve) => setTimeout(resolve, 700));

      // The effect should NOT have been called because the data already exists
      // and the user hasn't made any changes yet
      expect(getEmployeeByDocument).not.toHaveBeenCalled();
      expect(getUserByDocument).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should validate document when changed in edit mode", async () => {
      // Mock: No employee/user exists with new document
      (getEmployeeByDocument as any).mockResolvedValue(null);
      (getUserByDocument as any).mockResolvedValue(null);

      const initialState = {
        id: 101,
        isActive: true,
        user: {
          id: 202,
          documentTypeId: 1,
          documentNumber: "1234567890",
          person: {
            firstName: "Juan",
            lastName: "Perez",
          },
        },
      };

      renderWithProviders(
        <Form.Root state={initialState}>
          <EmployeeForm
            documentTypes={mockDocumentTypes}
            isEdit={true}
            employeeId={101}
          />
        </Form.Root>
      );

      // First, verify no call on initial render
      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(getEmployeeByDocument).not.toHaveBeenCalled();

      // Now change the document number to trigger the validation
      const docInput = screen.getByTestId("document-number-input");
      await act(async () => {
        fireEvent.change(docInput, { target: { value: "9999999999" } });
      });

      // Wait for debounce
      await waitFor(
        () => {
          expect(getEmployeeByDocument).toHaveBeenCalledWith(1, "9999999999");
        },
        { timeout: 1000 }
      );

      // Since no employee/user exists with new document in edit mode, should redirect to create
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload:
            "El documento ingresado no corresponde a ningún empleado existente. Redirigiendo a crear nuevo empleado.",
          type: "info",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("../../employee", {
        state: expect.objectContaining({
          documentTypes: mockDocumentTypes,
          initialData: expect.objectContaining({
            user: expect.objectContaining({
              documentTypeId: 1,
              documentNumber: "9999999999",
            }),
          }),
        }),
      });
    });

    it("should redirect to existing employee when changing to different employee document in edit mode", async () => {
      // Mock: Different employee exists with the new document
      (getEmployeeByDocument as any).mockResolvedValue({
        id: 999,
        firstName: "Pedro",
        lastName: "Martinez",
      });

      const initialState = {
        id: 101,
        isActive: true,
        user: {
          id: 202,
          documentTypeId: 1,
          documentNumber: "1234567890",
          person: {
            firstName: "Juan",
            lastName: "Perez",
          },
        },
      };

      renderWithProviders(
        <Form.Root state={initialState}>
          <EmployeeForm
            documentTypes={mockDocumentTypes}
            isEdit={true}
            employeeId={101}
          />
        </Form.Root>
      );

      // Wait for initial render to pass
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Change document to trigger validation
      const docInput = screen.getByTestId("document-number-input");
      await act(async () => {
        fireEvent.change(docInput, { target: { value: "8888888888" } });
      });

      await waitFor(
        () => {
          expect(getEmployeeByDocument).toHaveBeenCalledWith(1, "8888888888");
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          payload:
            "Ya existe un empleado registrado con este documento: Pedro Martinez",
          type: "warning",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("../employee/999");
    });
  });

  describe("Create Mode - New Employee", () => {
    it("should NOT redirect when document doesnt exist in create mode", async () => {
      // Mock: No employee/user exists
      (getEmployeeByDocument as any).mockResolvedValue(null);
      (getUserByDocument as any).mockResolvedValue(null);

      renderWithProviders(
        <Form.Root>
          <EmployeeForm documentTypes={mockDocumentTypes} />
        </Form.Root>
      );

      const select = screen.getByTestId("document-type-select-hidden");
      const input = screen.getByTestId("document-number-input");

      await act(async () => {
        fireEvent.change(select, { target: { value: "1" } });
      });
      await act(async () => {
        fireEvent.change(input, { target: { value: "NEWDOC123" } });
      });

      await waitFor(
        () => {
          expect(getEmployeeByDocument).toHaveBeenCalledWith(1, "NEWDOC123");
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(getUserByDocument).toHaveBeenCalledWith(1, "NEWDOC123");
      });

      // Should NOT redirect in create mode
      expect(mockNavigate).not.toHaveBeenCalled();
      // Should NOT show any notification (no user found is expected for new employees)
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });
});
