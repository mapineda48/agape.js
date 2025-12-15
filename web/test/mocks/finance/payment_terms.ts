import { vi } from "vitest";

// Payment Terms DTO (inline puesto que no existe un archivo separado de DTO)
export interface PaymentTermsDto {
  id: number;
  code: string;
  fullName: string;
  description?: string | null;
  dueDays: number;
  isDefault: boolean;
  isEnabled: boolean;
}

export const listPaymentTerms = vi.fn();
export const getPaymentTermsById = vi.fn();
