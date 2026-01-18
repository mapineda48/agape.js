import { vi } from "vitest";

export type {
  DepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ListDepartmentsParams,
  ListDepartmentsResult,
} from "@utils/dto/hr/department";

export const listDepartments = vi.fn();
export const getDepartmentById = vi.fn();
export const upsertDepartment = vi.fn();
