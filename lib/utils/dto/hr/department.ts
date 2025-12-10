export interface IDepartment {
  id?: number;
  code: string;
  name: string;
  description?: string | null;
  parentId?: number | null;
  costCenterCode?: string | null;
  managerId?: number | null;
  isActive?: boolean;
}

export interface ListDepartmentsParams {
  code?: string;
  name?: string;
  isActive?: boolean;
  parentId?: number;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface IDepartmentRecord extends IDepartment {
  id: number;
  createdAt: Date; // Model uses DateTime but usually DTO separates it? Model uses DateTime custom type. I should check other DTOs.
  // Actually, let's look at `Date` type usage.
}

import type DateTime from "../../data/DateTime";

export interface DepartmentDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parentId?: number | null;
  costCenterCode?: string | null;
  managerId?: number | null;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt?: DateTime | null;
}

export type CreateDepartmentDto = Omit<
  DepartmentDto,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateDepartmentDto = Partial<CreateDepartmentDto> & { id: number };

export interface ListDepartmentsResult {
  departments: DepartmentDto[];
  totalCount: number;
}
