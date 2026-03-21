import { eq, sql } from "drizzle-orm";
import { getDb } from "#lib/db";
import securityUser from "#models/security/user";
import { verifyPassword } from "#lib/security/password";
import user from "#models/user";
import person from "#models/person";
import { securityRole, securityUserRole } from "#models/security/role";
import type { IUserSession } from "@mapineda48/agape/security/types";

export type { IUserSession };

/**
 * Base query selection for user session data.
 * Reused by findUserByCredentials and findUserById to avoid duplication.
 */
const userSessionSelect = {
  id: securityUser.id,
  userId: securityUser.userId,
  passwordHash: securityUser.passwordHash,
  fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
};

/**
 * Base query builder for user session.
 * Joins securityUser -> user -> person.
 */
function buildUserSessionQuery() {
  return getDb()
    .select(userSessionSelect)
    .from(securityUser)
    .innerJoin(user, eq(user.id, securityUser.userId))
    .innerJoin(person, eq(person.id, user.id));
}

/**
 * Obtiene los permisos combinados de todos los roles de un usuario.
 */
async function getUserPermissions(userId: number): Promise<string[]> {
  const roles = await getDb()
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
  password: string,
): Promise<IUserSession | null> {
  const [record] = await buildUserSessionQuery().where(
    eq(securityUser.username, username),
  );

  if (!record) return null;

  const isValid = await verifyPassword(password, record.passwordHash);

  if (!isValid) return null;

  const permissions = await getUserPermissions(record.id);

  return {
    id: record.id,
    fullName: record.fullName,
    permissions,
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
  const [record] = await buildUserSessionQuery().where(
    eq(securityUser.id, id),
  );

  if (!record) return null;

  const permissions = await getUserPermissions(record.id);

  return {
    id: record.id,
    fullName: record.fullName,
    permissions,
  };
}
