import { eq, sql } from "drizzle-orm";
import { db } from "#lib/db";
import securityUser from "#models/security/user";
import { verifyPassword } from "#lib/access/password";
import employee from "#models/hr/employee";
import person from "#models/core/person";
import { securityRole, securityUserRole } from "#models/security/role";
import type { IContext } from "#lib/context";

/**
 * Obtiene los permisos combinados de todos los roles de un usuario.
 */
async function getUserPermissions(userId: number): Promise<string[]> {
  const roles = await db
    .select({
      permissions: securityRole.permissions,
    })
    .from(securityUserRole)
    .innerJoin(securityRole, eq(securityRole.id, securityUserRole.roleId))
    .where(eq(securityUserRole.userId, userId));

  // Combinar todos los arrays de permisos en uno solo y eliminar duplicados
  const allPermissions = roles.flatMap((r) => r.permissions);
  return Array.from(new Set(allPermissions));
}

/**
 * Busca un usuario por credenciales y retorna la sesión si es válida.
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña en texto plano
 * @returns Sesión del usuario o null si las credenciales son inválidas
 * @permission security.user.read
 */
export async function findUserByCredentials(
  username: string,
  password: string
): Promise<IUserSession | null> {
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

  const permissions = await getUserPermissions(record.id);

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
    permissions,
    tenant: "agape_app_development_demo",
  };
}

/**
 * Busca un usuario por ID y retorna la sesión.
 *
 * @param id - ID del usuario
 * @returns Sesión del usuario o null si no se encuentra
 * @permission security.user.read
 */
export async function findUserById(id: number): Promise<IUserSession | null> {
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

  const permissions = await getUserPermissions(record.id);

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
    permissions,
    tenant: "agape_app_development_demo",
  };
}


export interface IUserSession extends Omit<IContext, "session"> {
  fullName: string;
  avatarUrl: string | null;
}