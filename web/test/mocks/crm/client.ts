import { vi } from "vitest";

export type {
  UpsertClientPayload,
  GetClientByIdResult,
  ClientRecord,
  GetClientByDocumentResult,
  ClientDto,
  ClientListItem,
  ListClientsParams,
  ListClientsResult,
  IClientAddress,
} from "@utils/dto/crm/client";

export type {
  IClientContactInfo,
} from "@utils/dto/core/contactMethod";

export const upsertClient = vi.fn();
export const getClientById = vi.fn();
export const getClientByDocument = vi.fn();
export const listClients = vi.fn();
