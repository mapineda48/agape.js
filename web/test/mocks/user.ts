import { vi } from "vitest";

// Re-exportar DTOs desde utils para uso en tests del frontend
export type {
  UserType,
  IPerson,
  ICompany,
  IUserBase,
  IUserPerson,
  IUserCompany,
  IUser,
  IUserRecord,
  IUserWithDetails,
} from "@utils/dto/core/user";

export { USER_TYPE_VALUES } from "@utils/dto/core/user";

// Mocks de funciones del servicio
export const getUserById = vi.fn();
export const getUserByDocument = vi.fn();
export const upsertUser = vi.fn();
