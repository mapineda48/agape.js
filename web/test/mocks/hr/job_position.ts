import { vi } from "vitest";

export type {
  JobPositionDto,
  CreateJobPositionDto,
  UpdateJobPositionDto,
  ListJobPositionsParams,
  ListJobPositionsResult,
} from "@utils/dto/hr/job_position";

export const listJobPositions = vi.fn();
export const getJobPositionById = vi.fn();
export const upsertJobPosition = vi.fn();
