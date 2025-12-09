import { vi } from "vitest";

export const listDocumentTypes = vi.fn();
export const listPersonDocumentTypes = vi.fn();
export const getDocumentTypeById = vi.fn();
export const upsertDocumentType = vi.fn();

export interface DocumentType {
  id: number;
  name: string;
  code: string;
  appliesToPerson: boolean;
  appliesToCompany: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export type NewDocumentType = Partial<DocumentType>;
