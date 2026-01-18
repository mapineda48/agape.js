import { db } from "#lib/db";
import employee, { employeeJobPosition } from "#models/hr/employee";
import person from "#models/person";
import { user } from "#models/user";
import { contactMethod } from "#models/contactMethod";
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
  hireDate?: DateTime;
  departmentId?: number;
  jobPositionIds?: number[];
  contacts?: {
    email?: string;
    phone?: string;
    mobile?: string;
  };
  metadata?: unknown;
  avatar?: string | File;
}

/**
 * Obtiene un empleado por su ID con todos los datos relacionados.
 *
 * @param id - Identificador único del empleado
 * @returns Empleado con datos de persona, o undefined si no existe
 * @permission hr.employee.read
 */
export async function getEmployeeById(id: number) {
  const [match] = await db
    .select({
      id: employee.id,
      userId: employee.id,
      firstName: person.firstName,
      lastName: person.lastName,
      birthdate: person.birthdate,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      avatarUrl: employee.avatarUrl,
      departmentId: employee.departmentId,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      // Identity fields
      documentTypeId: user.documentTypeId,
      documentNumber: user.documentNumber,
      // Internationalization fields
      countryCode: user.countryCode,
      languageCode: user.languageCode,
      currencyCode: user.currencyCode,
    })
    .from(employee)
    .innerJoin(user, eq(employee.id, user.id))
    .innerJoin(person, eq(employee.id, person.id))
    .where(eq(employee.id, id));

  if (!match) return undefined;

  // Get job positions
  const jobPositions = await db
    .select({ jobPositionId: employeeJobPosition.jobPositionId })
    .from(employeeJobPosition)
    .where(eq(employeeJobPosition.employeeId, id));

  // Get contacts
  const contacts = await db
    .select({
      type: contactMethod.type,
      value: contactMethod.value,
    })
    .from(contactMethod)
    .where(eq(contactMethod.userId, id));

  const contactsMap = {
    email: contacts.find((c) => c.type === "email")?.value,
    phone: contacts.find((c) => c.type === "phone")?.value,
    mobile: contacts.find((c) => c.type === "mobile")?.value,
  };

  return {
    ...match,
    jobPositionIds: jobPositions.map((jp) => jp.jobPositionId),
    contacts: contactsMap,
  };
}

/**
 * Busca un empleado por tipo y número de documento.
 * Útil para validar si un usuario ya está registrado como empleado.
 *
 * @param documentTypeId - ID del tipo de documento
 * @param documentNumber - Número de documento
 * @returns Empleado encontrado con datos básicos, o null si no existe
 * @permission hr.employee.read
 */
export async function getEmployeeByDocument(
  documentTypeId: number,
  documentNumber: string
) {
  const [match] = await db
    .select({
      id: employee.id,
      userId: employee.id,
      firstName: person.firstName,
      lastName: person.lastName,
      birthdate: person.birthdate,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      avatarUrl: employee.avatarUrl,
      documentTypeId: user.documentTypeId,
      documentNumber: user.documentNumber,
    })
    .from(employee)
    .innerJoin(user, eq(employee.id, user.id))
    .innerJoin(person, eq(employee.id, person.id))
    .where(
      and(
        eq(user.documentTypeId, documentTypeId),
        eq(user.documentNumber, documentNumber)
      )
    );

  return match ?? null;
}

/**
 * Lista empleados con filtros opcionales y paginación.
 *
 * @param params - Parámetros de búsqueda y paginación
 * @returns Lista de empleados y opcionalmente el total de registros
 * @permission hr.employee.read
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
        CONCAT(${person.firstName}, ' ', ${person.lastName
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
      birthdate: person.birthdate,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      avatarUrl: employee.avatarUrl,
      documentNumber: user.documentNumber,
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
 * @permission hr.employee.manage
 */
export async function upsertEmployee(payload: UpsertEmployeePayload) {
  const { id, avatar, user: userDto, contacts, jobPositionIds, ...employeeData } = payload;

  // Paso 1: Upsert del usuario (SIEMPRE persona para empleados)
  // Aseguramos que person exista en el DTO
  if (!userDto.person) {
    throw new Error("Los empleados deben tener información personal");
  }

  const userRecord = await upsertUser(userDto);

  // Paso 2: Upsert del registro de empleado - DateTime viene directamente del RPC
  const [employeeRecord] = await db
    .insert(employee)
    .values({
      id: userRecord.id,
      hireDate: employeeData.hireDate ?? new DateTime(),
      isActive: employeeData.isActive ?? true,
      departmentId: employeeData.departmentId ?? null,
      avatarUrl: "", // Se actualiza despues si hay archivo
      metadata: employeeData.metadata,
    })
    .onConflictDoUpdate({
      target: employee.id,
      set: {
        // Siempre actualizar updatedAt para evitar error de "No values to set"
        updatedAt: new DateTime(),
        ...(employeeData.hireDate
          ? { hireDate: employeeData.hireDate }
          : {}),
        ...(employeeData.isActive !== undefined
          ? { isActive: employeeData.isActive }
          : {}),
        ...(employeeData.departmentId !== undefined
          ? { departmentId: employeeData.departmentId }
          : {}),
        ...(employeeData.metadata ? { metadata: employeeData.metadata } : {}),
      },
    })
    .returning();

  // Paso 3: Manejar cargos (job positions)
  if (jobPositionIds !== undefined) {
    // Eliminar asignaciones existentes
    await db
      .delete(employeeJobPosition)
      .where(eq(employeeJobPosition.employeeId, employeeRecord.id));

    // Insertar nuevas asignaciones
    if (jobPositionIds.length > 0) {
      await db.insert(employeeJobPosition).values(
        jobPositionIds.map((jobPositionId, index) => ({
          employeeId: employeeRecord.id,
          jobPositionId,
          isPrimary: index === 0, // El primero es el principal
        }))
      );
    }
  }

  // Paso 4: Manejar contactos
  if (contacts) {
    const contactTypes = [
      { type: "email" as const, value: contacts.email },
      { type: "phone" as const, value: contacts.phone },
      { type: "mobile" as const, value: contacts.mobile },
    ];

    for (const { type, value } of contactTypes) {
      if (value) {
        // Upsert each contact type
        await db
          .insert(contactMethod)
          .values({
            userId: employeeRecord.id,
            type,
            value,
            isPrimary: true,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: [contactMethod.userId, contactMethod.type, contactMethod.value],
            set: { value, updatedAt: new DateTime() },
          });
      }
    }
  }

  // Paso 5: Manejar subida de avatar si se proporciona
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

