import { db } from "#lib/db";
import employee from "#models/hr/employee";
import person from "#models/core/person";
import { user } from "#models/core/user";
import BlobStorage from "#lib/services/storage/AzureBlobStorage";
import { and, count, eq, sql, desc } from "drizzle-orm";
import DateTime from "#utils/data/DateTime";
import { upsertUser, type IUpsertUser, type IUser } from "#svc/core/user";

// Re-export DTOs from shared module
export type {
  ListEmployeesParams,
  ListEmployeesResult,
  EmployeeListItem,
  UpsertEmployeePayload,
  EmployeeRecord,
  EmployeeDetails,
} from "#utils/dto/hr/employee";

import type {
  ListEmployeesParams,
  ListEmployeesResult,
} from "#utils/dto/hr/employee";

// El UpsertEmployeePayload local usa los tipos de svc/core/user que son más estrictos
interface UpsertEmployeePayload {
  id?: number;
  user: IUser;
  isActive?: boolean;
  hireDate?: Date;
  metadata?: unknown;
  avatar?: string | File;
}

/**
 * Obtiene un empleado por su ID con todos los datos relacionados.
 *
 * @param id - Identificador único del empleado
 * @returns Empleado con datos de persona, o undefined si no existe
 */
export async function getEmployeeById(id: number) {
  const [match] = await db
    .select({
      id: employee.id,
      userId: employee.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birthdate: person.birthdate,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      avatarUrl: employee.avatarUrl,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      // Identity fields
      documentTypeId: user.documentTypeId,
      documentNumber: user.documentNumber,
    })
    .from(employee)
    .innerJoin(user, eq(employee.id, user.id))
    .innerJoin(person, eq(employee.id, person.id))
    .where(eq(employee.id, id));

  return match;
}

/**
 * Lista empleados con filtros opcionales y paginación.
 *
 * @param params - Parámetros de búsqueda y paginación
 * @returns Lista de empleados y opcionalmente el total de registros
 */
export async function listEmployees(
  params: ListEmployeesParams = {}
): Promise<ListEmployeesResult> {
  const {
    fullName,
    isActive,
    includeTotalCount = false,
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const conditions = [];

  if (fullName) {
    conditions.push(
      sql`(
        CONCAT(${person.firstName}, ' ', ${
        person.lastName
      }) ILIKE ${`%${fullName}%`}
      )`
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(employee.isActive, isActive));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Consulta de empleados con datos de persona
  const queryEmployees = db
    .select({
      id: employee.id,
      userId: employee.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birthdate: person.birthdate,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      avatarUrl: employee.avatarUrl,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    })
    .from(employee)
    .innerJoin(user, eq(employee.id, user.id))
    .innerJoin(person, eq(employee.id, person.id))
    .where(whereClause)
    .orderBy(desc(employee.id))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  // Si no se necesita el conteo total, retornar solo empleados
  if (!includeTotalCount) {
    const employees = await queryEmployees;
    return { employees };
  }

  // Consulta de conteo
  const queryCount = db
    .select({ totalCount: count() })
    .from(employee)
    .innerJoin(user, eq(employee.id, user.id))
    .innerJoin(person, eq(employee.id, person.id))
    .where(whereClause);

  // Ejecutar ambas consultas en paralelo
  const [employees, [{ totalCount }]] = await Promise.all([
    queryEmployees,
    queryCount,
  ]);

  return { employees, totalCount };
}

/**
 * Crea o actualiza un empleado junto con los datos de usuario.
 *
 * @param payload - Datos del empleado a insertar o actualizar
 * @returns El empleado creado o actualizado con sus datos relacionados
 */
export async function upsertEmployee(payload: UpsertEmployeePayload) {
  const { id, avatar, user: userDto, ...employeeData } = payload;

  // Paso 1: Upsert del usuario (SIEMPRE persona para empleados)
  // Aseguramos que person exista en el DTO
  if (!userDto.person) {
    throw new Error("Los empleados deben tener información personal");
  }

  const userRecord = await upsertUser(userDto);

  // Paso 2: Upsert del registro de empleado
  const [employeeRecord] = await db
    .insert(employee)
    .values({
      id: userRecord.id,
      hireDate: employeeData.hireDate
        ? new DateTime(employeeData.hireDate)
        : new DateTime(),
      isActive: employeeData.isActive ?? true,
      avatarUrl: "", // Se actualiza despues si hay archivo
      metadata: employeeData.metadata,
    })
    .onConflictDoUpdate({
      target: employee.id,
      set: {
        // Siempre actualizar updatedAt para evitar error de "No values to set"
        updatedAt: new DateTime(),
        ...(employeeData.hireDate
          ? { hireDate: new DateTime(employeeData.hireDate) }
          : {}),
        ...(employeeData.isActive !== undefined
          ? { isActive: employeeData.isActive }
          : {}),
        ...(employeeData.metadata ? { metadata: employeeData.metadata } : {}),
      },
    })
    .returning();

  // Paso 3: Manejar subida de avatar si se proporciona
  if (avatar) {
    let avatarUrl: string;

    if (typeof avatar === "string") {
      // Mantener URL existente
      avatarUrl = avatar;
    } else {
      // Subir nuevo archivo al storage
      avatarUrl = await BlobStorage.uploadFile(
        `hr/employee/${employeeRecord.id}/avatar`,
        avatar
      );
    }

    // Actualizar empleado con URL del avatar
    await db
      .update(employee)
      .set({ avatarUrl })
      .where(eq(employee.id, employeeRecord.id));

    return {
      ...employeeRecord,
      avatarUrl,
      user: userRecord,
    };
  }

  return {
    ...employeeRecord,
    user: userRecord,
  };
}

// Types are now imported from "#utils/dto/hr/employee"
// and re-exported at the top of this file.
