import { eq, sql } from "drizzle-orm";
import { db } from "#lib/db";
import securityUser from "#models/security/user";
import { verifyPassword } from "#lib/access/password";
import employee from "#models/hr/employee";
import person from "#models/core/person";
import type { IUserSession as IWebSession } from "#lib/context";
import { CacheManager } from "#lib/services/cache/CacheManager";

/**
 * Busca un usuario por credenciales y retorna la sesión si es válida.
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña en texto plano
 * @returns Sesión del usuario o null si las credenciales son inválidas
 */
export async function findUserByCredentials(
  username: string,
  password: string
): Promise<IWebSession | null> {
  const [record] = await db
    .select({
      id: securityUser.id,
      passwordHash: securityUser.passwordHash,
      avatarUrl: employee.avatarUrl,
      fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.username, username));

  if (!record) return null;

  const isValid = await verifyPassword(password, record.passwordHash);

  if (!isValid) return null;

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
    permissions: [],
    tenant: "",
  };
}

/**
 * Busca un usuario por ID y retorna la sesión.
 *
 * @param id - ID del usuario
 * @returns Sesión del usuario o null si no se encuentra
 */
export async function findUserById(id: number): Promise<IWebSession | null> {
  const [record] = await db
    .select({
      id: securityUser.id,
      passwordHash: securityUser.passwordHash,
      avatarUrl: employee.avatarUrl,
      fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.id, id));

  if (!record) return null;

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
    permissions: [],
    tenant: "",
  };
}

export const findUserByIdCache = CacheManager.cacheFn("findUserById", findUserById,);