import { vi } from "vitest";

export type {
  UpsertClientPayload,
  GetClientByIdResult,
  ClientRecord,
  GetClientByDocumentResult,
  ClientDto,
} from "@utils/dto/crm/client";

export const upsertClient = vi.fn();
export const getClientById = vi.fn();
export const getClientByDocument = vi.fn();
