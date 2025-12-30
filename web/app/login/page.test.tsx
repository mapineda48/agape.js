import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { act } from "react";
import LoginForm from "./page";
import { login } from "@agape/security/access";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import PortalProvider from "@/components/util/portal";
import EventEmitter from "@/components/util/event-emitter";

/**
 * Tests para la página de login.
 *
 * Estas pruebas validan:
 * - Renderizado correcto de campos (usuario/contraseña)
 * - Validación de campos requeridos
 * - Llamada al servicio login con credenciales correctas
 * - Navegación a /cms después del login exitoso
 * - Manejo de errores de autenticación
 */

describe("LoginForm", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    router = new HistoryManager();

    // Mock navegación
    vi.spyOn(router, "navigateTo").mockImplementation(() => { });
    vi.spyOn(router, "listenPath").mockReturnValue(() => { });
    vi.spyOn(router, "pathname", "get").mockReturnValue("/login");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderLoginForm = () => {
    return render(
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          EventEmitter,
          null,
          createElement(PortalProvider, null, createElement(LoginForm))
        )
      )
    );
  };

  describe("Rendering", () => {
    it("should render login page with title", () => {
      renderLoginForm();

      expect(screen.getByText("Bienvenido")).toBeInTheDocument();
      expect(
        screen.getByText("Ingresa tus credenciales para continuar")
      ).toBeInTheDocument();
    });

    it("should render username field", () => {
      renderLoginForm();

      expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Tu nombre de usuario")
      ).toBeInTheDocument();
    });

    it("should render password field", () => {
      renderLoginForm();

      expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    });

    it("should render submit button", () => {
      renderLoginForm();

      expect(
        screen.getByRole("button", { name: /iniciar sesión/i })
      ).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      renderLoginForm();

      expect(screen.getByText("Recuperar acceso")).toBeInTheDocument();
    });

    it("should render copyright footer", () => {
      renderLoginForm();

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(
          new RegExp(`${currentYear} Agape CMS. Todos los derechos reservados.`)
        )
      ).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("should allow typing in username field", () => {
      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText("Tu nombre de usuario");
      fireEvent.change(usernameInput, { target: { value: "testuser" } });

      expect(usernameInput).toHaveValue("testuser");
    });

    it("should allow typing in password field", () => {
      renderLoginForm();

      const passwordInput = screen.getByPlaceholderText("••••••••");
      fireEvent.change(passwordInput, { target: { value: "secret123" } });

      expect(passwordInput).toHaveValue("secret123");
    });

    it("should have password field with password type", () => {
      renderLoginForm();

      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Form Submission", () => {
    // Form submission tests need real timers because:
    // 1. EventEmitter.emit uses setTimeout internally
    // 2. waitFor from testing-library needs real timers to poll
    beforeEach(() => {
      vi.useRealTimers();
    });

    afterEach(() => {
      // Restore fake timers for other test groups
      vi.useFakeTimers();
    });

    it("should call login service with correct credentials on submit", async () => {
      (login as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      renderLoginForm();

      // Fill form
      const usernameInput = screen.getByPlaceholderText("Tu nombre de usuario");
      const passwordInput = screen.getByPlaceholderText("••••••••");

      fireEvent.change(usernameInput, { target: { value: "admin" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      // Click the submit button (required for Submit component to process the event)
      const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          username: "admin",
          password: "password123",
        });
      });
    });

    it("should navigate to /cms on successful login", async () => {
      (login as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const navigateSpy = vi.spyOn(router, "navigateTo");

      renderLoginForm();

      // Fill form
      const usernameInput = screen.getByPlaceholderText("Tu nombre de usuario");
      const passwordInput = screen.getByPlaceholderText("••••••••");

      fireEvent.change(usernameInput, { target: { value: "admin" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      // Click the submit button
      const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(navigateSpy).toHaveBeenCalledWith("/cms", { replace: true });
      });
    });

    it("should handle login error gracefully", async () => {
      const errorMessage = "Credenciales inválidas";
      (login as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      renderLoginForm();

      // Fill form
      const usernameInput = screen.getByPlaceholderText("Tu nombre de usuario");
      const passwordInput = screen.getByPlaceholderText("••••••••");

      fireEvent.change(usernameInput, { target: { value: "admin" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

      // Click the submit button
      const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalled();
      });

      // On error, should not navigate
      expect(router.navigateTo).not.toHaveBeenCalledWith("/cms", {
        replace: true,
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form fields", () => {
      renderLoginForm();

      // Labels should be associated with inputs via htmlFor
      const usernameLabel = screen.getByText("Usuario");
      const passwordLabel = screen.getByText("Contraseña");

      expect(usernameLabel).toHaveAttribute("for", "username");
      expect(passwordLabel).toHaveAttribute("for", "password");
    });

    it("should have required attributes on inputs", () => {
      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText("Tu nombre de usuario");
      const passwordInput = screen.getByPlaceholderText("••••••••");

      expect(usernameInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });
});
