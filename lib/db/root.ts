import { eq, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "#lib/access/password";
import accessUser from "#models/access/employee";
import person from "#models/core/person";
import employee, { employeeRole } from "#models/staff/employee";
import role from "#models/staff/role";
import { db } from ".";
import logger from "#lib/log/logger";

const CODE_SUPER_USER_ROLE = "SP";
const ADVISORY_LOCK_ID = 123456789111;

/**
 * Verifies and synchronizes the root user (Super User) in the database.
 *
 * This function ensures that a user with the Super User role exists and matches
 * the provided credentials. It uses an advisory lock to prevent race conditions
 * when multiple instances of the application are starting simultaneously.
 *
 * @param username - The username for the root user.
 * @param password - The password for the root user.
 */
export async function verifyRootUser(username: string, password?: string) {
  if (!username || !password) {
    logger
      .scope("RootUser")
      .warn("Root user credentials not provided, skipping synchronization.");
    return;
  }

  // Attempt non-blocking advisory lock to ensure only one instance syncs the root user
  const lockResult = await db.execute(
    sql`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_ID}) AS acquired;`
  );
  const acquired = lockResult.rows[0].acquired as boolean;

  if (!acquired) {
    logger
      .scope("RootUser")
      .info("Skipped synchronization due to concurrency (lock not acquired).");
    return;
  }

  try {
    logger.scope("RootUser").info("Starting root user synchronization...");

    const current = await findAccessByRoleCode(CODE_SUPER_USER_ROLE);

    if (!current) {
      // This might happen if the seed data hasn't been applied or the role doesn't exist.
      // For now, we assume the role and basic structure exist (e.g. via migrations/seeds).
      logger
        .scope("RootUser")
        .warn(
          `Role '${CODE_SUPER_USER_ROLE}' not found or no user assigned. Cannot sync root user.`
        );
      return;
    }

    const isPasswordMatch = await verifyPassword(password, current.password);

    if (current.username === username && isPasswordMatch) {
      logger.scope("RootUser").info("Root user is already synchronized.");
      return;
    }

    const updates: IUpdate = {};

    if (current.username !== username) {
      updates.username = username;
    }

    if (!isPasswordMatch) {
      updates.password = await hashPassword(password);
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(accessUser)
        .set(updates)
        .where(eq(accessUser.id, current.id));
      logger
        .scope("RootUser")
        .info("Root user has been successfully synchronized.");
    }
  } catch (error) {
    logger.scope("RootUser").error("Failed to synchronize root user", error);
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID});`);
  }
}

/**
 * Finds the access credentials for a user with a specific role code.
 *
 * @param code - The role code to search for (e.g., 'SP').
 * @returns The user's access details (id, username, password hash).
 */
async function findAccessByRoleCode(code: string) {
  const [result] = await db
    .select({
      id: accessUser.id,
      username: accessUser.username,
      password: accessUser.password,
    })
    .from(role)
    .where(eq(role.code, code))
    .innerJoin(employeeRole, eq(employeeRole.roleId, role.id))
    .innerJoin(employee, eq(employee.id, employeeRole.employeeId))
    .innerJoin(accessUser, eq(accessUser.employeeId, employee.id));

  return result;
}

interface IUpdate {
  username?: string;
  password?: string;
}
