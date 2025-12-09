import { vi } from "vitest";

export const upsertEmployee = vi.fn();
export const getEmployeeById = vi.fn();
export const listEmployees = vi.fn();

export interface UpsertEmployeePayload {
  id?: number;
  user: {
    id?: number;
    documentTypeId?: number;
    documentNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    person?: {
      firstName: string;
      lastName: string;
      birthdate?: Date;
    };
    company?: {
      legalName: string;
      tradeName?: string;
    };
  };
  isActive?: boolean;
  hireDate?: Date;
  metadata?: any;
  avatar?: string | File;
}
