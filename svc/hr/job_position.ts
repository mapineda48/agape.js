import { db } from "#lib/db";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { jobPosition, type NewJobPosition } from "#models/hr/job_position";
import type {
  CreateJobPositionDto,
  JobPositionDto,
  ListJobPositionsParams,
  ListJobPositionsResult,
  UpdateJobPositionDto,
} from "#utils/dto/hr/job_position";
import DateTime from "#utils/data/DateTime";

export async function upsertJobPosition(
  payload: CreateJobPositionDto | UpdateJobPositionDto
): Promise<JobPositionDto> {
  if ("id" in payload && typeof payload.id === "number") {
    const [updated] = await db
      .update(jobPosition)
      .set({
        code: payload.code,
        name: payload.name,
        description: payload.description,
        level: payload.level ?? undefined,
        isActive: payload.isActive,
      })
      .where(eq(jobPosition.id, payload.id))
      .returning();

    if (!updated)
      throw new Error(`JobPosition with ID ${payload.id} not found.`);
    return mapToDto(updated);
  } else {
    const data = payload as CreateJobPositionDto;
    const [inserted] = await db
      .insert(jobPosition)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        level: data.level ?? undefined,
        isActive: data.isActive ?? true,
      } as NewJobPosition)
      .returning();
    return mapToDto(inserted);
  }
}

export async function getJobPositionById(
  id: number
): Promise<JobPositionDto | undefined> {
  const [record] = await db
    .select()
    .from(jobPosition)
    .where(eq(jobPosition.id, id));

  return record ? mapToDto(record) : undefined;
}

export async function listJobPositions(
  params: ListJobPositionsParams
): Promise<ListJobPositionsResult> {
  const conditions = [];

  if (params.code) conditions.push(ilike(jobPosition.code, `%${params.code}%`));
  if (params.name) conditions.push(ilike(jobPosition.name, `%${params.name}%`));
  if (params.isActive !== undefined)
    conditions.push(eq(jobPosition.isActive, params.isActive));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let totalCount = 0;
  if (params.includeTotalCount) {
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(jobPosition)
      .where(whereClause);
    totalCount = c;
  }

  const query = db
    .select()
    .from(jobPosition)
    .where(whereClause)
    .orderBy(desc(jobPosition.id));

  if (params.pageIndex !== undefined && params.pageSize !== undefined) {
    query.limit(params.pageSize).offset(params.pageIndex * params.pageSize);
  }

  const records = await query;

  return {
    jobPositions: records.map(mapToDto),
    totalCount: params.includeTotalCount ? totalCount : records.length,
  };
}

function mapToDto(record: typeof jobPosition.$inferSelect): JobPositionDto {
  return {
    ...record,
    createdAt:
      record.createdAt instanceof DateTime
        ? record.createdAt
        : new DateTime(record.createdAt),
    updatedAt: record.updatedAt
      ? record.updatedAt instanceof DateTime
        ? record.updatedAt
        : new DateTime(record.updatedAt)
      : null,
  };
}

export * from "#utils/dto/hr/job_position";
