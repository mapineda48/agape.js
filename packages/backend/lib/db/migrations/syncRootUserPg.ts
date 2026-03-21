import { hashPassword } from "#lib/security/password";
import logger from "#lib/log/logger";
import { Pool } from "pg";

export async function syncRootUserPg(
  pool: Pool,
  schemaName: string,
  username?: string,
  password?: string,
) {
  if (!username || !password) {
    logger
      .scope("RootUser")
      .warn("Root user credentials not provided, skipping synchronization.");
    return;
  }

  try {
    const passwordHash = await hashPassword(password);

    await pool.query(`SELECT "${schemaName}"."sync_root_user"($1, $2);`, [
      username,
      passwordHash,
    ]);

    logger.scope("RootUser").info("sync_root_user called successfully.");
  } catch (error) {
    logger.scope("RootUser").error("Failed to sync root user (pg)", error);
    throw error;
  }
}
