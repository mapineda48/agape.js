import { vi } from "vitest";

export const findAll = vi.fn().mockResolvedValue([]);
export const upsert = vi.fn().mockResolvedValue({});
export const insertUpdate = vi.fn().mockResolvedValue([]);
