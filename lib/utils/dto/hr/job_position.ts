import type DateTime from "../../data/DateTime";

export interface JobPositionDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  level?: number | null;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt?: DateTime | null;
}

export type CreateJobPositionDto = Omit<
  JobPositionDto,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateJobPositionDto = Partial<CreateJobPositionDto> & {
  id: number;
};

export interface ListJobPositionsParams {
  code?: string;
  name?: string;
  isActive?: boolean;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface ListJobPositionsResult {
  jobPositions: JobPositionDto[];
  totalCount: number;
}
