import { db } from "#lib/db";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { department, type NewDepartment } from "#models/hr/department";
import type {
  CreateDepartmentDto,
  DepartmentDto,
  ListDepartmentsParams,
  ListDepartmentsResult,
  UpdateDepartmentDto,
} from "#utils/dto/hr/department";
import DateTime from "#utils/data/DateTime";

/** @permission hr.department.manage */
export async function upsertDepartment(
  payload: CreateDepartmentDto | UpdateDepartmentDto
): Promise<DepartmentDto> {
  if ("id" in payload && typeof payload.id === "number") {
    const [updated] = await db
      .update(department)
      .set({
        code: payload.code,
        name: payload.name,
        description: payload.description,
        parentId: payload.parentId,
        costCenterCode: payload.costCenterCode,
        managerId: payload.managerId,
        isActive: payload.isActive,
      })
      .where(eq(department.id, payload.id))
      .returning();

    if (!updated)
      throw new Error(`Department with ID ${payload.id} not found.`);
    return mapToDto(updated);
  } else {
    const data = payload as CreateDepartmentDto;
    const [inserted] = await db
      .insert(department)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        costCenterCode: data.costCenterCode,
        managerId: data.managerId,
        isActive: data.isActive ?? true,
      } satisfies NewDepartment)
      .returning();
    return mapToDto(inserted);
  }
}

/** @permission hr.department.read */
export async function getDepartmentById(
  id: number
): Promise<DepartmentDto | undefined> {
  const [record] = await db
    .select()
    .from(department)
    .where(eq(department.id, id));

  return record ? mapToDto(record) : undefined;
}

/** @permission hr.department.read */
export async function listDepartments(
  params: ListDepartmentsParams
): Promise<ListDepartmentsResult> {
  const conditions = [];

  if (params.code) conditions.push(ilike(department.code, `%${params.code}%`));
  if (params.name) conditions.push(ilike(department.name, `%${params.name}%`));
  if (params.isActive !== undefined)
    conditions.push(eq(department.isActive, params.isActive));
  if (params.parentId !== undefined)
    conditions.push(eq(department.parentId, params.parentId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let totalCount = 0;
  if (params.includeTotalCount) {
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(department)
      .where(whereClause);
    totalCount = c;
  }

  const query = db
    .select()
    .from(department)
    .where(whereClause)
    .orderBy(desc(department.id));

  if (params.pageIndex !== undefined && params.pageSize !== undefined) {
    query.limit(params.pageSize).offset(params.pageIndex * params.pageSize);
  }

  const records = await query;

  return {
    departments: records.map(mapToDto),
    totalCount: params.includeTotalCount ? totalCount : records.length,
  };
}

function mapToDto(record: typeof department.$inferSelect): DepartmentDto {
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

export * from "#utils/dto/hr/department";
