import { db } from "#lib/db";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import {
  paymentMethod,
  type NewPaymentMethod,
} from "#models/finance/payment_method";
import type {
  CreatePaymentMethodDto,
  ListPaymentMethodsParams,
  ListPaymentMethodsResult,
  PaymentMethodDto,
  UpdatePaymentMethodDto,
} from "#utils/dto/finance/payment_method";
import DateTime from "#utils/data/DateTime";

export async function upsertPaymentMethod(
  payload: CreatePaymentMethodDto | UpdatePaymentMethodDto
): Promise<PaymentMethodDto> {
  if ("id" in payload && typeof payload.id === "number") {
    const [updated] = await db
      .update(paymentMethod)
      .set({
        code: payload.code,
        fullName: payload.fullName,
        description: payload.description,
        requiresReference: payload.requiresReference,
        requiresBankAccount: payload.requiresBankAccount,
        isEnabled: payload.isEnabled,
      })
      .where(eq(paymentMethod.id, payload.id))
      .returning();

    if (!updated)
      throw new Error(`PaymentMethod with ID ${payload.id} not found.`);
    return mapToDto(updated);
  } else {
    const data = payload as CreatePaymentMethodDto;
    const [inserted] = await db
      .insert(paymentMethod)
      .values({
        code: data.code,
        fullName: data.fullName,
        description: data.description,
        requiresReference: data.requiresReference ?? false,
        requiresBankAccount: data.requiresBankAccount ?? false,
        isEnabled: data.isEnabled ?? true,
      } satisfies NewPaymentMethod)
      .returning();
    return mapToDto(inserted);
  }
}

export async function getPaymentMethodById(
  id: number
): Promise<PaymentMethodDto | undefined> {
  const [record] = await db
    .select()
    .from(paymentMethod)
    .where(eq(paymentMethod.id, id));

  return record ? mapToDto(record) : undefined;
}

export async function listPaymentMethods(
  params: ListPaymentMethodsParams
): Promise<ListPaymentMethodsResult> {
  const conditions = [];

  if (params.code)
    conditions.push(ilike(paymentMethod.code, `%${params.code}%`));
  if (params.fullName)
    conditions.push(ilike(paymentMethod.fullName, `%${params.fullName}%`));
  if (params.isEnabled !== undefined)
    conditions.push(eq(paymentMethod.isEnabled, params.isEnabled));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let totalCount = 0;
  if (params.includeTotalCount) {
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(paymentMethod)
      .where(whereClause);
    totalCount = c;
  }

  const query = db
    .select()
    .from(paymentMethod)
    .where(whereClause)
    .orderBy(desc(paymentMethod.id));

  if (params.pageIndex !== undefined && params.pageSize !== undefined) {
    query.limit(params.pageSize).offset(params.pageIndex * params.pageSize);
  }

  const records = await query;

  return {
    paymentMethods: records.map(mapToDto),
    totalCount: params.includeTotalCount ? totalCount : records.length,
  };
}

function mapToDto(record: typeof paymentMethod.$inferSelect): PaymentMethodDto {
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

export * from "#utils/dto/finance/payment_method";
