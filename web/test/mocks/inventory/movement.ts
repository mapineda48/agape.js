import { vi } from "vitest";

export const createInventoryMovement = vi.fn();
export const getInventoryMovement = vi.fn();
export const listInventoryMovements = vi.fn();
export const createInventoryTransfer = vi.fn();

export type {
  CreateInventoryMovementInput,
  CreateInventoryMovementDetail,
} from "@utils/dto/inventory/movement";
