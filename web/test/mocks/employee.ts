import { vi } from "vitest";

// Re-exportar DTOs desde utils para uso en tests del frontend
export type {
  ListEmployeesParams,
  ListEmployeesResult,
  EmployeeListItem,
  UpsertEmployeePayload,
  EmployeeRecord,
  EmployeeDetails,
} from "@utils/dto/hr/employee";

// Re-exportar tipos de usuario (necesarios para UpsertEmployeePayload)
export type {
  IUser,
  IUserPerson,
  IUserCompany,
  IPerson,
  ICompany,
} from "@utils/dto/core/user";

// Mocks de funciones del servicio
export const getEmployeeById = vi.fn();
export const listEmployees = vi.fn();
export const upsertEmployee = vi.fn();
