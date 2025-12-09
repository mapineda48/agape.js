import { vi } from "vitest";

// Re-exportar DTOs desde utils para uso en tests del frontend
export type {
  LoginRequest,
  IUserSession,
  LogoutResponse,
} from "@utils/dto/security/access";

// Mocks de funciones del servicio
export const login = vi.fn();
export const isAuthenticated = vi.fn();
export const logout = vi.fn();

// Session mock (para acceso directo en algunos componentes)
export const session = {
  id: 0,
  fullName: "",
  avatarUrl: null,
};
