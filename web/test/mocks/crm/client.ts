import { vi } from "vitest";

export type {
  UpsertClientPayload,
  GetClientByIdResult,
  ClientRecord,
} from "@utils/dto/crm/client";

export const upsertClient = vi.fn();
export const getClientById = vi.fn();
